#!/bin/bash

################################################################################
# Agri Platform - Complete Setup & Deploy Script
# 
# This script sets up the complete development/demo environment:
# - Kubernetes cluster with Kind
# - All microservices
# - Monitoring stack (Prometheus, Loki, Grafana)
# - ArgoCD for GitOps
# - Applications accessible via port-forward
#
# Usage: ./start.sh [local|k8s|all]
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICES_DIR="$PROJECT_DIR/services"
WEB_DIR="$PROJECT_DIR/web"

# Configuration
DOCKER_REGISTRY="scamlux3221"
DOCKER_TAG="${TAG:-latest}"
KUBE_VERSION="1.27"
DEMO_MODE="${1:-all}"

print_header() {
  echo -e "\n${BLUE}════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}════════════════════════════════════════════════════════${NC}\n"
}

print_success() {
  echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${RED}✗ $1${NC}"
}

print_info() {
  echo -e "${YELLOW}▶ $1${NC}"
}

# Check prerequisites
check_requirements() {
  print_header "Checking Prerequisites"

  local missing=()

  # Docker required for all modes
  command -v docker &> /dev/null || missing+=("docker")

  # Kubernetes tools only needed for k8s mode
  if [ "$DEMO_MODE" != "local" ]; then
    command -v kubectl &> /dev/null || missing+=("kubectl")
    command -v helm &> /dev/null || missing+=("helm")
    command -v kind &> /dev/null || missing+=("kind")
  fi

  if [ ${#missing[@]} -gt 0 ]; then
    print_error "Missing required tools: ${missing[*]}"
    print_info "Install them and try again"
    exit 1
  fi

  print_success "All prerequisites installed"
}

# Setup local development (Docker Compose with Registry)
setup_local() {
  print_header "Setting Up Local Development (Docker Compose with Registry)"

  cd "$PROJECT_DIR"

  if [ ! -f "docker-compose.registry.yml" ]; then
    print_error "docker-compose.registry.yml not found!"
    exit 1
  fi

  print_info "Starting Docker Compose stack (TAG=$DOCKER_TAG)..."
  TAG="$DOCKER_TAG" docker-compose -f docker-compose.registry.yml down -v 2>/dev/null || true
  TAG="$DOCKER_TAG" docker-compose -f docker-compose.registry.yml up -d

  sleep 5

  print_success "Docker Compose stack started"
  print_info "Services available at:"
  echo "  - Web:        http://localhost:3000"
  echo "  - API:        http://localhost:8000"
  echo "  - Swagger:    http://localhost:8080"
  echo "  - Grafana:    http://localhost:3001 (admin/admin)"
  echo "  - Prometheus: http://localhost:9090"
  echo ""
  print_info "Deployed Version: $DOCKER_TAG"
  echo "  To rollback: ./rollback.sh deploy <version>"
  echo "  To list versions: ./rollback.sh list"
}

# Setup Kubernetes cluster
setup_kubernetes() {
  print_header "Setting Up Kubernetes Cluster (Kind)"

  # Create Kind cluster
  if ! kind get clusters | grep -q "^agri-platform$"; then
    print_info "Creating Kind cluster..."
    kind create cluster \
      --name agri-platform \
      --image kindest/node:v${KUBE_VERSION} \
      --config - <<EOF
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 80
    hostPort: 80
    listenAddress: "127.0.0.1"
  - containerPort: 443
    hostPort: 443
    listenAddress: "127.0.0.1"
  - containerPort: 3000
    hostPort: 3000
    listenAddress: "127.0.0.1"
  - containerPort: 8000
    hostPort: 8000
    listenAddress: "127.0.0.1"
  - containerPort: 8080
    hostPort: 8080
    listenAddress: "127.0.0.1"
  - containerPort: 3001
    hostPort: 3001
    listenAddress: "127.0.0.1"
EOF
  else
    print_success "Kind cluster 'agri-platform' already exists"
  fi

  kubectl cluster-info --context kind-agri-platform
  print_success "Kubernetes cluster ready"
}

# Build and push Docker images
build_images() {
  print_header "Building Docker Images"

  local services=("api-gateway" "order-service" "inventory-service" "payment-service" "query-service" "web")

  for service in "${services[@]}"; do
    print_info "Building $service..."

    if [ "$service" == "web" ]; then
      docker build -t "$DOCKER_REGISTRY/$service:latest" "$WEB_DIR"
    else
      docker build -t "$DOCKER_REGISTRY/$service:latest" "$SERVICES_DIR/$service"
    fi

    print_success "Built $service"
  done

  print_success "All images built"
}

# Load images into Kind cluster
load_images_to_kind() {
  print_header "Loading Images into Kind Cluster"

  local services=("api-gateway" "order-service" "inventory-service" "payment-service" "query-service" "web")

  for service in "${services[@]}"; do
    print_info "Loading $service..."
    kind load docker-image "$DOCKER_REGISTRY/$service:latest" --name agri-platform
    print_success "Loaded $service"
  done

  print_success "All images loaded to Kind"
}

# Deploy with Helm
deploy_helm() {
  print_header "Deploying with Helm"

  # Add Helm repositories
  print_info "Adding Helm repositories..."
  helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
  helm repo add grafana https://grafana.github.io/helm-charts
  helm repo add loki https://grafana.github.io/loki/charts
  helm repo update

  # Create namespaces
  kubectl create namespace agri-platform --dry-run=client -o yaml | kubectl apply -f -
  kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -
  kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -

  # Deploy Prometheus
  print_info "Deploying Prometheus..."
  helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace monitoring \
    --values helm/monitoring/prometheus-values.yaml \
    --wait

  # Deploy Loki
  print_info "Deploying Loki..."
  helm install loki grafana/loki-stack \
    --namespace monitoring \
    --values helm/monitoring/loki-values.yaml \
    --wait

  # Deploy Grafana
  print_info "Deploying Grafana..."
  helm install grafana grafana/grafana \
    --namespace monitoring \
    --values helm/monitoring/grafana-values.yaml \
    --wait

  # Deploy ArgoCD
  print_info "Deploying ArgoCD..."
  helm install argocd argo/argo-cd \
    --namespace argocd \
    --create-namespace \
    --wait 2>/dev/null || helm upgrade argocd argo/argo-cd --namespace argocd

  # Deploy applications
  print_info "Deploying Agri Platform..."
  helm install agri-platform helm/agri-platform \
    --namespace agri-platform \
    --values helm/values.yaml \
    --wait

  print_success "Helm deployment complete"
}

# Setup port forwarding
setup_port_forwarding() {
  print_header "Setting Up Port Forwarding"

  print_info "Web:     kubectl port-forward -n agri-platform svc/web 3000:3000 &"
  print_info "API:     kubectl port-forward -n agri-platform svc/api-gateway 8000:8000 &"
  print_info "Grafana: kubectl port-forward -n monitoring svc/grafana 3001:80 &"
  print_info "ArgoCD:  kubectl port-forward -n argocd svc/argocd-server 8443:443 &"

  kubectl port-forward -n agri-platform svc/web 3000:3000 &
  kubectl port-forward -n agri-platform svc/api-gateway 8000:8000 &
  kubectl port-forward -n monitoring svc/grafana 3001:80 &
  kubectl port-forward -n argocd svc/argocd-server 8443:443 &

  sleep 3
  print_success "Port forwarding established"
}

# Show access information
show_access_info() {
  print_header "🚀 Agri Platform is Ready!"

  echo -e "${GREEN}Access URLs:${NC}"
  echo "  Web Application:  http://localhost:3000"
  echo "  API Gateway:      http://localhost:8000"
  echo "  Swagger Docs:     http://localhost:8080"
  echo "  Grafana:          http://localhost:3001  (admin/admin)"
  echo "  ArgoCD:           https://localhost:8443"
  echo ""
  echo -e "${GREEN}Default Credentials:${NC}"
  echo "  Grafana:   admin / admin"
  echo "  ArgoCD:    admin / <auto-generated>"
  echo ""
  echo -e "${GREEN}Useful Commands:${NC}"
  echo "  kubectl get pods -n agri-platform           # View pods"
  echo "  kubectl logs -n agri-platform <pod>         # View logs"
  echo "  kubectl port-forward -n agri-platform svc/web 3000:3000   # Manual forward"
  echo "  docker-compose logs -f                      # Local: View compose logs"
  echo "  docker-compose down                         # Local: Stop stack"
  echo "  kind delete cluster --name agri-platform    # K8s: Delete cluster"
  echo ""
  echo -e "${YELLOW}💡 Next Steps:${NC}"
  echo "  1. Open http://localhost:3000 in browser"
  echo "  2. Create an order from the form"
  echo "  3. Check order status in dashboard"
  echo "  4. Monitor with Grafana (http://localhost:3001)"
  echo "  5. View Git history: github.com/scamlux/test"
}

# Main execution
main() {
  print_header "Agri Platform Setup"
  echo "Mode: $DEMO_MODE"
  echo "Registry: $DOCKER_REGISTRY"
  echo "Project: $(basename $PROJECT_DIR)"

  check_requirements

  case "$DEMO_MODE" in
    local)
      setup_local
      ;;
    k8s)
      setup_kubernetes
      build_images
      load_images_to_kind
      deploy_helm
      setup_port_forwarding
      ;;
    all)
      setup_local
      print_info "Local stack running at http://localhost:3000"
      print_info ""
      print_info "To also deploy to Kubernetes:"
      print_info "  ./start.sh k8s"
      ;;
    *)
      print_error "Unknown mode: $DEMO_MODE"
      echo "Usage: ./start.sh [local|k8s|all]"
      exit 1
      ;;
  esac

  show_access_info
}

# Cleanup on interrupt
trap 'print_error "Setup interrupted"; exit 1' INT TERM

main "$@"
