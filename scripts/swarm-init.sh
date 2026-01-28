#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BWFC Docker Swarm Initialization${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if already in swarm mode
if docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${YELLOW}⚠️  Swarm is already initialized${NC}"
    echo
    echo "Current swarm info:"
    docker node ls
    echo
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Aborted.${NC}"
        exit 0
    fi
else
    echo -e "${GREEN}🚀 Initializing Docker Swarm...${NC}"
    docker swarm init
    echo -e "${GREEN}✅ Swarm initialized${NC}"
    echo
fi

# Display node info
echo -e "${GREEN}📋 Swarm Nodes:${NC}"
docker node ls
echo

# Create overlay network if it doesn't exist
NETWORK_NAME="bwfc_microservices-network"
if docker network ls | grep -q "$NETWORK_NAME"; then
    echo -e "${YELLOW}⚠️  Network '$NETWORK_NAME' already exists${NC}"
else
    echo -e "${GREEN}🔗 Creating overlay network: $NETWORK_NAME${NC}"
    docker network create --driver overlay --attachable "$NETWORK_NAME"
    echo -e "${GREEN}✅ Network created${NC}"
fi
echo

# Check for .env.prod file
if [ ! -f .env.prod ]; then
    echo -e "${RED}❌ Error: .env.prod file not found${NC}"
    echo -e "${YELLOW}Please create .env.prod with the following variables:${NC}"
    echo "  POSTGRES_USER=your_user"
    echo "  POSTGRES_PASSWORD=your_secure_password"
    echo "  GHCR_REGISTRY=ghcr.io/your_username"
    echo "  IMAGE_TAG=latest"
    echo "  DOMAIN=your-domain.com"
    echo "  ACME_EMAIL=your-email@example.com"
    exit 1
fi

# Source environment file
echo -e "${GREEN}📦 Loading environment from .env.prod${NC}"
set -a
source .env.prod
set +a

# Create Docker secrets (if they don't exist)
echo -e "${GREEN}🔐 Setting up Docker secrets...${NC}"

create_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if docker secret ls | grep -q "$secret_name"; then
        echo -e "${YELLOW}  ⚠️  Secret '$secret_name' already exists (skipping)${NC}"
    else
        echo "$secret_value" | docker secret create "$secret_name" -
        echo -e "${GREEN}  ✅ Created secret: $secret_name${NC}"
    fi
}

# Create secrets from environment variables
create_secret "postgres_user" "${POSTGRES_USER}"
create_secret "postgres_password" "${POSTGRES_PASSWORD}"

echo

# List secrets
echo -e "${GREEN}📋 Current Docker secrets:${NC}"
docker secret ls
echo

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Swarm Initialization Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${GREEN}Next steps:${NC}"
echo "  1. Deploy the stack:"
echo "     ${YELLOW}./scripts/swarm-deploy.sh prod${NC}"
echo
echo "  2. Check service status:"
echo "     ${YELLOW}docker stack services bwfc${NC}"
echo
echo "  3. View logs:"
echo "     ${YELLOW}docker service logs -f bwfc_location-service${NC}"
echo
echo -e "${GREEN}Useful commands:${NC}"
echo "  • List services:    docker service ls"
echo "  • Scale a service:  docker service scale bwfc_location-service=3"
echo "  • Node info:        docker node ls"
echo "  • Stack status:     docker stack ps bwfc"
echo
