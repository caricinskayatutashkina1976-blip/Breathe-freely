"""Middleware деперсонализации для чат-ботов (ст. 6, 10 152-ФЗ)."""

from typing import Any, Callable

from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService, MaskingStrategy
from app.maskers.pseudonymize import PseudonymizeMasker
from app.maskers.tokenize import TokenizeMasker
from app.models.entity_types import EntityType


class ChatBotAnonymizerMiddleware:
    """
    Перехватывает входящие сообщения, анонимизирует ПДн перед LLM,
    восстанавливает псевдонимы в ответе (PSEUDONYMIZE / TOKENIZE).
    """

    def __init__(
        self,
        detector: DetectorOrchestrator,
        masker: MaskerService,
        strategy: str = MaskingStrategy.PSEUDONYMIZE,
        entity_types: list[EntityType] | None = None,
    ):
        self.detector = detector
        self.masker = masker
        self.strategy = strategy
        self.entity_types = entity_types

    def anonymize_input(self, text: str) -> tuple[str, object | None]:
        self.masker.default_strategy = self.strategy
        entities = self.detector.detect(text, entity_types=self.entity_types)
        anonymized, _, _ = self.masker.mask(text, entities)
        restore_masker = self.masker._get_masker(self.strategy)
        return anonymized, restore_masker

    def restore_output(self, text: str, restore_masker: object | None) -> str:
        if restore_masker is None:
            return text
        if isinstance(restore_masker, (PseudonymizeMasker, TokenizeMasker)):
            return restore_masker.restore(text)
        return text

    def wrap(self, llm_callable: Callable[[str], str]) -> Callable[[str], str]:
        def wrapped(user_input: str) -> str:
            anon_input, restore = self.anonymize_input(user_input)
            llm_response = llm_callable(anon_input)
            return self.restore_output(llm_response, restore)

        return wrapped

    def wrap_langchain(self, chain: Any) -> Any:
        """Обёртка для LangChain Runnable / chain.invoke."""
        middleware = self

        class AnonymizedChain:
            def invoke(self, inputs: dict, **kwargs):
                raw = inputs.get("input") or inputs.get("question") or ""
                anon, restore = middleware.anonymize_input(str(raw))
                new_inputs = dict(inputs)
                key = "input" if "input" in inputs else "question"
                new_inputs[key] = anon
                response = chain.invoke(new_inputs, **kwargs)
                if isinstance(response, dict):
                    for k, v in response.items():
                        if isinstance(v, str):
                            response[k] = middleware.restore_output(v, restore)
                    return response
                if isinstance(response, str):
                    return middleware.restore_output(response, restore)
                return response

        return AnonymizedChain()

    async def wrap_openai(self, client: Any, messages: list[dict], **kwargs) -> Any:
        """Прямая интеграция с OpenAI/Anthropic messages API."""
        restore_masker = None
        new_messages = []
        for msg in messages:
            content = msg.get("content", "")
            if msg.get("role") == "user" and isinstance(content, str):
                anon, restore_masker = self.anonymize_input(content)
                new_messages.append({**msg, "content": anon})
            else:
                new_messages.append(msg)
        response = await client.chat.completions.create(messages=new_messages, **kwargs)
        if response.choices:
            text = response.choices[0].message.content or ""
            response.choices[0].message.content = self.restore_output(text, restore_masker)
        return response
