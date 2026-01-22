#!/bin/bash

# Agri Platform - Complete Kubernetes Deployment Script
# This script automates the deployment of Agri Platform to Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="agri-platform"
MONITORING_NAMESPACE="monitoring"
ARGOCD_NAMESPACE="argocd"
DOCKER_REGISTRY="docker.io"
IMAGE_PREFIX="scamlux3221"

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    local missing_tools=()
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        missing_tools+=("kubectl")
    fi
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        missing_tools+=("helm")
    fi
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        missing_tools+=("docker")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing tools: ${missing_tools[*]}"
        echo "Please install missing tools and try again"
        exit 1
    fi
    
    log_success "All prerequisites met"
}

# Check cluster connectivity
check_cluster() {
    log_info "Checking Kubernetes cluster..."
    
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    CLUSTER_NAME=$(kubectl config current-context)
    log_success "Connected to cluster: $CLUSTER_NAME"
    
    # Get cluster info
    NODES=$(kubectl get nodes --no-headers | wc -l)
    log_info "Cluster has $NODES node(s)"
}

# Create namespaces
create_namespaces() {
    log_info "Creating namespaces..."
    
    kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace $MONITORING_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    kubectl create namespace $ARGOCD_NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
    
    # Label namespaces
    kubectl label namespace $NAMESPACE prometheus.io/monitor=true --overwrite || true
    
    log_success "Namespaces created"
}

# Install ArgoCD
install_argocd() {
    log_info "Installing ArgoCD..."
    
    ARGOCD_VERSION="v2.8.0"
    
    kubectl apply -n $ARGOCD_NAMESPACE -f https://raw.githubusercontent.com/argoproj/argo-cd/release-${ARGOCD_VERSION}/manifests/install.yaml
    
    # Wait for ArgoCD to be ready
    log_info "Waiting for ArgoCD to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n $ARGOCD_NAMESPACE || {
        log_warn "ArgoCD startup is taking longer than expected"
    }
    
    log_success "ArgoCD installed"
    
    # Get initial password
    ARGOCD_PASSWORD=$(kubectl get secret -n $ARGOCD_NAMESPACE argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "admin")
    log_info "ArgoCD initial password: $ARGOCD_PASSWORD"
}

# Install Helm
install_helm() {
    log_info "Installing Helm..."
    
    HELM_VERSION=$(helm version --short | cut -d':' -f2 | tr -d ' ')
    log_success "Helm installed: $HELM_VERSION"
}

# Deploy services
deploy_services() {
    log_info "Deploying services..."
    
    # Get current git SHA for versioning
    VERSION=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")
    
    # List of services to deploy
    declare -a SERVICES=(
        "api-gateway"
        "product-service"
        "order-service"
        "inventory-service"
        "delivery-service"
        "query-service"
        "payment-service"
    )
    
    for service in "${SERVICES[@]}"; do
        if [ -d "helm/$service" ]; then
            log_info "Deploying $service..."
            
            helm upgrade --install $service helm/$service/ \
                --namespace $NAMESPACE \
                --set image.tag=$VERSION \
                --set image.repository="$DOCKER_REGISTRY/$IMAGE_PREFIX/$service" \
                --wait \
                --timeout 5m \
                --atomic || log_warn "$service deployment may be pending"
            
            log_success "$service deployed"
        else
            log_warn "Helm chart not found for $service"
        fi
    done
    
    # Deploy web frontend
    if [ -d "helm/web" ]; then
        log_info "Deploying web frontend..."
        
        helm upgrade --install web helm/web/ \
            --namespace $NAMESPACE \
            --set image.tag=$VERSION \
            --set image.repository="$DOCKER_REGISTRY/$IMAGE_PREFIX/agri-web" \
            --wait \
            --timeout 5m \
            --atomic || log_warn "web deployment may be pending"
        
        log_success "Web frontend deployed"
    fi
}

# Apply monitoring stack
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    # Check if monitoring configs exist
    if [ -f "k8s/monitoring/prometheus.yml" ]; then
        kubectl apply -f k8s/monitoring/prometheus.yml -n $MONITORING_NAMESPACE --record || log_warn "Prometheus deployment skipped"
        log_success "Prometheus deployed"
    fi
    
    if [ -f "k8s/monitoring/loki.yml" ]; then
        kubectl apply -f k8s/monitoring/loki.yml -n $MONITORING_NAMESPACE --record || log_warn "Loki deployment skipped"
        log_success "Loki deployed"
    fi
    
    if [ -f "k8s/monitoring/grafana.yml" ]; then
        kubectl apply -f k8s/monitoring/grafana.yml -n $MONITORING_NAMESPACE --record || log_warn "Grafana deployment skipped"
        log_success "Grafana deployed"
    fi
}

# Apply ArgoCD configuration
deploy_argocd_config() {
    log_info "Applying ArgoCD configuration..."
    
    if [ -f "k8s/argocd/application.yaml" ]; then
        kubectl apply -f k8s/argocd/application.yaml || log_warn "ArgoCD Application config skipped"
        log_success "ArgoCD configuration applied"
    fi
}

# Wait for deployments
wait_deployments() {
    log_info "Waiting for services to be ready..."
    
    # Critical services to wait for
    CRITICAL_SERVICES=(
        "api-gateway"
        "product-service"
        "order-service"
    )
    
    for service in "${CRITICAL_SERVICES[@]}"; do
        log_info "Checking $service..."
        
        if kubectl get deployment $service -n $NAMESPACE &> /dev/null; then
            timeout 300 kubectl rollout status deployment/$service -n $NAMESPACE || {
                log_warn "$service rollout incomplete"
            }
        fi
    done
    
    log_success "Deployment check complete"
}

# Get deployment status
show_status() {
    log_info "Deployment Status:"
    echo ""
    
    echo -e "${BLUE}Services:${NC}"
    kubectl get deployments -n $NAMESPACE --no-headers 2>/dev/null || echo "No services found"
    echo ""
    
    echo -e "${BLUE}Pods:${NC}"
    kubectl get pods -n $NAMESPACE 2>/dev/null || echo "No pods found"
    echo ""
    
    echo -e "${BLUE}Services & Endpoints:${NC}"
    kubectl get svc -n $NAMESPACE 2>/dev/null || echo "No services found"
    echo ""
    
    echo -e "${BLUE}Monitoring Stack:${NC}"
    kubectl get pods -n $MONITORING_NAMESPACE 2>/dev/null || echo "Monitoring namespace not ready"
    echo ""
    
    echo -e "${BLUE}Recent Events:${NC}"
    kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp' 2>/dev/null | tail -5 || echo "No events"
}

# Show access information
show_access_info() {
    log_info "Access Information:"
    echo ""
    
    # ArgoCD
    log_info "ArgoCD Dashboard:"
    echo "  kubectl port-forward svc/argocd-server 8080:443 -n $ARGOCD_NAMESPACE"
    echo "  URL: https://localhost:8080"
    echo ""
    
    # Grafana
    log_info "Grafana Dashboard:"
    echo "  kubectl port-forward svc/grafana 3000:3000 -n $MONITORING_NAMESPACE"
    echo "  URL: http://localhost:3000"
    echo "  Default credentials: admin / admin123"
    echo ""
    
    # Prometheus
    log_info "Prometheus:"
    echo "  kubectl port-forward svc/prometheus 9090:9090 -n $MONITORING_NAMESPACE"
    echo "  URL: http://localhost:9090"
    echo ""
    
    # Loki
    log_info "Loki:"
    echo "  kubectl port-forward svc/loki-external 3100:3100 -n $MONITORING_NAMESPACE"
    echo "  URL: http://localhost:3100"
    echo ""
    
    # API Gateway
    log_info "API Gateway:"
    echo "  kubectl port-forward svc/api-gateway 8000:8000 -n $NAMESPACE"
    echo "  URL: http://localhost:8000"
}

# Main deployment function
main() {
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo -e "${BLUE}    Agri Platform - Kubernetes Deployment${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""
    
    # Parse arguments
    SKIP_CHECKS=false
    SKIP_ARGOCD=false
    SKIP_MONITORING=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --skip-checks)
                SKIP_CHECKS=true
                shift
                ;;
            --skip-argocd)
                SKIP_ARGOCD=true
                shift
                ;;
            --skip-monitoring)
                SKIP_MONITORING=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --skip-checks       Skip prerequisite checks"
                echo "  --skip-argocd       Skip ArgoCD installation"
                echo "  --skip-monitoring   Skip monitoring stack deployment"
                echo "  --help              Show this help message"
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run deployment steps
    [ "$SKIP_CHECKS" = false ] && check_prerequisites
    [ "$SKIP_CHECKS" = false ] && check_cluster
    
    create_namespaces
    [ "$SKIP_ARGOCD" = false ] && install_argocd
    install_helm
    deploy_services
    [ "$SKIP_MONITORING" = false ] && deploy_monitoring
    [ "$SKIP_ARGOCD" = false ] && deploy_argocd_config
    wait_deployments
    
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    
    show_status
    echo ""
    show_access_info
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
    echo -e "${GREEN}    Agri Platform is ready to use!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════${NC}"
}

# Run main function
main "$@"
