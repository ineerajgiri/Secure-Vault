import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Prevents multiple simultaneous refresh calls if several requests 401 at once
let refreshPromise = null;

export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  refreshPromise = axios
    .post(`${BASE_URL}/auth/token/refresh/`, { refresh: refreshToken })
    .then((res) => {
      localStorage.setItem('access_token', res.data.access);
      return res.data.access;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

export function logoutAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/login';
}