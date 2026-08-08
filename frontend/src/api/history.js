import apiClient from './client';

/**
 * History & Dashboard Summary API Service (Planned / Phase 2)
 * Placeholders for /history endpoints documented in API_REFERENCE.md
 */

export const getHistorySummary = async () => {
  const response = await apiClient.get('/history/summary');
  return response.data;
};

export const getSubjectHistory = async (subject) => {
  const response = await apiClient.get(`/history/${subject}`);
  return response.data;
};
