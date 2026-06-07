import uuid

from app.detectors.base import DetectedEntity


class TokenizeMasker:
    strategy = "TOKENIZE"

    def __init__(self):
        self._mapping: dict[str, str] = {}
        self._reverse: dict[str, str] = {}

    def mask(self, text: str, entities: list[DetectedEntity]) -> tuple[str, dict[tuple[int, int], str]]:
        replacements = {}
        for ent in entities:
            if ent.value not in self._mapping:
                token = f"{ent.entity_type.value}_{uuid.uuid4().hex[:8]}"
                self._mapping[ent.value] = token
                self._reverse[token] = ent.value
            replacements[(ent.start, ent.end)] = self._mapping[ent.value]
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
