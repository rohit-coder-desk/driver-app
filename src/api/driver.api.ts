import apiClient from './axios';

export const driverApi = {
  getProfile: () => {
    return apiClient.get('/api/drivers/me');
  },
  
  updateStatus: (status: string) => {
    return apiClient.patch('/api/drivers/me/status', { status });
  },
  
  uploadDocuments: (formData: FormData) => {
    return apiClient.post('/api/drivers/me/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  updateLocation: (latitude: number, longitude: number) => {
    return apiClient.patch('/api/drivers/me/location', { latitude, longitude });
  },
  
  getVehicleTypes: () => {
    // Queries the operation settings endpoint for active vehicle configurations
    return apiClient.get('/api/vehicle-types');
  },
  getWorkingTypeConfig: () => {
    return apiClient.get('/api/drivers/me/working-type-config');
  },
};
