from app.providers.base import BaseProvider


class ProviderRegistry:
    def __init__(self) -> None:
        self._providers: dict[str, BaseProvider] = {}

    def register(self, name: str, provider: BaseProvider) -> None:
        if name in self._providers:
            raise ValueError(f"Provider '{name}' already registered")
        self._providers[name] = provider

    def get(self, name: str) -> BaseProvider:
        try:
            return self._providers[name]
        except KeyError:
            raise KeyError(f"Provider '{name}' not registered") from None

    def values(self) -> list[BaseProvider]:
        return list(self._providers.values())

    def clear(self) -> None:
        self._providers.clear()

    async def close_all(self) -> None:
        for provider in self._providers.values():
            await provider.close()

    def list_providers(self) -> list[dict[str, object]]:
        providers = sorted(self._providers.items(), key=lambda item: item[0])
        return [{"name": name, "models": provider.supported_models} for name, provider in providers]


registry = ProviderRegistry()
