import api from './api';

const orderService = {
  getAll: async (filters) => {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  addItems: async (orderId, items) => {
    const response = await api.post(`/orders/${orderId}/items`, { items });
    return response.data;
  },

  updateItem: async (orderId, itemId, data) => {
    const response = await api.put(`/orders/${orderId}/items/${itemId}`, data);
    return response.data;
  },

  removeItem: async (orderId, itemId) => {
    const response = await api.delete(`/orders/${orderId}/items/${itemId}`);
    return response.data;
  },

  close: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/close`);
    return response.data;
  },

  cancel: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/cancel`);
    return response.data;
  },
};

export default orderService;
