import axios from 'axios';

// Base API configuration (auto-normalizes external URLs to include /api and strips trailing slashes)
let rawBase = (import.meta.env.VITE_API_URL || '/api').trim();
rawBase = rawBase.replace(/\/+$/, '');
if (rawBase.startsWith('http') && !rawBase.endsWith('/api')) {
  rawBase = `${rawBase}/api`;
}
const API_BASE = rawBase;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach student JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campusshare_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: (credentials) => api.post('/accounts/login/', credentials),
  register: (data) => api.post('/accounts/register/', data),
  verifyEmailOtp: (data) => api.post('/accounts/verify-email-otp/', data),
  resendEmailOtp: (data) => api.post('/accounts/resend-email-otp/', data),
  uploadIdCard: (data) => {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return api.post('/accounts/upload-id-card/', data, {
        headers: { 'Content-Type': undefined },
      });
    }
    return api.post('/accounts/upload-id-card/', data);
  },
  getProfile: () => api.get('/accounts/profile/'),
  updateProfile: (data) => api.put('/accounts/profile/', data),
  getWallet: () => api.get('/accounts/wallet/'),
  topupWallet: (amount) => api.post('/accounts/wallet/', { amount }),
  getWalletHistory: () => api.get('/accounts/wallet-history/'),
  getStudentsList: () => api.get('/accounts/students/'),
};

export const adminApi = {
  login: (credentials) => api.post('/accounts/admin/login/', credentials),
  getUsers: (params) => api.get('/accounts/admin/users/', { params }),
  verifyId: (userId, data) => api.post(`/accounts/admin/users/${userId}/verify-id/`, data),
  toggleBlock: (userId, data) => api.post(`/accounts/admin/users/${userId}/toggle-block/`, data),
};

export const itemsApi = {
  list: (params) => api.get('/items/', { params }),
  get: (id) => api.get(`/items/${id}/`),
  create: (data) => api.post('/items/', data),
  update: (id, data) => api.put(`/items/${id}/`, data),
  delete: (id) => api.delete(`/items/${id}/`),
  getCategories: () => api.get('/items/categories/'),
  createCategory: (data) => api.post('/items/categories/', data),
  updateCategory: (id, data) => api.put(`/items/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/items/categories/${id}/`),
  getMyItems: () => api.get('/items/my-items/'),
};

export const rentalsApi = {
  book: (data) => api.post('/rentals/book/', data),
  myRentals: (params) => api.get('/rentals/my-rentals/', { params }),
  verifyPickup: (rentalId, data) => api.post(`/rentals/${rentalId}/verify-pickup/`, data),
  verifyReturn: (rentalId, data) => api.post(`/rentals/${rentalId}/verify-return/`, data),
  submitReview: (rentalId, data) => api.post(`/rentals/${rentalId}/review/`, data),
  getDisputes: () => api.get('/rentals/disputes/'),
  resolveDispute: (disputeId, data) => api.post(`/rentals/disputes/${disputeId}/resolve/`, data),
};

export const requestsApi = {
  list: (params) => api.get('/requests/', { params }),
  create: (data) => api.post('/requests/', data),
  delete: (id) => api.delete(`/requests/${id}/`),
};

export const analyticsApi = {
  getRecommendations: (params) => api.get('/analytics/recommendations/', { params }),
  getDashboard: () => api.get('/analytics/dashboard/'),
  getExplainDemo: () => api.get('/analytics/explain-demo/'),
  getNotifications: () => api.get('/analytics/notifications/'),
  markNotificationsRead: () => api.post('/analytics/notifications/mark-read/'),
};

export default api;
