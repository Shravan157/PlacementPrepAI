import apiClient from './client';

/**
 * Evaluation API Service (Planned / Phase 2)
 * Placeholders for /evaluation endpoints documented in API_REFERENCE.md
 */

export const getAnswerEvaluation = async (answerId) => {
  const response = await apiClient.get(`/evaluation/${answerId}`);
  return response.data;
};
