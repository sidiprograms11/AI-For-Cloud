from typing import Protocol


class LLMProvider(Protocol):
    async def generate(self, *, system_prompt: str, user_prompt: str, context: list[str]) -> str:
        """Génère une réponse à partir d’un contexte validé."""
