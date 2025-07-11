import axios from 'axios'

// Auto-detect the backend URL based on current location
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol // 'https:' or 'http:'
    const hostname = window.location.hostname
    return `${protocol}//${hostname}/api`
  }
  return 'http://localhost:3000/api'
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brainbrawler_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('brainbrawler_token')
      window.location.href = '/auth'
    }
    return Promise.reject(error)
  }
) 