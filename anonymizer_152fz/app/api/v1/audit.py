from datetime import datetime

from fastapi import APIRouter, Depends, Query

from app.api.v1.anonymize import get_service
from app.models.entity_types import EntityType
from app.models.response import AuditLogResponse, AuditLogsPageResponse
from app.services.anonymize_service import AnonymizeService

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs", response_model=AuditLogsPageResponse)
async def get_audit_logs(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    entity_type: EntityType | None = Query(None),
    operator_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    service: AnonymizeService = Depends(get_service),
):
    df = datetime.fromisoformat(date_from) if date_from else None
    dt = datetime.fromisoformat(date_to) if date_to else None
    rows, total = await service.audit.list_logs(
        date_from=df,
        date_to=dt,
        entity_type=entity_type,
        operator_id=operator_id,
        page=page,
        page_size=page_size,
    )
    items = [
        AuditLogResponse(
            audit_id=r.audit_id,
            timestamp=r.timestamp.isoformat(),
            operator_id=r.operator_id,
            input_hash=r.input_hash,
            entity_types_found=r.entity_types_found,
            entity_count=r.entity_count,
            strategy_used=r.strategy_used,
            processing_time_ms=r.processing_time_ms,
            legal_basis=r.legal_basis,
        )
        for r in rows
    ]
    return AuditLogsPageResponse(items=items, page=page, page_size=page_size, total=total)
