export interface LoginPayload {
  username: string; // Can be phone or custom username
  password?: string;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password?: string;
  vehicleTypeId?: number;
  username?: string;
}

export interface SendOtpPayload {
  phone: string;
}

export interface VerifyOtpPayload {
  phone: string;
  otp: string;
}

export interface Driver {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  username: string | null;
  status: string;
  isOnline: boolean;
  balance: number;
  isRegistrationVerified: boolean;
  authorizationStatus: 'pending' | 'approved' | 'rejected';
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleBrand?: string;
}

export interface VehicleType {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
}
