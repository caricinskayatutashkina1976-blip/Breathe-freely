import re
from pathlib import Path

import yaml

from app.detectors.base import BaseDetector, DetectedEntity
from app.models.entity_types import EntityType


class RegexDetector(BaseDetector):
    name = "regex"

    def __init__(self, patterns_file: Path, redis_client=None):
        self._redis = redis_client
        self._compiled: dict[str, list[tuple[re.Pattern, float]]] = {}
        self._load_patterns(patterns_file)

    def _cache_key(self, path: Path) -> str:
        return f"regex:compiled:{path.resolve()}"

    def _load_patterns(self, path: Path) -> None:
        if self._redis:
            cached = self._redis.get(self._cache_key(path))
            if cached:
                return

        with open(path, encoding="utf-8") as f:
            data = yaml.safe_load(f)

        patterns = data.get("patterns", {})
        for entity_key, entries in patterns.items():
            try:
                entity_type = EntityType[entity_key]
            except KeyError:
                continue
            compiled_list = []
            for entry in entries:
                regex = entry["regex"]
                confidence = float(entry.get("confidence", 0.9))
                compiled_list.append((re.compile(regex, re.IGNORECASE | re.UNICODE), confidence))
            self._compiled[entity_key] = compiled_list

    def detect(self, text: str) -> list[DetectedEntity]:
        results: list[DetectedEntity] = []
        for entity_key, patterns in self._compiled.items():
            entity_type = EntityType[entity_key]
            for pattern, base_confidence in patterns:
                for match in pattern.finditer(text):
                    results.append(
                        DetectedEntity(
                            start=match.start(),
                            end=match.end(),
                            entity_type=entity_type,
                            value=match.group(0),
                            confidence=base_confidence,
                            detector_name=self.name,
                        )
                    )
        return results
