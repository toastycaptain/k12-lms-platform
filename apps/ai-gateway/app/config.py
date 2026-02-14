from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_gateway_port: int = 8000
    ai_gateway_env: str = "development"
    cors_origins: str = "http://localhost:3000"
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    service_token: str = ""

    model_config = {"env_file": ".env"}


settings = Settings()
