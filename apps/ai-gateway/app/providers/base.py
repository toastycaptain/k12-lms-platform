from abc import ABC, abstractmethod
from pydantic import BaseModel
from typing import AsyncGenerator, Optional


class Usage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class GenerateResponse(BaseModel):
    content: str
    model: str
    provider: str
    usage: Usage
    finish_reason: str


class StreamChunk(BaseModel):
    content: str
    done: bool
    usage: Optional[Usage] = None


class ProviderError(Exception):
    def __init__(self, message: str, provider: str, status_code: int = 502):
        self.message = message
        self.provider = provider
        self.status_code = status_code
        super().__init__(message)


class BaseProvider(ABC):
    name: str
    supported_models: list[str]

    @abstractmethod
    async def generate(self, prompt: str, model: str, temperature: float = 0.7, max_tokens: int = 2048, system_prompt: str | None = None) -> GenerateResponse:
        ...

    @abstractmethod
    async def stream(self, prompt: str, model: str, temperature: float = 0.7, max_tokens: int = 2048, system_prompt: str | None = None) -> AsyncGenerator[StreamChunk, None]:
        ...

    async def close(self) -> None:
        """Close the underlying HTTP client. Override in subclasses that hold a persistent client."""
        pass
