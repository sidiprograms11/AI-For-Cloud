from app.core.config import Settings
from app.providers.base import LLMProvider
from app.providers.mock import MockLLMProvider


def get_llm_provider(settings: Settings) -> LLMProvider:
    if settings.llm_provider == "mock":
        return MockLLMProvider()
    raise ValueError("Aucun fournisseur LLM réel n’est configuré pour ce projet.")
