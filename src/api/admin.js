import { request, toQuery } from './client';

const BASE = '/api/admin';

/** Période commune aux KPI : { period, startDate, endDate } */
const periodQuery = ({ period, startDate, endDate } = {}) =>
  period === 'custom' ? { period, startDate, endDate } : { period };

// ─── Plateforme ─────────────────────────────────────────────────────────────
export const getPlatformStats = () => request(`${BASE}/stats`);

export const getKpiOverview = (period) =>
  request(`${BASE}/kpis/overview${toQuery(periodQuery(period))}`);

export const getKpiTrend = (months = 12) => request(`${BASE}/kpis/trend${toQuery({ months })}`);

export const getKpiTopCompanies = ({ by = 'revenue', limit = 10, ...period } = {}) =>
  request(`${BASE}/kpis/top-companies${toQuery({ by, limit, ...periodQuery(period) })}`);

export const getKpiHealth = () => request(`${BASE}/kpis/health`);

// ─── Entreprises ────────────────────────────────────────────────────────────
export const getCompanies = ({ page = 1, limit = 20, search = '' } = {}) =>
  request(`${BASE}/companies${toQuery({ page, limit, search })}`);

export const getCompany = (id) => request(`${BASE}/companies/${encodeURIComponent(id)}`);

export const getCompanyKpis = (id, period) =>
  request(`${BASE}/companies/${encodeURIComponent(id)}/kpis${toQuery(periodQuery(period))}`);

/** Seuls name, address, phone, matriculeFiscale sont acceptés par l'API */
export const updateCompany = (id, data) =>
  request(`${BASE}/companies/${encodeURIComponent(id)}`, { method: 'PUT', body: data });

export const setCompanyActive = (id, isActive) =>
  request(`${BASE}/companies/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { is_active: isActive },
  });

// ─── Utilisateurs ───────────────────────────────────────────────────────────
export const getAllUsers = () => request('/api/users/getAllUsers');

export const setUserActive = (id, isActive) =>
  request(`${BASE}/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { is_active: isActive },
  });

export const deleteUser = (id) =>
  request(`/api/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
