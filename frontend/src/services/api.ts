import axios, { InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { store } from '../store/store'; // Import the Redux store

// The Vite proxy will handle redirecting this to the correct backend service
const getApiBaseUrl = () => {
  return '/api'
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from Redux store instead of localStorage
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Still good practice to clear local storage on 401
      localStorage.removeItem('brainbrawler_token');
      // Redirect or dispatch a logout action
      // For simplicity, redirecting. A dispatched action would be cleaner.
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
); 