# Helm Charts Overview

## Introduction

Helm charts are Kubernetes package templates that define how applications are deployed to Kubernetes clusters. Agri Platform uses Helm to manage deployments for all 8 services.

## Chart Structure

Each Helm chart follows this standard structure:

```
helm/SERVICE_NAME/
├── Chart.yaml              # Chart metadata and version
├── values.yaml              # Default configuration values
├── templates/
│   ├── deployment.yaml      # Kubernetes Deployment, Service, HPA
│   └── _helpers.tpl         # Helm template helper functions
```

## Services & Charts

### 1. API Gateway (`helm/api-gateway/`)

**Purpose**: Main entry point for all requests  
**Replicas**: 3 (default), scales to 2-10 based on CPU/memory  
**Port**: 8000  
**Dependencies**: PostgreSQL, Kafka, MongoDB

**Key Configuration**:

```yaml
replicaCount: 3
service:
  port: 8000
resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits: { cpu: 500m, memory: 512Mi }
autoscaling: { minReplicas: 2, maxReplicas: 10 }
```

### 2. Product Service (`helm/product-service/`)

**Purpose**: Product catalog management  
**Replicas**: 2  
**Port**: 8001  
**Dependencies**: PostgreSQL, Kafka, Redis

### 3. Order Service (`helm/order-service/`)

**Purpose**: Order processing and management  
**Replicas**: 3 (critical service)  
**Port**: 8002  
**Dependencies**: PostgreSQL, Kafka, MongoDB  
**Special Features**: Idempotency store, outbox pattern

### 4. Inventory Service (`helm/inventory-service/`)

**Purpose**: Stock management  
**Replicas**: 2  
**Port**: 8003  
**Dependencies**: PostgreSQL, Kafka

### 5. Delivery Service (`helm/delivery-service/`)

**Purpose**: Delivery tracking  
**Replicas**: 2  
**Port**: 8004  
**Dependencies**: PostgreSQL, Kafka, MongoDB

### 6. Query Service (`helm/query-service/`)

**Purpose**: Read model for queries  
**Replicas**: 2  
**Port**: 8005  
**Dependencies**: PostgreSQL, Kafka, MongoDB

### 7. Payment Service (`helm/payment-service/`)

**Purpose**: Payment processing  
**Replicas**: 1  
**Port**: 8006  
**Dependencies**: Kafka, MongoDB, Stripe API

### 8. Web Frontend (`helm/web/`)

**Purpose**: React UI  
**Replicas**: 3  
**Port**: 80  
**Type**: LoadBalancer or Ingress  
**Dependencies**: API Gateway

## Helm Commands

### Install Service

```bash
# Install with default values
helm install api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --create-namespace

# Install with custom values
helm install api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --values custom-values.yaml

# Install and wait for deployment
helm install api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --wait \
  --timeout 5m
```

### Update Service

```bash
# Upgrade with new image tag
helm upgrade api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --set image.tag=v2026.01.22-abc1234 \
  --wait

# Dry-run to see what will change
helm upgrade api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --set image.tag=v2026.01.22-abc1234 \
  --dry-run \
  --debug
```

### Rollback Service

```bash
# Rollback to previous release
helm rollback api-gateway -n agri-platform

# Rollback to specific revision
helm rollback api-gateway 2 -n agri-platform

# View history
helm history api-gateway -n agri-platform
```

### Verify Deployment

```bash
# List all releases
helm list -n agri-platform

# Get values of current release
helm get values api-gateway -n agri-platform

# Get all manifests that were applied
helm get manifest api-gateway -n agri-platform

# Test release
helm test api-gateway -n agri-platform
```

## values.yaml Structure

Each chart's `values.yaml` contains:

```yaml
# Deployment settings
replicaCount: 2
image:
  repository: docker.io/scamlux3221/product-service
  tag: latest

# Service configuration
service:
  type: ClusterIP
  port: 8001
  targetPort: 8001

# Resource limits
resources:
  requests:
    cpu: 250m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi

# Auto-scaling
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 8
  targetCPUUtilizationPercentage: 70

# Environment variables
env:
  - name: NODE_ENV
    value: production
  - name: DB_HOST
    value: postgres-service
  - name: KAFKA_BROKERS
    value: kafka-service:9092

# Health checks
livenessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8001
  initialDelaySeconds: 10
  periodSeconds: 5
```

## Template Variables

Templates use Helm templating syntax to reference values:

```yaml
# In templates/deployment.yaml
metadata:
  name: { { include "product-service.fullname" . } }
  labels: { { - include "product-service.labels" . | nindent 4 } }

spec:
  replicas: { { .Values.replicaCount } }
  selector:
    matchLabels:
      { { - include "product-service.selectorLabels" . | nindent 6 } }

  template:
    spec:
      containers:
        - name: { { .Chart.Name } }
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          env: { { - toYaml .Values.env | nindent 12 } }
```

## Customization

### Override Values

```bash
# Set individual values
helm install api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --set replicaCount=5 \
  --set image.tag=v2026.01.22-custom

# Use custom values file
helm install api-gateway helm/api-gateway/ \
  --namespace agri-platform \
  --values production-values.yaml
```

### Custom Values File Example

```yaml
# production-values.yaml
replicaCount: 5

image:
  repository: docker.io/company/api-gateway
  tag: v2026.01.22-abc1234

resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1024Mi

autoscaling:
  minReplicas: 5
  maxReplicas: 20
  targetCPUUtilizationPercentage: 60

env:
  - name: LOG_LEVEL
    value: debug
  - name: DB_HOST
    value: prod-postgres.internal
```

## Integration with CI/CD

### GitHub Actions Integration

The CD workflow automatically deploys services using Helm:

```yaml
- name: Deploy services with Helm
  run: |
    helm upgrade --install api-gateway helm/api-gateway/ \
      --namespace agri-platform \
      --set image.tag=${{ github.sha }} \
      --wait
```

### ArgoCD Integration

ArgoCD can manage Helm deployments:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: api-gateway
spec:
  source:
    repoURL: https://github.com/yourusername/agri-platform-gitops.git
    path: helm/api-gateway
    helm:
      releaseName: api-gateway
      values: |
        image:
          tag: v2026.01.22-latest
```

## Common Operations

### Check all running services

```bash
kubectl get all -n agri-platform
kubectl get helm releases -n agri-platform  # requires helm plugin
```

### View service logs

```bash
# Show logs from all pods of a service
kubectl logs -f -l app=api-gateway -n agri-platform

# Follow specific pod
kubectl logs -f deployment/api-gateway -n agri-platform
```

### Scale service manually

```bash
# Scale using kubectl (not recommended with HPA)
kubectl scale deployment api-gateway --replicas=5 -n agri-platform

# Using helm (better approach)
helm upgrade api-gateway helm/api-gateway/ \
  -n agri-platform \
  --set replicaCount=5
```

### Debug deployment

```bash
# Describe deployment
kubectl describe deployment api-gateway -n agri-platform

# Check events
kubectl get events -n agri-platform --sort-by='.lastTimestamp'

# Inspect pod
kubectl debug pod/api-gateway-xyz -n agri-platform -it --image=busybox
```

## Best Practices

1. **Use labels consistently**
   - All resources labeled with `app.kubernetes.io/name` and `app.kubernetes.io/instance`
   - Makes selection and filtering easier

2. **Resource limits**
   - Always set requests and limits
   - Requests: guaranteed resources
   - Limits: maximum resources allowed

3. **Health checks**
   - Liveness probe: when to restart pod
   - Readiness probe: when pod is ready for traffic
   - Both probes should use same endpoint

4. **Security**
   - Run as non-root user (uid: 1000)
   - Read-only root filesystem where possible
   - No privilege escalation

5. **Versioning**
   - Bump chart version when templates change
   - Bump appVersion when app version changes
   - Keep semantic versioning

6. **Testing**
   - Use `helm lint` to validate charts
   - Use `helm template` to preview output
   - Use `helm diff` before upgrades

## Troubleshooting

### Chart validation

```bash
# Lint chart for errors
helm lint helm/api-gateway/

# Preview generated manifests
helm template api-gateway helm/api-gateway/

# Check for API deprecations
helm lint helm/api-gateway/ --strict
```

### Deployment issues

```bash
# Check deployment status
kubectl rollout status deployment/api-gateway -n agri-platform

# View recent changes
helm history api-gateway -n agri-platform

# Get diff between versions
helm diff upgrade api-gateway helm/api-gateway/ -n agri-platform

# Rollback if needed
helm rollback api-gateway -n agri-platform
```

## References

- [Helm Official Documentation](https://helm.sh/docs/)
- [Helm Best Practices](https://helm.sh/docs/chart_best_practices/)
- [Kubernetes Package Management](https://kubernetes.io/docs/concepts/cluster-administration/manage-deployment/#organizing-resource-configurations)
