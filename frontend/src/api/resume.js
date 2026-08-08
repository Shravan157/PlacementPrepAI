import apiClient from './client';

/**
 * Resume & Skill-Gap Matching API Service (Planned / Phase 2)
 * Placeholders for /resume endpoints documented in API_REFERENCE.md
 */

export const uploadResume = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const matchJobDescription = async (jobDescriptionText) => {
  const response = await apiClient.post('/resume/match', {
    job_description: jobDescriptionText,
  });
  return response.data;
};
