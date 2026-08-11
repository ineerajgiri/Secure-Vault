import axios from 'axios';
import { refreshAccessToken, logoutAndRedirect } from './tokenRefresh';

const documentsApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

documentsApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// NEW: auto-refresh on 401
documentsApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return documentsApi(originalRequest);
      } catch (refreshError) {
        logoutAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export const listDocuments = (tag = '') =>
  documentsApi.get('/documents/', { params: tag ? { tag } : {} });

export const uploadDocument = (file, tags) => {
  const formData = new FormData();
  formData.append('file', file);
  if (tags) formData.append('tags', tags);
  return documentsApi.post('/documents/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadDocument = (id) =>
  documentsApi.get(`/documents/${id}/download/`, { responseType: 'blob' });

export const viewDocument = (id) =>
  documentsApi.get(`/documents/${id}/view/`, { responseType: 'blob' });

export const deleteDocument = (id) =>
  documentsApi.delete(`/documents/${id}/`);

export default documentsApi;