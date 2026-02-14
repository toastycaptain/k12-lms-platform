from app.providers.base import BaseProvider


class ProviderRegistry:
    def __init__(self):
        self._providers: dict[str, BaseProvider] = {}

    def register(self, name: str, provider: BaseProvider):
        self._providers[name] = provider

    def get(self, name: str) -> BaseProvider:
        if name not in self._providers:
            raise KeyError(f"Provider '{name}' not registered")
        return self._providers[name]

    def list_providers(self) -> list[dict]:
        return [
            {"name": name, "models": provider.supported_models}
            for name, provider in self._providers.items()
        ]


registry = ProviderRegistry()
