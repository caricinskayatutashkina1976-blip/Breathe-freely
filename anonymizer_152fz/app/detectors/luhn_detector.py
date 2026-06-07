import re

from app.detectors.base import BaseDetector, DetectedEntity
from app.models.entity_types import EntityType


def luhn_check(card_number: str) -> bool:
    digits = [int(c) for c in card_number if c.isdigit()]
    if len(digits) < 13 or len(digits) > 19:
        return False
    checksum = 0
    parity = len(digits) % 2
    for i, d in enumerate(digits):
        if i % 2 == parity:
            d *= 2
            if d > 9:
                d -= 9
        checksum += d
    return checksum % 10 == 0


class LuhnDetector(BaseDetector):
    name = "luhn"

    CARD_PATTERN = re.compile(r"\b(?:\d[ -]*?){13,19}\b")

    def detect(self, text: str) -> list[DetectedEntity]:
        results: list[DetectedEntity] = []
        for match in self.CARD_PATTERN.finditer(text):
            raw = match.group(0)
            digits = re.sub(r"\D", "", raw)
            if 13 <= len(digits) <= 19 and luhn_check(digits):
                results.append(
                    DetectedEntity(
                        start=match.start(),
                        end=match.end(),
                        entity_type=EntityType.BANK_CARD,
                        value=raw,
                        confidence=0.98,
                        detector_name=self.name,
                    )
                )
        return results
