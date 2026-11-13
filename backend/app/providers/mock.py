from app.providers.base import LLMProvider


class MockLLMProvider(LLMProvider):
    """Fournisseur local de test ; il n’émet aucune recommandation cloud."""

    async def generate(self, *, system_prompt: str, user_prompt: str, context: list[str]) -> str:
        del system_prompt, user_prompt, context
        return "[SIMULATION IA — aucune recommandation cloud réelle n’a été générée.]"
