import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// HRMS API Base URL
// const API_BASE_URL = 'http://192.168.1.75:5000/api';

const API_BASE_URL = 'https://hrms.infinityarthvishva.com/Api_hrms/api';


// Storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_DATA_KEY = 'userData';

// Token refresh state
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Request interceptor – attach access token
api.interceptors.request.use(
  async (config) => {
    try {
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    } catch (error) {
      console.error('Error reading token from storage', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is not 401 or request already retried, reject
    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Prevent refresh loop on the refresh endpoint itself
    if (originalRequest.url.includes('/auth/refresh-token')) {
      // Refresh token failed – clear storage and reject
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If already refreshing, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh token endpoint – send refreshToken as plain text
      const refreshResponse = await axios.post(
        `${API_BASE_URL}/auth/refresh-token`,
        refreshToken, // plain text body
        {
          headers: { 'Content-Type': 'text/plain' },
        }
      );

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = refreshResponse.data;

      // Store new tokens
      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);

      // Update authorization header
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      // Process queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      return api(originalRequest);
    } catch (refreshError) {
      // Refresh failed – clear storage, reject queue, reject original
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY]);
      processQueue(refreshError, null);
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY };