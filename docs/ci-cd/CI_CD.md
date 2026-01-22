# CI/CD Pipeline Documentation

## Overview

Agri Platform использует современный CI/CD pipeline с GitHub Actions, ArgoCD и Kubernetes для автоматизированного развертывания приложения.

## Architecture

```
┌─────────────┐
│   GitHub    │
│  Repository │
└──────┬──────┘
       │
       ├─► GitHub Actions (CI)
       │   ├─ Build Docker images
       │   ├─ Run security scans
       │   └─ Push to Docker Hub
       │
       └─► GitHub Actions (CD)
           ├─ Deploy with ArgoCD
           ├─ Apply Helm charts
           └─ Monitor deployment
```

## GitHub Actions Workflows

### CI Workflow (`.github/workflows/ci.yml`)

**Триггеры:**

- Push на main/develop branches
- Pull requests

**Этапы:**

1. **Setup** - Генерация версии и конфигурация матрицы сервисов
2. **Test** - Запуск тестов для всех сервисов и фронтенда с coverage
3. **Build** - Параллельная сборка Docker образов (8 сервисов)
4. **Security** - Сканирование с Trivy
5. **Notify** - Уведомление в GitHub Actions Summary

**Переменные окружения:**

```bash
DOCKER_REGISTRY=docker.io
IMAGE_PREFIX=scamlux3221
VERSION=v2026.01.22-${GITHUB_SHA::7}  # на main branch
VERSION=${GITHUB_REF#refs/heads/}-${GITHUB_SHA::7}  # на других branches
```

**Примеры команд:**

```bash
# Сборка конкретного сервиса
docker buildx build --push \
  --tag docker.io/scamlux3221/api-gateway:v2026.01.22-abc1234 \
  -f services/api-gateway/Dockerfile .

# Сканирование образа
trivy image --format sarif \
  docker.io/scamlux3221/api-gateway:v2026.01.22-abc1234
```

### CD Workflow (`.github/workflows/cd.yml`)

**Триггеры:**

- Успешное завершение CI workflow
- Manual trigger (workflow_dispatch)

**Этапы:**

1. **Install ArgoCD** - Развертывание ArgoCD на кластере
2. **Deploy Services** - Развертывание всех сервисов via Helm
3. **Apply Monitoring** - Установка Prometheus, Loki, Grafana
4. **Verify** - Проверка статуса развертывания

**Пример развертывания сервиса:**

```bash
helm upgrade --install order-service helm/order-service/ \
  --namespace agri-platform \
  --set image.tag=v2026.01.22-abc1234 \
  --values helm/order-service/values.yaml
```

## ArgoCD Configuration

### Application Manifest (`k8s/argocd/application.yaml`)

Определяет GitOps источник и целевое состояние:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: agri-platform
  namespace: argocd
spec:
  source:
    repoURL: https://github.com/yourusername/agri-platform-gitops.git
    path: services
    plugin:
      name: helm
  destination:
    server: https://kubernetes.default.svc
    namespace: agri-platform
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

**Ключевые параметры:**

- **repoURL**: Отдельный Git репозиторий для GitOps (git-state-sync)
- **path**: Директория с Helm charts и K8s manifests
- **automated.prune**: Удалять ресурсы, удаленные из git
- **automated.selfHeal**: Синхронизировать при дрифте кластера

## Helm Charts

### Структура

```
helm/
├── api-gateway/
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       └── _helpers.tpl
├── product-service/
├── order-service/
├── delivery-service/
├── query-service/
├── inventory-service/
├── payment-service/
└── web/
```

### Типовой Helm Chart

**Chart.yaml** - Метаданные:

```yaml
apiVersion: v2
name: product-service
version: 1.0.0
appVersion: "1.0"
```

**values.yaml** - Конфигурация по умолчанию:

```yaml
replicaCount: 2
image:
  repository: docker.io/scamlux3221/product-service
  tag: latest
service:
  port: 8001
resources:
  limits:
    cpu: 500m
    memory: 512Mi
```

**deployment.yaml** - K8s Deployment и Service:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: { { include "product-service.fullname" . } }
spec:
  replicas: { { .Values.replicaCount } }
  template:
    spec:
      containers:
        - image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env:
            - name: DB_HOST
              value: postgres-service
```

### Использование Helm

**Установка сервиса:**

```bash
helm install order-service helm/order-service/ \
  --namespace agri-platform \
  --create-namespace \
  --values helm/order-service/values.yaml
```

**Обновление с новой версией:**

```bash
helm upgrade order-service helm/order-service/ \
  --set image.tag=v2026.01.22-xyz9999 \
  --namespace agri-platform
```

**Список развернутых Helm releases:**

```bash
helm list --namespace agri-platform
```

## Monitoring Integration

### Prometheus Configuration

**ServiceMonitor** для сбора метрик:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: agri-platform
spec:
  selector:
    matchLabels:
      prometheus: "true"
  endpoints:
    - port: http
      interval: 30s
```

**PrometheusRule** для alerting:

```yaml
- alert: ApiGatewayHighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
  for: 5m
  annotations:
    summary: "API Gateway error rate > 5%"
```

### Loki Configuration

Логи агрегируются в Loki:

```
Приложения (stdout/stderr)
    ↓
Docker logs
    ↓
Loki (StatefulSet)
    ↓
Grafana (визуализация)
```

### Grafana Dashboards

**Datasources:**

- Prometheus (метрики)
- Loki (логи)
- Tempo (трейсинг)

**Типовые графики:**

- Request Rate (requests/sec)
- Error Rate (errors/sec)
- Response Time (latency)
- Pod Status (running/pending/failed)
- Resource Usage (CPU, Memory)
- Log Queries (service logs)

## Deployment Workflow

### Шаг 1: Коммит в main branch

```bash
git push origin main
```

### Шаг 2: GitHub Actions запускает CI

```
CI Workflow
├─ setup: Version = v2026.01.22-abc1234
├─ build[api-gateway]: docker build & push
├─ build[product-service]: docker build & push
├─ ... (остальные сервисы)
└─ security: trivy scan
```

### Шаг 3: GitHub Actions запускает CD

```
CD Workflow
├─ helm upgrade api-gateway:v2026.01.22-abc1234
├─ helm upgrade product-service:v2026.01.22-abc1234
├─ ... (остальные сервисы)
├─ kubectl apply loki.yml
├─ kubectl apply prometheus.yml
├─ kubectl apply grafana.yml
└─ verify: kubectl rollout status
```

### Шаг 4: ArgoCD синхронизирует состояние

```
Git Repository (agri-platform-gitops)
    ↓
ArgoCD watches
    ↓
Desired state matches cluster state
    ↓
Notification sent to Grafana
```

## Команды для управления CI/CD

### Просмотр статуса GitHub Actions

```bash
# Просмотр всех workflow runs
gh run list --workflow ci.yml

# Просмотр деталей конкретного run
gh run view <RUN_ID>

# Просмотр логов
gh run view <RUN_ID> --log
```

### Управление ArgoCD

```bash
# Просмотр статуса приложения
argocd app get agri-platform

# Синхронизировать приложение
argocd app sync agri-platform

# Получить информацию о развертывании
argocd app info agri-platform

# Просмотр истории развертывания
argocd app history agri-platform
```

### Просмотр Kubernetes развертывания

```bash
# Список всех pods
kubectl get pods -n agri-platform

# Просмотр статуса deployment
kubectl rollout status deployment/order-service -n agri-platform

# Просмотр логов pod
kubectl logs -f pod/order-service-xyz123 -n agri-platform

# Просмотр событий
kubectl get events -n agri-platform --sort-by='.lastTimestamp'
```

### Управление Helm releases

```bash
# Список установленных releases
helm list -n agri-platform

# Просмотр значений текущей установки
helm get values order-service -n agri-platform

# Откат к предыдущей версии
helm rollback order-service -n agri-platform

# История releases
helm history order-service -n agri-platform
```

## GitOps Repository Structure

GitOps репозиторий (agri-platform-gitops) должен содержать:

```
agri-platform-gitops/
├── services/
│   ├── api-gateway/
│   │   ├── kustomization.yaml
│   │   └── deployment.yaml
│   ├── product-service/
│   ├── order-service/
│   └── ... (остальные)
├── monitoring/
│   ├── prometheus.yaml
│   ├── loki.yaml
│   └── grafana.yaml
├── infrastructure/
│   ├── namespace.yaml
│   ├── rbac.yaml
│   └── network-policy.yaml
└── argocd/
    └── application.yaml
```

## Troubleshooting

### Сервис не развертывается

```bash
# 1. Проверить ArgoCD статус
argocd app get agri-platform

# 2. Проверить Kubernetes события
kubectl describe deployment order-service -n agri-platform

# 3. Проверить pod логи
kubectl logs -f deployment/order-service -n agri-platform

# 4. Проверить образ доступен
docker pull docker.io/scamlux3221/order-service:latest

# 5. Проверить Helm values
helm get values order-service -n agri-platform
```

### GitHub Actions workflow падает

```bash
# Просмотр деталей ошибки
gh run view <RUN_ID> --log

# Проверить Docker Hub credentials
echo $DOCKER_USERNAME
echo $DOCKER_PASSWORD

# Проверить имя образа
docker images | grep scamlux3221
```

### Prometheus alerts не срабатывают

```bash
# Доступ к Prometheus
kubectl port-forward svc/prometheus 9090:9090 -n monitoring

# Проверить ServiceMonitor
kubectl get servicemonitor -n agri-platform

# Проверить targets в Prometheus UI
# http://localhost:9090/targets

# Проверить alert rules
kubectl get prometheusrule -n agri-platform
```

## Best Practices

### 1. Version Management

- Используйте semantic versioning: v1.2.3
- GitHub Actions автоматически генерирует версии
- Теги на main branch: v2026.01.22-abc1234
- Теги на feature branches: feature-xyz-abc1234

### 2. Resource Limits

```yaml
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### 3. Health Checks

```yaml
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
```

### 4. Security

- Non-root users (uid: 1000)
- Read-only root filesystem
- No privilege escalation
- Pod security policies

### 5. Monitoring

- Prometheus аннотации на всех сервисах
- Alert rules для критичных метрик
- Grafana dashboards для визуализации
- Loki интеграция для логов

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Loki Documentation](https://grafana.com/docs/loki/)
