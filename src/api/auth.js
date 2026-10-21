import { request } from './client';

export const login = (email, password) =>
  request('/api/users/loginUser', { method: 'POST', body: { email, password } });

export const logout = () => request('/api/users/logOutUser', { method: 'POST' });

export const getMe = () => request('/api/users/me');
