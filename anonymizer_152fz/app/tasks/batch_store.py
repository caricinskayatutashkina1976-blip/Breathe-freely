import json

import redis

from app.config import get_settings

_settings = get_settings()
_redis = redis.from_url(_settings.redis_url, decode_responses=True)


def save_batch_status(task_id: str, data: dict) -> None:
    _redis.setex(f"batch:{task_id}", 86400, json.dumps(data, default=str))


def get_batch_status(task_id: str) -> dict | None:
    raw = _redis.get(f"batch:{task_id}")
    if not raw:
        return None
    return json.loads(raw)
