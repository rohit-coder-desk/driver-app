import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth.api';
import { STORAGE_KEYS } from '../constants/storage';
import { LoginPayload, RegisterPayload, VerifyOtpPayload } from '../types/api.types';

export const AuthService = {
  login: async (payload: LoginPayload) => {
    try {
      const response = await authApi.login(payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      if (error.message === 'Network Error' || !error.response) {
        throw { message: 'Cannot connect to server. Please check server & network connection.' };
      }
      throw { message: 'Login failed. Please check your credentials.' };
    }
  },

  register: async (payload: RegisterPayload) => {
    try {
      const response = await authApi.register(payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Registration failed. Phone or email might already exist.';
    }
  },

  sendOtp: async (phone: string) => {
    try {
      const response = await authApi.sendOtp({ phone });
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to send OTP. Please try again.';
    }
  },

  verifyOtp: async (payload: VerifyOtpPayload) => {
    try {
      const response = await authApi.verifyOtp(payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Verification failed. Please enter the correct OTP.';
    }
  },

  resetPassword: async (payload: { phone: string; otp: string; newPassword: string }) => {
    try {
      const response = await authApi.resetPassword(payload);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to reset password. Please check details and try again.';
    }
  },

  saveToken: async (token: string) => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  getToken: async () => {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  saveDriver: async (driver: any) => {
    await AsyncStorage.setItem(STORAGE_KEYS.DRIVER_DATA, JSON.stringify(driver));
  },

  getSavedDriver: async () => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.DRIVER_DATA);
    return data ? JSON.parse(data) : null;
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    await AsyncStorage.removeItem(STORAGE_KEYS.DRIVER_DATA);
  },
};
