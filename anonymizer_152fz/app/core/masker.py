from app.detectors.base import DetectedEntity
from app.maskers import get_masker
from app.models.entity_types import EntityType


class MaskingStrategy:
    REDACT = "REDACT"
    PSEUDONYMIZE = "PSEUDONYMIZE"
    GENERALIZE = "GENERALIZE"
    TOKENIZE = "TOKENIZE"


class MaskerService:
    def __init__(self, default_strategy: str, secret_key: str, strategy_overrides: dict | None = None):
        self.default_strategy = default_strategy
        self.secret_key = secret_key
        self.strategy_overrides = strategy_overrides or {}
        self._masker_instances: dict[str, object] = {}

    def _get_masker(self, strategy: str):
        if strategy not in self._masker_instances:
            kwargs = {}
            if strategy in ("PSEUDONYMIZE",):
                kwargs["secret_key"] = self.secret_key
            self._masker_instances[strategy] = get_masker(strategy, **kwargs)
        return self._masker_instances[strategy]

    def _strategy_for(self, entity: DetectedEntity) -> str:
        return self.strategy_overrides.get(entity.entity_type.value, self.default_strategy)

    def mask(
        self,
        text: str,
        entities: list[DetectedEntity],
        dry_run: bool = False,
    ) -> tuple[str, list[DetectedEntity], dict]:
        if dry_run:
            return text, entities, {}

        by_strategy: dict[str, list[DetectedEntity]] = {}
        for ent in entities:
            strat = self._strategy_for(ent)
            by_strategy.setdefault(strat, []).append(ent)

        result = text
        applied: dict[tuple[int, int], str] = {}
        for strategy, group in by_strategy.items():
            masker = self._get_masker(strategy)
            result, reps = masker.mask(result, group)
            applied.update(reps)
            for ent in group:
                ent.strategy_applied = strategy

        return result, entities, applied
