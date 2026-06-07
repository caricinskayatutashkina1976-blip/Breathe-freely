from app.config import Settings, get_settings
from app.detectors.base import BaseDetector, DetectedEntity
from app.detectors.custom_detector import CustomDetector
from app.detectors.luhn_detector import LuhnDetector
from app.detectors.ner_detector import NERDetector
from app.detectors.regex_detector import RegexDetector
from app.models.entity_types import EntityType


def _merge_entities(entities: list[DetectedEntity]) -> list[DetectedEntity]:
    if not entities:
        return []
    sorted_ents = sorted(entities, key=lambda e: (e.start, -e.end, -e.confidence))
    merged: list[DetectedEntity] = []
    for ent in sorted_ents:
        if merged and ent.start < merged[-1].end:
            prev = merged[-1]
            if ent.confidence > prev.confidence or (ent.end - ent.start) > (prev.end - prev.start):
                merged[-1] = ent
            continue
        merged.append(ent)
    return merged


class DetectorOrchestrator:
    """Оркестратор детекторов ПДн (ст. 18.1 152-ФЗ — учёт обработки)."""

    def __init__(self, settings: Settings | None = None, redis_client=None):
        self.settings = settings or get_settings()
        self.detectors: list[BaseDetector] = [
            RegexDetector(self.settings.patterns_file, redis_client=redis_client),
            LuhnDetector(),
            CustomDetector(self.settings.custom_rules_file),
        ]
        if self.settings.enable_ner:
            self.detectors.append(
                NERDetector(
                    enable_natasha=True,
                    enable_spacy=self.settings.enable_spacy,
                    spacy_model=self.settings.anonymizer_ner_model,
                )
            )

    def detect(
        self,
        text: str,
        entity_types: list[EntityType] | None = None,
        confidence_threshold: float | None = None,
    ) -> list[DetectedEntity]:
        threshold = confidence_threshold or self.settings.anonymizer_confidence_threshold
        all_entities: list[DetectedEntity] = []
        for detector in self.detectors:
            try:
                all_entities.extend(detector.detect(text))
            except Exception:
                continue

        filtered = [e for e in all_entities if e.confidence >= threshold]
        if entity_types:
            allowed = set(entity_types)
            filtered = [e for e in filtered if e.entity_type in allowed]

        return _merge_entities(filtered)
