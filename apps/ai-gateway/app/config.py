from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_gateway_port: int = 8000
    ai_gateway_env: str = "development"
    log_level: str = "INFO"
    cors_origins: str = "http://localhost:3000"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    service_token: str = ""
    sentry_dsn: str = ""
    expose_docs: bool = False
    allow_legacy_bearer_auth: bool = True
    service_auth_max_age_seconds: int = 120
    rate_limit_generate_per_minute: int = 30
    rate_limit_stream_per_minute: int = 15

    model_config = {"env_file": ".env"}

    @property
    def is_production(self) -> bool:
        return self.ai_gateway_env.lower() == "production"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_security_configuration(self) -> None:
        if self.is_production:
            if not self.service_token.strip():
                raise RuntimeError("service_token must be configured in production")
            if self.expose_docs:
                raise RuntimeError("expose_docs must be false in production")
            if self.allow_legacy_bearer_auth:
                raise RuntimeError("allow_legacy_bearer_auth must be false in production")
            if not self.cors_origin_list:
                raise RuntimeError("cors_origins must include at least one explicit origin")
            if "*" in self.cors_origin_list:
                raise RuntimeError("cors_origins cannot include '*' in production")
            if any(origin.startswith("http://") for origin in self.cors_origin_list):
                raise RuntimeError("cors_origins must use https in production")


settings = Settings()
