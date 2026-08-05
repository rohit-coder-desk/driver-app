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
  docExpiryInfo?: {
    canGoOnline: boolean;
    hasExpiredDocs: boolean;
    expiredDocuments: Array<{ key: string; label: string; expiryDate?: string; daysRemaining?: number; reason?: string }>;
    warningDocuments: Array<{ key: string; label: string; expiryDate?: string; daysRemaining?: number; warningStage?: string }>;
    pendingDocuments: Array<{ key: string; label: string }>;
    rejectedDocuments: Array<{ key: string; label: string; reason?: string }>;
    missingDocuments: Array<{ key: string; label: string }>;
    warningBanner?: string | null;
    blockingCard?: string | null;
    onlineBlockReason?: string | null;
  } | null;
  canGoOnline?: boolean;
  warningBanner?: string | null;
  blockingCard?: string | null;
  onlineBlockReason?: string | null;
}

export interface VehicleType {
  id: number;
  title: string;
  description: string | null;
  isActive: boolean;
}
