import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// PRODUCT APIs
export const productAPI = {
  getAll: () => apiClient.get("/products"),
  getById: (id) => apiClient.get(`/products/${id}`),
  create: (data) => apiClient.post("/products", data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

// ORDER APIs
export const orderAPI = {
  getAll: () => apiClient.get("/orders"),
  getById: (id) => apiClient.get(`/orders/${id}`),
  create: (data) => apiClient.post("/orders", data),
};

// DELIVERY APIs
export const deliveryAPI = {
  getById: (id) => apiClient.get(`/deliveries/${id}`),
  create: (data) => apiClient.post("/deliveries", data),
  start: (id) => apiClient.post(`/deliveries/${id}/start`),
  confirm: (id, data) => apiClient.post(`/deliveries/${id}/confirm`, data),
};

// LOGS APIs
export const logsAPI = {
  getAll: (limit = 100) => apiClient.get(`/logs?limit=${limit}`),
  getByService: (service, limit = 50) =>
    apiClient.get(`/logs/${service}?limit=${limit}`),
};

export default apiClient;
