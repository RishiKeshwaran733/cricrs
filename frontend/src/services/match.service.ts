import api from './api';

export const matchService = {
  getMatches: (params?: Record<string, string>) =>
    api.get('/matches', { params }).then(r => r.data),

  getLiveMatches: () =>
    api.get('/matches/live').then(r => r.data),

  getMatch: (id: string) =>
    api.get(`/matches/${id}`).then(r => r.data),

  createMatch: (data: Record<string, unknown>) =>
    api.post('/admin/matches', data).then(r => r.data),

  updateMatch: (id: string, data: Record<string, unknown>) =>
    api.put(`/admin/matches/${id}`, data).then(r => r.data),

  deleteMatch: (id: string) =>
    api.delete(`/admin/matches/${id}`).then(r => r.data),

  startMatch: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/matches/${id}/start`, data).then(r => r.data),

  endInnings: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/matches/${id}/end-innings`, data).then(r => r.data),

  endMatch: (id: string, data: Record<string, unknown>) =>
    api.post(`/admin/matches/${id}/end-match`, data).then(r => r.data),

  pauseMatch: (id: string) =>
    api.post(`/admin/matches/${id}/pause`).then(r => r.data),

  resumeMatch: (id: string) =>
    api.post(`/admin/matches/${id}/resume`).then(r => r.data),

  getInningsScorecard: (inningsId: string) =>
    api.get(`/scoring/innings/${inningsId}/scorecard`).then(r => r.data),

  addBall: (data: Record<string, unknown>) =>
    api.post('/admin/scoring/ball', data).then(r => r.data),

  undoBall: (ballId: string) =>
    api.delete(`/admin/scoring/ball/${ballId}`).then(r => r.data),

  setCurrentPlayers: (inningsId: string, data: Record<string, unknown>) =>
    api.patch(`/admin/scoring/innings/${inningsId}/set-players`, data).then(r => r.data),
};
