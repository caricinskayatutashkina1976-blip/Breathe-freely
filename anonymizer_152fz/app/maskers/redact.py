from app.detectors.base import DetectedEntity
from app.models.entity_types import EntityType

LABELS = {
    EntityType.NAME: "[ФИО]",
    EntityType.PHONE: "[PHONE]",
    EntityType.EMAIL: "[EMAIL]",
    EntityType.SNILS: "[СНИЛС]",
    EntityType.INN: "[ИНН]",
    EntityType.PASSPORT: "[ПАСПОРТ]",
    EntityType.ADDRESS: "[АДРЕС]",
    EntityType.BANK_CARD: "[BANK_CARD]",
    EntityType.BIRTH_DATE: "[ДАТА_РОЖДЕНИЯ]",
    EntityType.IP_ADDRESS: "[IP]",
    EntityType.MEDICAL: "[МЕДИЦИНСКИЕ_ДАННЫЕ]",
}


class RedactMasker:
    strategy = "REDACT"

    def mask(self, text: str, entities: list[DetectedEntity]) -> tuple[str, dict[tuple[int, int], str]]:
        replacements: dict[tuple[int, int], str] = {}
        for ent in entities:
            label = LABELS.get(ent.entity_type, f"[{ent.entity_type.value}]")
            replacements[(ent.start, ent.end)] = label
        return self._apply(text, replacements), replacements

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
