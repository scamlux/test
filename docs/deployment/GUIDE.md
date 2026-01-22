# Agri Platform - Полное руководство по развертыванию и использованию

## 📋 Содержание

1. [Обзор](#обзор)
2. [Требования](#требования)
3. [Быстрый старт](#быстрый-старт)
4. [Архитектура](#архитектура)
5. [API Документация](#api-документация)
6. [Развертывание](#развертывание)
7. [Использование](#использование)
8. [Мониторинг](#мониторинг)
9. [Устранение неполадок](#устранение-неполадок)
10. [Производственное развертывание](#производственное-развертывание)

---

## 🌾 Обзор

**Agri Platform** - это микросервисная платформа для управления сельскохозяйственными товарами, обработки заказов и отслеживания доставок. Построена с использованием архитектуры Domain-Driven Design (DDD) и паттерна CQRS.

### Ключевые возможности:

- 🛍️ Управление каталогом продуктов
- 📦 Создание и отслеживание заказов
- 🚚 Управление доставками с отслеживанием статуса
- 📊 Единая панель управления со статусами заказов и доставок
- 📈 Мониторинг и логирование с помощью Grafana, Prometheus, Loki
- 🔍 Полная документация API в Swagger
- 💾 Оптимизированное логирование в MongoDB

---

## 📦 Требования

### Минимальные требования

- **Docker**: версия 20.10 или выше
- **Docker Compose**: версия 2.0 или выше
- **Node.js**: версия 16+ (для локальной разработки без Docker)
- **Оперативная память**: минимум 4GB, рекомендуется 8GB
- **Дисковое пространство**: минимум 10GB

### Проверка установки

```bash
docker --version
docker-compose --version
node --version
```

---

## 🚀 Быстрый старт

### Шаг 1: Клонирование репозитория

```bash
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform
```

### Шаг 2: Установка зависимостей (опционально для локальной разработки)

```bash
# Установить зависимости для каждого сервиса
for service in services/*/; do
  cd "$service"
  npm install
  cd ../..
done

# Установить зависимости для фронтенда
cd web && npm install && cd ..
```

### Шаг 3: Запуск с Docker Compose

```bash
# Построить образы (опционально)
docker-compose build

# Запустить все сервисы
docker-compose up -d

# Проверить статус контейнеров
docker-compose ps
```

### Шаг 4: Проверка доступности сервисов

Дождитесь, пока все сервисы будут готовы (это может занять 30-60 секунд):

```bash
# Проверить здоровье сервисов
curl http://localhost:8000/health
curl http://localhost:3000  # Web UI
```

### Шаг 5: Открыть приложение

```bash
# Приложение будет доступно по адресам:
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
# Swagger документация: http://localhost:8080
# Grafana: http://localhost:3000 (пользователь: admin, пароль: admin)
# Prometheus: http://localhost:9090
# Loki: http://localhost:3100
```

---

## 🏗️ Архитектура

### Слои архитектуры

```
┌──────────────────────────────────────────────────┐
│           React Frontend (Port 3000)             │
│   Dashboard | Products | Orders | Logs          │
└────────────────┬─────────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────────┐
│         API Gateway (Port 8000)                   │
│  Request Logging → MongoDB                       │
└────────────────┬─────────────────────────────────┘
                 │
    ┌────────────┼────────────┬────────────┐
    │            │            │            │
┌───▼────┐  ┌───▼────┐  ┌───▼───┐  ┌───▼────┐
│Product │  │ Order  │  │Delivery│ │ Query  │
│Service │  │Service │  │Service │ │Service │
│Port    │  │Port    │  │Port    │ │Port    │
│8003    │  │8001    │  │8004    │ │8002    │
└─┬──────┘  └──┬─────┘  └────┬───┘  └────────┘
  │            │             │
  │       ┌────▼────┐    ┌───▼───┐
  │       │  Kafka  │    │ Inv.  │
  │       │(Events) │    │Service│
  │       └────┬────┘    └───────┘
  │            │
  └────┬───────┴────────┐
       │                │
   ┌───▼──────┐    ┌───▼──────┐
   │PostgreSQL│    │ MongoDB  │
   │  Orders  │    │  Logs    │
   └──────────┘    └──────────┘

Мониторинг & Логирование:
┌──────────────┬──────────────┬────────────┬────────────┐
│  Prometheus  │    Loki      │   Tempo    │  Grafana   │
│(Метрики)     │  (Логи)      │ (Трассы)   │(Визуализ)  │
└──────────────┴──────────────┴────────────┴────────────┘
```

### Микросервисы

#### 1. **Product Service** (Port 8003)

- DDD архитектура с 4 слоями
- Управление каталогом товаров
- Операции: CRUD, резервирование, освобождение запасов
- БД: PostgreSQL (products table)

#### 2. **Order Service** (Port 8001)

- Обработка заказов с Outbox паттерном
- Идемпотентность через IdempotencyStore
- Rate limiting
- Event publishing через Kafka
- БД: PostgreSQL (orders, order_items, outbox tables)

#### 3. **Delivery Service** (Port 8004)

- Управление доставками
- Отслеживание статуса
- Подтверждение доставки
- БД: PostgreSQL (deliveries, delivery_confirmations tables)

#### 4. **Query Service** (Port 8002)

- CQRS читающая модель
- Synchronize через Kafka события
- Быстрые запросы аналитики

#### 5. **Payment Service**

- Имитация платежных операций
- Event-driven архитектура
- Kafka consumer/producer

#### 6. **Inventory Service**

- Управление запасами
- Резервирование товаров
- Event handlers для заказов

#### 7. **API Gateway** (Port 8000)

- Централизованная точка входа
- Request logging в MongoDB
- Прокси к микросервисам
- Rate limiting и валидация

### Базы данных

#### PostgreSQL (Port 5432)

```
Пользователь: orders_user
Пароль: orders_pass
База данных: orders_db

Таблицы:
- products (каталог товаров)
- orders (заказы)
- order_items (товары в заказах)
- inventory_reservations (зарезервированные товары)
- deliveries (доставки)
- delivery_confirmations (подтверждения доставок)
- outbox_events (события для распространения)
- request_logs (логи запросов - устарело, используйте MongoDB)
```

#### MongoDB (Port 27017)

```
Пользователь: admin
Пароль: admin
База данных: agri-logs

Коллекция:
- request_logs (все логи запросов к API)
  - service_name
  - method (GET, POST, PUT, DELETE)
  - endpoint
  - status_code
  - request_body
  - response_body
  - duration_ms
  - error_message
  - created_at
```

### Message Broker

#### Kafka (Port 9092)

Используется для асинхронной коммуникации между сервисами:

**События:**

- `order-created` - заказ создан
- `payment-completed` - платеж завершён
- `payment-failed` - платеж неудачен
- `inventory-reserved` - запасы зарезервированы
- `inventory-released` - запасы освобождены
- `order-cancelled` - заказ отменён

---

## 📚 API Документация

### Доступ к документации

1. **Swagger UI** (Интерактивный)\*\*
   - URL: http://localhost:8080
   - Содержит все эндпоинты с примерами запросов/ответов

2. **Openapi.yml файл**
   - Путь: `./infrastructure/openapi.yml`
   - Совместимость с различными инструментами (Insomnia, Postman и т.д.)

### Основные эндпоинты

#### 🛍️ Товары

```bash
# Получить все товары
GET /api/products

# Создать товар
POST /api/products
Content-Type: application/json

{
  "name": "Органические помидоры",
  "price": 5.99,
  "category": "Овощи",
  "quantity": 100,
  "description": "Свежие органические помидоры от местных фермеров"
}

# Получить товар
GET /api/products/{productId}

# Обновить товар
PUT /api/products/{productId}

# Удалить товар
DELETE /api/products/{productId}
```

#### 📦 Заказы

```bash
# Получить все заказы
GET /api/orders?status=pending&limit=20

# Создать заказ
POST /api/orders
Content-Type: application/json

{
  "customerId": "CUST-001",
  "items": [
    {
      "productId": "550e8400-e29b-41d4-a716-446655440000",
      "quantity": 5
    },
    {
      "productId": "550e8400-e29b-41d4-a716-446655440001",
      "quantity": 3
    }
  ],
  "deliveryAddress": "123 Main St, Город, Страна",
  "notes": "Пожалуйста, доставить с утра"
}

# Получить заказ с деталями
GET /api/orders/{orderId}

# Обновить статус заказа
PUT /api/orders/{orderId}
{
  "status": "completed"
}

# Отменить заказ
DELETE /api/orders/{orderId}
```

#### 🚚 Доставки

```bash
# Получить все доставки
GET /api/deliveries?status=in_transit

# Создать доставку
POST /api/deliveries
{
  "orderId": "550e8400-e29b-41d4-a716-446655440010",
  "address": "456 Oak Ave, Город, Страна",
  "notes": "Оставить у входа"
}

# Начать доставку
POST /api/deliveries/{deliveryId}/start

# Подтвердить доставку
POST /api/deliveries/{deliveryId}/confirm
{
  "signature": "Иван Петров",
  "notes": "Получено в отличном состоянии"
}
```

#### 📊 Логи и Метрики

```bash
# Получить все логи запросов
GET /api/logs?limit=100

# Фильтр по сервису
GET /api/logs?service=product-service&limit=50

# Фильтр по статусу
GET /api/logs?status=500&limit=20

# Получить метрики
GET /api/metrics
# Ответ:
{
  "total_requests": 1523,
  "error_count": 23,
  "success_count": 1500,
  "error_rate": "1.51",
  "avg_response_time": 145.23
}

# Health check
GET /api/health
```

---

## 🛠️ Развертывание

### Локальное развертывание (для разработки)

#### Опция 1: С Docker Compose (рекомендуется)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform

# 2. Запустить все контейнеры
docker-compose up -d

# 3. Проверить логи
docker-compose logs -f

# 4. Остановить сервисы
docker-compose down

# 5. Полная очистка (включая данные)
docker-compose down -v
```

#### Опция 2: Локально без Docker

```bash
# Запустить PostgreSQL (требуется установка)
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Запустить MongoDB
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Установить Kafka (требуется Java)
# macOS
brew install kafka
zookeeper-server-start.sh /usr/local/etc/kafka/zookeeper.properties &
kafka-server-start.sh /usr/local/etc/kafka/server.properties &

# Запустить каждый микросервис в отдельном терминале
cd services/api-gateway && npm install && npm start
cd services/product-service && npm install && npm start
cd services/order-service && npm install && npm start
cd services/delivery-service && npm install && npm start
cd services/query-service && npm install && npm start
cd services/inventory-service && npm install && npm start
cd services/payment-service && npm install && npm start

# В отдельном терминале запустить фронтенд
cd web && npm install && npm start
```

### Построение Docker образов

```bash
# Переменная для версии (опционально)
export TAG=1.0.0

# Построить все образы
docker-compose build

# Построить конкретный образ
docker-compose build product-service

# Построить без cache
docker-compose build --no-cache
```

### Управление контейнерами

```bash
# Просмотреть статус контейнеров
docker-compose ps

# Просмотреть логи
docker-compose logs -f api-gateway
docker-compose logs -f product-service

# Перезагрузить сервис
docker-compose restart api-gateway

# Остановить все сервисы
docker-compose stop

# Удалить контейнеры
docker-compose down

# Удалить контейнеры и волюмы (осторожно - удалит данные!)
docker-compose down -v
```

---

## 💻 Использование

### Через Web UI

1. **Откройте http://localhost:3000 в браузере**

2. **Навигация:**
   - **Dashboard** - Главная панель с статусами заказов и доставок
   - **Products** - Управление каталогом товаров
   - **Create Order** - Создание новых заказов
   - **Request Logs** - Просмотр логов API запросов

3. **Основные операции:**

   **Добавление товара:**
   - Нажмите "Add Product" на странице Products
   - Заполните форму: название, цена, категория, количество
   - Нажмите "Add"

   **Создание заказа:**
   - Перейдите на "Create Order"
   - Выберите товары из каталога и количество
   - Заполните информацию о доставке
   - Нажмите "Place Order"

   **Отслеживание:**
   - На Dashboard видны все статусы
   - В Request Logs можно отслеживать все API операции

### Через API (curl примеры)

```bash
# Создать товар
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Морковь",
    "price": 2.99,
    "category": "Овощи",
    "quantity": 500,
    "description": "Свежая органическая морковь"
  }'

# Получить товары
curl http://localhost:8000/api/products

# Создать заказ
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-002",
    "items": [
      {
        "productId": "550e8400-e29b-41d4-a716-446655440000",
        "quantity": 10
      }
    ],
    "deliveryAddress": "789 Pine St, City, Country",
    "notes": "Доставить в понедельник"
  }'

# Получить заказы
curl http://localhost:8000/api/orders

# Создать доставку
curl -X POST http://localhost:8000/api/deliveries \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440010",
    "address": "789 Pine St, City, Country"
  }'

# Начать доставку
curl -X POST http://localhost:8000/api/deliveries/550e8400-e29b-41d4-a716-446655440011/start

# Подтвердить доставку
curl -X POST http://localhost:8000/api/deliveries/550e8400-e29b-41d4-a716-446655440011/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "signature": "Пётр Иванов",
    "notes": "Доставлено в 14:30"
  }'

# Получить логи
curl "http://localhost:8000/api/logs?limit=10"

# Получить метрики
curl http://localhost:8000/api/metrics
```

### Через Postman

1. Скачайте Postman: https://www.postman.com/downloads/
2. Импортируйте OpenAPI документацию:
   - Нажмите "Import"
   - Вставьте содержимое `./infrastructure/openapi.yml`
   - Все эндпоинты будут импортированы

### Через Swagger UI

1. Откройте http://localhost:8080
2. Все эндпоинты перечислены и интерактивны
3. Нажмите "Try it out" для тестирования запроса
4. Заполните параметры и выполните запрос

---

## 📊 Мониторинг

### Grafana Dashboard (http://localhost:3000)

#### Вход:

- Пользователь: **admin**
- Пароль: **admin**

#### Доступные дашборды:

1. **API Gateway Metrics**
   - Количество запросов в минуту
   - Среднее время ответа
   - Процент ошибок
   - Распределение по сервисам

2. **Service Health**
   - Статус каждого микросервиса
   - Доступность БД
   - Статус Kafka

3. **Database Performance**
   - Количество активных соединений
   - Query latency
   - Cache hit rate

### Prometheus (http://localhost:9090)

- Исследование метрик через PromQL
- История событий
- Алерты

Пример запроса метрики:

```promql
rate(http_requests_total[5m])
```

### Loki (http://localhost:3100)

- Логи всех микросервисов
- Фильтрация по сервису
- Временная шкала

Пример query:

```
{job="api-gateway"} | json | status_code="500"
```

### Tempo (http://localhost:3200)

- Распределённая трассировка
- Анализ запросов между сервисами
- Performance insights

---

## 🐛 Устранение неполадок

### Частые проблемы

#### 1. "Connection refused" для PostgreSQL

```bash
# Проверить статус контейнера
docker-compose ps postgres

# Посмотреть логи
docker-compose logs postgres

# Решение: перезапустить контейнер
docker-compose restart postgres

# Или пересоздать
docker-compose down
docker-compose up -d postgres
docker-compose up -d
```

#### 2. Kafka не подключается

```bash
# Проверить Kafka
docker-compose logs kafka

# Проверить порт
netstat -an | grep 9092

# Переменная окружения KAFKA_BROKERS должна быть: kafka:9092
```

#### 3. MongoDB не инициализирует

```bash
# Проверить логи
docker-compose logs mongodb

# Проверить данные
docker exec mongodb-logs mongosh -u admin -p admin --authenticationDatabase admin

# Очистить и пересоздать
docker-compose down -v
docker-compose up -d mongodb
```

#### 4. Frontend не видит API

```bash
# Проверить переменную окружения
docker-compose exec web env | grep REACT_APP_API_URL

# Должна быть: http://api-gateway:8000

# Проверить логи frontend
docker-compose logs web
```

#### 5. API Gateway вернул 502

```bash
# Проверить статус микросервисов
docker-compose ps

# Проверить логи API Gateway
docker-compose logs api-gateway

# Убедиться что все сервисы запущены
docker-compose up -d product-service order-service delivery-service query-service
```

### Полезные команды для диагностики

```bash
# Показать все запущенные контейнеры
docker ps

# Показать все контейнеры (включая остановленные)
docker ps -a

# Просмотр логов всех сервисов
docker-compose logs

# Логи в реальном времени
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f service-name

# Выполнить команду в контейнере
docker-compose exec service-name bash

# Посмотреть переменные окружения
docker-compose exec service-name env

# Проверить использование портов
netstat -an | grep LISTEN
lsof -i -P -n | grep LISTEN  # macOS/Linux

# Перестроить конкретный сервис
docker-compose up -d --build product-service

# Удалить остановленные контейнеры
docker container prune

# Удалить неиспользуемые образы
docker image prune
```

### Проверка здоровья сервисов

```bash
# Проверить API Gateway
curl -i http://localhost:8000/health

# Проверить Product Service
curl -i http://localhost:8003/health

# Проверить Order Service
curl -i http://localhost:8001/health

# Проверить Delivery Service
curl -i http://localhost:8004/health

# Проверить Query Service
curl -i http://localhost:8002/health
```

---

## 🚀 Производственное развертывание

### Подготовка к production

#### 1. Построение и публикация Docker образов

```bash
# Установить переменную версии
export VERSION=1.0.0
export DOCKER_REGISTRY=docker.io
export DOCKER_USERNAME=yourusername

# Войти в Docker Hub
docker login

# Построить образы с тегом версии
docker-compose build --tag $VERSION

# Тегировать образы
docker tag scamlux3221/api-gateway:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/api-gateway:$VERSION
docker tag scamlux3221/product-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/product-service:$VERSION
docker tag scamlux3221/order-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/order-service:$VERSION
docker tag scamlux3221/delivery-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/delivery-service:$VERSION
docker tag scamlux3221/query-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/query-service:$VERSION
docker tag scamlux3221/inventory-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/inventory-service:$VERSION
docker tag scamlux3221/payment-service:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/payment-service:$VERSION
docker tag scamlux3221/agri-web:latest $DOCKER_REGISTRY/$DOCKER_USERNAME/agri-web:$VERSION

# Опубликовать образы
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/api-gateway:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/product-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/order-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/delivery-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/query-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/inventory-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/payment-service:$VERSION
docker push $DOCKER_REGISTRY/$DOCKER_USERNAME/agri-web:$VERSION
```

#### 2. Kubernetes развертывание

```yaml
# deployment.yaml пример
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: agri-production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
        - name: api-gateway
          image: docker.io/yourusername/api-gateway:1.0.0
          ports:
            - containerPort: 8000
          env:
            - name: DB_HOST
              value: postgres-service
            - name: MONGO_URL
              value: mongodb://admin:admin@mongodb-service:27017
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway-service
  namespace: agri-production
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 8000
  selector:
    app: api-gateway
```

```bash
# Развернуть на Kubernetes
kubectl apply -f deployment.yaml
kubectl apply -f postgres-statefulset.yaml
kubectl apply -f mongodb-statefulset.yaml
kubectl apply -f kafka-statefulset.yaml
```

#### 3. Environment файл для production

```bash
# .env.production
NODE_ENV=production
LOG_LEVEL=info

# API Gateway
API_GATEWAY_PORT=8000
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database
DB_HOST=postgres.agri-production.svc.cluster.local
DB_PORT=5432
DB_USER=orders_user
DB_PASSWORD=<secure-password>
DB_NAME=orders_db
DB_POOL_MIN=5
DB_POOL_MAX=20

# MongoDB
MONGO_URL=mongodb://admin:<secure-password>@mongodb.agri-production.svc.cluster.local:27017
MONGO_DB=agri-logs
MONGO_POOL_SIZE=10

# Kafka
KAFKA_BROKERS=kafka-0.kafka-headless:9092,kafka-1.kafka-headless:9092,kafka-2.kafka-headless:9092

# Monitoring
PROMETHEUS_URL=http://prometheus:9090
GRAFANA_URL=http://grafana:3000

# Security
JWT_SECRET=<secure-jwt-secret>
API_KEY=<secure-api-key>

# Alerting
SLACK_WEBHOOK_URL=<slack-webhook>
EMAIL_FROM=noreply@agri-platform.local
```

#### 4. CI/CD pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    tags:
      - "v*"

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v1

      - name: Login to Docker Hub
        uses: docker/login-action@v1
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push images
        run: |
          VERSION=${GITHUB_REF#refs/tags/}
          docker-compose build
          docker tag scamlux3221/api-gateway:latest ${{ secrets.DOCKER_REGISTRY }}/api-gateway:${VERSION}
          docker push ${{ secrets.DOCKER_REGISTRY }}/api-gateway:${VERSION}

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/api-gateway
```

#### 5. Мониторинг и алерты

```yaml
# prometheus-alerts.yml
groups:
  - name: agri-platform
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: ServiceDown
        expr: up{job=~"product-service|order-service|delivery-service"} == 0
        for: 2m
        annotations:
          summary: "Service is down"

      - alert: DatabaseConnectionPoolExhausted
        expr: pg_stat_activity_count > 80
        for: 5m
        annotations:
          summary: "Database connection pool nearly exhausted"
```

#### 6. Резервное копирование и восстановление

```bash
# Резервная копия PostgreSQL
docker-compose exec postgres pg_dump -U orders_user orders_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление
docker-compose exec -T postgres psql -U orders_user orders_db < backup_20240101_120000.sql

# Резервная копия MongoDB
docker-compose exec mongodb mongodump --username admin --password admin --authenticationDatabase admin --out /backup

# Восстановление MongoDB
docker-compose exec -T mongodb mongorestore --username admin --password admin --authenticationDatabase admin /backup
```

#### 7. Масштабирование

```bash
# Масштабирование с помощью Docker Swarm
docker swarm init
docker stack deploy -c docker-compose.yml agri-platform

# Масштабирование с помощью Kubernetes
kubectl scale deployment api-gateway --replicas=5
kubectl scale deployment product-service --replicas=3
kubectl scale deployment order-service --replicas=3
```

---

## 📞 Поддержка и контакты

- **Документация**: [README.md](README.md)
- **API Документация**: http://localhost:8080 (Swagger UI)
- **Issues**: https://github.com/yourusername/agri-platform/issues
- **Discussions**: https://github.com/yourusername/agri-platform/discussions

---

## 📄 Лицензия

MIT License - смотрите [LICENSE](LICENSE) файл для деталей.

---

## 🎯 Версии и обновления

### Версия 1.0.0 (текущая)

- ✅ Полная архитектура микросервисов с DDD
- ✅ PostgreSQL для основных данных
- ✅ MongoDB для логирования
- ✅ Kafka для событийной архитектуры
- ✅ Grafana/Prometheus/Loki/Tempo для мониторинга
- ✅ React frontend с Dashboard
- ✅ Swagger/OpenAPI документация
- ✅ Docker контейнеризация

### Планируемые обновления

- [ ] GraphQL API
- [ ] WebSocket для real-time обновлений
- [ ] Elasticsearch для полнотекстового поиска
- [ ] Redis кэширование
- [ ] Multi-язычная поддержка
- [ ] Mobile приложение

---

**Последнее обновление**: 2024 год
**Версия документации**: 1.0.0
