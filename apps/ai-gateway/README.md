# AI Gateway

FastAPI service that brokers LLM providers for curriculum generation tasks.

## Local Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
```

Create `.env` with any provider keys you need:

```bash
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
SERVICE_TOKEN=
CORS_ORIGINS=http://localhost:3000
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Tests

```bash
pytest
```

## API

- `GET /v1/health`
- `GET /v1/providers`
- `POST /v1/generate`
- `POST /v1/generate_stream`
