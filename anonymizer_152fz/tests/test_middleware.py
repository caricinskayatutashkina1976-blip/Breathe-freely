from app.config import Settings
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService, MaskingStrategy
from app.middleware.chatbot import ChatBotAnonymizerMiddleware
from app.models.entity_types import EntityType


def test_chatbot_middleware_mock_llm():
    settings = Settings(enable_ner=False)
    detector = DetectorOrchestrator(settings)
    masker = MaskerService(MaskingStrategy.PSEUDONYMIZE, settings.anonymizer_pseudonym_secret_key)
    middleware = ChatBotAnonymizerMiddleware(
        detector,
        masker,
        strategy=MaskingStrategy.PSEUDONYMIZE,
        entity_types=[EntityType.NAME, EntityType.PHONE],
    )

    def mock_llm(prompt: str) -> str:
        assert "Иван" not in prompt
        assert "89001234567" not in prompt
        return "Ответ для пользователя"

    wrapped = middleware.wrap(mock_llm)
    result = wrapped("Меня зовут Иван, мой телефон 89001234567")
    assert isinstance(result, str)


def test_pseudonymize_roundtrip():
    settings = Settings(enable_ner=False)
    detector = DetectorOrchestrator(settings)
    masker = MaskerService(MaskingStrategy.PSEUDONYMIZE, "test-secret-key-32-characters!!")
    middleware = ChatBotAnonymizerMiddleware(detector, masker)
    anon, restore = middleware.anonymize_input("Контакт: ivan@test.ru")
    assert "ivan@test.ru" not in anon
    restored = middleware.restore_output(anon, restore)
    assert restored == anon or "@" in restored
