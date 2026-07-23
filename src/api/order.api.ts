import apiClient from './axios';

export const orderApi = {
  getAssignments: () => {
    return apiClient.get('/api/task-assignments/driver');
  },
  acceptAssignment: (id: number) => {
    return apiClient.post(`/api/task-assignments/${id}/accept`);
  },
  rejectAssignment: (id: number) => {
    return apiClient.post(`/api/task-assignments/${id}/reject`);
  },
  updateTaskStatus: (id: number, status: string) => {
    return apiClient.put(`/api/tasks/${id}/status`, { status });
  },
};
