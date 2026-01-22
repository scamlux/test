const axios = require("axios");
const requestLogRepository = require("../domain/RequestLogRepository");

const SERVICE_URLS = {
  "product-service": "http://localhost:8003",
  "order-service": "http://localhost:8001",
  "delivery-service": "http://localhost:8004",
  "query-service": "http://localhost:8002",
};

async function proxyRequest(serviceName, method, path, data = null) {
  const startTime = Date.now();
  const serviceUrl = SERVICE_URLS[serviceName];

  if (!serviceUrl) {
    throw new Error(`Service ${serviceName} not found`);
  }

  try {
    const config = {
      method,
      url: `${serviceUrl}${path}`,
      headers: { "Content-Type": "application/json" },
    };

    if (data && (method === "POST" || method === "PUT")) {
      config.data = data;
    }

    const response = await axios(config);
    const durationMs = Date.now() - startTime;

    await requestLogRepository.log({
      serviceName,
      method,
      endpoint: path,
      statusCode: response.status,
      requestBody: data,
      responseBody: response.data,
      durationMs,
    });

    return response.data;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorStatus = err.response?.status || 500;

    await requestLogRepository.log({
      serviceName,
      method,
      endpoint: path,
      statusCode: errorStatus,
      requestBody: data,
      responseBody: err.response?.data || null,
      durationMs,
      errorMessage: err.message,
    });

    throw err;
  }
}

module.exports = { proxyRequest };
