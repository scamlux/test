# 📚 Agri Platform Documentation

Complete documentation for the Agri Platform microservices architecture.

> 👈 **Back to**: [Main README](../readme.md)

---

## 📖 Documentation Structure

### 🎯 [Project Overview](PROJECT_SUMMARY.md)

- Complete project summary
- All 14 acceptance criteria details
- Architecture overview
- Implementation details

### 🏗️ [Architecture](architecture/)

- System design & patterns
- SAGA orchestration
- Kafka message broker
- Factory design pattern
- CQRS implementation
- Domain-Driven Design
- Outbox pattern & idempotency

**Key Files:**

- [ACCEPTANCE_CRITERIA_AUDIT.md](architecture/ACCEPTANCE_CRITERIA_AUDIT.md) - Full acceptance criteria verification
- [FRONTEND_REVIEW.md](architecture/FRONTEND_REVIEW.md) - React component architecture

### 🚀 [Getting Started](getting-started/)

- Installation & setup instructions
- Quick start guide
- Prerequisites
- Local development environment
- Docker Compose setup

### 🔄 [CI/CD Pipeline](ci-cd/)

- GitHub Actions workflows
- Docker image building
- Automated testing
- Security scanning
- ArgoCD deployment

**Key Files:**

- [CI_CD.md](ci-cd/CI_CD.md) - Complete CI/CD documentation
- [INFRASTRUCTURE.md](ci-cd/INFRASTRUCTURE.md) - Infrastructure setup

### 🚢 [Deployment](deployment/)

- Production deployment guide
- Kubernetes setup
- Helm charts
- GitOps with ArgoCD

**Key Files:**

- [GUIDE.md](deployment/GUIDE.md) - Deployment guide
- [HELM.md](deployment/HELM.md) - Helm chart reference
- [GITOPS.md](deployment/GITOPS.md) - GitOps setup

### 📊 [Monitoring & Observability](monitoring/)

- Prometheus metrics collection
- Grafana dashboards
- Loki log aggregation
- Tempo distributed tracing
- OpenTelemetry integration

### 🧪 [Testing](testing/)

- Unit testing
- Integration testing
- Test coverage
- Running tests
- Test best practices

**Key Files:**

- [GUIDE.md](testing/GUIDE.md) - Complete testing guide

### 📖 [Guides & References](guides/)

- Common tasks
- Best practices
- Troubleshooting
- API endpoints reference
- Database schema

---

## 🎯 Quick Navigation

**For First-Time Users:**

1. Read [Project Overview](PROJECT_SUMMARY.md)
2. Follow [Getting Started](getting-started/)
3. Review [Architecture Overview](architecture/)

**For Development:**

1. Check [Architecture](architecture/) for design patterns
2. Follow [Testing Guide](testing/GUIDE.md)
3. Use [Guides](guides/) for common tasks

**For Operations:**

1. Review [Deployment Guide](deployment/GUIDE.md)
2. Set up [Monitoring](monitoring/)
3. Use [Troubleshooting Guide](guides/)

**For CI/CD:**

1. Read [CI/CD Pipeline](ci-cd/CI_CD.md)
2. Review [Infrastructure Setup](ci-cd/INFRASTRUCTURE.md)
3. Check [GitOps Configuration](deployment/GITOPS.md)

---

## 📋 Quick Reference

### Available Services

| Service           | Port | Purpose               |
| ----------------- | ---- | --------------------- |
| Frontend          | 3000 | React web application |
| API Gateway       | 8000 | Central request proxy |
| Product Service   | 8001 | Product management    |
| Order Service     | 8002 | Order processing      |
| Delivery Service  | 8004 | Delivery management   |
| Query Service     | 8005 | CQRS read model       |
| Inventory Service | 8003 | Inventory management  |
| Payment Service   | 8006 | Payment processing    |

### Key Technologies

- **Backend**: Node.js, Express
- **Frontend**: React 18, Zustand
- **Databases**: PostgreSQL, MongoDB
- **Events**: Kafka
- **Monitoring**: Prometheus, Grafana, Loki, Tempo
- **Container**: Docker, Kubernetes
- **CI/CD**: GitHub Actions, ArgoCD

### Important Ports

- **3000** - Frontend & Grafana
- **8000** - API Gateway
- **8080** - Swagger UI
- **9090** - Prometheus
- **3100** - Loki
- **3200** - Tempo

---

## ✨ Key Features

✅ Complete microservices architecture  
✅ Domain-Driven Design (DDD)  
✅ CQRS pattern implementation  
✅ Event-driven with Kafka  
✅ Outbox pattern for event reliability  
✅ Idempotency and retry logic  
✅ Rate limiting  
✅ Full observability stack  
✅ Production-ready security  
✅ Kubernetes-native deployment

---

## 🚀 Getting Started (Quick)

```bash
# Start with Docker Compose
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform
docker-compose up -d

# Access services
# Frontend: http://localhost:3000
# API Gateway: http://localhost:8000
# Grafana: http://localhost:3000 (admin/admin)
```

👉 **For detailed setup**: [Getting Started Guide](getting-started/)

---

## 📞 Support

- 📖 Full documentation in `docs/` directory
- 🐛 Report issues on GitHub
- 💬 Discuss features in GitHub Discussions
- 📧 Check project README for contact info

---

## 📅 Last Updated

January 22, 2026

**Status**: ✅ **100% PRODUCTION READY**
