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
  cancelOrder: (id: number, reason: string) => {
    return apiClient.put(`/api/orders/${id}/status`, { status: 'cancelled', cancellationReason: reason, failedReason: reason });
  },
  getFailureReasons: () => {
    return apiClient.get('/api/failure-reasons');
  },
  rateCustomer: (id: number, rating: number, review?: string) => {
    return apiClient.put(`/api/orders/${id}/rate-customer`, { rating, review });
  },
  uploadProofPhoto: (id: number, file: { uri: string; type?: string; fileName?: string }, type: 'pickup' | 'delivery') => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('photo', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `proof_${type}_${Date.now()}.jpg`,
    } as any);

    return apiClient.post(`/api/orders/${id}/proof-photo`, formData);
  },
};


