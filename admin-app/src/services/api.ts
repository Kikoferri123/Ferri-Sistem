import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// Auth
export const login = (email: string, password: string) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');

// Clients (basic list)
export const getClients = (params?: any) => api.get('/clients', { params });

// Admin Features - News
export const getAdminNews = (params?: any) => api.get('/admin-features/news', { params });
export const createNews = (data: any) => api.post('/admin-features/news', data);
export const updateNews = (id: number, data: any) => api.put(`/admin-features/news/${id}`, data);
export const deleteNews = (id: number) => api.delete(`/admin-features/news/${id}`);

// Admin Features - Messages
export const getAdminMessages = (params?: any) => api.get('/admin-features/messages', { params });
export const getAdminMessage = (id: number) => api.get(`/admin-features/messages/${id}`);
export const replyMessage = (data: any) => api.post('/admin-features/messages/reply', data);
export const deleteMessage = (id: number) => api.delete(`/admin-features/messages/${id}`);

// Admin Features - Rewards
export const getAdminRewards = (params?: any) => api.get('/admin-features/rewards', { params });
export const addRewardPoints = (data: any) => api.post('/admin-features/rewards/add-points', data);
export const getRewardTransactions = (params?: any) => api.get('/admin-features/rewards/transactions', { params });

// Admin Features - Check-ins
export const getAdminCheckins = (params?: any) => api.get('/admin-features/checkins', { params });

// Admin Features - Reviews
export const getAdminReviews = (params?: any) => api.get('/admin-features/reviews', { params });
export const respondReview = (id: number, data: any) => api.put(`/admin-features/reviews/${id}/respond`, data);

// Admin Features - FAQ
export const getAdminFaq = (params?: any) => api.get('/admin-features/faq', { params });
export const createFaq = (data: any) => api.post('/admin-features/faq', data);
export const updateFaq = (id: number, data: any) => api.put(`/admin-features/faq/${id}`, data);
export const deleteFaq = (id: number) => api.delete(`/admin-features/faq/${id}`);

// Admin Features - Referrals
export const getAdminReferrals = (params?: any) => api.get('/admin-features/referrals', { params });
export const updateReferralStatus = (id: number, data: any) => api.put(`/admin-features/referrals/${id}/status`, data);

// Branding
export const getBranding = () => api.get('/branding');
export const getBrandingPublic = () => api.get('/branding/config');
export const updateBranding = (data: any) => api.put('/branding', data);

// Dashboard stats
export const getDashboardStats = () => api.get('/admin-features/stats');
