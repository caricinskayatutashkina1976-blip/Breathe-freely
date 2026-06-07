import time

from app.core.audit_logger import AuditLogger
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService
from app.models.entity_types import EntityType
from app.models.response import AnonymizeTextResponse, DetectedEntityResponse


class AnonymizeService:
    def __init__(
        self,
        detector: DetectorOrchestrator,
        masker: MaskerService,
        audit: AuditLogger,
        default_strategy: str,
        legal_basis: str,
    ):
        self.detector = detector
        self.masker = masker
        self.audit = audit
        self.default_strategy = default_strategy
        self.legal_basis = legal_basis

    async def anonymize_text(
        self,
        text: str,
        *,
        strategy: str | None = None,
        entity_types: list[EntityType] | None = None,
        return_entities: bool = True,
        dry_run: bool = False,
        operator_id: str = "system",
        legal_basis: str | None = None,
    ) -> AnonymizeTextResponse:
        started = time.perf_counter()
        strategy_used = strategy or self.default_strategy
        self.masker.default_strategy = strategy_used

        entities = self.detector.detect(text, entity_types=entity_types)
        anonymized, entities, _ = self.masker.mask(text, entities, dry_run=dry_run)

        elapsed_ms = int((time.perf_counter() - started) * 1000)
        audit_id = await self.audit.log(
            operator_id=operator_id,
            input_text=text,
            entities=entities,
            strategy_used=strategy_used,
            processing_time_ms=elapsed_ms,
            legal_basis=legal_basis or self.legal_basis,
        )

        entity_responses = []
        if return_entities:
            entity_responses = [
                DetectedEntityResponse(
                    entity_type=e.entity_type,
                    value=e.value,
                    start=e.start,
                    end=e.end,
                    confidence=e.confidence,
                    detector_name=e.detector_name,
                    strategy_applied=getattr(e, "strategy_applied", strategy_used),
                )
                for e in entities
            ]

        return AnonymizeTextResponse(
            anonymized_text=anonymized,
            entities_found=entity_responses,
            processing_time_ms=elapsed_ms,
            audit_id=audit_id,
            dry_run=dry_run,
        )
