# Developer entrypoints for the containerized monorepo.
# Host commands (test/lint/typecheck) run via pnpm; stack commands via docker compose.

.DEFAULT_GOAL := help
.PHONY: help install up down logs test test-integration lint typecheck format build clean generate migrate

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install workspace dependencies
	pnpm install

up: ## Build and start the full stack (db, api, web) in the background
	docker compose up -d --build

down: ## Stop the stack and remove containers
	docker compose down

logs: ## Tail logs from all services
	docker compose logs -f

generate: ## Generate a Drizzle migration from schema changes (no DB needed)
	pnpm --filter @sti/api run db:generate

migrate: ## Apply Drizzle migrations to the dev db container (host → localhost:DB_PORT)
	# Make does not auto-load .env the way docker compose does, so source it here (if
	# present) and build a localhost URL from DB_PORT/POSTGRES_* — never .env's
	# DATABASE_URL, which uses the compose-internal host `db` (unreachable from the host).
	# Assumes simple KEY=VALUE lines, the same assumption docker compose makes.
	@set -a; [ -f .env ] && . ./.env; set +a; \
	DATABASE_URL="postgres://$${POSTGRES_USER:-sti}:$${POSTGRES_PASSWORD:-sti}@localhost:$${DB_PORT:-5432}/$${POSTGRES_DB:-sti}" \
		pnpm --filter @sti/api run db:migrate

test: ## Run the unit Vitest suite (fast, no Docker)
	pnpm test

test-integration: ## Run the Testcontainers DB integration tests (requires Docker)
	pnpm test:integration

lint: ## Lint all packages with ESLint
	pnpm lint

typecheck: ## Type-check all packages with the TypeScript project graph
	pnpm typecheck

format: ## Format the repo with Prettier
	pnpm format

build: ## Build all packages
	pnpm -r run build

clean: ## Remove build output and caches
	rm -rf packages/*/dist packages/*/*.tsbuildinfo coverage
