from collections.abc import AsyncGenerator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.providers.base import BaseProvider, GenerateResponse, StreamChunk, Usage
from app.providers.registry import registry


class FakeProvider(BaseProvider):
    name = "fake"
    supported_models = ["fake-model"]

    def __init__(self, content: str = "generated"):
        self.content = content

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> GenerateResponse:
        return GenerateResponse(
            content=self.content,
            model=model,
            provider=self.name,
            usage=Usage(prompt_tokens=1, completion_tokens=1, total_tokens=2),
            finish_reason="stop",
        )

    async def stream(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        yield StreamChunk(content="partial", done=False)
        yield StreamChunk(
            content="",
            done=True,
            usage=Usage(prompt_tokens=1, completion_tokens=1, total_tokens=2),
        )


@pytest.fixture(autouse=True)
def reset_registry():
    registry.clear()
    yield
    registry.clear()


@pytest.fixture
def client() -> TestClient:
    with TestClient(app) as test_client:
        yield test_client
