#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default environment
ENV=${1:-prod}

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BWFC Docker Swarm Deployment${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}Environment: ${ENV}${NC}"
echo

# Check if swarm is initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${RED}❌ Error: Docker Swarm is not initialized${NC}"
    echo -e "${YELLOW}Run ./scripts/swarm-init.sh first${NC}"
    exit 1
fi

# Determine which compose files to use
COMPOSE_FILES="-c docker-compose.yaml -c docker-compose.swarm.yaml"
ENV_FILE=".env.${ENV}"

if [ "$ENV" = "dev" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -c docker-compose.dev.yaml"
elif [ "$ENV" = "prod" ]; then
    COMPOSE_FILES="$COMPOSE_FILES -c docker-compose.prod.yaml"
else
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo -e "${YELLOW}Usage: $0 [dev|prod]${NC}"
    exit 1
fi

# Check if env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Error: Environment file $ENV_FILE not found${NC}"
    exit 1
fi

# Load environment variables
echo -e "${GREEN}📦 Loading environment from $ENV_FILE${NC}"
set -a
source "$ENV_FILE"
set +a
echo

# Login to GitHub Container Registry (if credentials available)
if [ -n "$GHCR_PAT" ]; then
    echo -e "${GREEN}🔐 Logging into GitHub Container Registry...${NC}"
    echo "$GHCR_PAT" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
    echo -e "${GREEN}✅ Logged in to GHCR${NC}"
    echo
fi

# Pull latest images
echo -e "${GREEN}📥 Pulling latest images...${NC}"
docker compose $COMPOSE_FILES --env-file "$ENV_FILE" pull
echo -e "${GREEN}✅ Images pulled${NC}"
echo

# Deploy the stack
STACK_NAME="bwfc"
echo -e "${GREEN}🚀 Deploying stack: $STACK_NAME${NC}"
echo -e "${BLUE}Compose files: $COMPOSE_FILES${NC}"
echo

docker stack deploy $COMPOSE_FILES --prune $STACK_NAME

echo
echo -e "${GREEN}✅ Stack deployed!${NC}"
echo

# Wait a moment for services to start
echo -e "${YELLOW}⏳ Waiting for services to initialize...${NC}"
sleep 5

# Show service status
echo -e "${GREEN}📋 Service Status:${NC}"
docker stack services $STACK_NAME
echo

# Show running tasks
echo -e "${GREEN}📋 Running Tasks:${NC}"
docker stack ps $STACK_NAME --no-trunc
echo

# Check for failed services
FAILED=$(docker stack ps $STACK_NAME --filter "desired-state=running" --format "{{.CurrentState}}" | grep -c "Failed" || true)
if [ "$FAILED" -gt 0 ]; then
    echo -e "${RED}⚠️  Warning: $FAILED task(s) failed${NC}"
    echo -e "${YELLOW}Check logs with: docker service logs <service-name>${NC}"
    echo
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${GREEN}Useful commands:${NC}"
echo "  • View services:       ${YELLOW}docker stack services $STACK_NAME${NC}"
echo "  • View tasks:          ${YELLOW}docker stack ps $STACK_NAME${NC}"
echo "  • View logs:           ${YELLOW}docker service logs -f ${STACK_NAME}_location-service${NC}"
echo "  • Scale a service:     ${YELLOW}docker service scale ${STACK_NAME}_location-service=3${NC}"
echo "  • Update a service:    ${YELLOW}docker service update ${STACK_NAME}_location-service${NC}"
echo "  • Remove stack:        ${YELLOW}docker stack rm $STACK_NAME${NC}"
echo
echo -e "${BLUE}Access your application:${NC}"
if [ "$ENV" = "dev" ]; then
    echo "  http://localhost:3000"
else
    echo "  https://${DOMAIN}"
fi
echo
