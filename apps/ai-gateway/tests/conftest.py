from collections.abc import AsyncGenerator

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.providers.base import BaseProvider, GenerateResponse, ProviderError, StreamChunk, Usage
from app.providers.registry import registry


class FakeProvider(BaseProvider):
    name = "fake"
    supported_models = ["fake-model"]

    def __init__(
        self,
        content: str = "generated",
        generate_error: ProviderError | Exception | None = None,
        stream_error: ProviderError | Exception | None = None,
    ):
        self.content = content
        self.generate_error = generate_error
        self.stream_error = stream_error
        self.last_generate_call: dict | None = None
        self.last_stream_call: dict | None = None

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> GenerateResponse:
        self.last_generate_call = {
            "prompt": prompt,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "system_prompt": system_prompt,
        }
        if self.generate_error is not None:
            raise self.generate_error

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
        self.last_stream_call = {
            "prompt": prompt,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "system_prompt": system_prompt,
        }
        if self.stream_error is not None:
            raise self.stream_error

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
