from datetime import datetime

import pytest


@pytest.mark.asyncio
async def test_health_returns_ok(client):
    response = await client.get("/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_health_timestamp_format(client):
    response = await client.get("/v1/health")
    data = response.json()
    # Verify timestamp is valid ISO8601 by parsing it
    parsed = datetime.fromisoformat(data["timestamp"])
    assert parsed is not None
