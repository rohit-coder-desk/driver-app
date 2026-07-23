import apiClient from './axios';

export const driverApi = {
  getProfile: () => {
    return apiClient.get('/api/drivers/me');
  },
  
  updateStatus: (status: string) => {
    return apiClient.patch('/api/drivers/me/status', { status });
  },
  
  getVehicleTypes: () => {
    // Queries the operation settings endpoint for active vehicle configurations
    return apiClient.get('/api/vehicle-types');
  },
};
