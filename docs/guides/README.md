# 📖 Guides & References

Common tasks, best practices, and useful references.

---

## 🎯 Common Tasks

### API Operations

#### Get All Products

```bash
curl http://localhost:8000/api/products
```

#### Create Product

```bash
curl -X POST http://localhost:8000/api/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Wheat",
    "price": 25.50,
    "category": "Grain",
    "stockQuantity": 1000
  }'
```

#### Create Order

```bash
curl -X POST http://localhost:8000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "cust-001",
    "items": [
      {"productId": "prod-001", "quantity": 10}
    ]
  }'
```

#### Get Order Status

```bash
curl http://localhost:8000/api/orders/{orderId}
```

#### Start Delivery

```bash
curl -X POST http://localhost:8000/api/deliveries/{deliveryId}/start
```

### Docker Operations

```bash
# View logs for specific service
docker-compose logs -f api-gateway

# Restart service
docker-compose restart order-service

# Execute command in container
docker-compose exec order-service npm test

# Build specific image
docker-compose build product-service
```

### Database Operations

#### PostgreSQL

```bash
# Connect to database
psql -h localhost -U postgres -d orders_db

# List tables
\dt

# Query products
SELECT id, name, price FROM products;

# Query orders
SELECT id, customer_id, status FROM orders;
```

#### MongoDB

```bash
# Connect to MongoDB
mongosh localhost:27017/agri-logs

# List collections
show collections

# Find logs
db.request_logs.find().limit(10)

# Filter by service
db.request_logs.find({service_name: "order-service"}).count()
```

---

## 📊 Monitoring & Debugging

### Grafana Dashboards

1. Access: http://localhost:3000
2. Login: admin/admin
3. Default dashboards:
   - API Gateway Metrics
   - Service Health Status
   - Database Performance
   - Request Latency
   - Error Rates

### Prometheus Queries

Common useful queries:

```promql
# Request rate (per second)
rate(http_requests_total[1m])

# Error rate
rate(http_requests_total{status=~"5.."}[1m])

# Request latency (p99)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage
node_memory_MemUsed_bytes / 1024 / 1024

# CPU usage
rate(process_cpu_seconds_total[1m]) * 100
```

### Loki Log Queries

```
# All logs
{job="service"}

# Filter by service
{job=~"order-service|product-service"}

# Filter by level
{job="api-gateway"} | json | level="ERROR"

# Count errors
{job="api-gateway"} | json | level="ERROR" | stats count()
```

### View Service Logs

```bash
# Real-time logs
docker-compose logs -f order-service

# Last 100 lines
docker-compose logs --tail 100 api-gateway

# With timestamps
docker-compose logs -t product-service
```

---

## 🔧 Configuration

### Service Configuration

Each service can be configured via environment variables or `.env` file:

```bash
# API Gateway
API_GATEWAY_PORT=8000
LOG_LEVEL=debug

# Order Service
ORDER_SERVICE_PORT=8002
DB_HOST=localhost
KAFKA_BROKERS=localhost:9092

# Retry Policy
RETRY_MAX_ATTEMPTS=3
RETRY_INITIAL_DELAY=500
RETRY_MAX_DELAY=2000

# Rate Limiting
RATE_LIMIT_WINDOW=60000  # 1 minute
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Configuration

Edit `docker-compose.yml`:

```yaml
postgres:
  environment:
    POSTGRES_DB: orders_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres

mongodb:
  environment:
    MONGO_INITDB_ROOT_USERNAME: root
    MONGO_INITDB_ROOT_PASSWORD: password
```

---

## 🚀 Performance Tips

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_deliveries_order ON deliveries(order_id);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 'cust-001';
```

### Service Scaling

For production, scale services using Kubernetes:

```yaml
# Scale order-service to 3 replicas
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
```

### Caching Strategy

- Cache product list (TTL: 5 minutes)
- Cache order status (TTL: 1 minute)
- Cache delivery status (TTL: 30 seconds)

---

## 🐛 Troubleshooting

### Service Not Responding

```bash
# Check if container is running
docker-compose ps order-service

# View logs
docker-compose logs order-service

# Restart service
docker-compose restart order-service
```

### High Memory Usage

```bash
# Check memory stats
docker stats

# Limit memory in docker-compose.yml
services:
  api-gateway:
    mem_limit: 512m
```

### Slow Queries

```bash
# Enable query logging in PostgreSQL
SET log_min_duration_statement = 1000;  -- Log queries > 1 second

# Check slow query log
tail -f /var/log/postgresql/postgresql.log | grep duration
```

### Network Issues

```bash
# Test service connectivity
docker-compose exec api-gateway curl http://kafka:9092

# Check network
docker network ls
docker network inspect agri-platform_default
```

---

## 📋 API Reference

### Base URL

```
http://localhost:8000/api
```

### Common Response Codes

| Code | Meaning               |
| ---- | --------------------- |
| 200  | Success               |
| 201  | Created               |
| 400  | Bad Request           |
| 404  | Not Found             |
| 429  | Rate Limited          |
| 500  | Internal Server Error |

### Authentication

Currently no authentication. For production, add:

```bash
# API Key based
curl -H "X-API-Key: your-key" http://localhost:8000/api/products

# JWT based
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/products
```

---

## 📚 Best Practices

1. **Error Handling**: Always handle API errors gracefully
2. **Idempotency**: Use idempotency keys for critical operations
3. **Rate Limiting**: Respect rate limit headers (429 responses)
4. **Logging**: Include correlation IDs for request tracing
5. **Monitoring**: Set up alerts for errors and latency
6. **Security**: Never log sensitive data (passwords, tokens)
7. **Database**: Keep connections pooled, use transactions
8. **Testing**: Write unit and integration tests

---

## 🔗 Related Documentation

- [Getting Started](../getting-started/)
- [Architecture](../architecture/)
- [Monitoring](../monitoring/)
- [Testing](../testing/)
- [Deployment](../deployment/)
