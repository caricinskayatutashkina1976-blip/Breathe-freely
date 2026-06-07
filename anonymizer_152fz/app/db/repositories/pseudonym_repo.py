from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.crypto import AESCipher
from app.models.audit import PseudonymMappingORM


class PseudonymRepository:
    def __init__(self, session: AsyncSession, secret_key: str):
        self.session = session
        self.cipher = AESCipher(secret_key)

    async def save_mapping(self, token: str, value: str, entity_type: str) -> None:
        encrypted = self.cipher.encrypt(value)
        existing = await self.session.execute(
            select(PseudonymMappingORM).where(PseudonymMappingORM.token == token)
        )
        if existing.scalar_one_or_none():
            return
        record = PseudonymMappingORM(
            token=token,
            encrypted_value=encrypted,
            entity_type=entity_type,
        )
        self.session.add(record)
        await self.session.commit()

    async def get_value(self, token: str) -> str | None:
        result = await self.session.execute(
            select(PseudonymMappingORM).where(PseudonymMappingORM.token == token)
        )
        row = result.scalar_one_or_none()
        if not row:
            return None
        return self.cipher.decrypt(row.encrypted_value)
