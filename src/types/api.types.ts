export interface LoginPayload {
  username?: string;
  name?: string;
  phone?: string;
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
  authorizationDescription?: string | null;
  documentStatuses?: Record<string, any> | null;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleBrand?: string;
  city?: string | null;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  drivingLicenceNumber?: string;
  drivingLicenceExpiry?: string;
  rcExpiry?: string;
  insuranceExpiry?: string;
  avatarPhoto?: string | null;
  vehiclePhoto?: string | null;
  drivingLicencePhoto?: string | null;
  drivingLicenceBackPhoto?: string | null;
  identityCardPhoto?: string | null;
  identityCardBackPhoto?: string | null;
  rcPhoto?: string | null;
  insurancePhoto?: string | null;
}

export interface VehicleType {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
}
