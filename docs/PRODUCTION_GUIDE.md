# Agri Platform v2.0 - Production Ready

## 🚀 Полностью готовое решение для сельскохозяйственной платформы

Это полностью интегрированная платформа электронной торговли для сельхозпродукции с системой аутентификации, управлением ролями и микросервисной архитектурой.

---

## 📋 Содержание

1. [Быстрый старт](#быстрый-старт)
2. [Архитектура](#архитектура)
3. [Аутентификация](#аутентификация)
4. [Роли и разрешения](#роли-и-разрешения)
5. [Демо учетные данные](#демо-учетные-данные)
6. [API Endpoints](#api-endpoints)
7. [Структура БД](#структура-бд)
8. [Микросервисы](#микросервисы)

---

## 🎯 Быстрый старт

### Предварительные требования

- Docker & Docker Compose
- Node.js 18+ (для локальной разработки)
- PostgreSQL 15+ (запускается в контейнере)

### Запуск системы

```bash
# Клонируем проект
cd /Users/muhammadumar/Desktop/agri-platform

# Запускаем все сервисы
docker-compose up -d

# Проверяем статус
docker-compose ps
```

### Доступные URL

| Сервис                 | URL                   | Порт  |
| ---------------------- | --------------------- | ----- |
| **Frontend (Web App)** | http://localhost:3000 | 3000  |
| **API Gateway**        | http://localhost:8000 | 8000  |
| **Auth Service**       | http://localhost:8005 | 8005  |
| **Grafana Dashboard**  | http://localhost:3001 | 3001  |
| **PostgreSQL**         | localhost:5432        | 5432  |
| **MongoDB**            | localhost:27017       | 27017 |

---

## 🏗️ Архитектура

### Система состоит из:

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React 18)                    │
│         Login, Dashboard, Products, Orders              │
│                  localhost:3000                          │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              API Gateway (Express.js)                    │
│    CORS • JWT Verification • Request Logging           │
│                  localhost:8000                          │
└──┬──────────┬──────────┬──────────┬────────────┬────────┘
   │          │          │          │            │
   │          │          │          │            │
┌──▼──┐  ┌───▼──┐  ┌────▼──┐  ┌───▼───┐  ┌────▼────┐
│Auth │  │Order │  │Product│  │Query  │  │Delivery │
│Svc  │  │Svc   │  │Svc    │  │Svc    │  │Svc      │
│8005 │  │8001  │  │8003   │  │8002   │  │8004     │
└──┬──┘  └───┬──┘  └────┬──┘  └───┬───┘  └────┬────┘
   │         │         │         │           │
   └─────────┴──────┬──┴─────────┴───────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
    ┌───▼─────┐          ┌─────▼──┐
    │PostgreSQL│          │MongoDB │
    │  (Data)  │          │(Logs)  │
    └──────────┘          └────────┘
```

### Technology Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Databases**: PostgreSQL (data), MongoDB (logs)
- **Message Queue**: Kafka
- **Monitoring**: Prometheus, Grafana, Loki, Tempo
- **Auth**: JWT, Bcrypt
- **API Gateway**: Express.js with CORS & Proxy

---

## 🔐 Аутентификация

### JWT Token Flow

```
1. User Login
   POST /api/auth/login
   { "email": "user@agri.com", "password": "pass123" }

2. Server returns
   {
     "accessToken": "eyJhbGc...",    // 1 час
     "refreshToken": "eyJhbGc...",   // 7 дней
     "user": { ... }
   }

3. Client stores tokens in localStorage

4. For protected requests:
   GET /api/dashboard
   Authorization: Bearer <accessToken>

5. Token expires?
   POST /api/auth/refresh
   { "refreshToken": "..." }
   → returns new accessToken
```

### Endpoints аутентификации

```
POST /api/auth/register
- Регистрация нового пользователя
- Автоматически присваивается роль BUYER

POST /api/auth/login
- Вход в систему
- Возвращает JWT токены и данные пользователя

POST /api/auth/refresh
- Обновление access token
- Требует refresh token

GET /api/auth/me
- Получить текущего пользователя
- Требует Authorization заголовок

POST /api/auth/logout
- Выход из системы
```

---

## 👥 Роли и разрешения

### Доступные роли

| Роль               | Описание      | Может                                  |
| ------------------ | ------------- | -------------------------------------- |
| **ADMIN**          | Администратор | Управлять всем, видеть все заказы      |
| **SELLER**         | Продавец      | Управлять своими продуктами и заказами |
| **BUYER**          | Покупатель    | Просматривать, покупать, отслеживать   |
| **DELIVERY_AGENT** | Доставщик     | Управлять доставками                   |

### Таблица разрешений

```
                Admin  Seller  Buyer  Delivery Agent
Просмотр продуктов  ✓      ✓      ✓         -
Создание продукта   ✓      ✓      -         -
Редактирование      ✓      свой   -         -
Удаление            ✓      свой   -         -

Просмотр заказов    ✓      свои   свои      -
Создание заказа     ✓      ✓      ✓         -
Изменение статуса   ✓      ✓      -         ✓
Отмена заказа       ✓      ✓      ✓         -

Управление доставкой✓      ✓      -         ✓
Подтверждение       ✓      -      ✓         ✓
```

---

## 🧪 Демо учетные данные

### Admin (Администратор)

```
Email:    admin@agriplatform.com
Password: admin123
Role:     ADMIN
```

**Может**: Управлять всеми пользователями, продуктами, заказами, видеть все логи

### Seller 1 (Продавец)

```
Email:    seller1@agriplatform.com
Password: admin123
Role:     SELLER
Shop:     Ali's Fresh Farm
```

**Может**: Управлять своими продуктами, видеть свои заказы

### Seller 2 (Продавец)

```
Email:    seller2@agriplatform.com
Password: admin123
Role:     SELLER
Shop:     Fatima's Organic Store
```

### Buyer 1 (Покупатель)

```
Email:    buyer1@agriplatform.com
Password: admin123
Role:     BUYER
```

**Может**: Просматривать продукты, создавать заказы, отслеживать доставку

### Buyer 2 (Покупатель)

```
Email:    buyer2@agriplatform.com
Password: admin123
Role:     BUYER
```

### Delivery Agent (Доставщик)

```
Email:    delivery@agriplatform.com
Password: admin123
Role:     DELIVERY_AGENT
```

**Может**: Управлять доставками, подтверждать получение

---

## 🔌 API Endpoints

### Authentication

```bash
# Register
POST /api/auth/register
{
  "email": "newuser@agri.com",
  "username": "newuser",
  "password": "securepass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+8801234567890"
}

# Login
POST /api/auth/login
{
  "email": "admin@agriplatform.com",
  "password": "admin123"
}

# Get Current User
GET /api/auth/me
Header: Authorization: Bearer <token>

# Refresh Token
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGc..."
}

# Logout
POST /api/auth/logout
Header: Authorization: Bearer <token>
```

### Products (Товары)

```bash
# List all products
GET /api/products

# Create product (Seller/Admin only)
POST /api/products
{
  "sku": "PROD-001",
  "name": "Organic Tomato",
  "description": "Fresh organic tomatoes",
  "price": 150.00,
  "stockQuantity": 100
}

# Get product by ID
GET /api/products/:id

# Update product
PUT /api/products/:id
{
  "name": "Updated Name",
  "price": 160.00,
  "stockQuantity": 50
}

# Delete product
DELETE /api/products/:id
```

### Orders (Заказы)

```bash
# List all orders
GET /api/orders

# Create order
POST /api/orders
{
  "customerId": "uuid",
  "items": [
    {
      "productId": "uuid",
      "quantity": 5
    }
  ]
}

# Get order by ID
GET /api/orders/:id

# Update order status
PUT /api/orders/:id
{
  "status": "CONFIRMED"
}
```

### Deliveries (Доставки)

```bash
# Get delivery info
GET /api/deliveries/:orderId

# Start delivery
POST /api/deliveries/:orderId/start

# Confirm delivery
POST /api/deliveries/:orderId/confirm
{
  "recipientName": "John Doe",
  "notes": "Left at gate"
}
```

### Logs & Monitoring

```bash
# Get all request logs
GET /api/logs?limit=100

# Get logs for specific service
GET /api/logs/order-service?limit=50

# View in Grafana
http://localhost:3001
(Admin credentials needed)
```

---

## 📊 Структура БД

### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  status VARCHAR(50) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Preloaded roles:
- ADMIN
- SELLER
- BUYER
- DELIVERY_AGENT
```

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY,
  seller_id UUID REFERENCES users(id),
  sku VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  visibility VARCHAR(50) DEFAULT 'PUBLIC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Orders Table

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  buyer_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'PENDING',
  payment_status VARCHAR(50) DEFAULT 'PENDING',
  payment_method VARCHAR(100),
  total_amount DECIMAL(10, 2),
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Order Items

```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔧 Микросервисы

### 1. Auth Service (Port 8005)

- Управление пользователями
- JWT токены
- Refresh token logic
- Role-based access

**Язык**: Node.js + Express

### 2. Product Service (Port 8003)

- CRUD операции для товаров
- Управление складом
- Фильтрация и поиск

### 3. Order Service (Port 8001)

- Создание и управление заказами
- Event sourcing для истории
- Idempotency для безопасности

### 4. Query Service (Port 8002)

- Оптимизированное чтение данных
- CQRS pattern
- Aggreations и analytics

### 5. Delivery Service (Port 8004)

- Управление доставками
- Трекинг
- Подтверждение получения

### 6. API Gateway (Port 8000)

- Единая точка входа
- CORS handling
- Request logging
- JWT verification
- Rate limiting (опционально)

---

## 📈 Мониторинг и Логирование

### Grafana (http://localhost:3001)

- Метрики Prometheus
- Логи Loki
- Traces Tempo

### Request Logging

Все запросы логируются в MongoDB:

```javascript
{
  service_name: "order-service",
  method: "POST",
  endpoint: "/api/orders",
  status_code: 201,
  request_body: { ... },
  response_body: { ... },
  duration_ms: 145,
  created_at: "2026-01-24T11:45:00Z"
}
```

---

## 🧪 Testing

### Register новый пользователь

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "username": "newuser",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@agriplatform.com",
    "password": "admin123"
  }'
```

### Использование токена

```bash
TOKEN="eyJhbGciOiJIUzI1NiIs..."

curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📝 Примечания

### Security

- ✅ Passwords хешированы с bcrypt
- ✅ JWT токены подписаны
- ✅ CORS настроены правильно
- ✅ Refresh tokens отдельно хранятся
- ⚠️ В продакшене используйте HTTPS
- ⚠️ Измените JWT_SECRET в .env

### Performance

- ✅ Request logging в MongoDB
- ✅ Database indexes на часто используемых полях
- ✅ Connection pooling для PostgreSQL
- ✅ Async/await для non-blocking operations

### Scalability

- ✅ Microservices архитектура
- ✅ Docker containerization
- ✅ Можно развернуть в Kubernetes (Helm charts готовы)
- ✅ Event-driven с Kafka

---

## 🐛 Troubleshooting

### "Cannot connect to auth-service"

```bash
docker-compose logs auth-service
docker-compose restart auth-service
```

### "JWT token invalid"

```bash
# Проверьте что JWT_SECRET совпадает везде
# Обновите переменные окружения в .env
docker-compose restart api-gateway
```

### "Database connection refused"

```bash
# Дождитесь пока postgres стартует
docker-compose ps postgres-db
# Должен показать "Healthy"
```

---

## 📦 Environment Variables

```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=orders_user
DB_PASSWORD=orders_pass
DB_NAME=orders_db

# Auth
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=1h
REFRESH_TOKEN_EXPIRE=7d

# Services
PRODUCT_SERVICE_HOST=product-service
ORDER_SERVICE_HOST=order-service
DELIVERY_SERVICE_HOST=delivery-service
QUERY_SERVICE_HOST=query-service
AUTH_SERVICE_HOST=auth-service
```

---

## 🎓 Дальнейшие улучшения

- [ ] Email подтверждение при регистрации
- [ ] OAuth 2.0 integration (Google, Facebook)
- [ ] Two-factor authentication (2FA)
- [ ] Role-based endpoints protection
- [ ] Product reviews и ratings
- [ ] Order history and analytics
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Real-time notifications (WebSockets)
- [ ] Admin dashboard
- [ ] Seller analytics dashboard

---

## 📞 Поддержка

Для вопросов или проблем, проверьте:

1. Логи контейнеров: `docker-compose logs <service-name>`
2. Health checks: `curl http://localhost:8000/health`
3. Database: `docker exec -it postgres-db psql -U orders_user -d orders_db`

---

**Version**: 2.0 Production Ready  
**Last Updated**: January 24, 2026  
**Status**: ✅ Fully Operational
