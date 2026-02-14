import pytest


@pytest.mark.asyncio
async def test_get_providers_returns_200(client):
    response = await client.get("/v1/providers")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_get_providers_contains_registered_providers(client):
    response = await client.get("/v1/providers")
    data = response.json()
    names = [p["name"] for p in data]
    assert "openai" in names
    assert "anthropic" in names


@pytest.mark.asyncio
async def test_get_providers_has_models(client):
    response = await client.get("/v1/providers")
    data = response.json()
    for provider in data:
        assert "name" in provider
        assert "models" in provider
        assert isinstance(provider["models"], list)
        assert len(provider["models"]) > 0
