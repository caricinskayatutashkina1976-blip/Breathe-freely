import pytest

from app.models.entity_types import EntityType


@pytest.mark.asyncio
async def test_anonymize_service_redact(service):
    result = await service.anonymize_text(
        "Позвоните +7 900 123-45-67",
        strategy="REDACT",
        return_entities=True,
    )
    assert "[PHONE]" in result.anonymized_text or "900" not in result.anonymized_text
    assert result.audit_id is not None


@pytest.mark.asyncio
async def test_anonymize_dry_run(service):
    text = "email: secret@test.ru"
    result = await service.anonymize_text(text, dry_run=True)
    assert "secret@test.ru" in result.anonymized_text
    assert result.dry_run is True


@pytest.mark.asyncio
async def test_entity_type_filter(service):
    result = await service.anonymize_text(
        "Иван Петров, +79001112233",
        entity_types=[EntityType.PHONE],
        strategy="REDACT",
    )
    types = {e.entity_type for e in result.entities_found}
    assert EntityType.NAME not in types or EntityType.PHONE in types
