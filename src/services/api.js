import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  // OTP Flow (Shopify)
  requestCode: (email) => api.post('/auth/request-code', { email }),
  registerAndSendCode: (data) => api.post('/auth/register-and-send-code', data),
  verifyCode: (email, code) => api.post('/auth/verify-code', { email, code }),

  // Legacy (password)
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),

  // User
  me: () => api.get('/auth/me'),
  myOrders: () => api.get('/auth/my-orders'),
};

// Pins
export const pinsAPI = {
  getAll: (params) => api.get('/pins', { params }),
  getById: (id) => api.get(`/pins/${id}`),
  create: (pinData) => api.post('/pins', pinData),
  like: (id) => api.post(`/pins/${id}/like`),
  unlike: (id) => api.delete(`/pins/${id}/like`),
  getComments: (id) => api.get(`/pins/${id}/comments`),
  addComment: (id, content) => api.post(`/pins/${id}/comments`, { content }),
};

// Upload
export const uploadAPI = {
  images: (formData) => api.post('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Categories
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
};

// Cities
export const citiesAPI = {
  getAll: () => api.get('/cities'),
};

// Users
export const usersAPI = {
  getByUsername: (username) => api.get(`/users/${username}`),
};

export default api;
