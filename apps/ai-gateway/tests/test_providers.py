import pytest
from typing import AsyncGenerator

from app.providers.base import BaseProvider, GenerateResponse, StreamChunk, Usage
from app.providers.registry import ProviderRegistry


class MockProvider(BaseProvider):
    name = "mock"
    supported_models = ["mock-model-1", "mock-model-2"]

    async def generate(self, prompt: str, model: str, temperature: float = 0.7,
                       max_tokens: int = 2048, system_prompt: str | None = None) -> GenerateResponse:
        return GenerateResponse(
            content="mock response",
            model=model,
            provider=self.name,
            usage=Usage(prompt_tokens=10, completion_tokens=20, total_tokens=30),
            finish_reason="stop",
        )

    async def stream(self, prompt: str, model: str, temperature: float = 0.7,
                     max_tokens: int = 2048, system_prompt: str | None = None) -> AsyncGenerator[StreamChunk, None]:
        yield StreamChunk(content="hello ", done=False)
        yield StreamChunk(content="world", done=False)
        yield StreamChunk(content="", done=True, usage=Usage(prompt_tokens=10, completion_tokens=5, total_tokens=15))


class TestProviderRegistry:
    def test_register_and_get(self):
        reg = ProviderRegistry()
        provider = MockProvider()
        reg.register("mock", provider)
        assert reg.get("mock") is provider

    def test_get_unknown_provider_raises_key_error(self):
        reg = ProviderRegistry()
        with pytest.raises(KeyError, match="Provider 'unknown' not registered"):
            reg.get("unknown")

    def test_list_providers_returns_correct_shape(self):
        reg = ProviderRegistry()
        provider = MockProvider()
        reg.register("mock", provider)
        result = reg.list_providers()
        assert len(result) == 1
        assert result[0]["name"] == "mock"
        assert result[0]["models"] == ["mock-model-1", "mock-model-2"]

    def test_list_providers_empty(self):
        reg = ProviderRegistry()
        result = reg.list_providers()
        assert result == []

    def test_register_multiple_providers(self):
        reg = ProviderRegistry()
        provider1 = MockProvider()
        provider2 = MockProvider()
        provider2.name = "mock2"
        provider2.supported_models = ["model-a"]
        reg.register("mock", provider1)
        reg.register("mock2", provider2)
        result = reg.list_providers()
        assert len(result) == 2
        names = [p["name"] for p in result]
        assert "mock" in names
        assert "mock2" in names
