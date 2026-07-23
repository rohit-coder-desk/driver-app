import { driverApi } from '../api/driver.api';
import { VehicleType } from '../types/api.types';

export const DriverService = {
  getProfile: async () => {
    try {
      const response = await driverApi.getProfile();
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to fetch driver profile.';
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
};
