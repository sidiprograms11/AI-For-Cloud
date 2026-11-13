from fastapi import APIRouter

from app.schemas.health import HealthResponse

api_router = APIRouter()


@api_router.get("/health", response_model=HealthResponse, tags=["health"])
async def health_check() -> HealthResponse:
    """Expose un état minimal sans secret ni diagnostic interne."""
    return HealthResponse(status="ok")
