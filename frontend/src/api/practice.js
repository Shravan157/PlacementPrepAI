import apiClient from './client';

/**
 * Practice API Service
 * Endpoint wrappers matching backend practice router.
 */

export const generateQuestion = async ({
  subject,
  topic,
  company_type = 'product_based',
  difficulty_tag = 'medium',
  generation_method = 'rag_generated',
}) => {
  const response = await apiClient.post('/practice/questions', {
    subject,
    topic,
    company_type,
    difficulty_tag,
    generation_method,
  });
  return response.data;
};

export const submitAnswer = async ({ question_id, answer_text }) => {
  const response = await apiClient.post('/practice/answers', {
    question_id,
    answer_text,
  });
  return response.data;
};

export const getCoverage = async (subject = null) => {
  const response = await apiClient.get('/practice/coverage', {
    params: subject ? { subject } : {},
  });
  return response.data;
};
