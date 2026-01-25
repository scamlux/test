FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY services/query-service/package*.json ./
COPY services/shared ./shared/

# Install dependencies
RUN npm install --omit=dev

# Copy service code
COPY services/query-service ./

EXPOSE 8002
