import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AuthService } from '../services/AuthService';
import { DriverService } from '../services/DriverService';
import { socketService } from '../services/SocketService';
import { Driver } from '../types/api.types';

export interface AuthContextType {
  token: string | null;
  driver: Driver | null;
  isLoading: boolean;
  unverifiedPhone: string | null;
  otpCodeForTesting: string | null; // Developer aid to show current OTP in UI
  login: (username: string, password?: string) => Promise<void>;
  register: (name: string, phone: string, email?: string, password?: string, vehicleTypeId?: number, username?: string) => Promise<void>;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<Driver | undefined>;
  setUnverifiedPhone: (phone: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [unverifiedPhone, setUnverifiedPhone] = useState<string | null>(null);
  const [otpCodeForTesting, setOtpCodeForTesting] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      console.log(' [AUTH CONTEXT] Calling refreshProfile()...');
      const updatedProfile = await DriverService.getProfile();
      console.log(' [AUTH CONTEXT] Profile Refreshed! ID:', updatedProfile?.id, '| authStatus:', updatedProfile?.authorizationStatus, '| docStatuses:', JSON.stringify(updatedProfile?.documentStatuses));
      await AuthService.saveDriver(updatedProfile);
      setDriver(updatedProfile);
      return updatedProfile;
    } catch (e) {
      console.error(' [AUTH CONTEXT] Failed to sync/refresh driver profile:', e);
      throw e;
    }
  }, []);

  // Restore session on boot
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const savedToken = await AuthService.getToken();
        const savedDriver = await AuthService.getSavedDriver();

        if (savedToken && savedDriver) {
          setToken(savedToken);
          setDriver(savedDriver);
        }
      } catch (e) {
        console.error('Failed to restore login session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Real-time socket listener for driver status & document updates
  useEffect(() => {
    if (token && driver?.id) {
      console.log(`[STEP-06] [AUTH CONTEXT] Initializing socket subscription for Driver ID=${driver.id}`);
      socketService.connect(driver.id);
      socketService.joinDriverRoom(driver.id);

      const unsubscribe = socketService.onDriverUpdated((data) => {
        console.log(`[STEP-11] [AUTH CONTEXT] Listener received 'driver_updated' event! Payload: ${JSON.stringify(data)}`);
        refreshProfile().catch((err) => console.warn('❌ [AUTH CONTEXT] refreshProfile error:', err));
      });

      return () => {
        unsubscribe();
      };
    } else {
      socketService.disconnect();
    }
  }, [token, driver?.id, refreshProfile]);

  const login = async (username: string, password?: string) => {
    try {
      const data = await AuthService.login({
        name: username,
        phone: username,
        username,
        password,
      });

      // If driver phone isn't verified yet, API route might return isRegistrationVerified = false
      if (data.isRegistrationVerified === false || data.driver?.isRegistrationVerified === false) {
        setUnverifiedPhone(data.driver?.phone || username);
        // Automatically request sending new OTP
        try {
          const res = await AuthService.sendOtp(data.driver?.phone || username);
          if (res.otp) {
            setOtpCodeForTesting(res.otp);
          }
        } catch (err) {
          console.warn('Auto send OTP failed:', err);
        }
        throw new Error('VERIFY_OTP_REQUIRED');
      }

      await AuthService.saveToken(data.token);
      await AuthService.saveDriver(data.driver);

      setToken(data.token);
      setDriver(data.driver);
      setUnverifiedPhone(null);
      setOtpCodeForTesting(null);
    } catch (error: any) {
      if (error?.isRegistrationVerified === false || error?.message === 'VERIFY_OTP_REQUIRED') {
        const phoneToVerify = error?.phone || username;
        setUnverifiedPhone(phoneToVerify);
        try {
          const res = await AuthService.sendOtp(phoneToVerify);
          if (res.otp) {
            setOtpCodeForTesting(res.otp);
          }
        } catch (err) {
          console.warn('Auto send OTP failed:', err);
        }
        throw new Error('VERIFY_OTP_REQUIRED');
      }

      const errMsg = typeof error === 'string' ? error : (error?.message || 'Invalid username or password.');
      throw new Error(errMsg);
    }
  };

  const register = async (
    name: string,
    phone: string,
    email?: string,
    password?: string,
    vehicleTypeId?: number,
    username?: string
  ) => {
    const response = await AuthService.register({
      name,
      phone,
      email,
      password,
      vehicleTypeId,
      username: username || phone,
    });

    setUnverifiedPhone(phone);
    if (response.otp) {
      setOtpCodeForTesting(response.otp);
    }
  };

  const sendOtp = async (phone: string) => {
    const response = await AuthService.sendOtp(phone);
    setUnverifiedPhone(phone);
    if (response.otp) {
      setOtpCodeForTesting(response.otp);
    }
  };

  const verifyOtp = async (phone: string, otp: string) => {
    const response = await AuthService.verifyOtp({ phone, otp });

    // Save state on successful verification
    await AuthService.saveToken(response.token);
    await AuthService.saveDriver(response.driver);

    setToken(response.token);
    setDriver(response.driver);
    setUnverifiedPhone(null);
    setOtpCodeForTesting(null);
  };

  const logout = async () => {
    socketService.disconnect();
    await AuthService.logout();
    setToken(null);
    setDriver(null);
    setUnverifiedPhone(null);
    setOtpCodeForTesting(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        driver,
        isLoading,
        unverifiedPhone,
        otpCodeForTesting,
        login,
        register,
        sendOtp,
        verifyOtp,
        logout,
        refreshProfile,
        setUnverifiedPhone,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
