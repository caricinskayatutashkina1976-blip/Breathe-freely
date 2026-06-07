import hashlib
import hmac

from app.detectors.base import DetectedEntity
from app.models.entity_types import EntityType


class PseudonymizeMasker:
    strategy = "PSEUDONYMIZE"

    def __init__(self, secret_key: str):
        self._secret = secret_key.encode("utf-8")
        self._mapping: dict[str, str] = {}
        self._reverse: dict[str, str] = {}
        self._counter: dict[EntityType, int] = {}

    def _pseudonym(self, entity: DetectedEntity) -> str:
        if entity.value in self._mapping:
            return self._mapping[entity.value]
        digest = hmac.new(
            self._secret,
            f"{entity.entity_type.value}:{entity.value}".encode(),
            hashlib.sha256,
        ).hexdigest()[:4].upper()
        prefix = {
            EntityType.NAME: "Субъект",
            EntityType.PHONE: "PHONE",
            EntityType.EMAIL: "EMAIL",
        }.get(entity.entity_type, entity.entity_type.value)
        token = f"{prefix}_{digest}"
        self._mapping[entity.value] = token
        self._reverse[token] = entity.value
        return token

    def mask(self, text: str, entities: list[DetectedEntity]) -> tuple[str, dict[tuple[int, int], str]]:
        replacements = {}
        for ent in entities:
            replacements[(ent.start, ent.end)] = self._pseudonym(ent)
        return self._apply(text, replacements), replacements

    def restore(self, text: str) -> str:
        result = text
        for token, original in self._reverse.items():
            result = result.replace(token, original)
        return result

    def get_mapping(self) -> dict[str, str]:
        return dict(self._mapping)

    def _apply(self, text: str, replacements: dict[tuple[int, int], str]) -> str:
        if not replacements:
            return text
        parts = []
        last = 0
        for start, end in sorted(replacements.keys()):
            parts.append(text[last:start])
            parts.append(replacements[(start, end)])
            last = end
        parts.append(text[last:])
        return "".join(parts)
