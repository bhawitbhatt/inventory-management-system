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
