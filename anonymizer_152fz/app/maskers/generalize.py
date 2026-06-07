import re
from datetime import datetime

from app.detectors.base import DetectedEntity
from app.models.entity_types import EntityType


class GeneralizeMasker:
    strategy = "GENERALIZE"

    def mask(self, text: str, entities: list[DetectedEntity]) -> tuple[str, dict[tuple[int, int], str]]:
        replacements = {}
        for ent in entities:
            replacements[(ent.start, ent.end)] = self._generalize(ent)
        return self._apply(text, replacements), replacements

    def _generalize(self, entity: DetectedEntity) -> str:
        if entity.entity_type == EntityType.BIRTH_DATE:
            return self._generalize_date(entity.value)
        if entity.entity_type == EntityType.PHONE:
            digits = re.sub(r"\D", "", entity.value)
            if digits.startswith("7") or digits.startswith("8"):
                return "+7 (***) ***-**-**"
            return "[PHONE]"
        if entity.entity_type == EntityType.EMAIL:
            return "[EMAIL]"
        if entity.entity_type == EntityType.NAME:
            return "[ФИО]"
        return f"[{entity.entity_type.value}]"

    def _generalize_date(self, value: str) -> str:
        for fmt in ("%d.%m.%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%Y"):
            try:
                dt = datetime.strptime(value.strip(), fmt)
                decade = (dt.year // 10) * 10
                return f"{decade}-е"
            except ValueError:
                continue
        return "[ДАТА]"

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
