# 🌾 Agri Platform - Production-Ready Microservices System

A modern, cloud-native microservices platform for agricultural product management, order processing, and delivery tracking. Built with **Domain-Driven Design**, **CQRS pattern**, and production-grade technologies.

**Status**: ✅ **100% PRODUCTION READY**

---

## 📚 Documentation

All documentation is organized in the `docs/` directory:

- 📖 [**Project Overview & Completion Summary**](docs/PROJECT_SUMMARY.md) - Full project details & acceptance criteria
- 🏗️ [**Architecture**](docs/architecture/) - System design, patterns & microservices
- 🚀 [**Getting Started**](docs/getting-started/) - Setup, installation & quick start guide
- 🔄 [**CI/CD Pipeline**](docs/ci-cd/) - GitHub Actions, Docker builds, ArgoCD deployment
- 📊 [**Monitoring & Observability**](docs/monitoring/) - Prometheus, Grafana, Loki, Tempo setup
- 🧪 [**Testing Guide**](docs/testing/) - Unit tests, integration tests, test coverage
- 📖 [**Guides & References**](docs/guides/) - Common tasks, troubleshooting, best practices

---

## 🚀 Quick Start

### Development (Docker Compose)

```bash
git clone https://github.com/yourusername/agri-platform.git
cd agri-platform
docker-compose up -d

# Access services
Frontend:     http://localhost:3000
API Gateway:  http://localhost:8000
Grafana:      http://localhost:3000 (admin/admin)
Prometheus:   http://localhost:9090
```

### Production (Kubernetes)

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh

# Port-forward to access dashboards
kubectl port-forward svc/grafana 3000:3000 -n monitoring
kubectl port-forward svc/argocd-server 8080:443 -n argocd
```

👉 **See [Getting Started Guide](docs/getting-started/) for detailed setup instructions**

---

## ✨ Key Features

- ✅ **8 Production-Ready Services** (7 microservices + React frontend)
- ✅ **Domain-Driven Design** (4-layer architecture in each service)
- ✅ **CQRS Pattern** (Command & Query separation)
- ✅ **Event-Driven** with Kafka & Outbox pattern
- ✅ **Database Variety** (PostgreSQL, MongoDB, Kafka)
- ✅ **Full Observability** (Prometheus, Grafana, Loki, Tempo)
- ✅ **Modern React UI** with dark theme & real-time dashboard
- ✅ **CI/CD Pipeline** (GitHub Actions + ArgoCD)
- ✅ **Security** (Trivy scanning, RBAC, Pod security)
- ✅ **Kubernetes-Ready** with Helm charts

---

## 🔧 Technology Stack

| Component         | Technology                                      |
| ----------------- | ----------------------------------------------- |
| **Backend**       | Node.js, Express, PostgreSQL, MongoDB           |
| **Frontend**      | React 18, Zustand, Axios                        |
| **Events**        | Kafka, Zookeeper                                |
| **Monitoring**    | Prometheus, Grafana, Loki, Tempo, OpenTelemetry |
| **Container**     | Docker, Docker Compose                          |
| **Orchestration** | Kubernetes, Helm, ArgoCD                        |
| **CI/CD**         | GitHub Actions                                  |

---

## 📞 Support & Resources

- 📖 **Full Documentation** → See `docs/` directory
- 🏗️ **Architecture Details** → [docs/architecture/](docs/architecture/)
- 🚀 **Setup Guide** → [docs/getting-started/](docs/getting-started/)
- 🔄 **CI/CD Pipeline** → [docs/ci-cd/](docs/ci-cd/)
- 📊 **Monitoring Setup** → [docs/monitoring/](docs/monitoring/)
- 🧪 **Testing Guide** → [docs/testing/](docs/testing/)
- 📚 **Guides & Tips** → [docs/guides/](docs/guides/)
- 📋 **Project Summary** → [docs/PROJECT_SUMMARY.md](docs/PROJECT_SUMMARY.md)

---

## 📄 License

MIT © 2024 Agri Platform Contributors

- ✅ MongoDB for optimized logging
- ✅ Dashboard with order/delivery status
- ✅ Swagger/OpenAPI documentation
- ✅ Grafana monitoring setup
- ✅ Production-ready Docker setup
- ✅ Comprehensive deployment guide

---

**Last Updated**: 2024  
**Status**: ✅ Production Ready  
**Maintained by**: Agri Platform Team
