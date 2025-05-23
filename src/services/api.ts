
import axios from 'axios';
import { toast } from 'sonner';

// Extend the axios request config type to include our custom properties
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
    _retryCount?: number;
  }
}

// Get the API URL from environment variable or use the remote API as fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://38.9.119.167:3000';

console.log('Using API URL:', API_URL);

// Create axios instance with improved configuration
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000, // Increased timeout to 20 seconds for potentially slower remote API
});

// Custom retry configuration (stored outside axios config)
const maxRetries = 3;
const retryDelay = 2000; // Increased delay between retries for remote API

// Add a request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('financeNewsAuthToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Avoid logging view-related endpoints to reduce console noise
    const isViewsEndpoint = config.url?.includes('/views') || 
                           config.url?.includes('/site-views');
                           
    if (!isViewsEndpoint || config.method !== 'get') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  response => {
    // Avoid logging view-related responses to reduce console noise
    const isViewsEndpoint = response.config.url?.includes('/views') || 
                           response.config.url?.includes('/site-views');
                           
    if (!isViewsEndpoint || response.config.method !== 'get') {
      console.log(`API Response: ${response.status} ${response.config.url}`, response.data);
    }
    
    // Check if the response is from login or user data and contains a banned status
    if (
      (response.config.url?.includes('/login') || 
       response.config.url?.includes('/users')) && 
      response.data?.status === 'banned'
    ) {
      const error = new Error('Esta conta foi suspensa. Entre em contato com o suporte.');
      error.name = 'AccountBannedError';
      return Promise.reject(error);
    }
    
    return response;
  },
  async error => {
    const originalRequest = error.config;
    
    // If no originalRequest (e.g., request wasn't made), create a simplified object for logging
    const logConfig = originalRequest || { url: 'unknown', method: 'unknown' };
    
    // Log detailed error information
    console.error('API Error:', {
      url: logConfig.url,
      method: logConfig.method,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      retryCount: logConfig._retryCount || 0
    });
    
    // If the error is a network error or timeout, retry
    if ((error.message === 'Network Error' || error.code === 'ECONNABORTED') && 
        logConfig._retry !== true && 
        (logConfig._retryCount || 0) < maxRetries &&
        originalRequest) { // Only retry if we have an original request
      
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      
      console.log(`Retrying request (${originalRequest._retryCount}/${maxRetries}): ${originalRequest.url}`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      return api(originalRequest);
    }
    
    // User friendly error message based on error type
    if (error.message === 'Network Error') {
      error.userMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet ou tente novamente mais tarde.';
      
      // Show a toast notification for network errors
      toast.error(error.userMessage);
    } else if (error.code === 'ECONNABORTED') {
      error.userMessage = 'A requisição demorou muito tempo. Por favor, tente novamente.';
    } else if (error.response?.status === 401) {
      error.userMessage = 'Credenciais inválidas ou sessão expirada.';
    } else if (error.response?.status === 403) {
      error.userMessage = 'Você não tem permissão para acessar este recurso.';
    } else if (error.response?.status === 404) {
      error.userMessage = 'O recurso solicitado não foi encontrado.';
    } else if (error.response?.status >= 500) {
      error.userMessage = 'Erro no servidor. Por favor, tente novamente mais tarde.';
    }
    
    return Promise.reject(error);
  }
);

// Initialize the retry count for all requests
api.interceptors.request.use((config) => {
  config._retryCount = 0;
  return config;
});

// Helper function to check if the API is available
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    // Try to fetch a small endpoint to check if API is responding
    await api.get('/health', { timeout: 5000 });
    return true;
  } catch (error) {
    console.log('API health check failed:', error);
    // Try an alternative endpoint if health check fails
    try {
      await api.get('/users?_limit=1', { timeout: 5000 });
      return true;
    } catch (e) {
      console.log('Alternative API health check failed:', e);
      return false;
    }
  }
};

export default api;
