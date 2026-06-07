import re
from pathlib import Path

import yaml

from app.detectors.base import BaseDetector, DetectedEntity
from app.models.entity_types import EntityType


class CustomDetector(BaseDetector):
    name = "custom"

    def __init__(self, rules_file: Path | None):
        self._patterns: list[tuple[re.Pattern, EntityType, float]] = []
        if rules_file and rules_file.exists():
            self._load(rules_file)

    def _load(self, path: Path) -> None:
        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        for rule_name, rule in data.get("custom_patterns", {}).items():
            entity_type = EntityType[rule["entity_type"]]
            for entry in rule.get("patterns", []):
                self._patterns.append(
                    (
                        re.compile(entry["regex"], re.IGNORECASE | re.UNICODE),
                        entity_type,
                        float(entry.get("confidence", 0.9)),
                    )
                )

    def detect(self, text: str) -> list[DetectedEntity]:
        results: list[DetectedEntity] = []
        for pattern, entity_type, confidence in self._patterns:
            for match in pattern.finditer(text):
                results.append(
                    DetectedEntity(
                        start=match.start(),
                        end=match.end(),
                        entity_type=entity_type,
                        value=match.group(0),
                        confidence=confidence,
                        detector_name=self.name,
                    )
                )
        return results
