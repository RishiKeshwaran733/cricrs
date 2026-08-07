import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },
  playerLogin: async (mobileNumber: string) => {
    const res = await api.post('/auth/player-login', { mobileNumber });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data.user;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.put('/auth/change-password', { currentPassword, newPassword });
    return res.data;
  },
};
