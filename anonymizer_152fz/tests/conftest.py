import os

os.environ.setdefault("ENABLE_NER", "false")
os.environ.setdefault("ENABLE_SPACY", "false")

import pytest

from app.config import Settings, get_settings
from app.core.audit_logger import AuditLogger
from app.core.detector import DetectorOrchestrator
from app.core.masker import MaskerService
from app.services.anonymize_service import AnonymizeService


@pytest.fixture(autouse=True)
def _reset_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def settings():
    return Settings(enable_ner=False, enable_spacy=False)


@pytest.fixture
def orchestrator(settings):
    return DetectorOrchestrator(settings)


@pytest.fixture
def masker(settings):
    return MaskerService(settings.anonymizer_strategy, settings.anonymizer_pseudonym_secret_key)


@pytest.fixture
def service(orchestrator, masker, settings):
    return AnonymizeService(
        orchestrator,
        masker,
        AuditLogger(),
        settings.anonymizer_strategy,
        settings.anonymizer_legal_basis,
    )
