"""Parcours local de la console. Toutes les opérations passent par le serveur."""

from collections.abc import Iterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, field_validator
from supabase import Client, create_client

from app.core.config import get_settings
from app.providers.mock import MockLLMProvider

router = APIRouter(prefix="/internal", tags=["console interne"])
ROLE_LEVEL = {"member": 0, "reviewer": 1, "publisher": 2}


class CaseFields(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    company_context: str = Field(min_length=10, max_length=4000)
    blocking_constraints: list[str] = Field(default_factory=list, max_length=12)
    preferences: list[str] = Field(default_factory=list, max_length=12)
    data_region: str = Field(default="", max_length=120)
    budget_context: str = Field(default="", max_length=240)

    @field_validator("blocking_constraints", "preferences")
    @classmethod
    def validate_items(cls, values: list[str]) -> list[str]:
        if any(not value.strip() or len(value.strip()) > 240 for value in values):
            raise ValueError("Chaque contrainte doit contenir entre 1 et 240 caractères.")
        return values


class DraftEdit(CaseFields):
    expected_revision: int = Field(ge=1)


@dataclass
class MemberContext:
    user_id: str
    role: str
    db: Client


def _configured_key(value: object) -> str | None:
    if value is None:
        return None
    secret = value.get_secret_value()  # type: ignore[attr-defined]
    if not secret or secret.startswith("replace-"):
        return None
    return secret


def _close_client(client: Client) -> None:
    """Ferme les connexions HTTP du client synchrone."""
    for owner in (
        getattr(client, "auth", None),
        getattr(getattr(client, "postgrest", None), "session", None),
    ):
        close = getattr(owner, "close", None)
        if callable(close):
            close()


def require_member(
    authorization: Annotated[str | None, Header()] = None,
) -> Iterator[MemberContext]:
    settings = get_settings()
    public_key = _configured_key(settings.supabase_publishable_key)
    secret_key = _configured_key(settings.supabase_secret_key)
    if not public_key or not secret_key:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Supabase local non configuré.")
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Connexion requise.")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Connexion requise.")
    public_client = None
    try:
        public_client = create_client(settings.supabase_url, public_key)
        user = public_client.auth.get_user(token).user
    except Exception:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session invalide.") from None
    finally:
        if public_client is not None:
            _close_client(public_client)
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Session invalide.")
    db = None
    try:
        db = create_client(settings.supabase_url, secret_key)
        rows = (
            db.table("internal_members").select("role").eq("user_id", str(user.id)).execute().data
        )
    except Exception:
        if db is not None:
            _close_client(db)
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE, "Données internes indisponibles."
        ) from None
    if not rows or rows[0]["role"] not in ROLE_LEVEL:
        _close_client(db)
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Accès interne refusé.")
    try:
        yield MemberContext(str(user.id), rows[0]["role"], db)
    finally:
        _close_client(db)


Member = Annotated[MemberContext, Depends(require_member)]


def _require_role(member: MemberContext, minimum: str) -> None:
    if ROLE_LEVEL[member.role] < ROLE_LEVEL[minimum]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Droit insuffisant.")


def _db_error() -> HTTPException:
    return HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Données internes indisponibles.")


def _case_row(member: MemberContext, case_id: UUID) -> dict:
    try:
        rows = member.db.table("internal_cases").select("*").eq("id", str(case_id)).execute().data
    except Exception:
        raise _db_error() from None
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Cas introuvable.")
    return rows[0]


def _version_row(member: MemberContext, case_id: UUID, version_id: UUID) -> dict:
    try:
        rows = (
            member.db.table("internal_case_versions")
            .select("*")
            .eq("case_id", str(case_id))
            .eq("id", str(version_id))
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    if not rows:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Version introuvable.")
    return rows[0]


def _constraints(fields: CaseFields) -> dict:
    return {
        "blocking": [value.strip() for value in fields.blocking_constraints if value.strip()],
        "preferences": [value.strip() for value in fields.preferences if value.strip()],
        "data_region": fields.data_region.strip(),
        "budget_context": fields.budget_context.strip(),
    }


def _record_event(member: MemberContext, case_id: UUID, version_id: UUID, action: str) -> None:
    try:
        member.db.table("internal_case_events").insert(
            {
                "case_id": str(case_id),
                "case_version_id": str(version_id),
                "action": action,
                "actor_id": member.user_id,
            }
        ).execute()
    except Exception:
        raise _db_error() from None


@router.get("/me")
def internal_me(member: Member) -> dict:
    return {"user_id": member.user_id, "role": member.role}


@router.get("/cases")
def list_cases(member: Member) -> list[dict]:
    try:
        cases = (
            member.db.table("internal_cases")
            .select("*")
            .order("created_at", desc=True)
            .execute()
            .data
        )
        for case in cases:
            versions = (
                member.db.table("internal_case_versions")
                .select("id,version_no,revision,state,title,company_context,constraints,created_at")
                .eq("case_id", case["id"])
                .order("version_no", desc=True)
                .execute()
                .data
            )
            case["versions"] = versions
        return cases
    except Exception:
        raise _db_error() from None


@router.get("/cases/{case_id}")
def get_case(case_id: UUID, member: Member) -> dict:
    case = _case_row(member, case_id)
    try:
        case["versions"] = (
            member.db.table("internal_case_versions")
            .select("*")
            .eq("case_id", str(case_id))
            .order("version_no", desc=True)
            .execute()
            .data
        )
        version_ids = [version["id"] for version in case["versions"]]
        case["tests"] = (
            member.db.table("internal_case_tests")
            .select("*")
            .in_("case_version_id", version_ids)
            .order("created_at", desc=True)
            .execute()
            .data
            if version_ids
            else []
        )
        case["events"] = (
            member.db.table("internal_case_events")
            .select("*")
            .eq("case_id", str(case_id))
            .order("created_at", desc=True)
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    return case


@router.post("/cases", status_code=status.HTTP_201_CREATED)
def create_case(fields: CaseFields, member: Member) -> dict:
    try:
        case_id = (
            member.db.rpc(
                "create_internal_case",
                {
                    "p_title": fields.title.strip(),
                    "p_company_context": fields.company_context.strip(),
                    "p_constraints": _constraints(fields),
                    "p_actor_id": member.user_id,
                },
            )
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    return get_case(UUID(case_id), member)


@router.post("/cases/{case_id}/drafts", status_code=status.HTTP_201_CREATED)
def new_draft(case_id: UUID, member: Member) -> dict:
    _case_row(member, case_id)
    try:
        version_id = (
            member.db.rpc(
                "create_internal_case_draft",
                {"p_case_id": str(case_id), "p_actor_id": member.user_id},
            )
            .execute()
            .data
        )
    except Exception:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Un brouillon existe déjà ou aucune version active."
        ) from None
    return _version_row(member, case_id, UUID(version_id))


@router.patch("/cases/{case_id}/versions/{version_id}")
def update_draft(case_id: UUID, version_id: UUID, fields: DraftEdit, member: Member) -> dict:
    version = _version_row(member, case_id, version_id)
    if version["state"] not in ("draft", "tested"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Cette version n'est plus modifiable.")
    try:
        rows = (
            member.db.table("internal_case_versions")
            .update(
                {
                    "title": fields.title.strip(),
                    "company_context": fields.company_context.strip(),
                    "constraints": _constraints(fields),
                    "revision": fields.expected_revision + 1,
                    "state": "draft",
                }
            )
            .eq("id", str(version_id))
            .eq("case_id", str(case_id))
            .eq("revision", fields.expected_revision)
            .in_("state", ["draft", "tested"])
            .select("*")
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    if not rows:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Brouillon modifié entre-temps ; rechargez-le."
        )
    _record_event(member, case_id, version_id, "draft_updated")
    return rows[0]


@router.post("/cases/{case_id}/versions/{version_id}/tests", status_code=status.HTTP_201_CREATED)
async def run_test(case_id: UUID, version_id: UUID, member: Member) -> dict:
    version = _version_row(member, case_id, version_id)
    if version["state"] not in ("draft", "tested"):
        raise HTTPException(status.HTTP_409_CONFLICT, "Le test exige un brouillon modifiable.")
    try:
        existing = (
            member.db.table("internal_case_tests")
            .select("id")
            .eq("case_version_id", str(version_id))
            .eq("version_revision", version["revision"])
            .limit(10)
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    if len(existing) >= 10:
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS, "Limite de dix tests par révision atteinte."
        )
    constraints = version["constraints"]
    missing = [
        label
        for key, label in (
            ("blocking", "Contraintes bloquantes"),
            ("data_region", "Région des données"),
            ("budget_context", "Contexte budgétaire"),
        )
        if not constraints.get(key)
    ]
    marker = await MockLLMProvider().generate(system_prompt="", user_prompt="", context=[])
    result = {
        "mode": "simulation",
        "message": marker,
        "missing_information": missing,
        "hypotheses": [
            "Aucune source cloud ni règle de comparaison validée n'est chargée pour ce test.",
            "Aucun coût ou service AWS, Azure ou Google Cloud n'est calculé.",
        ],
        "provider_comparison": None,
    }
    configuration = {
        "llm_adapter": "mock",
        "comparison_rules": "non_configured",
        "case_version_id": str(version_id),
        "case_revision": version["revision"],
    }
    try:
        row = (
            member.db.table("internal_case_tests")
            .insert(
                {
                    "case_version_id": str(version_id),
                    "version_revision": version["revision"],
                    "run_by": member.user_id,
                    "status": "simulated",
                    "result": result,
                    "configuration": configuration,
                }
            )
            .select("*")
            .execute()
            .data[0]
        )
        updated = (
            member.db.table("internal_case_versions")
            .update({"state": "tested"})
            .eq("id", str(version_id))
            .eq("revision", version["revision"])
            .in_("state", ["draft", "tested"])
            .select("*")
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    if not updated:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "La version a changé pendant le test ; rechargez-la."
        )
    _record_event(member, case_id, version_id, "test_simulated")
    return row


@router.post("/cases/{case_id}/versions/{version_id}/submit-review")
def submit_review(case_id: UUID, version_id: UUID, member: Member) -> dict:
    version = _version_row(member, case_id, version_id)
    if version["state"] != "tested":
        raise HTTPException(status.HTTP_409_CONFLICT, "Un test à jour est requis.")
    try:
        tests = (
            member.db.table("internal_case_tests")
            .select("id")
            .eq("case_version_id", str(version_id))
            .eq("version_revision", version["revision"])
            .limit(1)
            .execute()
            .data
        )
        if not tests:
            raise HTTPException(status.HTTP_409_CONFLICT, "Un test à jour est requis.")
        rows = (
            member.db.table("internal_case_versions")
            .update({"state": "in_review"})
            .eq("id", str(version_id))
            .eq("state", "tested")
            .eq("revision", version["revision"])
            .select("*")
            .execute()
            .data
        )
    except HTTPException:
        raise
    except Exception:
        raise _db_error() from None
    if not rows:
        raise HTTPException(status.HTTP_409_CONFLICT, "La version a changé ; rechargez-la.")
    _record_event(member, case_id, version_id, "submitted_for_review")
    return rows[0]


@router.post("/cases/{case_id}/versions/{version_id}/approve")
def approve_version(case_id: UUID, version_id: UUID, member: Member) -> dict:
    _require_role(member, "reviewer")
    version = _version_row(member, case_id, version_id)
    if version["state"] != "in_review":
        raise HTTPException(status.HTTP_409_CONFLICT, "La version n'est pas en relecture.")
    if version["created_by"] == member.user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Une autre personne doit relire ce cas.")
    try:
        rows = (
            member.db.table("internal_case_versions")
            .update(
                {
                    "state": "reviewed",
                    "reviewed_by": member.user_id,
                    "reviewed_at": datetime.now(UTC).isoformat(),
                }
            )
            .eq("id", str(version_id))
            .eq("state", "in_review")
            .select("*")
            .execute()
            .data
        )
    except Exception:
        raise _db_error() from None
    if not rows:
        raise HTTPException(status.HTTP_409_CONFLICT, "La version a changé ; rechargez-la.")
    _record_event(member, case_id, version_id, "reviewed")
    return rows[0]


@router.post("/cases/{case_id}/versions/{version_id}/publish")
def publish_version(case_id: UUID, version_id: UUID, member: Member) -> dict:
    _require_role(member, "publisher")
    version = _version_row(member, case_id, version_id)
    if version["state"] != "reviewed":
        raise HTTPException(status.HTTP_409_CONFLICT, "La relecture est requise.")
    try:
        member.db.rpc(
            "activate_internal_case_version",
            {
                "p_case_id": str(case_id),
                "p_version_id": str(version_id),
                "p_actor_id": member.user_id,
                "p_rollback": False,
            },
        ).execute()
    except Exception:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Publication impossible ; rechargez le cas."
        ) from None
    return get_case(case_id, member)


@router.post("/cases/{case_id}/versions/{version_id}/rollback")
def rollback_version(case_id: UUID, version_id: UUID, member: Member) -> dict:
    _require_role(member, "publisher")
    try:
        member.db.rpc(
            "activate_internal_case_version",
            {
                "p_case_id": str(case_id),
                "p_version_id": str(version_id),
                "p_actor_id": member.user_id,
                "p_rollback": True,
            },
        ).execute()
    except Exception:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Retour à cette version impossible."
        ) from None
    return get_case(case_id, member)
