from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime, timezone


class GenerateRequest(BaseModel):
    provider: str
    model: str
    prompt: str = Field(..., min_length=1, max_length=32000)
    system_prompt: Optional[str] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2048, ge=1, le=16384)
    task_type: Optional[str] = None
    context: Optional[dict] = None


class GenerateResponseModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    content: str
    model: str
    provider: str
    usage: dict
    finish_reason: str
    task_type: Optional[str] = None
    tenant_id: Optional[str] = None
    user_id: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
