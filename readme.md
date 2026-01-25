# 🌾 Agri Platform - Production-Ready Microservices

Enterprise-grade agricultural management system with complete DevOps setup.

## 🚀 Quick Start

### One-Command Setup (Recommended)

```bash
./start.sh all          # Local development
./start.sh k8s          # Kubernetes deployment
```

### Local Development (Docker Compose)

```bash
docker-compose up -d
```

**Access:**

- Web App: http://localhost:3001
- API: http://localhost:8000
- Swagger: http://localhost:8080
- Grafana: http://localhost:3001 (admin/admin)

### Kubernetes Deployment

```bash
# Setup Kind cluster, build images, deploy with Helm
./start.sh k8s

# Then access services via port-forward
kubectl port-forward -n agri-platform svc/web 3000:3001
kubectl port-forward -n agri-platform svc/api-gateway 8000:8000
kubectl port-forward -n monitoring svc/grafana 3001:80
```

## 📋 Project Structure

```
agri-platform/
├── services/
│   ├── api-gateway/          # Request routing & logging
│   ├── order-service/        # Order management (SAGA)
│   ├── inventory-service/    # Stock management
│   ├── payment-service/      # Payment processing
│   ├── query-service/        # CQRS read model
│   └── shared/               # Utilities & logging
├── web/
│   └── src/
│       ├── pages/            # React components
│       ├── api/              # HTTP client
│       └── store/            # Zustand state
├── helm/
│   ├── agri-platform/        # Application charts
│   ├── monitoring/           # Prometheus, Loki, Grafana
│   └── values.yaml           # Deployment config
├── infrastructure/           # Database schemas
├── .github/workflows/        # CI/CD pipeline
└── start.sh                  # One-command setup
```

## 🏗️ Architecture

### Microservices (Node.js + Express)

- **API Gateway**: Central proxy with request logging
- **Order Service**: Distributed transactions (SAGA pattern)
- **Inventory Service**: Stock reservation & management
- **Payment Service**: Payment simulation & tracking
- **Query Service**: CQRS read model & analytics

### Key Patterns

✅ **SAGA Orchestration** - Distributed transaction management  
✅ **CQRS** - Separate read/write models  
✅ **Event-Driven** - Kafka-based communication  
✅ **Outbox Pattern** - Guaranteed event delivery  
✅ **Idempotency** - Safe request retries  
✅ **Rate Limiting** - API protection (429)

### Database

- **PostgreSQL**: Orders (transactional)
- **MongoDB**: Logs & audit trail
- **Kafka**: Event streaming

### Monitoring & Observability

- **Prometheus**: Metrics collection (50+ metrics)
- **Loki**: Log aggregation
- **Grafana**: Dashboards & visualization
- **OpenTelemetry**: Distributed tracing

### Deployment

- **Docker**: Container images (scamlux3221 registry)
- **Kubernetes**: Orchestration (Kind for local)
- **Helm**: Package management (8 charts)
- **ArgoCD**: GitOps deployment
- **GitHub Actions**: CI/CD pipeline

## 📊 Features

### Web Application

- Real-time dashboard (10s auto-refresh)
- Order creation form with validation
- Product management
- Request logging viewer
- Dark theme UI

### Business Processes

1. **Create Order** → API validation
2. **Inventory Reservation** → Stock check
3. **Payment Processing** → Payment confirmation
4. **Order Confirmation** → CQRS update
5. **Delivery Tracking** → Delivery management

### Monitoring

- Real-time metrics dashboard
- Service health status
- Request/response logging
- Error rate alerts
- Performance tracing

## 🔧 Configuration

### Environment Variables

**Web (REACT_APP_API_URL)**

```
Local:    http://localhost:8000
K8s:      http://api-gateway:8000
```

**Services (KAFKA_BROKERS)**

```
Local:    localhost:9092
K8s:      kafka:9092
```

### GitHub Secrets (Required for CI/CD)

```
DOCKER_PASSWORD    # Docker Hub password
```

## 📦 Deployment Process

### Local Development

```bash
./start.sh local        # Docker Compose
docker-compose logs -f  # View logs
```

### Kubernetes (Production-like)

```bash
./start.sh k8s          # Creates Kind cluster
kubectl logs -f -n agri-platform -l app=order-service
```

### CI/CD Pipeline

1. Push to `main` → GitHub Actions
2. Build images → Docker Hub (scamlux3221/\*)
3. Update Helm values
4. ArgoCD auto-syncs

## 🔐 Security Features

- Non-root containers
- Read-only filesystems
- Resource limits
- Network policies
- Secret management
- Trivy vulnerability scanning

## 📊 API Endpoints

### Orders

```
POST   /api/orders           # Create order
GET    /api/orders           # List orders
GET    /api/orders/:id       # Get order details
```

### Products

```
GET    /api/products         # List products
POST   /api/products         # Create product
PUT    /api/products/:id     # Update product
DELETE /api/products/:id     # Delete product
```

### Deliveries

```
POST   /api/deliveries       # Create delivery
POST   /api/deliveries/:id/start      # Start delivery
POST   /api/deliveries/:id/confirm    # Confirm delivery
```

### System

```
GET    /api/health           # Health check
GET    /api/metrics          # System metrics
GET    /api/logs             # Request logs
```

## 🧪 Testing

### Local Test

```bash
# Create order via web UI (http://localhost:3001)
# Check status in dashboard
# Verify in Grafana (http://localhost:3001)
```

### Automated Tests

```bash
# Services
cd services && npm test -- --coverage

# Frontend
cd web && npm test -- --coverage
```

## 📈 Monitoring

### Grafana Dashboards

- **Service Health**: Pod status, resource usage
- **Request Metrics**: Latency, throughput, errors
- **Business Metrics**: Orders, deliveries, inventory
- **Infrastructure**: CPU, memory, disk

### Alerts

- High error rate (> 5%)
- Service down (3 failed health checks)
- High memory usage (> 80%)
- Pod crash loop

### Logs

- Aggregated via Loki
- Full-text search
- Service filtering
- Error tracing

## 🔄 Update Process

### After Code Push

1. **CI/CD Pipeline** (GitHub Actions)
   - Build Docker images
   - Push to Docker Hub
   - Update Helm values

2. **ArgoCD** (Auto-sync)
   - Detects Helm changes
   - Applies new versions
   - Updates K8s resources

3. **Rolling Update**
   - New pods spin up
   - Old pods gradually terminate
   - Zero-downtime deployment

### Example Workflow

```bash
# Make code changes
git add .
git commit -m "feat: new feature"
git push origin main

# Automatic:
# 1. Images built: scamlux3221/order-service:abc123
# 2. Helm updated: tag: abc123
# 3. ArgoCD syncs: new deployment
# 4. Grafana shows new version
```

## 🛠️ Troubleshooting

### Local Issues

```bash
# View logs
docker-compose logs -f service-name

# Restart service
docker-compose restart service-name

# Reset everything
docker-compose down -v
./start.sh local
```

### Kubernetes Issues

```bash
# Check pod status
kubectl get pods -n agri-platform

# View pod logs
kubectl logs -n agri-platform deployment/order-service

# Describe pod
kubectl describe pod -n agri-platform <pod-name>

# Port forward for debugging
kubectl port-forward -n agri-platform svc/order-service 8001:8001
```

## 📞 Support

- **Repository**: github.com/scamlux/test
- **Docker Registry**: docker.io/scamlux3221/\*
- **Issues**: GitHub Issues
- **Monitoring**: Grafana Dashboard

## 📚 Documentation by Component

### Microservices

- Order Service: SAGA orchestration, Outbox pattern
- Inventory Service: Event-driven stock management
- Payment Service: Payment processing simulation
- Query Service: CQRS read model

### Frontend

- React 18, Zustand state, Axios HTTP
- Dark theme UI, real-time updates
- Form validation, error handling

### DevOps

- Docker multi-stage builds
- Kubernetes manifests
- Helm charts (8 charts)
- GitHub Actions CI/CD
- ArgoCD GitOps

## 🎯 Success Criteria

✅ One-command setup (`./start.sh`)  
✅ Full monitoring stack (Prometheus, Loki, Grafana)  
✅ GitOps deployment (ArgoCD)  
✅ CI/CD automation (GitHub Actions)  
✅ Zero-downtime updates  
✅ Complete order-to-delivery flow  
✅ Production-ready security

## 📋 Checklist for Demo

- [ ] Clone repository: `git clone https://github.com/scamlux/test`
- [ ] Run setup: `./start.sh all`
- [ ] Web app loads: http://localhost:3001
- [ ] Create order via form
- [ ] Check dashboard for order status
- [ ] Open Grafana: http://localhost:3001
- [ ] View order metrics & logs
- [ ] Show GitHub Actions workflow
- [ ] Explain ArgoCD deployment

## 🚀 Next Steps

1. **Local Testing**: `./start.sh local`
2. **Manual Testing**: Create orders, track delivery
3. **Kubernetes**: `./start.sh k8s`
4. **Monitor**: Grafana dashboard
5. **GitHub Push**: Trigger CI/CD
6. **ArgoCD**: Auto-deployment

---

**Status**: ✅ Production Ready  
**Last Updated**: January 24, 2026  
**Version**: 1.0  
**License**: MIT

---

**Key Stats**:

- 5 Core Microservices
- React + Zustand Frontend
- 50+ Prometheus Metrics
- 8 Helm Charts
- 100% Containerized
- GitOps Ready
- CI/CD Automated
- Fully Observable
