from pathlib import Path

from app.config import Settings
from app.detectors.luhn_detector import LuhnDetector, luhn_check
from app.detectors.regex_detector import RegexDetector
from app.models.entity_types import EntityType

RULES = Path(__file__).resolve().parent.parent / "rules" / "patterns_ru.yaml"


def test_luhn_valid_card():
    assert luhn_check("4111111111111111") is True


def test_luhn_invalid_card():
    assert luhn_check("4111111111111112") is False


def test_luhn_detector_finds_card():
    detector = LuhnDetector()
    text = "Оплата картой 4111 1111 1111 1111 прошла успешно"
    entities = detector.detect(text)
    assert any(e.entity_type == EntityType.BANK_CARD for e in entities)


def test_phone_detection_russian():
    detector = RegexDetector(RULES)
    text = "Позвоните по номеру +7 900 123-45-67"
    entities = detector.detect(text)
    phones = [e for e in entities if e.entity_type == EntityType.PHONE]
    assert len(phones) >= 1
    assert "+7" in phones[0].value or "900" in phones[0].value


def test_snils_detection():
    detector = RegexDetector(RULES)
    text = "СНИЛС: 123-456-789 01"
    entities = detector.detect(text)
    assert any(e.entity_type == EntityType.SNILS for e in entities)


def test_email_detection():
    detector = RegexDetector(RULES)
    text = "Пишите на test.user@example.com"
    entities = detector.detect(text)
    assert any(e.entity_type == EntityType.EMAIL for e in entities)


def test_false_positive_plain_number_not_phone():
    detector = RegexDetector(RULES)
    text = "В документе указан номер 12345"
    entities = [e for e in detector.detect(text) if e.entity_type == EntityType.PHONE]
    assert len(entities) == 0


def test_passport_detection():
    detector = RegexDetector(RULES)
    text = "Паспорт 4506 123456 выдан"
    entities = detector.detect(text)
    assert any(e.entity_type == EntityType.PASSPORT for e in entities)


def test_ip_detection():
    detector = RegexDetector(RULES)
    text = "IP-адрес клиента 192.168.1.100"
    entities = detector.detect(text)
    assert any(e.entity_type == EntityType.IP_ADDRESS for e in entities)


def test_orchestrator_merge(settings):
    from app.core.detector import DetectorOrchestrator

    orch = DetectorOrchestrator(settings)
    text = "Иван Петров, +7 900 111-22-33, ivan@test.ru"
    entities = orch.detect(text)
    types = {e.entity_type for e in entities}
    assert EntityType.PHONE in types or EntityType.EMAIL in types
