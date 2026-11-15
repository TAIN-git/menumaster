import api from './api';

const dishService = {
  getAll: async (categoryId) => {
    const params = categoryId ? { categoryId } : {};
    const response = await api.get('/dishes', { params });
    return response.data;
  },

  getAvailable: async () => {
    const response = await api.get('/dishes/available');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/dishes', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/dishes/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/dishes/${id}`);
    return response.data;
  },
};

export default dishService;
