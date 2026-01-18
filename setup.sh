#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Kafka Notification Service Setup ===${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Docker is not installed. Please install Docker first."
    exit 1
fi

echo -e "${GREEN}✓ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose is installed${NC}"

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✓ Created logs directory${NC}"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from template${NC}"
fi

# Build and start services
echo -e "\n${BLUE}Starting services...${NC}\n"
docker-compose up -d

echo -e "\n${GREEN}✓ Services started${NC}"
echo -e "\n${BLUE}Checking service health...${NC}\n"

# Wait for service to be ready
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null; then
        echo -e "${GREEN}✓ Service is healthy${NC}"
        break
    fi
    echo "Waiting for service to start... ($i/30)"
    sleep 2
done

echo -e "\n${GREEN}=== Setup Complete ===${NC}"
echo -e "\nServices are running:"
docker-compose ps
echo -e "\nAPI available at: ${BLUE}http://localhost:3000${NC}"
echo -e "Health check: ${BLUE}http://localhost:3000/health${NC}"
echo -e "\nTo view logs: ${BLUE}docker-compose logs -f${NC}"
echo -e "To stop services: ${BLUE}docker-compose down${NC}"
