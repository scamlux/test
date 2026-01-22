# 🚀 Getting Started Guide

Complete setup and installation guide for Agri Platform.

---

## 📋 Prerequisites

### Minimum Requirements

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **4GB RAM** (8GB recommended)
- **10GB disk space**

### For Local Development (without Docker)

- **Node.js** 18+
- **npm** 9+
- **PostgreSQL** 14+
- **MongoDB** 5.0+
- **Kafka** (or use Docker Compose for it)

---

## 🐳 Quick Start with Docker Compose

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform
```

### 2. Start All Services

```bash
docker-compose up -d
```

This starts:

- PostgreSQL (port 5432)
- MongoDB (port 27017)
- Kafka + Zookeeper (ports 9092, 2181)
- Redis (port 6379)
- All 8 microservices
- React Frontend
- Grafana, Prometheus, Loki, Tempo

### 3. Wait for Services to Start

```bash
# Check service status
docker-compose ps

# Wait 30-60 seconds for full initialization
```

### 4. Access Services

| Service          | URL                   |
| ---------------- | --------------------- |
| **Frontend**     | http://localhost:3000 |
| **API Gateway**  | http://localhost:8000 |
| **Swagger Docs** | http://localhost:8080 |
| **Grafana**      | http://localhost:3000 |
| **Prometheus**   | http://localhost:9090 |
| **Loki**         | http://localhost:3100 |
| **Tempo**        | http://localhost:3200 |

### 5. Test the API

```bash
# Get all products
curl http://localhost:8000/api/products

# Create a product
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wheat",
    "price": 25.50,
    "stockQuantity": 1000
  }'

# Create an order
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-001",
    "items": [
      {"productId": "prod-001", "quantity": 10}
    ]
  }'
```

---

## 💻 Local Development Setup (Without Docker)

### 1. Install Dependencies

```bash
# Backend services
cd services
npm install

# Frontend
cd ../web
npm install

# Return to root
cd ..
```

### 2. Start External Services (Using Docker)

```bash
# Start only infrastructure (PostgreSQL, MongoDB, Kafka, etc.)
docker-compose up -d postgres mongodb kafka zookeeper redis grafana prometheus loki tempo
```

### 3. Configure Environment Variables

Create `.env` file in root:

```bash
# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=orders_db

# MongoDB
MONGO_URI=mongodb://localhost:27017/agri-logs

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_GROUP_ID=agri-platform

# Services
API_GATEWAY_PORT=8000
PRODUCT_SERVICE_PORT=8001
ORDER_SERVICE_PORT=8002
DELIVERY_SERVICE_PORT=8004
QUERY_SERVICE_PORT=8005
INVENTORY_SERVICE_PORT=8003
PAYMENT_SERVICE_PORT=8006

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

### 4. Start Services Individually

```bash
# Terminal 1: API Gateway
cd services/api-gateway
npm start

# Terminal 2: Product Service
cd services/product-service
npm start

# Terminal 3: Order Service
cd services/order-service
npm start

# Terminal 4: Delivery Service
cd services/delivery-service
npm start

# Terminal 5: Query Service
cd services/query-service
npm start

# Terminal 6: Inventory Service
cd services/inventory-service
npm start

# Terminal 7: Payment Service
cd services/payment-service
npm start

# Terminal 8: Frontend
cd web
npm start
```

---

## 🔍 Verify Installation

### 1. Health Check

```bash
# Check all services are responding
for port in 8000 8001 8002 8003 8004 8005 8006; do
  echo "Checking port $port..."
  curl -s http://localhost:$port/health || echo "❌ Port $port down"
done
```

### 2. Database Check

```bash
# PostgreSQL
psql -h localhost -U postgres -d orders_db -c "SELECT * FROM products LIMIT 1;"

# MongoDB
mongosh localhost:27017/agri-logs --eval "db.request_logs.findOne()"
```

### 3. Kafka Topics

```bash
# List topics
docker-compose exec kafka kafka-topics.sh --list --bootstrap-server kafka:9092

# Expected topics: order-created, payment-completed, inventory-reserved, delivery-confirmed
```

### 4. Access Grafana

1. Open http://localhost:3000
2. Login: `admin` / `admin`
3. Check dashboard shows metrics

---

## 📱 Frontend Setup

### Development Server

```bash
cd web
npm start
```

Runs on http://localhost:3000 with hot reload

### Build for Production

```bash
cd web
npm run build
```

Output in `web/build/` directory

### Test Frontend

```bash
cd web
npm test -- --watchAll=false
```

---

## 🧪 Run Tests

### All Services & Frontend

```bash
npm test -- --watchAll=false --coverage
```

### Specific Service

```bash
cd services/order-service
npm test
```

### With Coverage Report

```bash
npm test -- --coverage
```

---

## 🛑 Stop Services

### Docker Compose

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f api-gateway
```

### Local Development

Press `Ctrl+C` in each terminal running services

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### PostgreSQL Connection Error

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart service
docker-compose restart postgres
```

### Frontend Can't Reach API

```bash
# Check REACT_APP_API_URL
curl http://localhost:8000/health

# Update .env file if needed
REACT_APP_API_URL=http://localhost:8000/api
```

### Kafka Connection Issues

```bash
# Check Kafka broker
docker-compose logs kafka

# Test connectivity
docker-compose exec kafka kafka-broker-api-versions.sh --bootstrap-server kafka:9092
```

---

## 🚀 Next Steps

After successful setup:

1. 📖 Read [Architecture Guide](../architecture/)
2. 📊 Explore [Grafana Dashboards](../monitoring/)
3. 📝 Review [API Documentation](../deployment/GUIDE.md#api-documentation)
4. 🧪 Check [Testing Guide](../testing/GUIDE.md)
5. 🚢 Learn about [Deployment](../deployment/)

---

## 📞 Support

- Check [Troubleshooting Guide](../guides/)
- Review service logs: `docker-compose logs <service-name>`
- See GitHub Issues for known problems
- Consult main [README.md](../../readme.md)
