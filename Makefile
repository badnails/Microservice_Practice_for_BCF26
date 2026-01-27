.PHONY: help dev-up dev-down dev-build dev-logs dev-restart prod-up prod-down prod-build prod-logs prod-restart clean test

# Default target
help:
	@echo "Available targets:"
	@echo "  Development:"
	@echo "    make dev-up         - Start development environment (HTTP on port 3000)"
	@echo "    make dev-down       - Stop development environment"
	@echo "    make dev-build      - Build development services"
	@echo "    make dev-restart    - Restart development environment"
	@echo "    make dev-logs       - View development logs"
	@echo ""
	@echo "  Production:"
	@echo "    make prod-up        - Start production environment (HTTPS on 80/443)"
	@echo "    make prod-down      - Stop production environment"
	@echo "    make prod-build     - Build production services"
	@echo "    make prod-restart   - Restart production environment"
	@echo "    make prod-logs      - View production logs"
	@echo ""
	@echo "  Testing:"
	@echo "    make test           - Run integration tests"
	@echo ""
	@echo "  Cleanup:"
	@echo "    make clean          - Stop all services and remove volumes"

# Development targets
dev-up:
	@echo "Starting development environment..."
	docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.dev up -d

dev-down:
	@echo "Stopping development environment..."
	docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.dev down

dev-build:
	@echo "Building development services..."
	docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.dev build --parallel

dev-restart: dev-down dev-build dev-up

dev-logs:
	docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.dev logs -f

# Production targets
prod-up:
	@echo "Starting production environment..."
	docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.prod up -d

prod-down:
	@echo "Stopping production environment..."
	docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.prod down

prod-build:
	@echo "Building production services..."
	docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.prod build --parallel

prod-restart: prod-down prod-build prod-up

prod-logs:
	docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.prod logs -f

# Testing
test:
	@echo "Running integration tests..."
	cd server && bun test

# Cleanup
clean:
	@echo "Stopping all services and removing volumes..."
	docker compose -f docker-compose.yaml -f docker-compose.dev.yaml --env-file .env.dev down -v || true
	docker compose -f docker-compose.yaml -f docker-compose.prod.yaml --env-file .env.prod down -v || true
	@echo "Cleanup complete!"