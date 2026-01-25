#!/bin/bash

################################################################################
# Agri Platform - Rollback Management Script
# 
# This script helps you:
# - List available versions for rollback
# - Rollback to a specific version
# - Manage deployment history
#
# Usage:
#   ./rollback.sh list                  # List available versions
#   ./rollback.sh deploy <version>      # Deploy/rollback to specific version
#   ./rollback.sh current               # Show current deployed version
#   ./rollback.sh compare <v1> <v2>     # Compare two versions
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_REGISTRY="scamlux3221"
DEPLOYMENT_LOG="$PROJECT_DIR/.deployment-history"

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

# Initialize deployment history file
init_history() {
  if [ ! -f "$DEPLOYMENT_LOG" ]; then
    echo "# Agri Platform Deployment History" > "$DEPLOYMENT_LOG"
    echo "# Format: TIMESTAMP | VERSION | STATUS" >> "$DEPLOYMENT_LOG"
  fi
}

# List all available image versions
list_versions() {
  print_header "Available Image Versions"
  
  local services=(
    "api-gateway"
    "product-service"
    "order-service"
    "inventory-service"
    "payment-service"
    "delivery-service"
    "query-service"
    "web"
  )

  echo -e "${BLUE}Local Docker Images:${NC}\n"
  
  for service in "${services[@]}"; do
    echo "Service: $service"
    docker images "$DOCKER_REGISTRY/$service" --format "  {{.Tag}}\t{{.CreatedAt}}" 2>/dev/null | head -10 || echo "  (no images found)"
    echo ""
  done

  print_header "Deployment History"
  if [ -f "$DEPLOYMENT_LOG" ]; then
    tail -20 "$DEPLOYMENT_LOG"
  else
    echo "No deployment history yet"
  fi
}

# Get current deployed version
get_current_version() {
  if [ -f "$DEPLOYMENT_LOG" ]; then
    # Get last successful deployment
    grep "DEPLOYED" "$DEPLOYMENT_LOG" | tail -1 | awk '{print $3}'
  else
    echo "unknown"
  fi
}

# Deploy/rollback to specific version
deploy_version() {
  local version="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  
  print_header "Deploying Version: $version"
  
  # Pull images if needed
  local missing=0
  local services=(
    "api-gateway"
    "product-service"
    "order-service"
    "inventory-service"
    "payment-service"
    "delivery-service"
    "query-service"
    "web"
  )

  for service in "${services[@]}"; do
    if ! docker inspect "$DOCKER_REGISTRY/$service:$version" > /dev/null 2>&1; then
      print_info "Pulling $service:$version from registry..."
      docker pull "$DOCKER_REGISTRY/$service:$version" 2>/dev/null || {
        print_error "Image not found: $DOCKER_REGISTRY/$service:$version"
        missing=$((missing + 1))
      }
    fi
  done

  if [ $missing -gt 0 ]; then
    print_error "$missing image(s) missing for version $version"
    print_info "You need to build and push version $version first:"
    echo "  ./build-and-push.sh $version $DOCKER_REGISTRY"
    return 1
  fi

  print_success "All images ready for version $version"
  print_info "Pulling and starting containers..."

  cd "$PROJECT_DIR"
  
  # Stop current deployment
  print_info "Stopping current deployment..."
  docker-compose -f docker-compose.registry.yml down 2>/dev/null || true
  
  # Deploy new version
  print_info "Starting version $version..."
  TAG="$version" docker-compose -f docker-compose.registry.yml up -d
  
  sleep 5
  
  # Log deployment
  init_history
  echo "$timestamp | $version | DEPLOYED" >> "$DEPLOYMENT_LOG"
  
  print_success "Version $version deployed successfully!"
  print_info "Services will be available at:"
  echo "  - Web:        http://localhost:3000"
  echo "  - API:        http://localhost:8000"
  echo "  - Swagger:    http://localhost:8080"
  echo "  - Grafana:    http://localhost:3001 (admin/admin)"
}

# Show current deployment status
show_current() {
  print_header "Current Deployment Status"
  
  local current_version=$(get_current_version)
  echo "Current Version: $current_version"
  echo ""
  
  print_info "Running Containers:"
  docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}" | grep -E "api-gateway|product|order|inventory|payment|delivery|query|web" || echo "  (no services running)"
  
  echo ""
  print_info "Recent Deployments:"
  if [ -f "$DEPLOYMENT_LOG" ]; then
    tail -5 "$DEPLOYMENT_LOG"
  fi
}

# Compare two versions
compare_versions() {
  local v1="$1"
  local v2="$2"
  
  if [ -z "$v1" ] || [ -z "$v2" ]; then
    print_error "Usage: ./rollback.sh compare <version1> <version2>"
    exit 1
  fi

  print_header "Comparing Versions: $v1 vs $v2"
  
  local services=(
    "api-gateway"
    "product-service"
    "order-service"
    "inventory-service"
    "payment-service"
    "delivery-service"
    "query-service"
    "web"
  )

  echo -e "${BLUE}Service Comparison:${NC}\n"
  printf "%-30s %-20s %-20s\n" "Service" "Version 1" "Version 2"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  
  for service in "${services[@]}"; do
    local exists_v1=$(docker inspect "$DOCKER_REGISTRY/$service:$v1" > /dev/null 2>&1 && echo "✓" || echo "✗")
    local exists_v2=$(docker inspect "$DOCKER_REGISTRY/$service:$v2" > /dev/null 2>&1 && echo "✓" || echo "✗")
    printf "%-30s %-20s %-20s\n" "$service" "$exists_v1" "$exists_v2"
  done
}

# Main
main() {
  local command="${1:-list}"
  
  case "$command" in
    list)
      list_versions
      ;;
    deploy)
      if [ -z "$2" ]; then
        print_error "Usage: ./rollback.sh deploy <version>"
        echo "Example: ./rollback.sh deploy 1.0.0"
        exit 1
      fi
      deploy_version "$2"
      ;;
    current)
      show_current
      ;;
    compare)
      compare_versions "$2" "$3"
      ;;
    *)
      print_error "Unknown command: $command"
      echo ""
      echo "Usage:"
      echo "  ./rollback.sh list              # List available versions"
      echo "  ./rollback.sh deploy <version>  # Deploy/rollback to version"
      echo "  ./rollback.sh current           # Show current deployment"
      echo "  ./rollback.sh compare <v1> <v2> # Compare versions"
      exit 1
      ;;
  esac
}

main "$@"
