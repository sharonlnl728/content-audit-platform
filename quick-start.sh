#!/bin/bash

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}
╔══════════════════════════════════════════════════════════════╗
║                Intelligent Content Audit Platform             ║
║                     Quick Start Script                       ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

# Check required tools
echo -e "${YELLOW}Checking environment dependencies...${NC}"

check_command() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}Error: $1 is not installed, please install it first${NC}"
        exit 1
    else
        echo -e "${GREEN}✓ $1 is installed${NC}"
    fi
}

check_command "docker"
check_command "docker-compose"
check_command "mvn"
check_command "java"
check_command "python3"

# Select startup mode
echo -e "\n${YELLOW}Please select startup mode:${NC}"
echo "1. Full startup (all services)"
echo "2. Development mode (infrastructure + Java services local run)"
echo "3. Infrastructure only (PostgreSQL, Redis, Consul)"
echo "4. Kubernetes deployment"

read -p "Please enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Starting full services...${NC}"
        
        # Build all Java services
        echo -e "${YELLOW}Building Java services...${NC}"
        for service in gateway-service user content admin; do
            if [ -d "$service" ]; then
                echo "Building $service..."
                cd $service
                mvn clean package -DskipTests
                cd ..
            fi
        done
        
        # Start all services
        docker-compose up --build -d
        
        echo -e "${GREEN}✓ All services started successfully${NC}"
        ;;
        
    2)
        echo -e "\n${YELLOW}Starting development mode...${NC}"
        
        # Only start infrastructure
        docker-compose up -d audit-postgres audit-redis audit-consul audit-ai-service
        
        echo -e "${YELLOW}Waiting for infrastructure to start...${NC}"
        sleep 30
        
        # Build Java services
        echo -e "${YELLOW}Building Java services...${NC}"
        for service in gateway-service user content admin; do
            if [ -d "$service" ]; then
                echo "Building $service..."
                cd $service
                mvn clean package -DskipTests
                cd ..
            fi
        done
        
        echo -e "${GREEN}✓ Development environment ready${NC}"
        echo -e "${YELLOW}Please manually start Java services for development debugging${NC}"
        ;;
        
    3)
        echo -e "\n${YELLOW}Starting infrastructure...${NC}"
        docker-compose up -d audit-postgres audit-redis audit-consul
        echo -e "${GREEN}✓ Infrastructure started successfully${NC}"
        ;;
        
    4)
        echo -e "\n${YELLOW}Deploying to Kubernetes...${NC}"
        
        # Check kubectl
        if ! command -v kubectl &> /dev/null; then
            echo -e "${RED}Error: kubectl is not installed${NC}"
            exit 1
        fi
        
        # Build images
        echo -e "${YELLOW}Building Docker images...${NC}"
        
        # Build Java service images
        for service in gateway-service user content admin; do
            if [ -d "$service" ]; then
                echo "Building $service image..."
                cd $service
                mvn clean package -DskipTests
                docker build -t content-audit/$service:latest .
                cd ..
            fi
        done
        
        # Build AI service image
        cd ai-service
        docker build -t content-audit/ai-service:latest .
        cd ..
        
        # Apply Kubernetes configuration
        echo -e "${YELLOW}Deploying to Kubernetes...${NC}"
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/postgres/
        kubectl apply -f k8s/redis/
        kubectl apply -f k8s/nacos/
        kubectl apply -f k8s/services/
        kubectl apply -f k8s/ingress.yaml
        
        echo -e "${GREEN}✓ Kubernetes deployment completed${NC}"
        echo -e "${YELLOW}Waiting for all pods to start...${NC}"
        kubectl wait --for=condition=ready pod -l app=postgres -n content-audit --timeout=300s
        kubectl wait --for=condition=ready pod -l app=content-service -n content-audit --timeout=300s
        ;;
        
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Wait for services to start
echo -e "\n${YELLOW}Waiting for services to start...${NC}"
sleep 30

# Health check
echo -e "\n${YELLOW}Performing health checks...${NC}"

check_service() {
    local service_name=$1
    local url=$2
    local timeout=60
    local counter=0
    
    echo -n "Checking $service_name..."
    
    while [ $counter -lt $timeout ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e " ${GREEN}✓ Running normally${NC}"
            return 0
        fi
        sleep 2
        counter=$((counter + 2))
        echo -n "."
    done
    
    echo -e " ${RED}✗ Startup failed or timeout${NC}"
    return 1
}

if [ "$choice" == "1" ]; then
    check_service "Gateway Service" "http://localhost:8080/actuator/health"
    check_service "User Service" "http://localhost:8081/actuator/health"
    check_service "Content Service" "http://localhost:8082/actuator/health"
    check_service "Admin Service" "http://localhost:8084/actuator/health"
    check_service "AI Service" "http://localhost:8083/health"
    check_service "Nacos" "http://localhost:8848/nacos/"
elif [ "$choice" == "2" ] || [ "$choice" == "3" ]; then
    check_service "AI Service" "http://localhost:8083/health"
    check_service "Nacos" "http://localhost:8848/nacos/"
    check_service "PostgreSQL" "localhost:5432"
fi

# Display access information
echo -e "\n${GREEN}
╔══════════════════════════════════════════════════════════════╗
║                        Service Information                   ║
╚══════════════════════════════════════════════════════════════╝
${NC}"

echo -e "${BLUE}API Gateway:${NC}     http://localhost:8080"
echo -e "${BLUE}User Service:${NC}    http://localhost:8081"
echo -e "${BLUE}Content Service:${NC} http://localhost:8082"
echo -e "${BLUE}AI Service:${NC}      http://localhost:8083"
echo -e "${BLUE}Admin Service:${NC}   http://localhost:8084"
echo -e "${BLUE}Nacos Console:${NC}   http://localhost:8848/nacos (nacos/nacos)"

echo -e "\n${YELLOW}API Test Examples:${NC}"
echo "# User Registration"
echo "curl -X POST http://localhost:8080/api/user/register \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"test\",\"password\":\"123456\",\"email\":\"test@example.com\"}'"

echo -e "\n# User Login"
echo "curl -X POST http://localhost:8080/api/user/login \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"username\":\"test\",\"password\":\"123456\"}'"

echo -e "\n# Text Audit"
echo "curl -X POST http://localhost:8080/api/content/audit/text \\"
echo "  -H 'Authorization: Bearer \$TOKEN' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"content\":\"Test text content\"}'"

echo -e "\n${YELLOW}Run complete test:${NC}"
echo "bash test/api-test.sh"

echo -e "\n${GREEN}🎉 Project startup completed!${NC}"
echo -e "${YELLOW}Tip: Use 'docker-compose logs -f [service-name]' to view service logs${NC}"

# Ask whether to run tests
read -p $'\nRun API tests immediately? (y/n): ' run_test

if [ "$run_test" == "y" ] || [ "$run_test" == "Y" ]; then
    if [ -f "test/api-test.sh" ]; then
        echo -e "\n${YELLOW}Starting API tests...${NC}"
        bash test/api-test.sh
    else
        echo -e "${RED}Test script does not exist, please test manually${NC}"
    fi
fi 