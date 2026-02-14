import json
import logging
from typing import AsyncGenerator

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

    def _headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> GenerateResponse:
        payload: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            payload["system"] = system_prompt
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=self._headers(),
                    json=payload,
                )
            if response.status_code != 200:
                raise ProviderError(
                    message=f"Anthropic API error: {response.status_code} - {response.text}",
                    provider=self.name,
                    status_code=response.status_code,
                )
            data = response.json()
            content = data["content"][0]["text"]
            usage_data = data.get("usage", {})
            return GenerateResponse(
                content=content,
                model=data["model"],
                provider=self.name,
                usage=Usage(
                    prompt_tokens=usage_data.get("input_tokens", 0),
                    completion_tokens=usage_data.get("output_tokens", 0),
                    total_tokens=usage_data.get("input_tokens", 0) + usage_data.get("output_tokens", 0),
                ),
                finish_reason=data.get("stop_reason", "end_turn"),
            )
        except ProviderError:
            raise
        except httpx.HTTPError as e:
            raise ProviderError(
                message=f"Anthropic request failed: {str(e)}",
                provider=self.name,
            )

    async def stream(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> AsyncGenerator[StreamChunk, None]:
        payload: dict = {
            "model": model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "messages": [{"role": "user", "content": prompt}],
            "stream": True,
        }
        if system_prompt:
            payload["system"] = system_prompt
        try:
            async with httpx.AsyncClient(timeout=180.0) as client:
                async with client.stream(
                    "POST",
                    self.base_url,
                    headers=self._headers(),
                    json=payload,
                ) as response:
                    if response.status_code != 200:
                        body = await response.aread()
                        raise ProviderError(
                            message=f"Anthropic API error: {response.status_code} - {body.decode()}",
                            provider=self.name,
                            status_code=response.status_code,
                        )
                    event_type = None
                    input_tokens = 0
                    output_tokens = 0
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line:
                            continue
                        if line.startswith("event: "):
                            event_type = line[len("event: "):]
                            continue
                        if not line.startswith("data: "):
                            continue
                        data_str = line[len("data: "):]
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        if event_type == "message_start":
                            usage_data = data.get("message", {}).get("usage", {})
                            input_tokens = usage_data.get("input_tokens", 0)
                        elif event_type == "content_block_delta":
                            delta = data.get("delta", {})
                            text = delta.get("text", "")
                            if text:
                                yield StreamChunk(content=text, done=False)
                        elif event_type == "message_delta":
                            usage_data = data.get("usage", {})
                            output_tokens = usage_data.get("output_tokens", 0)
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
        except ProviderError:
            raise
        except httpx.HTTPError as e:
            raise ProviderError(
                message=f"Anthropic stream failed: {str(e)}",
                provider=self.name,
            )
