import json
import logging
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.auth import verify_service_token
from app.config import settings
from app.models.generate import GenerateRequest, GenerateResponseModel
from app.prompts.system_prompts import SYSTEM_PROMPTS
from app.providers.base import BaseProvider, ProviderError
from app.providers.registry import registry
from app.safety.filters import SafetyFilter

logger = logging.getLogger("ai-gateway.v1")

router = APIRouter(prefix="/v1")
safety_filter = SafetyFilter()


def resolve_provider(provider_name: str) -> BaseProvider:
    try:
        return registry.get(provider_name)
    except KeyError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from None


@router.get("/health")
async def health() -> dict[str, object]:
    configured_providers: list[str] = []
    if settings.openai_api_key.strip():
        configured_providers.append("openai")
    if settings.anthropic_api_key.strip():
        configured_providers.append("anthropic")

    status = "ok" if configured_providers else "degraded"
    return {
        "status": status,
        "version": "1.0.0",
        "timestamp": datetime.now(UTC).isoformat(),
        "checks": {
            "providers": "ok" if configured_providers else "degraded",
        },
        "providers_configured": configured_providers,
    }


@router.get("/providers")
async def list_providers() -> list[dict[str, object]]:
    return registry.list_providers()


@router.post("/generate", dependencies=[Depends(verify_service_token)])
async def generate(request: GenerateRequest) -> GenerateResponseModel:
    is_safe, reason = safety_filter.check_input(request.prompt, request.task_type)
    if not is_safe:
        raise HTTPException(status_code=422, detail=reason)

    provider = resolve_provider(request.provider)

    system_prompt = request.system_prompt
    if not system_prompt and request.task_type:
        system_prompt = SYSTEM_PROMPTS.get(request.task_type)

    try:
        result = await provider.generate(
            prompt=request.prompt,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=system_prompt,
        )
    except ProviderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=exc.message) from None

    is_safe_output, output_reason = safety_filter.check_output(result.content, request.task_type)
    if not is_safe_output:
        raise HTTPException(status_code=422, detail=output_reason)

    return GenerateResponseModel(
        content=result.content,
        model=result.model,
        provider=result.provider,
        usage=result.usage.model_dump(),
        finish_reason=result.finish_reason,
        task_type=request.task_type,
    )


@router.post("/generate_stream", dependencies=[Depends(verify_service_token)])
async def generate_stream(request: GenerateRequest) -> StreamingResponse:
    is_safe, reason = safety_filter.check_input(request.prompt, request.task_type)
    if not is_safe:
        raise HTTPException(status_code=422, detail=reason)

    provider = resolve_provider(request.provider)

    system_prompt = request.system_prompt
    if not system_prompt and request.task_type:
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
                        "content": chunk.content,
                        "done": True,
                        "usage": chunk.usage.model_dump() if chunk.usage else None,
                        "finish_reason": "stop",
                    }
                else:
                    data = {"content": chunk.content, "done": False}
                yield "data: " + json.dumps(data) + "\n\n"
        except ProviderError as exc:
            yield "data: " + json.dumps({"error": exc.message}) + "\n\n"
        except Exception as exc:
            yield "data: " + json.dumps({"error": str(exc)}) + "\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
