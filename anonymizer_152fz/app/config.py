from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent
RULES_DIR = BASE_DIR / "rules"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Anonymizer 152-FZ"
    app_version: str = "1.0.0"
    debug: bool = False

    anonymizer_strategy: str = "REDACT"
    anonymizer_confidence_threshold: float = 0.85
    anonymizer_ner_model: str = "ru_core_news_lg"
    anonymizer_audit_retention_days: int = 1095
    anonymizer_pseudonym_secret_key: str = Field(
        default="change-me-in-production-32bytes!!",
        min_length=16,
    )
    anonymizer_legal_basis: str = "ст. 6, 10, 18.1 152-ФЗ"

    db_url: str = "postgresql+asyncpg://anonymizer:anonymizer@localhost:5432/anonymizer"
    redis_url: str = "redis://localhost:6379/0"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"

    patterns_file: Path = RULES_DIR / "patterns_ru.yaml"
    custom_rules_file: Path | None = RULES_DIR / "custom_rules_example.yaml"

    rate_limit_per_minute: int = 100
    batch_max_items: int = 1000

    enable_ner: bool = True
    enable_spacy: bool = False


@lru_cache
def get_settings() -> Settings:
    return Settings()
