#!/bin/bash

# 🌾 Agri Platform - Quick Start Script
# Этот скрипт быстро готовит окружение для разработки

set -e

echo "
╔════════════════════════════════════════╗
║  🌾 AGRI PLATFORM - QUICK START        ║
║  Production-Ready Microservices        ║
╚════════════════════════════════════════╝
"

# Проверка требований
echo "📋 Проверка требований..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен. Установите его с https://www.docker.com/"
    exit 1
fi
echo "✅ Docker $(docker --version | awk '{print $3}' | sed 's/,//')"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose не установлен."
    exit 1
fi
echo "✅ Docker Compose $(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')"

# Переход в корневую папку
cd "$(dirname "$0")"

echo ""
echo "🚀 Запуск сервисов..."
echo ""

# Проверить и создать папки для волюмов если нужно
mkdir -p infrastructure/grafana/provisioning/{dashboards,datasources}

# Запустить Docker Compose
docker-compose down 2>/dev/null || true
docker-compose up -d --remove-orphans

echo ""
echo "⏳ Ожидание инициализации сервисов (30-60 сек)..."
echo ""

# Счетчик попыток
attempt=1
max_attempts=60

while [ $attempt -le $max_attempts ]; do
    # Проверить API Gateway
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo ""
        echo "✅ API Gateway готов!"
        break
    fi
    
    # Вывести точки прогресса
    echo -n "."
    
    attempt=$((attempt + 1))
    sleep 1
done

if [ $attempt -gt $max_attempts ]; then
    echo ""
    echo "⚠️  Сервисы инициализируются, но еще не готовы"
    echo "Проверьте логи: docker-compose logs -f"
fi

echo ""
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✨ АГРИ ПЛАТФОРМА ГОТОВА К ИСПОЛЬЗОВАНИЮ!                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "📱 WEB UI"
echo "   🌐 Frontend:        http://localhost:3000"
echo "   📖 Swagger/OpenAPI: http://localhost:8080"
echo ""
echo "🔌 API ENDPOINTS"
echo "   🚀 API Gateway:     http://localhost:8000"
echo "   📦 Products:        http://localhost:8000/api/products"
echo "   📋 Orders:          http://localhost:8000/api/orders"
echo "   🚚 Deliveries:      http://localhost:8000/api/deliveries"
echo "   📊 Logs & Metrics:  http://localhost:8000/api/logs"
echo ""
echo "📊 МОНИТОРИНГ"
echo "   📈 Grafana:         http://localhost:3000"
echo "   🔍 Prometheus:      http://localhost:9090"
echo "   📝 Loki (Logs):     http://localhost:3100"
echo "   🔎 Tempo (Traces):  http://localhost:3200"
echo ""
echo "💾 БАЗЫ ДАННЫХ"
echo "   PostgreSQL:         localhost:5432"
echo "   MongoDB:            localhost:27017"
echo "   Kafka:              localhost:9092"
echo ""
echo "📚 ПОЛНАЯ ДОКУМЕНТАЦИЯ"
echo "   Развертывание:  cat DEPLOYMENT_GUIDE.md"
echo "   API Docs:       curl http://localhost:8080"
echo "   Скрипты:        cat scripts/README.md"
echo ""
echo "🔧 ПОЛЕЗНЫЕ КОМАНДЫ"
echo "   Просмотр логов:       docker-compose logs -f [service-name]"
echo "   Проверка статуса:     ./scripts/health-check.sh"
echo "   Остановка:            docker-compose down"
echo "   Полная очистка:       docker-compose down -v"
echo "   Перестроить образ:    docker-compose up -d --build [service]"
echo ""
echo "✅ ДАЛЕЕ:"
echo "   1. Откройте http://localhost:3000 в браузере"
echo "   2. Перейдите на вкладку 'Products' и добавьте товары"
echo "   3. Перейдите на вкладку 'Create Order' и создайте заказ"
echo "   4. Отследите статус на вкладке 'Dashboard'"
echo ""
echo "❓ ПОМОЩЬ"
echo "   📖 Документация:  DEPLOYMENT_GUIDE.md"
echo "   🐛 Проблемы:      docker-compose logs -f"
echo "   📞 Поддержка:     GitHub Issues"
echo ""
