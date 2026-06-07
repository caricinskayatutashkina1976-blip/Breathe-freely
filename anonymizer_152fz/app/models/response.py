from uuid import UUID

from pydantic import BaseModel, Field

from app.models.entity_types import EntityType


class DetectedEntityResponse(BaseModel):
    entity_type: EntityType
    value: str
    start: int
    end: int
    confidence: float
    detector_name: str
    strategy_applied: str | None = None


class AnonymizeTextResponse(BaseModel):
    anonymized_text: str
    entities_found: list[DetectedEntityResponse] = Field(default_factory=list)
    processing_time_ms: int
    audit_id: UUID
    dry_run: bool = False


class BatchTaskResponse(BaseModel):
    task_id: str
    status: str
    message: str


class BatchResultItem(BaseModel):
    index: int
    anonymized_text: str
    entities_found: list[DetectedEntityResponse] = Field(default_factory=list)
    processing_time_ms: int


class BatchStatusResponse(BaseModel):
    task_id: str
    status: str
    progress: int = 0
    total: int = 0
    results: list[BatchResultItem] | None = None
    error: str | None = None


class AuditLogResponse(BaseModel):
    audit_id: UUID
    timestamp: str
    operator_id: str
    input_hash: str
    entity_types_found: list[str]
    entity_count: int
    strategy_used: str
    processing_time_ms: int
    legal_basis: str


class AuditLogsPageResponse(BaseModel):
    items: list[AuditLogResponse]
    page: int
    page_size: int
    total: int


class ProblemDetail(BaseModel):
    type: str = "about:blank"
    title: str
    status: int
    detail: str
    instance: str | None = None
