import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.providers.anthropic_provider import AnthropicProvider
from app.providers.openai_provider import OpenAIProvider
from app.providers.registry import registry
from app.routers.v1 import router as v1_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-gateway")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: register providers
    openai_provider = OpenAIProvider()
    anthropic_provider = AnthropicProvider()
    registry.register("openai", openai_provider)
    registry.register("anthropic", anthropic_provider)
    logger.info("Registered providers: %s", [p["name"] for p in registry.list_providers()])
    yield
    # Shutdown: cleanup if needed
    pass


app = FastAPI(title="K-12 LMS AI Gateway", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "method=%s path=%s status_code=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled exception: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": str(exc), "status_code": 500},
    )


app.include_router(v1_router)
