import apiClient from './client';

/**
 * Evaluation API Service
 * Endpoint wrappers matching backend evaluation router.
 */

export const evaluateAnswer = async (answer_id) => {
  const response = await apiClient.post('/evaluation/evaluate', {
    answer_id,
  });
  return response.data;
};

export const getAnswerEvaluation = async (answerId) => {
  const response = await apiClient.get(`/evaluation/${answerId}`);
  return response.data;
};
