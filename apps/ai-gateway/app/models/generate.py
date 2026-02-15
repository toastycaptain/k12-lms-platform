import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    provider: str
    model: str
    prompt: str = Field(..., min_length=1, max_length=32000)
    system_prompt: str | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=16384)
    task_type: str | None = None
    context: dict[str, object] | None = None


class GenerateResponseModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    model: str
    provider: str
    usage: dict[str, int]
    finish_reason: str | None = None
    task_type: str | None = None
    tenant_id: str | None = None
    user_id: str | None = None
    created_at: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
