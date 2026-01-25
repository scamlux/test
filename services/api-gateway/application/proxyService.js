const axios = require("axios");
const requestLogRepository = require("../domain/RequestLogRepository");

const SERVICE_URLS = {
  "product-service": `http://${process.env.PRODUCT_SERVICE_HOST || "product-service"}:8003`,
  "order-service": `http://${process.env.ORDER_SERVICE_HOST || "order-service"}:8001`,
  "delivery-service": `http://${process.env.DELIVERY_SERVICE_HOST || "delivery-service"}:8004`,
  "query-service": `http://${process.env.QUERY_SERVICE_HOST || "query-service"}:8002`,
  "auth-service": `http://${process.env.AUTH_SERVICE_HOST || "auth-service"}:8005`,
};

async function proxyRequest(
  serviceName,
  method,
  path,
  data = null,
  authHeader = null,
) {
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

    // Add authorization header if provided
    if (authHeader) {
      config.headers.Authorization = authHeader;
    }

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
