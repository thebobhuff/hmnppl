"""Application configuration via environment variables.

Uses pydantic-settings to read and validate configuration from environment
variables (and optional .env file).  All settings are strongly typed and
documented so that missing required values fail fast at startup.
"""

from __future__ import annotations

from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings.

    Values are loaded from environment variables.  An optional ``.env`` file
    in the working directory is also supported for local development.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ---- Required secrets ----
    AI_SERVICE_API_KEY: str

    # ---- Optional API keys ----
    HUGGINGFACE_API_TOKEN: str = ""
    OPENROUTER_API_KEY: str = ""

    # ---- Supabase ----
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ---- CORS ----
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # ---- Observability ----
    LOG_LEVEL: str = "INFO"

    # ---- Helpers ----

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def _parse_origins(cls, v: str) -> str:
        """Accept comma-separated origins and normalise whitespace."""
        return ",".join(origin.strip() for origin in v.split(",") if origin.strip())

    @property
    def cors_origins_list(self) -> List[str]:
        """Return ALLOWED_ORIGINS as a list of strings."""
        return [
            origin.strip()
            for origin in self.ALLOWED_ORIGINS.split(",")
            if origin.strip()
        ]

    @field_validator("LOG_LEVEL", mode="before")
    @classmethod
    def _normalise_log_level(cls, v: str) -> str:
        return v.upper()


def get_settings() -> Settings:
    """Return a cached Settings instance.

    Using a function allows easy override in tests via dependency injection.
    """
    return Settings()
