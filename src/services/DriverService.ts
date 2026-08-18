import { driverApi } from '../api/driver.api';
import { VehicleType } from '../types/api.types';

export const DriverService = {
  getProfile: async () => {
    try {
      const response = await driverApi.getProfile();
      return response.data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch driver profile.';
      throw typeof msg === 'string' ? msg : JSON.stringify(msg);
    }
  },

  updateStatus: async (status: string) => {
    try {
      const response = await driverApi.updateStatus(status);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to update online status.';
    }
  },

  uploadDocuments: async (formData: FormData) => {
    try {
      const response = await driverApi.uploadDocuments(formData);
      return response.data;
    } catch (error: any) {
      console.error('❌ [DRIVER SERVICE] uploadDocuments error:', error.response?.data || error.message || error);
      throw error.response?.data?.message || error.message || 'Failed to upload documents.';
    }
  },

  updateLocation: async (latitude: number, longitude: number) => {
    try {
      const response = await driverApi.updateLocation(latitude, longitude);
      return response.data;
    } catch (error: any) {
      console.warn('Failed to update live location:', error);
    }
  },

  getVehicleTypes: async (): Promise<VehicleType[]> => {
    try {
      const response = await driverApi.getVehicleTypes();
      // Only return active vehicle types
      const list = response.data || [];
      return list.filter((v: any) => v.isActive);
    } catch (error: any) {
      console.warn('Vehicle types endpoint restricted/unavailable, using hardcoded fallback list:', error);
      // Fallback to active types seeded in DB
      return [
        { id: 3, title: 'Motorbike', description: 'Fast delivery for small packages', isActive: true },
        { id: 4, title: 'Van', description: 'For larger shipments', isActive: true }
      ];
    }
  },
  getWorkingTypeConfig: async () => {
    try {
      const response = await driverApi.getWorkingTypeConfig();
      return response.data?.workingTypeConfig || null;
    } catch (error: any) {
      console.warn('Failed to fetch working type config:', error);
      return null;
    }
  },
  getServiceArea: async () => {
    try {
      const response = await driverApi.getServiceArea();
      return response.data?.serviceArea || null;
    } catch (error: any) {
      console.warn('Failed to fetch service area configuration:', error);
      return null;
    }
  },
  getEarnings: async () => {
    try {
      console.log('⚡ [DRIVER SERVICE] Fetching /api/drivers/me/earnings...');
      const response = await driverApi.getEarnings();
      console.log('⚡ [DRIVER SERVICE] Response status:', response.status, 'data:', JSON.stringify(response.data));
      return response.data || null;
    } catch (error: any) {
      console.warn('❌ [DRIVER SERVICE] Failed to fetch driver earnings:', error?.response?.data || error?.message || error);
      return null;
    }
  },
  requestPayout: async (amount: number, note?: string) => {
    try {
      const response = await driverApi.requestPayout(amount, note);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Failed to submit payout request.';
    }
  },
  cancelPayoutRequest: async (id: number) => {
    try {
      const response = await driverApi.cancelPayoutRequest(id);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || error.message || 'Failed to cancel payout request.';
    }
  },
};

