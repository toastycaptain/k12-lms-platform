import hmac
import logging

from fastapi import HTTPException, Request

from app.config import settings

logger = logging.getLogger("ai-gateway.auth")


def verify_service_token(request: Request) -> None:
    """Verify the Bearer token on authenticated endpoints.

    SECURITY: In production, a missing service_token means the gateway
    is misconfigured. We reject all requests rather than silently allowing them.
    """
    if not settings.service_token:
        if settings.ai_gateway_env == "production":
            logger.error(
                "SECURITY: service_token is not configured in production. Rejecting request."
            )
            raise HTTPException(
                status_code=503,
                detail="AI Gateway is not properly configured",
            )
        # In development/test, allow unauthenticated access for convenience
        return

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header[len("Bearer ") :]

    # SECURITY: Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(token.encode("utf-8"), settings.service_token.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid service token")
