import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/env';
import { STORAGE_KEYS } from '../constants/storage';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token to Authorization headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        if (typeof (config.headers as any).set === 'function') {
          (config.headers as any).set('Authorization', `Bearer ${token}`);
        } else {
          (config.headers as any)['Authorization'] = `Bearer ${token}`;
        }
      }
      if (config.data instanceof FormData) {
        if (typeof (config.headers as any).set === 'function') {
          (config.headers as any).set('Content-Type', 'multipart/form-data');
        } else {
          (config.headers as any)['Content-Type'] = 'multipart/form-data';
        }
      }
    } catch (e) {
      console.error('Error fetching token from storage in interceptor:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
