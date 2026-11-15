import api from './api';

const kitchenService = {
  getQueue: async () => {
    const response = await api.get('/kitchen/queue');
    return response.data;
  },

  markReady: async (itemId) => {
    const response = await api.put(`/kitchen/items/${itemId}/ready`);
    return response.data;
  },
};

export default kitchenService;
