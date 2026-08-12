# Shortcuts for the FastAPI backend. Every target shells out to `uv` — the repo
# uses uv exclusively for Python, never pip or poetry.
#
# Run from anywhere with `make -C backend <target>`.

PORT ?= 8000
HOST ?= 127.0.0.1
BASE := http://$(HOST):$(PORT)/api/v1
UV   := uv

.DEFAULT_GOAL := help
.PHONY: help install dev run test test-watch lint format format-check check token smoke clean

help: ## Show this help
	@grep -hE '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "  PORT=$(PORT) HOST=$(HOST) — override like: make dev PORT=8080"

install: ## Sync dependencies from uv.lock
	$(UV) sync

dev: install ## Run the API with auto-reload; docs at /docs
	$(UV) run fastapi dev app/main.py --host $(HOST) --port $(PORT)

run: install ## Run the API without auto-reload
	$(UV) run fastapi run app/main.py --host $(HOST) --port $(PORT)

test: install ## Run the whole test suite
	$(UV) run pytest

test-watch: install ## Re-run the tests that failed last, first
	$(UV) run pytest -q --last-failed --last-failed-no-failures all

lint: install ## Check with ruff
	$(UV) run ruff check .

format: install ## Reformat with ruff
	$(UV) run ruff format .

format-check: install ## Fail if anything is unformatted
	$(UV) run ruff format --check .

check: lint format-check test ## Everything CI should run before merging

# The seeded demo login. A fixture for local development, not a credential:
# the store is in memory, so it exists only as long as the process does.
GET_TOKEN = curl -sS $(BASE)/auth/token \
		-H 'content-type: application/json' \
		-d '{"username":"grownup@example.com","password":"atlas-demo-password"}' \
		| python3 -c 'import json,sys; print(json.load(sys.stdin)["accessToken"])'

token: ## Print a bearer token for the seeded demo account (needs a running server)
	@$(GET_TOKEN)

smoke: ## Hit a running server: health, content version, one authed profile list
	@curl -sS http://$(HOST):$(PORT)/health; echo
	@curl -sS $(BASE)/content/version; echo
	@TOKEN=$$($(GET_TOKEN)); curl -sS $(BASE)/profiles -H "authorization: Bearer $$TOKEN"; echo

clean: ## Remove caches (not .venv — `make install` is the slow part)
	rm -rf .pytest_cache .ruff_cache
	find . -name __pycache__ -type d -prune -exec rm -rf {} +
