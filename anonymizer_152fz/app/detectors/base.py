from abc import ABC, abstractmethod
from dataclasses import dataclass

from app.models.entity_types import EntityType


@dataclass
class DetectedEntity:
    start: int
    end: int
    entity_type: EntityType
    value: str
    confidence: float
    detector_name: str
    strategy_applied: str | None = None


class BaseDetector(ABC):
    name: str = "base"

    @abstractmethod
    def detect(self, text: str) -> list[DetectedEntity]:
        """Возвращает список найденных сущностей с позициями."""
        ...
