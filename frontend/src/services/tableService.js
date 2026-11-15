import api from './api';

const tableService = {
  getAll: async () => {
    const response = await api.get('/tables');
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tables', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tables/${id}`, data);
    return response.data;
  },

  remove: async (id) => {
    const response = await api.delete(`/tables/${id}`);
    return response.data;
  },
};

export default tableService;
