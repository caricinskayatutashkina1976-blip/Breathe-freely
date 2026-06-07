from app.maskers.generalize import GeneralizeMasker
from app.maskers.pseudonymize import PseudonymizeMasker
from app.maskers.redact import RedactMasker
from app.maskers.tokenize import TokenizeMasker

MASKERS = {
    "REDACT": RedactMasker,
    "PSEUDONYMIZE": PseudonymizeMasker,
    "GENERALIZE": GeneralizeMasker,
    "TOKENIZE": TokenizeMasker,
}


def get_masker(strategy: str, **kwargs):
    cls = MASKERS.get(strategy.upper(), RedactMasker)
    return cls(**kwargs)
