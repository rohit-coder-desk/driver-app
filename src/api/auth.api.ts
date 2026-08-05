import apiClient from './axios';
import { LoginPayload, RegisterPayload, SendOtpPayload, VerifyOtpPayload } from '../types/api.types';

export const authApi = {
  login: (payload: LoginPayload) => {
    return apiClient.post('/api/drivers/login', payload);
  },
  
  register: (payload: RegisterPayload) => {
    return apiClient.post('/api/drivers/register', payload);
  },
  
  sendOtp: (payload: SendOtpPayload) => {
    return apiClient.post('/api/drivers/send-otp', payload);
  },
  
  verifyOtp: (payload: VerifyOtpPayload) => {
    return apiClient.post('/api/drivers/verify-otp', payload);
  },

  resetPassword: (payload: { phone: string; otp: string; newPassword: string }) => {
    return apiClient.post('/api/drivers/reset-password', payload);
  },
};
