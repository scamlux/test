FROM node:18-alpine

WORKDIR /app

# Copy shared dependencies first
COPY services/shared ../shared
WORKDIR /shared
RUN npm install --omit=dev

# Copy and install service dependencies
WORKDIR /app
COPY services/product-service/package*.json ./
RUN npm install --omit=dev

COPY services/product-service .

EXPOSE 8003

CMD ["node", "index.js"]
