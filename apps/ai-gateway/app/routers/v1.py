import json
import logging
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.generate import GenerateRequest, GenerateResponseModel
from app.prompts.system_prompts import SYSTEM_PROMPTS
from app.providers.base import ProviderError
from app.providers.registry import registry
from app.safety.filters import SafetyFilter

logger = logging.getLogger("ai-gateway.v1")

router = APIRouter(prefix="/v1")
safety_filter = SafetyFilter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/providers")
async def list_providers():
    return registry.list_providers()


@router.post("/generate")
async def generate(request: GenerateRequest):
    # Safety filter check
    is_safe, rejection_reason = safety_filter.check_input(request.prompt, request.task_type)
    if not is_safe:
        raise HTTPException(status_code=422, detail=rejection_reason)

    # Look up provider
    try:
        provider = registry.get(request.provider)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Determine system prompt
    system_prompt = request.system_prompt
    if system_prompt is None and request.task_type:
        system_prompt = SYSTEM_PROMPTS.get(request.task_type)

    # Call provider
    try:
        result = await provider.generate(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=system_prompt,
        )
    except ProviderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)

    return GenerateResponseModel(
        content=result.content,
        model=result.model,
        provider=result.provider,
        usage=result.usage.model_dump(),
        finish_reason=result.finish_reason,
        task_type=request.task_type,
    )


@router.post("/generate_stream")
async def generate_stream(request: GenerateRequest):
    # Safety filter check before streaming
    is_safe, rejection_reason = safety_filter.check_input(request.prompt, request.task_type)
    if not is_safe:
        raise HTTPException(status_code=422, detail=rejection_reason)

    # Look up provider
    try:
        provider = registry.get(request.provider)
    except KeyError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Determine system prompt
    system_prompt = request.system_prompt
    if system_prompt is None and request.task_type:
        system_prompt = SYSTEM_PROMPTS.get(request.task_type)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            async for chunk in provider.stream(
                prompt=request.prompt,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_prompt=system_prompt,
            ):
                if chunk.done:
                    data = {
                        "content": "",
                        "done": True,
                        "usage": chunk.usage.model_dump() if chunk.usage else None,
                        "finish_reason": "stop",
                    }
                    yield f"data: {json.dumps(data)}\n\n"
                else:
                    data = {"content": chunk.content, "done": False}
                    yield f"data: {json.dumps(data)}\n\n"
        except ProviderError as e:
            error_data = {"error": e.message, "done": True}
            yield f"data: {json.dumps(error_data)}\n\n"
        except Exception as e:
            error_data = {"error": str(e), "done": True}
            yield f"data: {json.dumps(error_data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )
