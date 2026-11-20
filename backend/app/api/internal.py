"""Passerelle FastAPI vers les règles transactionnelles communes de Supabase."""

from collections.abc import Iterator
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field
from supabase import Client, ClientOptions, create_client

from app.core.config import get_settings

router = APIRouter(prefix="/internal", tags=["console interne"])


class CaseFields(BaseModel):
    title: str = Field(min_length=3, max_length=160)
    company_context: str = Field(min_length=10, max_length=4000)
    blocking_constraints: list[str] = Field(default_factory=list, max_length=12)
    preferences: list[str] = Field(default_factory=list, max_length=12)
    data_region: str = Field(default="", max_length=120)
    budget_context: str = Field(default="", max_length=240)


class DraftEdit(CaseFields):
    expected_revision: int = Field(ge=1)


def close_client(client: Client) -> None:
    for owner in (client.auth, client.postgrest.session):
        close = getattr(owner, "close", None)
        if callable(close):
            close()


def user_client(authorization: Annotated[str | None, Header()] = None) -> Iterator[Client]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Connexion requise.")
    token = authorization.removeprefix("Bearer ").strip()
    if not token:
        raise HTTPException(401, "Connexion requise.")
    settings = get_settings()
    key = settings.supabase_publishable_key
    if not key or key.get_secret_value().startswith("replace-"):
        raise HTTPException(503, "Supabase non configuré.")
    client = create_client(
        settings.supabase_url,
        key.get_secret_value(),
        options=ClientOptions(
            headers={"Authorization": authorization},
            persist_session=False,
            auto_refresh_token=False,
        ),
    )
    try:
        try:
            user = client.auth.get_user(token).user
        except Exception:
            raise HTTPException(401, "Session invalide.") from None
        if user is None:
            raise HTTPException(401, "Session invalide.")
        yield client
    finally:
        close_client(client)


UserClient = Annotated[Client, Depends(user_client)]


def call_api(
    client: Client,
    action: str,
    case_id: UUID | None = None,
    version_id: UUID | None = None,
    payload: dict | None = None,
) -> Any:
    return execute_rpc(
        client,
        "console_api",
        {
            "p_action": action,
            "p_case_id": str(case_id) if case_id else None,
            "p_version_id": str(version_id) if version_id else None,
            "p_payload": payload or {},
        },
    )


def execute_rpc(client: Client, name: str, params: dict) -> Any:
    try:
        return client.rpc(name, params).execute().data
    except Exception as error:
        code = str(getattr(error, "code", ""))
        if code in ("PT401", "PT403", "PT404", "PT409", "PT422", "PT429"):
            raise HTTPException(
                int(code[2:]), str(getattr(error, "message", "Opération refusée."))
            ) from None
        raise HTTPException(503, "Données internes indisponibles.") from None


@router.get("/me")
def me(client: UserClient):
    return call_api(client, "me")


@router.get("/cases")
def list_cases(client: UserClient):
    return call_api(client, "list")


@router.get("/cases/{case_id}")
def get_case(case_id: UUID, client: UserClient):
    return call_api(client, "get", case_id)


@router.post("/cases", status_code=201)
def create_case(fields: CaseFields, client: UserClient):
    return call_api(client, "create", payload=fields.model_dump())


@router.patch("/cases/{case_id}/versions/{version_id}")
def update_case(case_id: UUID, version_id: UUID, fields: DraftEdit, client: UserClient):
    return call_api(client, "edit", case_id, version_id, fields.model_dump())


@router.post("/cases/{case_id}/drafts", status_code=201)
def new_draft(case_id: UUID, client: UserClient):
    return call_api(client, "draft", case_id)


@router.post("/cases/{case_id}/versions/{version_id}/tests", status_code=201)
def run_test(case_id: UUID, version_id: UUID, client: UserClient):
    return call_api(client, "test", case_id, version_id)


@router.post("/cases/{case_id}/versions/{version_id}/submit-review")
def submit_review(case_id: UUID, version_id: UUID, client: UserClient):
    return call_api(client, "submit-review", case_id, version_id)


@router.post("/cases/{case_id}/versions/{version_id}/approve")
def approve(case_id: UUID, version_id: UUID, client: UserClient):
    return call_api(client, "approve", case_id, version_id)


@router.post("/cases/{case_id}/versions/{version_id}/publish")
def publish(case_id: UUID, version_id: UUID, client: UserClient):
    return call_api(client, "publish", case_id, version_id)


@router.post("/cases/{case_id}/versions/{version_id}/rollback")
def rollback(case_id: UUID, version_id: UUID, client: UserClient):
    return call_api(client, "rollback", case_id, version_id)
