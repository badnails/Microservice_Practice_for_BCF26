.PHONY: help dev-up dev-down dev-build dev-logs dev-restart prod-up prod-down prod-build prod-logs prod-restart clean test swarm-init swarm-deploy swarm-deploy-dev swarm-status swarm-logs swarm-scale swarm-rollback swarm-down swarm-clean

# Default target
help:
	@echo "Available targets:"
	@echo "  Development (Compose):"
	@echo "    make dev-up         - Start development environment (HTTP on port 3000)"
	@echo "    make dev-down       - Stop development environment"
	@echo "    make dev-build      - Build development services"
	@echo "    make dev-restart    - Restart development environment"
	@echo "    make dev-logs       - View development logs"
	@echo ""
	@echo "  Production (Compose):"
	@echo "    make prod-up        - Start production environment (HTTPS on 80/443)"
	@echo "    make prod-down      - Stop production environment"
	@echo "    make prod-build     - Build production services"
	@echo "    make prod-restart   - Restart production environment"
	@echo "    make prod-logs      - View production logs"
	@echo ""
	@echo "  Docker Swarm:"
	@echo "    make swarm-init     - Initialize Docker Swarm cluster"
	@echo "    make swarm-deploy   - Deploy stack to swarm (production)"
	@echo "    make swarm-deploy-dev - Deploy stack to swarm (development)"
	@echo "    make swarm-status   - Show swarm services status"
	@echo "    make swarm-logs     - View logs for all swarm services"
	@echo "    make swarm-scale    - Scale a service (use SVC=name REPLICAS=n)"
	@echo "    make swarm-rollback - Rollback services (use SVC=name for specific service)"
	@echo "    make swarm-down     - Remove swarm stack"
	@echo "    make swarm-clean    - Remove swarm stack and leave swarm mode"
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

# ========================================
# Docker Swarm Targets
# ========================================

swarm-init:
	@echo "Initializing Docker Swarm..."
	./scripts/swarm-init.sh

swarm-deploy:
	@echo "Deploying stack to swarm (production)..."
	./scripts/swarm-deploy.sh prod

swarm-deploy-dev:
	@echo "Deploying stack to swarm (development)..."
	./scripts/swarm-deploy.sh dev

swarm-status:
	@echo "=== Swarm Services ==="
	docker stack services bwfc
	@echo ""
	@echo "=== Service Tasks ==="
	docker stack ps bwfc

swarm-logs:
	@if [ -z "$(SVC)" ]; then \
		echo "Viewing logs for all services..."; \
		for svc in location-service product-service warehouse-service routing-service demand-service validation-service network-service; do \
			echo ""; \
			echo "=== $$svc ==="; \
			docker service logs --tail 50 bwfc_$$svc; \
		done; \
	else \
		echo "Viewing logs for $(SVC)..."; \
		docker service logs -f bwfc_$(SVC); \
	fi

swarm-scale:
	@if [ -z "$(SVC)" ] || [ -z "$(REPLICAS)" ]; then \
		echo "Error: Usage: make swarm-scale SVC=service-name REPLICAS=number"; \
		echo "Example: make swarm-scale SVC=location-service REPLICAS=3"; \
		exit 1; \
	fi
	@echo "Scaling bwfc_$(SVC) to $(REPLICAS) replicas..."
	docker service scale bwfc_$(SVC)=$(REPLICAS)

swarm-rollback:
	@if [ -z "$(SVC)" ]; then \
		echo "Rolling back all services..."; \
		./scripts/swarm-rollback.sh; \
	else \
		echo "Rolling back $(SVC)..."; \
		./scripts/swarm-rollback.sh $(SVC); \
	fi

swarm-down:
	@echo "Removing swarm stack..."
	docker stack rm bwfc
	@echo "Waiting for stack removal..."
	@sleep 5
	@echo "Stack removed!"

swarm-clean:
	@echo "Removing swarm stack and leaving swarm mode..."
	docker stack rm bwfc || true
	@sleep 5
	docker swarm leave --force || true
	@echo "Swarm mode disabled!"
