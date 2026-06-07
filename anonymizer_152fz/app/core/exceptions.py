class AnonymizerError(Exception):
    """Базовая ошибка системы деперсонализации."""


class DetectionError(AnonymizerError):
    pass


class MaskingError(AnonymizerError):
    pass


class AuditError(AnonymizerError):
    pass


class BatchLimitError(AnonymizerError):
    pass
