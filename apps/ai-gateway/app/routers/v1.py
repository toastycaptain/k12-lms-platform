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
from app.safety import ContentClassifier, PIIFilter, SafetyCategory, SafetyFilter, SafetyPipeline

logger = logging.getLogger("ai-gateway.v1")
safety_logger = logging.getLogger("ai-gateway.safety")

router = APIRouter(prefix="/v1")


def create_safety_pipeline(safety_level: str = "strict") -> SafetyPipeline:
    pipeline = SafetyPipeline()
    pipeline.add_filter(SafetyFilter())
    pipeline.add_filter(PIIFilter())
    pipeline.add_filter(ContentClassifier(safety_level))
    return pipeline


default_pipeline = create_safety_pipeline("strict")


def log_safety_event(request: GenerateRequest, result, direction: str) -> None:
    context = request.context or {}
    event = {
        "timestamp": datetime.now(UTC).isoformat(),
        "direction": direction,
        "category": result.category.value if result.category else None,
        "action": result.action,
        "confidence": result.confidence,
        "detail": result.detail,
        "task_type": request.task_type,
        "tenant_id": context.get("tenant_id"),
        "safety_level": context.get("safety_level", "strict"),
    }
    safety_logger.warning(json.dumps(event))


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
    context = request.context or {}
    safety_level = str(context.get("safety_level", "strict"))
    pipeline = create_safety_pipeline(safety_level)

    input_result = pipeline.check_input(request.prompt)
    if not input_result.passed:
        log_safety_event(request, input_result, direction="input")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "content_safety",
                "category": input_result.category.value if input_result.category else None,
                "detail": input_result.detail,
            },
        )

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

    response_text = result.content
    output_result = pipeline.check_output(response_text)
    if not output_result.passed:
        if output_result.category == SafetyCategory.PII:
            response_text = PIIFilter().redact(response_text)
            log_safety_event(request, output_result, direction="output")
        else:
            log_safety_event(request, output_result, direction="output")
            raise HTTPException(
                status_code=422,
                detail={
                    "error": "content_safety",
                    "category": output_result.category.value
                    if output_result.category
                    else None,
                    "detail": "Generated content did not pass safety review",
                },
            )

    return GenerateResponseModel(
        content=response_text,
        model=result.model,
        provider=result.provider,
        usage=result.usage.model_dump(),
        finish_reason=result.finish_reason,
        task_type=request.task_type,
    )


@router.post("/generate_stream", dependencies=[Depends(verify_service_token)])
async def generate_stream(request: GenerateRequest) -> StreamingResponse:
    context = request.context or {}
    safety_level = str(context.get("safety_level", "strict"))
    pipeline = create_safety_pipeline(safety_level)

    input_result = pipeline.check_input(request.prompt)
    if not input_result.passed:
        log_safety_event(request, input_result, direction="input")
        raise HTTPException(
            status_code=422,
            detail={
                "error": "content_safety",
                "category": input_result.category.value if input_result.category else None,
                "detail": input_result.detail,
            },
        )

    provider = resolve_provider(request.provider)

    system_prompt = request.system_prompt
    if not system_prompt and request.task_type:
        system_prompt = SYSTEM_PROMPTS.get(request.task_type)

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            pii_filter = PIIFilter()
            async for chunk in provider.stream(
                prompt=request.prompt,
                model=request.model,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_prompt=system_prompt,
            ):
                if not chunk.done:
                    token = chunk.content
                    output_result = pipeline.check_output(token)
                    if not output_result.passed:
                        if output_result.category == SafetyCategory.PII:
                            token = pii_filter.redact(token)
                            log_safety_event(request, output_result, direction="output")
                        else:
                            log_safety_event(request, output_result, direction="output")
                            yield "data: " + json.dumps(
                                {"error": "Generated content did not pass safety review"}
                            ) + "\n\n"
                            return

                    data = {"content": token, "done": False}
                    yield "data: " + json.dumps(data) + "\n\n"
                    continue

                if chunk.done:
                    data = {
                        "content": chunk.content,
                        "done": True,
                        "usage": chunk.usage.model_dump() if chunk.usage else None,
                        "finish_reason": "stop",
                    }
                yield "data: " + json.dumps(data) + "\n\n"
        except ProviderError as exc:
            yield "data: " + json.dumps({"error": exc.message}) + "\n\n"
        except Exception as exc:
            yield "data: " + json.dumps({"error": str(exc)}) + "\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")
