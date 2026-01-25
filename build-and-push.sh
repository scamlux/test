#!/bin/bash

################################################################################
# Build & Push Docker Images to Registry & GitHub
# 
# This script:
# - Builds all service images locally
# - Tags them with version and 'latest'
# - Pushes them to Docker Registry
# - Commits version to Git and pushes to GitHub
# - Supports rollback by keeping version history
#
# Usage: ./build-and-push.sh [version] [registry]
# Example: ./build-and-push.sh 1.0.0 scamlux3221
#
# Requires: git configured with GitHub credentials
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
VERSION="${1:-latest}"
REGISTRY="${2:-scamlux3221}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

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

# Check if logged in to Docker Registry
check_docker_login() {
  print_header "Checking Docker Registry Access"
  
  if ! docker info > /dev/null 2>&1; then
    print_error "Docker daemon not running"
    exit 1
  fi

  # Try to push a test image to check authentication
  if ! docker run --rm alpine echo "Docker access OK" > /dev/null 2>&1; then
    print_error "Docker not properly configured"
    print_info "Please ensure Docker is running"
    exit 1
  fi

  print_success "Docker is accessible"
}

# Build and push a service image
build_and_push_service() {
  local service=$1
  local service_dir=$2
  local tag_base="$REGISTRY/$service"

  print_info "Building $service..."
  
  # Build from services directory context so it can access shared folder
  docker build -t "$tag_base:$VERSION" \
               -t "$tag_base:latest" \
               -t "$tag_base:$TIMESTAMP" \
               -f "$service_dir/Dockerfile" \
               "$SERVICES_DIR"
  
  if [ $? -eq 0 ]; then
    print_success "Built $service:$VERSION"
  else
    print_error "Failed to build $service"
    return 1
  fi

  print_info "Pushing $service to registry..."
  
  docker push "$tag_base:$VERSION"
  docker push "$tag_base:latest"
  docker push "$tag_base:$TIMESTAMP"
  
  if [ $? -eq 0 ]; then
    print_success "Pushed $service to $REGISTRY"
  else
    print_error "Failed to push $service"
    return 1
  fi
}

# Build all services
build_all_images() {
  print_header "Building and Pushing All Images"
  
  local services=(
    "api-gateway:$SERVICES_DIR/api-gateway"
    "product-service:$SERVICES_DIR/product-service"
    "order-service:$SERVICES_DIR/order-service"
    "inventory-service:$SERVICES_DIR/inventory-service"
    "payment-service:$SERVICES_DIR/payment-service"
    "delivery-service:$SERVICES_DIR/delivery-service"
    "query-service:$SERVICES_DIR/query-service"
  )

  local failed=0
  
  for service_path in "${services[@]}"; do
    IFS=':' read -r service service_dir <<< "$service_path"
    build_and_push_service "$service" "$service_dir" || failed=$((failed + 1))
  done

  # Build and push web frontend
  print_info "Building web..."
  docker build -t "$REGISTRY/web:$VERSION" \
               -t "$REGISTRY/web:latest" \
               -t "$REGISTRY/web:$TIMESTAMP" \
               -f "$WEB_DIR/Dockerfile" \
               "$WEB_DIR"
  
  if [ $? -eq 0 ]; then
    print_success "Built web:$VERSION"
  else
    print_error "Failed to build web"
    failed=$((failed + 1))
  fi

  print_info "Pushing web to registry..."
  docker push "$REGISTRY/web:$VERSION"
  docker push "$REGISTRY/web:latest"
  docker push "$REGISTRY/web:$TIMESTAMP"

  if [ $failed -gt 0 ]; then
    print_error "$failed images failed to build/push"
    exit 1
  fi

  print_success "All images built and pushed successfully"
}

# List available versions for rollback
list_versions() {
  print_header "Available Image Versions (for rollback)"
  
  echo "Web images:"
  docker images "$REGISTRY/web" --format "table {{.Tag}}\t{{.CreatedAt}}" 2>/dev/null || echo "  (use 'docker images' to check local images)"
  
  echo ""
  echo "Services (example: api-gateway):"
  docker images "$REGISTRY/api-gateway" --format "table {{.Tag}}\t{{.CreatedAt}}" 2>/dev/null || echo "  (use 'docker images' to check local images)"
}

# Commit and push to GitHub
push_to_github() {
  print_header "Pushing to GitHub"
  
  # Check if git is configured
  if ! command -v git &> /dev/null; then
    print_error "Git not installed"
    return 1
  fi
  
  cd "$PROJECT_DIR"
  
  # Create version tag file
  echo "$VERSION" > .version
  
  # Check if there are changes to commit
  if git status --porcelain | grep -q .; then
    print_info "Committing version $VERSION to Git..."
    
    git add .version docker-compose.registry.yml
    git commit -m "Release: Version $VERSION - Docker images pushed to $REGISTRY" || {
      print_info "No changes to commit (already up to date)"
      return 0
    }
    
    # Tag the commit
    git tag -a "v$VERSION" -m "Release version $VERSION" 2>/dev/null || {
      print_info "Tag v$VERSION already exists"
    }
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    git push origin HEAD:$(git rev-parse --abbrev-ref HEAD) 2>/dev/null || {
      print_error "Failed to push to GitHub"
      print_info "Make sure you have GitHub credentials configured:"
      print_info "  git config --global credential.helper osxkeychain"
      return 1
    }
    
    git push origin "v$VERSION" 2>/dev/null || {
      print_info "Tag v$VERSION not pushed (might already exist on remote)"
    }
    
    print_success "Pushed to GitHub successfully"
  else
    print_info "No changes to commit"
  fi
}

# Main
main() {
  echo -e "${BLUE}"
  echo "════════════════════════════════════════════════════════"
  echo "  Agri Platform - Build & Push to Registry & GitHub"
  echo "════════════════════════════════════════════════════════"
  echo -e "${NC}"
  echo "Registry: $REGISTRY"
  echo "Version:  $VERSION"
  echo "Timestamp: $TIMESTAMP"
  echo ""

  check_docker_login
  build_all_images
  list_versions
  push_to_github

  print_success "Done! Use TAG=$VERSION ./start.sh local to deploy"
}

main "$@"
