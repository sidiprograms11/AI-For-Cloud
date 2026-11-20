from fastapi import APIRouter

from app.api.internal import router as internal_router
from app.api.workspace import router as workspace_router
from app.schemas.health import HealthResponse

api_router = APIRouter()
api_router.include_router(internal_router)
api_router.include_router(workspace_router)


@api_router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Expose un état minimal sans secret ni diagnostic interne."""
    return HealthResponse(status="ok")
