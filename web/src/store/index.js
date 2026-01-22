import { create } from "zustand";
import { productAPI, orderAPI, deliveryAPI } from "../api/client";

export const useProductStore = create((set) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await productAPI.getAll();
      set({ products: response.data.data || [] });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await productAPI.create(productData);
      set((state) => ({
        products: [...state.products, response.data.data],
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const response = await productAPI.update(id, productData);
      set((state) => ({
        products: state.products.map((p) =>
          p.id === id ? response.data.data : p,
        ),
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteProduct: async (id) => {
    try {
      await productAPI.delete(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));

export const useOrderStore = create((set) => ({
  orders: [],
  selectedOrder: null,
  loading: false,
  error: null,

  fetchOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await orderAPI.getAll();
      set({ orders: Array.isArray(response.data) ? response.data : [] });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createOrder: async (orderData) => {
    try {
      const response = await orderAPI.create(orderData);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  setSelectedOrder: (order) => set({ selectedOrder: order }),
}));

export const useDeliveryStore = create((set) => ({
  deliveries: {},
  loading: false,
  error: null,

  getDelivery: async (orderId) => {
    set({ loading: true, error: null });
    try {
      const response = await deliveryAPI.getById(orderId);
      set((state) => ({
        deliveries: {
          ...state.deliveries,
          [orderId]: response.data.data,
        },
      }));
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      return null;
    } finally {
      set({ loading: false });
    }
  },

  startDelivery: async (deliveryId) => {
    try {
      const response = await deliveryAPI.start(deliveryId);
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  confirmDelivery: async (deliveryId, data) => {
    try {
      const response = await deliveryAPI.confirm(deliveryId, data);
      return response.data.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
