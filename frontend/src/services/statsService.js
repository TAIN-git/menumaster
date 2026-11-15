import api from './api';

const statsService = {
  getDashboard: async () => {
    const response = await api.get('/stats/dashboard');
    return response.data;
  },

  getTopDishes: async (days) => {
    const params = days ? { days } : {};
    const response = await api.get('/stats/top-dishes', { params });
    return response.data;
  },
};

export default statsService;
