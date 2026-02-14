import pytest

from app.providers.registry import ProviderRegistry
from tests.conftest import FakeProvider


def test_register_duplicate_provider_raises():
    reg = ProviderRegistry()
    reg.register("fake", FakeProvider())

    with pytest.raises(ValueError):
        reg.register("fake", FakeProvider())


def test_list_providers_sorted_by_name():
    reg = ProviderRegistry()
    reg.register("zeta", FakeProvider())
    reg.register("alpha", FakeProvider())

    providers = reg.list_providers()

    assert [entry["name"] for entry in providers] == ["alpha", "zeta"]
