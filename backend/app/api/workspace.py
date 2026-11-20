"""Contrats de la console de connaissances, communs avec la passerelle Edge."""

import re

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.api.internal import UserClient, execute_rpc

router = APIRouter(prefix="/internal/workspace", tags=["ateliers internes"])
UUID_PATTERN = r"([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})"


@router.get("")
def overview(client: UserClient):
    return execute_rpc(client, "workspace_api", {"p_action": "overview"})


@router.api_route("/{path:path}", methods=["GET", "POST", "PATCH"])
async def workspace_route(path: str, request: Request, client: UserClient):
    action = None
    resource_id = None
    method = request.method
    if method == "POST" and path in ("items", "releases", "search"):
        action = {"items": "save_item", "releases": "prepare_release", "search": "search_sources"}[
            path
        ]
    for category, suffixes, mapping in (
        ("items", "review|archive", {"GET": "get_item", "PATCH": "save_item"}),
        ("releases", "tests|approve|activate|rollback", {"GET": "get_release"}),
        ("experiments", "evaluations", {"GET": "get_experiment"}),
    ):
        match = re.fullmatch(rf"{category}/{UUID_PATTERN}(?:/({suffixes}))?", path)
        if not match:
            continue
        resource_id, suffix = match.groups()
        if not suffix:
            action = mapping.get(method)
        elif method == "POST":
            action = {"tests": "run_experiment", "evaluations": "evaluate"}.get(suffix)
            if action is None:
                action = f"{suffix}_{'item' if category == 'items' else 'release'}"
    if action is None:
        raise HTTPException(404, "Opération introuvable.")
    payload = {}
    if method != "GET":
        raw = await request.body()
        if len(raw) > 250000:
            raise HTTPException(413, "Données trop volumineuses.")
        try:
            payload = await request.json() if raw else {}
        except ValueError:
            raise HTTPException(422, "JSON invalide.") from None
        if not isinstance(payload, dict):
            raise HTTPException(422, "Objet JSON attendu.")
    result = execute_rpc(
        client,
        "workspace_api",
        {
            "p_action": action,
            "p_id": resource_id,
            "p_payload": payload,
        },
    )
    created = action in ("prepare_release", "run_experiment", "evaluate") or (
        action == "save_item" and method == "POST"
    )
    return JSONResponse(result, status_code=201 if created else 200)
