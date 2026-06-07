from app.core.masker import MaskerService
from app.detectors.base import DetectedEntity
from app.models.entity_types import EntityType


def _entity(value, entity_type=EntityType.NAME, start=0, end=None):
    end = end or len(value)
    return DetectedEntity(
        start=start,
        end=end,
        entity_type=entity_type,
        value=value,
        confidence=0.95,
        detector_name="test",
    )


def test_redact_masker():
    masker = MaskerService("REDACT", "secret-key-for-tests-32b!")
    text = "Позвоните Ивану Петрову"
    ent = _entity("Ивану Петрову", EntityType.NAME, 9, 22)
    result, _, _ = masker.mask(text, [ent])
    assert "[ФИО]" in result
    assert "Ивану" not in result


def test_pseudonymize_reversible():
    masker = MaskerService("PSEUDONYMIZE", "secret-key-for-tests-32b!")
    text = "Меня зовут Иван Петров"
    ent = _entity("Иван Петров", EntityType.NAME, 12, 23)
    anon, _, _ = masker.mask(text, [ent])
    assert "Иван Петров" not in anon
    restore = masker._get_masker("PSEUDONYMIZE")
    restored = restore.restore(anon)
    assert "Иван Петров" in restored


def test_generalize_birth_date():
    masker = MaskerService("GENERALIZE", "secret-key-for-tests-32b!")
    text = "Дата рождения 14.03.1985"
    ent = _entity("14.03.1985", EntityType.BIRTH_DATE, 14, 24)
    result, _, _ = masker.mask(text, [ent])
    assert "1980-е" in result


def test_tokenize_unique_tokens():
    masker = MaskerService("TOKENIZE", "secret-key-for-tests-32b!")
    text = "+79001234567"
    ent = _entity("+79001234567", EntityType.PHONE, 0, 12)
    result, _, _ = masker.mask(text, [ent])
    assert "PHONE_" in result or "PHONE" in result
