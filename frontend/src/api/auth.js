import apiClient from './client';

/**
 * Authentication API Service
 * Endpoint wrappers matching backend/app/auth/router.py & API_REFERENCE.md
 */

/**
 * Register a new user account.
 * @param {Object} data - { email, password, name }
 * @returns {Promise<Object>} UserOut object
 */
export const registerUser = async ({ email, password, name }) => {
  const response = await apiClient.post('/auth/register', {
    email,
    password,
    name,
  });
  return response.data;
};

/**
 * Authenticate user and retrieve JWT access token.
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} Token object { access_token, token_type }
 */
export const loginUser = async ({ email, password }) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  if (response.data?.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
  }

  return response.data;
};

/**
 * Get current authenticated user details.
 * Requires Bearer token (attached automatically by apiClient request interceptor).
 * @returns {Promise<Object>} UserOut object
 */
export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

/**
 * Logout user by clearing stored token.
 */
export const logoutUser = () => {
  localStorage.removeItem('access_token');
};
