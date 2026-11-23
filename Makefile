# Developer entrypoints for the containerized monorepo.
# Host commands (test/lint/typecheck) run via pnpm; stack commands via docker compose.

.DEFAULT_GOAL := help
.PHONY: help install up down logs test lint typecheck format build clean

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

test: ## Run the Vitest suite across all packages
	pnpm test

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
