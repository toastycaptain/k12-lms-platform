from unittest.mock import AsyncMock, MagicMock

import httpx
import pytest

from app.providers.base import ProviderError
from app.providers.openai_provider import OpenAIProvider


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
    provider = OpenAIProvider(api_key="test-key")
    response = MagicMock(status_code=200, text="")
    response.json.return_value = {
        "choices": [{"message": {"content": "hello"}, "finish_reason": "stop"}],
        "usage": {"prompt_tokens": 1, "completion_tokens": 2, "total_tokens": 3},
    }
    provider._client = MagicMock(post=AsyncMock(return_value=response), aclose=AsyncMock())

    result = await provider.generate(prompt="hi", model="gpt-4o", system_prompt="sys")

    assert result.content == "hello"
    assert result.usage.total_tokens == 3
    provider._client.post.assert_awaited_once()


@pytest.mark.asyncio
async def test_generate_raises_for_non_200() -> None:
    provider = OpenAIProvider(api_key="test-key")
    response = MagicMock(status_code=500, text="upstream failed")
    provider._client = MagicMock(post=AsyncMock(return_value=response), aclose=AsyncMock())

    with pytest.raises(ProviderError, match="OpenAI API error: 500"):
        await provider.generate(prompt="hi", model="gpt-4o")


@pytest.mark.asyncio
async def test_generate_wraps_timeout() -> None:
    provider = OpenAIProvider(api_key="test-key")
    provider._client = MagicMock(
        post=AsyncMock(side_effect=httpx.TimeoutException("timeout")),
        aclose=AsyncMock(),
    )

    with pytest.raises(ProviderError, match="timed out"):
        await provider.generate(prompt="hi", model="gpt-4o")


@pytest.mark.asyncio
async def test_generate_requires_api_key() -> None:
    provider = OpenAIProvider(api_key="")

    with pytest.raises(ProviderError, match="not configured"):
        await provider.generate(prompt="hi", model="gpt-4o")


@pytest.mark.asyncio
async def test_stream_emits_chunks_until_finish() -> None:
    provider = OpenAIProvider(api_key="test-key")
    stream_response = FakeStreamResponse(
        status_code=200,
        lines=[
            'data: {"choices":[{"delta":{"content":"Hello"},"finish_reason":null}]}',
            (
                'data: {"choices":[{"delta":{"content":""},"finish_reason":"stop"}],'
                '"usage":{"prompt_tokens":1,"completion_tokens":2,"total_tokens":3}}'
            ),
        ],
    )
    provider._client = MagicMock(stream=MagicMock(return_value=stream_response), aclose=AsyncMock())

    chunks = [chunk async for chunk in provider.stream(prompt="hi", model="gpt-4o")]

    assert chunks[0].content == "Hello"
    assert chunks[0].done is False
    assert chunks[1].done is True
    assert chunks[1].usage is not None
    assert chunks[1].usage.total_tokens == 3


@pytest.mark.asyncio
async def test_stream_handles_done_sentinel() -> None:
    provider = OpenAIProvider(api_key="test-key")
    stream_response = FakeStreamResponse(status_code=200, lines=["data: [DONE]"])
    provider._client = MagicMock(stream=MagicMock(return_value=stream_response), aclose=AsyncMock())

    chunks = [chunk async for chunk in provider.stream(prompt="hi", model="gpt-4o")]

    assert len(chunks) == 1
    assert chunks[0].done is True


@pytest.mark.asyncio
async def test_stream_raises_for_non_200() -> None:
    provider = OpenAIProvider(api_key="test-key")
    stream_response = FakeStreamResponse(status_code=500, lines=[], body=b"failure")
    provider._client = MagicMock(stream=MagicMock(return_value=stream_response), aclose=AsyncMock())

    with pytest.raises(ProviderError, match="OpenAI API error: 500"):
        [chunk async for chunk in provider.stream(prompt="hi", model="gpt-4o")]


@pytest.mark.asyncio
async def test_stream_wraps_timeout() -> None:
    provider = OpenAIProvider(api_key="test-key")
    provider._client = MagicMock(
        stream=MagicMock(side_effect=httpx.TimeoutException("timeout")),
        aclose=AsyncMock(),
    )

    with pytest.raises(ProviderError, match="timed out"):
        [chunk async for chunk in provider.stream(prompt="hi", model="gpt-4o")]


@pytest.mark.asyncio
async def test_close_closes_underlying_client() -> None:
    provider = OpenAIProvider(api_key="test-key")
    provider._client = MagicMock(aclose=AsyncMock())

    await provider.close()

    provider._client.aclose.assert_awaited_once()
