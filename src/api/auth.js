import { request } from './client';

export const login = (email, password) =>
  request('/api/users/loginUser', { method: 'POST', body: { email, password } });

export const logout = () => request('/api/users/logOutUser', { method: 'POST' });

export const getMe = () => request('/api/users/me');

// Activation d'un compte (code OTP reçu par email à la création de l'admin)
export const verifyAccount = (email, code) =>
  request('/api/users/verifyAccounts', { method: 'PUT', body: { email, code } });

export const resendCode = (email) =>
  request('/api/users/resendCode', { method: 'POST', body: { email } });
