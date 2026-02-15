import json
import logging
from collections.abc import AsyncGenerator

import httpx

from app.config import settings
from app.providers.base import (
    BaseProvider,
    GenerateResponse,
    ProviderError,
    StreamChunk,
    Usage,
)

logger = logging.getLogger("ai-gateway.anthropic")


class AnthropicProvider(BaseProvider):
    name = "anthropic"
    supported_models = ["claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.anthropic_api_key
        self.base_url = "https://api.anthropic.com/v1/messages"
        self._client = httpx.AsyncClient(timeout=120.0)

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    def _ensure_api_key(self) -> None:
        if not self.api_key:
            raise ProviderError(
                message="Anthropic API key is not configured",
                provider=self.name,
                status_code=500,
            )

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> GenerateResponse:
        self._ensure_api_key()
        body = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            body["system"] = system_prompt

        try:
            response = await self._client.post(
                self.base_url,
                headers=self._headers(),
                json=body,
                timeout=120.0,
            )

            if response.status_code != 200:
                detail = response.text[:500]
                raise ProviderError(
                    message=f"Anthropic API error: {response.status_code} {detail}",
                    provider=self.name,
                    status_code=response.status_code,
                )

            data = response.json()
            usage = data.get("usage", {})
            return GenerateResponse(
                content=data["content"][0]["text"],
                model=model,
                provider=self.name,
                usage=Usage(
                    prompt_tokens=usage.get("input_tokens", 0),
                    completion_tokens=usage.get("output_tokens", 0),
                    total_tokens=usage.get("input_tokens", 0) + usage.get("output_tokens", 0),
                ),
                finish_reason=data.get("stop_reason", "end_turn"),
            )
        except httpx.TimeoutException as exc:
            raise ProviderError(
                message="Anthropic request timed out",
                provider=self.name,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                message="Anthropic request failed",
                provider=self.name,
            ) from exc

    async def stream(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        self._ensure_api_key()
        body = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }
        if system_prompt:
            body["system"] = system_prompt

        try:
            async with self._client.stream(
                "POST",
                self.base_url,
                headers=self._headers(),
                json=body,
                timeout=180.0,
            ) as response:
                if response.status_code != 200:
                    detail = (await response.aread()).decode("utf-8", errors="ignore")[:500]
                    raise ProviderError(
                        message=f"Anthropic API error: {response.status_code} {detail}",
                        provider=self.name,
                        status_code=response.status_code,
                    )

                input_tokens = 0
                output_tokens = 0
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line or not line.startswith("data: "):
                        if line.startswith("event: "):
                            continue
                        continue

                    line = line[len("data: ") :]

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    event_type = data.get("type")

                    if event_type == "message_start":
                        usage = data.get("message", {}).get("usage", {})
                        input_tokens = usage.get("input_tokens", 0)

                    elif event_type == "content_block_delta":
                        delta = data.get("delta", {})
                        text = delta.get("text", "")
                        yield StreamChunk(content=text, done=False)

                    elif event_type == "message_delta":
                        output_tokens = data.get("usage", {}).get("output_tokens", 0)

                    elif event_type == "message_stop":
                        yield StreamChunk(
                            content="",
                            done=True,
                            usage=Usage(
                                prompt_tokens=input_tokens,
                                completion_tokens=output_tokens,
                                total_tokens=input_tokens + output_tokens,
                            ),
                        )
                        return
        except httpx.TimeoutException as exc:
            raise ProviderError(
                message="Anthropic stream timed out",
                provider=self.name,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProviderError(
                message="Anthropic stream failed",
                provider=self.name,
            ) from exc

    async def close(self) -> None:
        await self._client.aclose()
