from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Inventory & Order Management API"
    app_version: str = "1.0.0"
    debug: bool = False

    database_url: str = Field(
        default="sqlite:///./dev.db",
        description="SQLAlchemy database URL.",
    )

    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated allowed CORS origins.",
    )

    cors_origin_regex: str = Field(
        default="",
        description=(
            "Optional regex matching additional allowed origins (e.g. preview-deploy URLs). "
            "Empty disables regex. Operator must set this explicitly for production deploys "
            "that use ephemeral preview URLs; the default no longer hard-codes any project."
        ),
    )

    docs_enabled: bool = Field(
        default=False,
        description=(
            "If true, /docs, /redoc, and /openapi.json are exposed. Default is false: "
            "production deployments should opt in only after confirming CSP allows the "
            "Swagger UI assets (cdn.jsdelivr.net). Set DOCS_ENABLED=true in .env for local dev."
        ),
    )

    low_stock_threshold: int = Field(
        default=10,
        ge=0,
        description="Products with quantity_in_stock < this value are flagged as low stock.",
    )

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
