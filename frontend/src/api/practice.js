import apiClient from './client';

/**
 * Practice API Service (Planned / Phase 2)
 * Placeholders for /practice endpoints documented in API_REFERENCE.md
 */

export const startPracticeSession = async (subject = 'dbms') => {
  const response = await apiClient.post('/practice/start', null, {
    params: { subject },
  });
  return response.data;
};

export const submitAnswer = async (sessionId, answerText) => {
  const response = await apiClient.post(`/practice/${sessionId}/answer`, {
    answer: answerText,
  });
  return response.data;
};

export const getNextQuestion = async (sessionId) => {
  const response = await apiClient.get(`/practice/${sessionId}/question`);
  return response.data;
};
