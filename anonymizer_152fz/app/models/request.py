from typing import Literal

from pydantic import BaseModel, Field

from app.models.entity_types import EntityType


class AnonymizeTextRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100_000)
    strategy: Literal["REDACT", "PSEUDONYMIZE", "GENERALIZE", "TOKENIZE"] | None = None
    entity_types: list[EntityType] | None = None
    return_entities: bool = True
    dry_run: bool = False
    operator_id: str = "system"
    legal_basis: str | None = None


class AnonymizeBatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=1000)
    strategy: Literal["REDACT", "PSEUDONYMIZE", "GENERALIZE", "TOKENIZE"] | None = None
    entity_types: list[EntityType] | None = None
    return_entities: bool = True
    dry_run: bool = False
    operator_id: str = "system"
    legal_basis: str | None = None


class AuditLogFilter(BaseModel):
    date_from: str | None = None
    date_to: str | None = None
    entity_type: EntityType | None = None
    operator_id: str | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(50, ge=1, le=200)
