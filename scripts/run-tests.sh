#!/bin/bash

###############################################################################
# Agri Platform - Run All Tests
# Executes tests for services and frontend with coverage reports
###############################################################################

set -e

COLOR_BLUE='\033[0;34m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${COLOR_BLUE}=====================================${NC}"
echo -e "${COLOR_BLUE}   Agri Platform Test Suite${NC}"
echo -e "${COLOR_BLUE}=====================================${NC}\n"

# Colors for output
print_section() {
  echo -e "\n${COLOR_YELLOW}▶ $1${NC}"
}

print_success() {
  echo -e "${COLOR_GREEN}✓ $1${NC}"
}

print_error() {
  echo -e "${COLOR_RED}✗ $1${NC}"
}

# Test Services
print_section "Testing Services..."

cd services

if [ ! -d "node_modules" ]; then
  echo "Installing service dependencies..."
  npm install --save-dev jest
fi

echo "Running service tests..."
npm test -- --coverage --passWithNoTests 2>&1 | tee test-results.log

SERVICES_EXIT=$?

if [ $SERVICES_EXIT -eq 0 ]; then
  print_success "Service tests passed"
else
  print_error "Service tests failed"
fi

cd ..

# Test Frontend
print_section "Testing Frontend..."

cd web

if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event babel-jest identity-obj-proxy
fi

echo "Running frontend tests..."
npm test -- --coverage --passWithNoTests --watchAll=false 2>&1 | tee test-results.log

FRONTEND_EXIT=$?

if [ $FRONTEND_EXIT -eq 0 ]; then
  print_success "Frontend tests passed"
else
  print_error "Frontend tests failed"
fi

cd ..

# Summary
print_section "Test Summary"

echo ""
echo "Service Tests:  $([ $SERVICES_EXIT -eq 0 ] && echo -e "${COLOR_GREEN}PASSED${NC}" || echo -e "${COLOR_RED}FAILED${NC}")"
echo "Frontend Tests: $([ $FRONTEND_EXIT -eq 0 ] && echo -e "${COLOR_GREEN}PASSED${NC}" || echo -e "${COLOR_RED}FAILED${NC}")"
echo ""

# Open coverage reports
print_section "Coverage Reports"

if command -v open &> /dev/null; then
  echo "Opening coverage reports..."
  open services/coverage/lcov-report/index.html 2>/dev/null || true
  open web/coverage/lcov-report/index.html 2>/dev/null || true
else
  echo "Service coverage: services/coverage/lcov-report/index.html"
  echo "Frontend coverage: web/coverage/lcov-report/index.html"
fi

# Final status
echo ""
echo -e "${COLOR_BLUE}=====================================${NC}"

if [ $SERVICES_EXIT -eq 0 ] && [ $FRONTEND_EXIT -eq 0 ]; then
  print_success "All tests passed!"
  exit 0
else
  print_error "Some tests failed. Check logs above."
  exit 1
fi
