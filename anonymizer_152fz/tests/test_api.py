import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health(client):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_anonymize_text(client):
    response = await client.post(
        "/api/v1/anonymize/text",
        json={
            "text": "Позвоните Ивану Петрову по номеру +7 900 123-45-67",
            "strategy": "REDACT",
            "return_entities": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "anonymized_text" in data
    assert "audit_id" in data
    assert data["processing_time_ms"] >= 0


@pytest.mark.asyncio
async def test_dry_run(client):
    response = await client.post(
        "/api/v1/anonymize/text",
        json={"text": "email: test@mail.ru", "dry_run": True},
    )
    assert response.status_code == 200
    data = response.json()
    assert "test@mail.ru" in data["anonymized_text"]


@pytest.mark.asyncio
async def test_audit_logs(client):
    await client.post(
        "/api/v1/anonymize/text",
        json={"text": "+79001112233", "operator_id": "tester"},
    )
    response = await client.get("/api/v1/audit/logs")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
