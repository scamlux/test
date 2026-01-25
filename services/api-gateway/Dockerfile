FROM node:20-alpine

WORKDIR /app

# Copy the full services directory to maintain relative paths
COPY services/api-gateway/package*.json ./
RUN npm install --omit=dev

# Copy the service code
COPY services/api-gateway ./

# Create shared-like utilities locally to avoid path issues
RUN mkdir -p /app/shared && \
    echo "module.exports = { v4: () => require('uuid').v4() };" > /app/shared/uuid-helper.js

EXPOSE 8000

CMD ["node", "index.js"]
