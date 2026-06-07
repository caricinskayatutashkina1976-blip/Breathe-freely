import pytest

from app.core.audit_logger import AuditLogger
from app.detectors.base import DetectedEntity
from app.models.entity_types import EntityType


@pytest.mark.asyncio
async def test_audit_logger_memory():
    audit = AuditLogger()
    entities = [
        DetectedEntity(0, 5, EntityType.PHONE, "+7900", 0.95, "regex"),
    ]
    audit_id = await audit.log(
        operator_id="tester",
        input_text="секретный текст",
        entities=entities,
        strategy_used="REDACT",
        processing_time_ms=10,
        legal_basis="ст. 6 152-ФЗ",
    )
    rows, total = await audit.list_logs(page=1, page_size=10)
    assert total == 1
    assert rows[0].audit_id == audit_id
    assert rows[0].input_hash != "секретный текст"


@pytest.mark.asyncio
async def test_audit_hash_only():
    audit = AuditLogger()
    text = "Иван +79001112233"
    entities = []
    await audit.log(
        operator_id="x",
        input_text=text,
        entities=entities,
        strategy_used="REDACT",
        processing_time_ms=1,
        legal_basis="ст. 18.1 152-ФЗ",
    )
    rows, _ = await audit.list_logs()
    assert len(rows[0].input_hash) == 64
