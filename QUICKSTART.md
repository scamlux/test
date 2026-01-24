# 🚀 ИНСТРУКЦИИ ПО ЗАПУСКУ AGRI PLATFORM

## ✅ Быстрый старт (Рекомендуется)

### 1️⃣ Локальная разработка (Docker Compose)

```bash
cd /Users/muhammadumar/Desktop/agri-platform
./start.sh local
```

**Доступ:**

- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:8000
- 📚 **Swagger**: http://localhost:8080
- 📊 **Grafana**: http://localhost:3001 (admin/admin)
- 📈 **Prometheus**: http://localhost:9090

### 2️⃣ Kubernetes (Kind + Helm)

```bash
cd /Users/muhammadumar/Desktop/agri-platform
./start.sh k8s
```

**Доступ:**

- 🌐 **Web App**: http://localhost:3000
- 🔌 **API**: http://localhost:8000
- 📚 **Swagger**: http://localhost:8080
- 📊 **Grafana**: http://localhost:3001 (admin/admin)
- 🔐 **ArgoCD**: https://localhost:8443

## 📋 ЧЕКЛИСТ КОМПОНЕНТОВ

### ✓ Готовые сервисы

- [x] API Gateway (8000)
- [x] Order Service (8001)
- [x] Inventory Service
- [x] Payment Service
- [x] Query Service (8002)
- [x] Web Frontend (3000 - React)

### ✓ Инфраструктура

- [x] Docker Compose
- [x] PostgreSQL
- [x] MongoDB
- [x] Kafka + Zookeeper
- [x] Prometheus (метрики)
- [x] Loki (логи)
- [x] Grafana (дашборды)
- [x] OTEL Collector (трейсинг)
- [x] Tempo (сохранение трейсов)

### ✓ Автоматизация

- [x] GitHub Actions CI/CD (ci.yml)
- [x] Kubernetes deployment (Kind + Helm)
- [x] start.sh скрипт
- [x] Docker Registry: scamlux3221

### ✓ GitHub

- Repository: github.com/scamlux/test
- Username: scamlux
- Registry: scamlux3221

## 🔄 CI/CD ПРОЦЕСС

1. **Push на main** → GitHub Actions
2. **Build images** → Docker Registry (scamlux3221)
3. **Update Helm values** → Commit в репозиторий
4. **ArgoCD auto-sync** → Развёртывание в K8s

## 🎯 ДЕМОНСТРАЦИОННЫЙ СЦЕНАРИЙ

### Сценарий 1: Локальное тестирование

```bash
./start.sh local
# Открыть http://localhost:3000
# Создать заказ
# Проверить логи в Grafana
```

### Сценарий 2: Kubernetes демонстрация

```bash
./start.sh k8s
# Показать ArgoCD dashboard
# Масштабирование сервисов
# Метрики в Grafana
```

## 🛠️ ИЗМЕНЕНИЯ ИЗ ЭТОЙ СЕССИИ

✅ Удалены старые скрипты deploy.sh и cd.yml
✅ Исправлено название image в docker-compose (agri-web → web)
✅ Создан Dockerfile для api-gateway
✅ Проверена всё структура Dockerfiles
✅ Синтаксис start.sh и CI workflow проверены

## 📞 КОНТАКТЫ

**Docker Registry**: docker.io/scamlux3221
**GitHub**: github.com/scamlux/test
**Email**: (your-email)

---

**СТАТУС**: ✅ ГОТОВ К ДЕМОНСТРАЦИИ И ТЕСТИРОВАНИЮ
