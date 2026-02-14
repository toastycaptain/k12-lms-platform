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

logger = logging.getLogger("ai-gateway.openai")


class OpenAIProvider(BaseProvider):
    name = "openai"
    supported_models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"]

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or settings.openai_api_key
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self._client = httpx.AsyncClient(timeout=120.0)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": "Bearer " + self.api_key,
            "Content-Type": "application/json",
        }

    def _ensure_api_key(self) -> None:
        if not self.api_key:
            raise ProviderError(
                message="OpenAI API key is not configured",
                provider=self.name,
                status_code=500,
            )

    def _build_messages(self, prompt: str, system_prompt: str | None = None) -> list[dict]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(self, prompt: str, model: str, temperature: float = 0.7, max_tokens: int = 2048, system_prompt: str | None = None) -> GenerateResponse:
        self._ensure_api_key()
        messages = self._build_messages(prompt, system_prompt)
        try:
            response = await self._client.post(
                self.base_url,
                headers=self._headers(),
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
                timeout=120.0,
            )

            if response.status_code != 200:
                detail = response.text[:500]
                raise ProviderError(
                    message=f"OpenAI API error: {response.status_code} {detail}",
                    provider=self.name,
                    status_code=response.status_code,
                )

            data = response.json()
            usage = data.get("usage", {})
            return GenerateResponse(
                content=data["choices"][0]["message"]["content"],
                model=model,
                provider=self.name,
                usage=Usage(
                    prompt_tokens=usage.get("prompt_tokens", 0),
                    completion_tokens=usage.get("completion_tokens", 0),
                    total_tokens=usage.get("total_tokens", 0),
                ),
                finish_reason=data["choices"][0].get("finish_reason", "stop"),
            )
        except httpx.TimeoutException:
            raise ProviderError(
                message="OpenAI request timed out",
                provider=self.name,
            )
        except httpx.HTTPError:
            raise ProviderError(
                message="OpenAI request failed",
                provider=self.name,
            )

    async def stream(self, prompt: str, model: str, temperature: float = 0.7, max_tokens: int = 2048, system_prompt: str | None = None) -> AsyncGenerator[StreamChunk, None]:
        self._ensure_api_key()
        messages = self._build_messages(prompt, system_prompt)
        try:
            async with self._client.stream(
                "POST",
                self.base_url,
                headers=self._headers(),
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "stream": True,
                },
                timeout=180.0,
            ) as response:
                if response.status_code != 200:
                    detail = (await response.aread()).decode("utf-8", errors="ignore")[:500]
                    raise ProviderError(
                        message=f"OpenAI API error: {response.status_code} {detail}",
                        provider=self.name,
                        status_code=response.status_code,
                    )

                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line.startswith("data: "):
                        continue
                    line = line[len("data: "):]
                    if line == "[DONE]":
                        yield StreamChunk(content="", done=True)
                        return

                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    choices = data.get("choices", [])
                    if not choices:
                        continue

                    delta = choices[0].get("delta", {})
                    content = delta.get("content", "")
                    finish_reason = choices[0].get("finish_reason")

                    usage_data = data.get("usage")
                    usage = None
                    if usage_data:
                        usage = Usage(
                            prompt_tokens=usage_data.get("prompt_tokens", 0),
                            completion_tokens=usage_data.get("completion_tokens", 0),
                            total_tokens=usage_data.get("total_tokens", 0),
                        )

                    if finish_reason:
                        yield StreamChunk(content=content, done=True, usage=usage)
                        return

                    yield StreamChunk(content=content, done=False)
        except httpx.TimeoutException:
            raise ProviderError(
                message="OpenAI stream timed out",
                provider=self.name,
            )
        except httpx.HTTPError:
            raise ProviderError(
                message="OpenAI stream failed",
                provider=self.name,
            )

    async def close(self) -> None:
        await self._client.aclose()
