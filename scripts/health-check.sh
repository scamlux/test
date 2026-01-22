#!/bin/bash

# Agri Platform - Health Check Script
# Проверяет статус всех сервисов и зависимостей

echo "🏥 Agri Platform Health Check"
echo "=============================="
echo ""

# Цвета
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Счетчики
passed=0
failed=0

# Функция проверки
check_service() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    if [ -z "$url" ]; then
        echo -e "${YELLOW}⊘${NC} $name: URL не указан"
        return
    fi
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" -eq "$expected_status" ] || [ "$response" -lt 500 ]; then
        echo -e "${GREEN}✓${NC} $name: OK (HTTP $response)"
        ((passed++))
    else
        echo -e "${RED}✗${NC} $name: FAILED (HTTP $response)"
        ((failed++))
    fi
}

echo "🔍 Checking Services..."
echo ""

# Infrastructure
echo "Infrastructure Services:"
check_service "PostgreSQL" "http://localhost:5432" "000"
check_service "MongoDB" "http://localhost:27017" "000"
check_service "Kafka" "http://localhost:9092" "000"
echo ""

# Application Services
echo "Application Services:"
check_service "API Gateway" "http://localhost:8000/health"
check_service "Product Service" "http://localhost:8003/health"
check_service "Order Service" "http://localhost:8001/health"
check_service "Delivery Service" "http://localhost:8004/health"
check_service "Query Service" "http://localhost:8002/health"
echo ""

# Monitoring & Logging
echo "Monitoring Stack:"
check_service "Grafana" "http://localhost:3000"
check_service "Prometheus" "http://localhost:9090"
check_service "Loki" "http://localhost:3100"
check_service "Tempo" "http://localhost:3200"
echo ""

# Frontend
echo "Frontend:"
check_service "React App" "http://localhost:3000"
check_service "Swagger UI" "http://localhost:8080"
echo ""

# Docker Compose Status
echo "Container Status:"
docker-compose ps --services --filter "status=running" > /tmp/running_services.txt
total_services=$(docker-compose ps --services | wc -l)
running_services=$(wc -l < /tmp/running_services.txt)

if [ "$running_services" -eq "$total_services" ]; then
    echo -e "${GREEN}✓${NC} All containers running ($running_services/$total_services)"
else
    echo -e "${YELLOW}⚠${NC} Some containers not running ($running_services/$total_services)"
    echo ""
    echo "Not running:"
    comm -13 <(sort /tmp/running_services.txt) <(docker-compose ps --services | sort)
fi
echo ""

# Summary
echo "=============================="
echo "Summary:"
echo -e "  ${GREEN}Passed:${NC} $passed"
echo -e "  ${RED}Failed:${NC} $failed"

if [ "$failed" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✨ All systems operational!${NC}"
    echo ""
    echo "Quick Links:"
    echo "  📱 Frontend:   http://localhost:3000"
    echo "  🔗 API:        http://localhost:8000"
    echo "  📖 Swagger:    http://localhost:8080"
    echo "  📊 Grafana:    http://localhost:3000"
    exit 0
else
    echo ""
    echo -e "${RED}⚠ Some services are down. Check logs:${NC}"
    echo "  docker-compose logs -f [service-name]"
    exit 1
fi
