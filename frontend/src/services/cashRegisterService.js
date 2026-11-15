import api from './api';

const cashRegisterService = {
  getToday: async () => {
    const response = await api.get('/cash-register/today');
    return response.data;
  },

  open: async (data) => {
    const response = await api.post('/cash-register/open', data);
    return response.data;
  },

  close: async () => {
    const response = await api.post('/cash-register/close');
    return response.data;
  },
};

export default cashRegisterService;
