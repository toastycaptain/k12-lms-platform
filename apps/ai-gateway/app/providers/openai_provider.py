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

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    def _build_messages(self, prompt: str, system_prompt: str | None = None) -> list[dict]:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        model: str,
        temperature: float = 0.7,
        max_tokens: int = 2048,
        system_prompt: str | None = None,
    ) -> GenerateResponse:
        payload = {
            "model": model,
            "messages": self._build_messages(prompt, system_prompt),
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                response = await client.post(
                    self.base_url,
                    headers=self._headers(),
                    json=payload,
                )
            if response.status_code != 200:
                raise ProviderError(
                    message=f"OpenAI API error: {response.status_code} - {response.text}",
                    provider=self.name,
                    status_code=response.status_code,
                )
            data = response.json()
            choice = data["choices"][0]
            usage_data = data.get("usage", {})
            return GenerateResponse(
                content=choice["message"]["content"],
                model=data["model"],
                provider=self.name,
                usage=Usage(
                    prompt_tokens=usage_data.get("prompt_tokens", 0),
                    completion_tokens=usage_data.get("completion_tokens", 0),
                    total_tokens=usage_data.get("total_tokens", 0),
                ),
                finish_reason=choice.get("finish_reason", "stop"),
            )
        except ProviderError:
            raise
        except httpx.HTTPError as e:
            raise ProviderError(
                message=f"OpenAI request failed: {str(e)}",
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
        payload = {
            "model": model,
            "messages": self._build_messages(prompt, system_prompt),
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": True,
        }
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
                            message=f"OpenAI API error: {response.status_code} - {body.decode()}",
                            provider=self.name,
                            status_code=response.status_code,
                        )
                    async for line in response.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue
                        data_str = line[len("data: "):]
                        if data_str == "[DONE]":
                            yield StreamChunk(content="", done=True)
                            return
                        try:
                            data = json.loads(data_str)
                        except json.JSONDecodeError:
                            continue
                        choice = data.get("choices", [{}])[0]
                        delta = choice.get("delta", {})
                        content = delta.get("content", "")
                        finish_reason = choice.get("finish_reason")
                        if finish_reason:
                            usage_data = data.get("usage", {})
                            yield StreamChunk(
                                content=content,
                                done=True,
                                usage=Usage(
                                    prompt_tokens=usage_data.get("prompt_tokens", 0),
                                    completion_tokens=usage_data.get("completion_tokens", 0),
                                    total_tokens=usage_data.get("total_tokens", 0),
                                ),
                            )
                            return
                        if content:
                            yield StreamChunk(content=content, done=False)
        except ProviderError:
            raise
        except httpx.HTTPError as e:
            raise ProviderError(
                message=f"OpenAI stream failed: {str(e)}",
                provider=self.name,
            )
