import axios from 'axios';

const API_BASE = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // 60 seconds to allow Render free tier to wake up
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cricrs_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle global errors
api.interceptors.response.use(
  response => response,
  error => {
    // If request timed out
    if (error.code === 'ECONNABORTED') {
      error.response = { 
        data: { message: 'Server is waking up (this can take 60s). Please try again!' } 
      };
    } 
    // If Network Error (like CORS)
    else if (error.message === 'Network Error') {
      error.response = { 
        data: { message: 'Could not connect to server. Check backend URL or wait a moment.' } 
      };
    }
    // Auto logout on 401
    else if (error.response?.status === 401) {
      localStorage.removeItem('cricrs_token');
      localStorage.removeItem('cricrs_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default api;
