.PHONY: help web-install web-ci core-install core-ci ai-install ai-ci ci

help:
	@echo "Targets:"
	@echo "  web-install  Install web dependencies"
	@echo "  web-ci       Run web lint + typecheck + build"
	@echo "  core-install Install core gems"
	@echo "  core-ci      Run core lint, security checks, and tests"
	@echo "  ai-install   Install AI gateway dependencies"
	@echo "  ai-ci        Run AI gateway tests"
	@echo "  ci           Run all available checks"

web-install:
	cd apps/web && npm ci

web-ci:
	cd apps/web && npm run ci

core-install:
	cd apps/core && bundle install

core-ci:
	cd apps/core && bundle exec rubocop --parallel && bundle exec brakeman --quiet --no-pager --exit-on-warn --exit-on-error && bundle exec rspec

ai-install:
	cd apps/ai-gateway && python3 -m venv .venv && . .venv/bin/activate && pip install -e .[dev]

ai-ci:
	cd apps/ai-gateway && \
	if [ ! -d .venv ]; then python3 -m venv .venv; fi && \
	. .venv/bin/activate && \
	pip install -e .[dev] && \
	pytest

ci: web-ci core-ci ai-ci
