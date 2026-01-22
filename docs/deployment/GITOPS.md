# GitOps Repository Setup

Это руководство по настройке отдельного GitOps репозитория для Agri Platform, который используется ArgoCD для управления развертыванием.

## Repository Structure

Создайте новый репозиторий `agri-platform-gitops` с следующей структурой:

```
agri-platform-gitops/
├── services/
│   ├── api-gateway/
│   │   ├── kustomization.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   ├── product-service/
│   ├── order-service/
│   ├── delivery-service/
│   ├── query-service/
│   ├── inventory-service/
│   ├── payment-service/
│   └── web/
├── monitoring/
│   ├── kustomization.yaml
│   ├── prometheus.yaml
│   ├── loki.yaml
│   ├── grafana.yaml
│   └── alerts.yaml
├── infrastructure/
│   ├── namespace.yaml
│   ├── rbac.yaml
│   ├── network-policy.yaml
│   ├── secrets.yaml
│   └── storage.yaml
├── argocd/
│   ├── notifications.yaml
│   ├── rbac.yaml
│   └── argocd-config.yaml
├── kustomization.yaml
├── README.md
└── .gitignore
```

## Setup Instructions

### 1. Create Repository

```bash
# Create new directory
mkdir agri-platform-gitops
cd agri-platform-gitops

# Initialize git
git init
git config user.email "your-email@example.com"
git config user.name "Your Name"
```

### 2. Create Directory Structure

```bash
# Create directories
mkdir -p services/{api-gateway,product-service,order-service,delivery-service,query-service,inventory-service,payment-service,web}
mkdir -p monitoring
mkdir -p infrastructure
mkdir -p argocd

# Create root kustomization.yaml
cat > kustomization.yaml << 'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - services
  - monitoring
  - infrastructure

namespaces:
  - agri-platform
  - monitoring

commonLabels:
  app.kubernetes.io/part-of: agri-platform
  app.kubernetes.io/managed-by: argocd
EOF
```

### 3. Create Services Configuration

Each service directory should contain:

**services/api-gateway/kustomization.yaml:**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: agri-platform

replicas:
  - name: api-gateway
    count: 3

images:
  - name: api-gateway
    newTag: latest

resources:
  - deployment.yaml
  - service.yaml

patches:
  - target:
      kind: Deployment
    patch: |-
      - op: replace
        path: /spec/template/spec/containers/0/image
        value: docker.io/scamlux3221/api-gateway:latest
```

**services/api-gateway/deployment.yaml:**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  labels:
    app: api-gateway
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
          image: docker.io/scamlux3221/api-gateway:latest
          ports:
            - containerPort: 8000
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
          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
          env:
            - name: NODE_ENV
              value: production
            - name: DB_HOST
              value: postgres-service
            - name: KAFKA_BROKERS
              value: kafka-service:9092
```

**services/api-gateway/service.yaml:**

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  labels:
    app: api-gateway
spec:
  type: ClusterIP
  ports:
    - port: 8000
      targetPort: 8000
  selector:
    app: api-gateway
```

### 4. Create Monitoring Configuration

**monitoring/kustomization.yaml:**

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: monitoring

resources:
  - prometheus.yaml
  - loki.yaml
  - grafana.yaml
  - alerts.yaml

commonLabels:
  app.kubernetes.io/part-of: monitoring-stack
```

### 5. Create Infrastructure

**infrastructure/namespace.yaml:**

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: agri-platform
  labels:
    name: agri-platform
---
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
```

**infrastructure/rbac.yaml:**

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: agri-platform
  namespace: agri-platform
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: agri-platform
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: edit
subjects:
  - kind: ServiceAccount
    name: agri-platform
    namespace: agri-platform
```

### 6. Create ArgoCD Application

**argocd/application.yaml:**

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: agri-platform
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/agri-platform-gitops.git
    targetRevision: main
    path: .
    plugin:
      name: kustomize
  destination:
    server: https://kubernetes.default.svc
    namespace: agri-platform
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
```

### 7. Commit and Push

```bash
# Add all files
git add .
git commit -m "Initial GitOps repository structure"

# Create main branch
git branch -M main

# Add remote
git remote add origin https://github.com/yourusername/agri-platform-gitops.git

# Push to GitHub
git push -u origin main
```

## Configure ArgoCD

### 1. Add Repository to ArgoCD

```bash
# Port-forward to ArgoCD
kubectl port-forward svc/argocd-server 8080:443 -n argocd

# Add repository (default password is Pod name of argocd-server)
argocd repo add https://github.com/yourusername/agri-platform-gitops.git \
  --username yourusername \
  --password ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Create Application

```bash
argocd app create agri-platform \
  --repo https://github.com/yourusername/agri-platform-gitops.git \
  --path . \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace agri-platform \
  --auto-prune \
  --self-heal
```

### 3. Sync Application

```bash
argocd app sync agri-platform
```

## Image Management

To update service images from CI/CD pipeline, use `kustomize` patches:

**Update Script** (`.github/workflows/update-images.yml`):

```yaml
name: Update Images

on:
  workflow_run:
    workflows: ["CI - Build & Push"]
    types: [completed]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          repository: yourusername/agri-platform-gitops
          token: ${{ secrets.GITOPS_REPO_TOKEN }}

      - name: Update images
        run: |
          # Get version from artifact
          VERSION=${{ github.event.workflow_run.head_commit }}

          # Update all service images
          kustomize edit set image api-gateway=docker.io/scamlux3221/api-gateway:${VERSION}
          kustomize edit set image order-service=docker.io/scamlux3221/order-service:${VERSION}
          # ... other services

          git add kustomization.yaml
          git commit -m "Update images to ${VERSION}"
          git push
```

## Rollback Strategy

To rollback to previous version:

```bash
# View history
argocd app history agri-platform

# Rollback to revision N
argocd app rollback agri-platform N

# Or use git
git revert <commit-hash>
git push
# ArgoCD will sync automatically
```

## Secret Management

Use `sealed-secrets` or `external-secrets` for sensitive data:

**Example with sealed-secrets:**

```bash
# Create sealed secret
echo -n admin | kubectl create secret generic db-secret \
  --dry-run=client \
  --from-file=password=/dev/stdin \
  -o yaml | kubeseal -o yaml > infrastructure/secrets.yaml

# Commit sealed secret (it's encrypted)
git add infrastructure/secrets.yaml
git commit -m "Add encrypted secrets"
git push
```

## Monitoring

Check ArgoCD UI for sync status:

```bash
# Access ArgoCD
kubectl port-forward svc/argocd-server 8080:443 -n argocd

# Open browser: https://localhost:8080
# Username: admin
# Password: kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

## References

- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Kustomize Documentation](https://kustomize.io/)
- [Sealed Secrets](https://github.com/bitnami-labs/sealed-secrets)
- [Best Practices](https://argo-cd.readthedocs.io/en/stable/operator-manual/application.yaml/)
