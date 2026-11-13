from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_env: str = "development"
    allowed_origins: str = "http://127.0.0.1:5173,http://localhost:5173"
    supabase_url: str = "http://127.0.0.1:54321"
    supabase_publishable_key: SecretStr | None = None
    supabase_secret_key: SecretStr | None = None
    llm_provider: str = "mock"
    llm_model: str = "mock"
    llm_api_key: SecretStr | None = None
    embedding_model: str = "mock"
    embedding_api_key: SecretStr | None = None

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
