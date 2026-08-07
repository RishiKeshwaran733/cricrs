import api from './api';

export const teamService = {
  getTeams: (params?: Record<string, string>) =>
    api.get('/teams', { params }).then(r => r.data),

  getTeam: (id: string) =>
    api.get(`/teams/${id}`).then(r => r.data),

  createTeam: (formData: FormData) =>
    api.post('/admin/teams', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  updateTeam: (id: string, formData: FormData) =>
    api.put(`/admin/teams/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  deleteTeam: (id: string) =>
    api.delete(`/admin/teams/${id}`).then(r => r.data),
};

export const playerService = {
  getPlayers: (params?: Record<string, string>) =>
    api.get('/players', { params }).then(r => r.data),

  getPlayer: (id: string) =>
    api.get(`/players/${id}`).then(r => r.data),

  createPlayer: (formData: FormData) =>
    api.post('/admin/players', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  updatePlayer: (id: string, formData: FormData) =>
    api.put(`/admin/players/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  deletePlayer: (id: string) =>
    api.delete(`/admin/players/${id}`).then(r => r.data),

  transferPlayer: (id: string, teamId: string | null) =>
    api.put(`/admin/players/${id}/transfer`, { teamId }).then(r => r.data),

  updateMyPhoto: (formData: FormData) =>
    api.put('/players/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  renameGuestPlayer: (id: string, name: string) =>
    api.put(`/admin/players/${id}/rename`, { name }).then(r => r.data),
};

export const tournamentService = {
  getTournaments: (params?: Record<string, string>) =>
    api.get('/tournaments', { params }).then(r => r.data),

  getTournament: (id: string) =>
    api.get(`/tournaments/${id}`).then(r => r.data),

  createTournament: (formData: FormData) =>
    api.post('/admin/tournaments', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  updateTournament: (id: string, formData: FormData) =>
    api.put(`/admin/tournaments/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),

  deleteTournament: (id: string) =>
    api.delete(`/admin/tournaments/${id}`).then(r => r.data),

  getPointsTable: (id: string) =>
    api.get(`/tournaments/${id}/points-table`).then(r => r.data),
};

export const statsService = {
  getDashboard: () => api.get('/stats/dashboard').then(r => r.data),
  getBattingLeaders: (params?: Record<string, string>) => api.get('/stats/batting-leaders', { params }).then(r => r.data),
  getBowlingLeaders: (params?: Record<string, string>) => api.get('/stats/bowling-leaders', { params }).then(r => r.data),
  search: (q: string) => api.get('/stats/search', { params: { q } }).then(r => r.data),
};
