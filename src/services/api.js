import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

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

// Verification (user-facing)
export const verificationAPI = {
  addImages: (pinId, images) => api.post(`/verification/${pinId}/add-images`, { images }),
};

// Users
export const usersAPI = {
  getByUsername: (username) => api.get(`/users/${username}`),
};

// Routes
export const routesAPI = {
  getAll: (params) => api.get('/routes', { params }),
  getById: (id) => api.get(`/routes/${id}`),
};

// Badges
export const badgesAPI = {
  getAll: (params) => api.get('/badges', { params }),
  getMine: () => api.get('/badges/me'),
  getById: (id) => api.get(`/badges/${id}`),
  getCategories: () => api.get('/badges/categories'),
};

// Admin
export const adminAPI = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, reason) => api.post(`/admin/users/${id}/ban`, { reason }),
  unbanUser: (id) => api.post(`/admin/users/${id}/unban`),
  setAdmin: (id, is_admin) => api.post(`/admin/users/${id}/set-admin`, { is_admin }),
  verifyBuyer: (id, is_verified) => api.post(`/admin/users/${id}/verify-buyer`, { is_verified }),
  // Pins
  getPins: (params) => api.get('/admin/pins', { params }),
  hidePin: (id, reason) => api.post(`/admin/pins/${id}/hide`, { reason }),
  unhidePin: (id) => api.post(`/admin/pins/${id}/unhide`),
  // Badges
  getBadges: () => api.get('/admin/badges'),
  createBadge: (data) => api.post('/admin/badges', data),
  updateBadge: (id, data) => api.put(`/admin/badges/${id}`, data),
  // Point Actions
  getPointActions: () => api.get('/admin/point-actions'),
  updatePointAction: (id, data) => api.put(`/admin/point-actions/${id}`, data),
  // Settings
  getSettings: (category) => api.get('/admin/settings', { params: category ? { category } : {} }),
  updateSetting: (key, value) => api.put(`/admin/settings/${key}`, { value }),
  // Moderation Logs
  getLogs: (params) => api.get('/admin/moderation-logs', { params }),
  // Verification
  getPendingVerifications: (params) => api.get('/verification/pending', { params }),
  getAllVerifications: (params) => api.get('/verification/all', { params }),
  approveVerification: (id, notes) => api.post(`/verification/${id}/approve`, { notes }),
  rejectVerification: (id, reason) => api.post(`/verification/${id}/reject`, { reason }),
};

export default api;
