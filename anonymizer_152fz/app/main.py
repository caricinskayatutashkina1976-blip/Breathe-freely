from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.api.v1 import anonymize, audit, health
from app.config import get_settings
from app.core.audit_logger import AuditLogger
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService
from app.db.database import init_db
from app.rate_limit import limiter
from app.services.anonymize_service import AnonymizeService

settings = get_settings()

_detector: DetectorOrchestrator | None = None
_masker: MaskerService | None = None
_service: AnonymizeService | None = None


def get_anonymize_service() -> AnonymizeService:
    if _service is None:
        raise RuntimeError("Service not initialized")
    return _service


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _detector, _masker, _service
    try:
        await init_db()
    except Exception:
        pass
    _detector = DetectorOrchestrator(settings)
    _masker = MaskerService(settings.anonymizer_strategy, settings.anonymizer_pseudonym_secret_key)
    _service = AnonymizeService(
        _detector,
        _masker,
        AuditLogger(),
        settings.anonymizer_strategy,
        settings.anonymizer_legal_basis,
    )
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Система деперсонализации персональных данных по 152-ФЗ",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "type": "about:blank",
            "title": "Validation Error",
            "status": 422,
            "detail": str(exc),
            "instance": str(request.url),
        },
    )


app.include_router(health.router, prefix="/api/v1")
app.include_router(anonymize.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
