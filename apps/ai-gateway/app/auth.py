from fastapi import HTTPException, Request

from app.config import settings


def verify_service_token(request: Request) -> None:
    if not settings.service_token:
        return

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = auth_header[len("Bearer ") :]
    if token != settings.service_token:
        raise HTTPException(status_code=401, detail="Invalid service token")
