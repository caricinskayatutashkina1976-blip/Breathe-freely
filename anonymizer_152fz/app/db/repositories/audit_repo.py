from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit import AuditLogORM
from app.models.entity_types import EntityType


class AuditRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, record: AuditLogORM) -> AuditLogORM:
        self.session.add(record)
        await self.session.commit()
        await self.session.refresh(record)
        return record

    async def list_logs(
        self,
        *,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        entity_type: EntityType | None = None,
        operator_id: str | None = None,
        page: int = 1,
        page_size: int = 50,
    ) -> tuple[list[AuditLogORM], int]:
        query = select(AuditLogORM)
        if date_from:
            query = query.where(AuditLogORM.timestamp >= date_from)
        if date_to:
            query = query.where(AuditLogORM.timestamp <= date_to)
        if operator_id:
            query = query.where(AuditLogORM.operator_id == operator_id)
        if entity_type:
            query = query.where(AuditLogORM.entity_types_found.contains([entity_type.value]))

        count_q = select(func.count()).select_from(query.subquery())
        total = (await self.session.execute(count_q)).scalar_one()

        query = query.order_by(AuditLogORM.timestamp.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.session.execute(query)).scalars().all()
        return list(rows), total

    async def get_by_id(self, audit_id: UUID) -> AuditLogORM | None:
        result = await self.session.execute(select(AuditLogORM).where(AuditLogORM.audit_id == audit_id))
        return result.scalar_one_or_none()
