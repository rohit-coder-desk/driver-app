import apiClient from './axios';

export const orderApi = {
  getOffers: () => {
    return apiClient.get('/api/task-assignments/driver');
  },
  acceptOffer: (id: number) => {
    return apiClient.post(`/api/task-assignments/${id}/accept`);
  },
  rejectOffer: (id: number) => {
    return apiClient.post(`/api/task-assignments/${id}/reject`);
  },
  getOrders: () => {
    return apiClient.get('/api/orders');
  },
  updateOrderStatus: (id: number, status: string, paymentMethod?: string) => {
    return apiClient.put(`/api/orders/${id}/status`, { status, paymentMethod });
  },
};
