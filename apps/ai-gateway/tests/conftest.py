import pytest
from httpx import AsyncClient, ASGITransport

from app.providers.anthropic_provider import AnthropicProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.registry import registry
from app.main import app


@pytest.fixture(scope="session", autouse=True)
def register_default_providers():
    """Register default providers once for all tests since
    ASGITransport does not trigger lifespan events."""
    if "openai" not in registry._providers:
        registry.register("openai", OpenAIProvider())
    if "anthropic" not in registry._providers:
        registry.register("anthropic", AnthropicProvider())
    yield


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
