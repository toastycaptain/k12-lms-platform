from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from app.providers.anthropic_provider import AnthropicProvider
from app.providers.base import ProviderError


class FakeStreamResponse:
    def __init__(self, *, status_code: int, lines: list[str], body: bytes = b"") -> None:
        self.status_code = status_code
        self._lines = lines
        self._body = body

    async def __aenter__(self) -> "FakeStreamResponse":
        return self

    async def __aexit__(self, exc_type, exc, tb) -> bool:
        return False

    async def aread(self) -> bytes:
        return self._body

    async def aiter_lines(self):
        for line in self._lines:
            yield line


@pytest.mark.asyncio
async def test_generate_success() -> None:
    provider = AnthropicProvider(api_key="test-key")
    response = MagicMock(status_code=200, text="")
    response.json.return_value = {
        "content": [{"text": "lesson"}],
        "usage": {"input_tokens": 2, "output_tokens": 3},
        "stop_reason": "end_turn",
    }
    provider._client = MagicMock(post=AsyncMock(return_value=response), aclose=AsyncMock())

    result = await provider.generate(prompt="hi", model="claude-haiku-4-5-20251001")

    assert result.content == "lesson"
    assert result.usage.prompt_tokens == 2
    assert result.usage.completion_tokens == 3


@pytest.mark.asyncio
async def test_generate_raises_for_non_200() -> None:
    provider = AnthropicProvider(api_key="test-key")
    response = MagicMock(status_code=401, text="forbidden")
    provider._client = MagicMock(post=AsyncMock(return_value=response), aclose=AsyncMock())

    with pytest.raises(ProviderError, match="Anthropic API error: 401"):
        await provider.generate(prompt="hi", model="claude-haiku-4-5-20251001")


@pytest.mark.asyncio
async def test_generate_wraps_http_errors() -> None:
    provider = AnthropicProvider(api_key="test-key")
    provider._client = MagicMock(
        post=AsyncMock(side_effect=httpx.HTTPError("boom")),
        aclose=AsyncMock(),
    )

    with pytest.raises(ProviderError, match="request failed"):
        await provider.generate(prompt="hi", model="claude-haiku-4-5-20251001")


@pytest.mark.asyncio
async def test_generate_requires_api_key() -> None:
    provider = AnthropicProvider(api_key="")

    with pytest.raises(ProviderError, match="not configured"):
        await provider.generate(prompt="hi", model="claude-haiku-4-5-20251001")


@pytest.mark.asyncio
async def test_stream_emits_content_and_final_usage() -> None:
    provider = AnthropicProvider(api_key="test-key")
    stream_response = FakeStreamResponse(
        status_code=200,
        lines=[
            "event: message_start",
            'data: {"type":"message_start","message":{"usage":{"input_tokens":7}}}',
            'data: {"type":"content_block_delta","delta":{"text":"Hello"}}',
            'data: {"type":"message_delta","usage":{"output_tokens":4}}',
            'data: {"type":"message_stop"}',
        ],
    )
    provider._client = MagicMock(stream=MagicMock(return_value=stream_response), aclose=AsyncMock())

    chunks = [
        chunk async for chunk in provider.stream(prompt="hi", model="claude-haiku-4-5-20251001")
    ]

    assert chunks[0].content == "Hello"
    assert chunks[0].done is False
    assert chunks[1].done is True
    assert chunks[1].usage is not None
    assert chunks[1].usage.total_tokens == 11


@pytest.mark.asyncio
async def test_stream_raises_for_non_200() -> None:
    provider = AnthropicProvider(api_key="test-key")
    stream_response = FakeStreamResponse(status_code=500, lines=[], body=b"failure")
    provider._client = MagicMock(stream=MagicMock(return_value=stream_response), aclose=AsyncMock())

    with pytest.raises(ProviderError, match="Anthropic API error: 500"):
        [chunk async for chunk in provider.stream(prompt="hi", model="claude-haiku-4-5-20251001")]


@pytest.mark.asyncio
async def test_stream_wraps_timeout() -> None:
    provider = AnthropicProvider(api_key="test-key")
    provider._client = MagicMock(
        stream=MagicMock(side_effect=httpx.TimeoutException("timeout")),
        aclose=AsyncMock(),
    )

    with pytest.raises(ProviderError, match="timed out"):
        [chunk async for chunk in provider.stream(prompt="hi", model="claude-haiku-4-5-20251001")]


@pytest.mark.asyncio
async def test_close_closes_underlying_client() -> None:
    provider = AnthropicProvider(api_key="test-key")
    provider._client = MagicMock(aclose=AsyncMock())

    await provider.close()

    provider._client.aclose.assert_awaited_once()
