FROM node:20-alpine

WORKDIR /app

COPY services/auth-service/package*.json ./

RUN npm install --omit=dev

COPY services/auth-service ./

EXPOSE 8005

CMD ["node", "index.js"]
