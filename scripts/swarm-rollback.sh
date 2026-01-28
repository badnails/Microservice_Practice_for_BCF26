#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STACK_NAME="bwfc"
SERVICE_NAME=$1

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}BWFC Docker Swarm Rollback${NC}"
echo -e "${GREEN}========================================${NC}"
echo

# Check if swarm is initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    echo -e "${RED}❌ Error: Docker Swarm is not initialized${NC}"
    exit 1
fi

# Check if stack exists
if ! docker stack ls | grep -q "$STACK_NAME"; then
    echo -e "${RED}❌ Error: Stack '$STACK_NAME' not found${NC}"
    exit 1
fi

# If service name provided, rollback specific service
if [ -n "$SERVICE_NAME" ]; then
    FULL_SERVICE_NAME="${STACK_NAME}_${SERVICE_NAME}"
    
    # Check if service exists
    if ! docker service ls | grep -q "$FULL_SERVICE_NAME"; then
        echo -e "${RED}❌ Error: Service '$FULL_SERVICE_NAME' not found${NC}"
        echo
        echo -e "${YELLOW}Available services:${NC}"
        docker stack services $STACK_NAME
        exit 1
    fi
    
    echo -e "${YELLOW}🔄 Rolling back service: $FULL_SERVICE_NAME${NC}"
    docker service rollback "$FULL_SERVICE_NAME"
    echo -e "${GREEN}✅ Rollback initiated for $FULL_SERVICE_NAME${NC}"
    echo
    
    # Monitor rollback
    echo -e "${BLUE}⏳ Monitoring rollback progress...${NC}"
    sleep 2
    docker service ps "$FULL_SERVICE_NAME" --no-trunc
else
    # Rollback all services
    echo -e "${YELLOW}🔄 Rolling back all services in stack: $STACK_NAME${NC}"
    echo
    
    # Get all service names
    SERVICES=$(docker stack services $STACK_NAME --format "{{.Name}}")
    
    for SERVICE in $SERVICES; do
        echo -e "${BLUE}Rolling back: $SERVICE${NC}"
        docker service rollback "$SERVICE" || echo -e "${YELLOW}  ⚠️  Could not rollback $SERVICE (might not have previous version)${NC}"
    done
    
    echo
    echo -e "${GREEN}✅ Rollback initiated for all services${NC}"
    echo
    
    # Show service status
    echo -e "${GREEN}📋 Service Status:${NC}"
    docker stack services $STACK_NAME
fi

echo
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Rollback Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo
echo -e "${YELLOW}Note: Rollback restores to the previous version of the service.${NC}"
echo -e "${YELLOW}If you need to rollback further, you may need to redeploy with specific image tags.${NC}"
echo
echo -e "${GREEN}Useful commands:${NC}"
echo "  • View service logs:    ${YELLOW}docker service logs -f ${STACK_NAME}_<service-name>${NC}"
echo "  • View service tasks:   ${YELLOW}docker service ps ${STACK_NAME}_<service-name>${NC}"
echo "  • Force update:         ${YELLOW}docker service update --force ${STACK_NAME}_<service-name>${NC}"
echo
