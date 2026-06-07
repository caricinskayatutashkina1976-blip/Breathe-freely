import hashlib
import uuid
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.repositories.audit_repo import AuditRepository
from app.detectors.base import DetectedEntity
from app.models.audit import AuditLogORM


class AuditLogger:
    """Журналирование операций деперсонализации (ст. 18.1 152-ФЗ)."""

    def __init__(self, session: AsyncSession | None = None):
        self._repo = AuditRepository(session) if session else None
        self._memory: list[AuditLogORM] = []

    @staticmethod
    def hash_input(text: str) -> str:
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

    async def log(
        self,
        *,
        operator_id: str,
        input_text: str,
        entities: list[DetectedEntity],
        strategy_used: str,
        processing_time_ms: int,
        legal_basis: str,
    ) -> uuid.UUID:
        audit_id = uuid.uuid4()
        record = AuditLogORM(
            audit_id=audit_id,
            timestamp=datetime.now(timezone.utc),
            operator_id=operator_id,
            input_hash=self.hash_input(input_text),
            entity_types_found=sorted({e.entity_type.value for e in entities}),
            entity_count=len(entities),
            strategy_used=strategy_used,
            processing_time_ms=processing_time_ms,
            legal_basis=legal_basis,
        )
        if self._repo:
            await self._repo.create(record)
        else:
            self._memory.append(record)
        return audit_id

    async def list_logs(
        self,
        *,
        date_from=None,
        date_to=None,
        entity_type=None,
        operator_id: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ):
        if self._repo:
            return await self._repo.list_logs(
                date_from=date_from,
                date_to=date_to,
                entity_type=entity_type,
                operator_id=operator_id,
                page=page,
                page_size=page_size,
            )

        rows = list(self._memory)
        if date_from:
            rows = [r for r in rows if r.timestamp >= date_from]
        if date_to:
            rows = [r for r in rows if r.timestamp <= date_to]
        if operator_id:
            rows = [r for r in rows if r.operator_id == operator_id]
        if entity_type:
            rows = [r for r in rows if entity_type.value in r.entity_types_found]

        total = len(rows)
        start = (page - 1) * page_size
        end = start + page_size
        return rows[start:end], total
