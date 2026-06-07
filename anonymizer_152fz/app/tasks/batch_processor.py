import asyncio
import time

from app.config import get_settings
from app.core.audit_logger import AuditLogger
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService
from app.models.entity_types import EntityType
from app.models.response import BatchResultItem, DetectedEntityResponse
from app.services.anonymize_service import AnonymizeService
from app.tasks.batch_store import save_batch_status


def _build_service() -> AnonymizeService:
    settings = get_settings()
    detector = DetectorOrchestrator(settings)
    masker = MaskerService(settings.anonymizer_strategy, settings.anonymizer_pseudonym_secret_key)
    audit = AuditLogger()
    return AnonymizeService(
        detector,
        masker,
        audit,
        settings.anonymizer_strategy,
        settings.anonymizer_legal_basis,
    )


def run_batch(task, payload: dict) -> dict:
    texts = payload.get("texts", [])
    total = len(texts)
    task_id = task.request.id
    save_batch_status(task_id, {"task_id": task_id, "status": "PROCESSING", "progress": 0, "total": total})

    service = _build_service()
    results = []

    async def process_all():
        nonlocal results
        for idx, text in enumerate(texts):
            started = time.perf_counter()
            entity_types = None
            if payload.get("entity_types"):
                entity_types = [EntityType(e) for e in payload["entity_types"]]
            resp = await service.anonymize_text(
                text,
                strategy=payload.get("strategy"),
                entity_types=entity_types,
                return_entities=payload.get("return_entities", True),
                dry_run=payload.get("dry_run", False),
                operator_id=payload.get("operator_id", "batch"),
                legal_basis=payload.get("legal_basis"),
            )
            results.append(
                BatchResultItem(
                    index=idx,
                    anonymized_text=resp.anonymized_text,
                    entities_found=resp.entities_found,
                    processing_time_ms=resp.processing_time_ms,
                ).model_dump()
            )
            progress = int(((idx + 1) / total) * 100)
            task.update_state(state="PROGRESS", meta={"progress": progress, "total": total})
            save_batch_status(
                task_id,
                {"task_id": task_id, "status": "PROCESSING", "progress": progress, "total": total},
            )

    asyncio.run(process_all())

    final = {
        "task_id": task_id,
        "status": "COMPLETED",
        "progress": 100,
        "total": total,
        "results": results,
        "error": None,
    }
    save_batch_status(task_id, final)
    return final
