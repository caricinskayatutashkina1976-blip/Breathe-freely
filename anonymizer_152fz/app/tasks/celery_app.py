from celery import Celery

from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "anonymizer_152fz",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="Europe/Moscow",
    enable_utc=True,
)


@celery_app.task(bind=True, name="process_batch")
def process_batch_task(self, payload: dict):
    from app.tasks.batch_processor import run_batch

    return run_batch(self, payload)
