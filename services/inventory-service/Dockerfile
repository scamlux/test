FROM node:20-alpine

WORKDIR /app

# Copy shared dependencies first
COPY shared ../shared
WORKDIR /shared
RUN npm install --omit=dev

# Copy and install service dependencies
WORKDIR /app
COPY services/inventory-service/package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
