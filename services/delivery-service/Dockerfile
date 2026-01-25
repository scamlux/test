FROM node:18-alpine

WORKDIR /app

# Copy shared dependencies first
COPY shared ../shared
WORKDIR /shared
RUN npm install --omit=dev

# Copy and install service dependencies
WORKDIR /app
COPY services/delivery-service/package*.json ./
RUN npm install --omit=dev

COPY . .

EXPOSE 8004

CMD ["node", "index.js"]
