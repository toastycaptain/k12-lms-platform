import hashlib
import hmac
import logging
import threading
import time
from dataclasses import dataclass

from fastapi import HTTPException, Request

from app.config import settings

logger = logging.getLogger("ai-gateway.auth")


@dataclass(frozen=True)
class ServicePrincipal:
    token_fingerprint: str
    tenant_id: str | None
    auth_mode: str


_NONCE_LOCK = threading.Lock()
_RECENT_NONCES: dict[str, float] = {}


def _token_fingerprint(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()[:16]


def _cleanup_expired_nonces(now: float) -> None:
    expired = [nonce_key for nonce_key, expiry in _RECENT_NONCES.items() if expiry <= now]
    for nonce_key in expired:
        _RECENT_NONCES.pop(nonce_key, None)


def _register_nonce_once(nonce_key: str) -> bool:
    now = time.time()
    with _NONCE_LOCK:
        _cleanup_expired_nonces(now)
        if nonce_key in _RECENT_NONCES:
            return False

        _RECENT_NONCES[nonce_key] = now + float(settings.service_auth_max_age_seconds)
        return True


def _verify_legacy_bearer(request: Request, secret: str) -> ServicePrincipal:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    provided = auth_header[len("Bearer ") :]
    if not hmac.compare_digest(provided.encode("utf-8"), secret.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid service token")

    return ServicePrincipal(
        token_fingerprint=_token_fingerprint(secret),
        tenant_id=request.headers.get("X-Tenant-ID"),
        auth_mode="bearer",
    )


async def _verify_hmac_request(request: Request, secret: str) -> ServicePrincipal:
    version = request.headers.get("X-Service-Auth-Version", "")
    signature = request.headers.get("X-Service-Signature", "")
    timestamp_header = request.headers.get("X-Service-Timestamp", "")
    nonce = request.headers.get("X-Service-Nonce", "")

    if version != "v1":
        raise HTTPException(status_code=401, detail="Invalid service auth version")
    if not signature or not timestamp_header or not nonce:
        raise HTTPException(status_code=401, detail="Missing service authentication headers")

    try:
        timestamp = int(timestamp_header)
    except ValueError as exc:
        raise HTTPException(
            status_code=401,
            detail="Invalid service authentication timestamp",
        ) from exc

    now = int(time.time())
    max_age = int(settings.service_auth_max_age_seconds)
    if abs(now - timestamp) > max_age:
        raise HTTPException(status_code=401, detail="Service authentication timestamp expired")

    nonce_key = f"{timestamp}:{nonce}"
    if not _register_nonce_once(nonce_key):
        raise HTTPException(status_code=401, detail="Service authentication nonce replay detected")

    body = await request.body()
    body_digest = hashlib.sha256(body).hexdigest()
    canonical = "\n".join(
        [
            request.method.upper(),
            request.url.path,
            str(timestamp),
            nonce,
            body_digest,
        ]
    )

    expected_signature = hmac.new(
        secret.encode("utf-8"),
        canonical.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature.lower(), expected_signature):
        raise HTTPException(status_code=401, detail="Invalid service authentication signature")

    return ServicePrincipal(
        token_fingerprint=_token_fingerprint(secret),
        tenant_id=request.headers.get("X-Tenant-ID"),
        auth_mode="hmac",
    )


async def verify_service_token(request: Request) -> ServicePrincipal:
    """Verify service-to-service authentication headers."""
    secret = settings.service_token.strip()
    if not secret:
        if settings.is_production:
            logger.error("SECURITY: service_token is not configured in production")
            raise HTTPException(status_code=503, detail="AI Gateway is not properly configured")

        return ServicePrincipal(
            token_fingerprint="development",
            tenant_id=request.headers.get("X-Tenant-ID"),
            auth_mode="none",
        )

    if request.headers.get("X-Service-Signature"):
        return await _verify_hmac_request(request, secret)

    if settings.allow_legacy_bearer_auth and not settings.is_production:
        return _verify_legacy_bearer(request, secret)

    raise HTTPException(status_code=401, detail="Missing service authentication headers")
