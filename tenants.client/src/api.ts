import type { Property, Floor, Tenant, RentPayment, RentIncreaseRule, Bill } from './types';

const API = '/api';
const TOKEN_KEY = 'authToken';

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers } as HeadersInit,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      fetchApi<{ success: boolean; username: string; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    logout: () => sessionStorage.removeItem(TOKEN_KEY),
    getToken: () => sessionStorage.getItem(TOKEN_KEY),
    isAuthenticated: () => !!sessionStorage.getItem(TOKEN_KEY),
  },

  properties: {
    list: () => fetchApi<Property[]>('/properties'),
    get: (id: number) => fetchApi<Property>(`/properties/${id}`),
    create: (data: { houseNumber: string; address: string; size: number }) =>
      fetchApi<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { houseNumber?: string; address?: string; size?: number }) =>
      fetchApi<Property>(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/properties/${id}`, { method: 'DELETE' }),
  },

  floors: {
    listByProperty: (propertyId: number) => fetchApi<Floor[]>(`/properties/${propertyId}/floors`),
    get: (id: number) => fetchApi<Floor>(`/floors/${id}`),
    create: (propertyId: number, data: { floorNumber: number; label?: string }) =>
      fetchApi<Floor>(`/properties/${propertyId}/floors`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { floorNumber?: number; label?: string }) =>
      fetchApi<Floor>(`/floors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/floors/${id}`, { method: 'DELETE' }),
  },

  tenants: {
    listByFloor: (floorId: number) => fetchApi<Tenant[]>(`/floors/${floorId}/tenants`),
    get: (id: number) => fetchApi<Tenant>(`/tenants/${id}`),
    create: (floorId: number, data: { name: string; phoneNumber: string; rent: number; securityDeposit: number; startDate: string }) =>
      fetchApi<Tenant>(`/floors/${floorId}/tenants`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; phoneNumber?: string; rent?: number; securityDeposit?: number; startDate?: string }) =>
      fetchApi<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/tenants/${id}`, { method: 'DELETE' }),
  },

  bills: {
    list: (propertyId: number, year?: number, month?: number) => {
      const params = new URLSearchParams();
      if (year != null) params.set('year', String(year));
      if (month != null) params.set('month', String(month));
      const q = params.toString() ? `?${params}` : '';
      return fetchApi<Bill[]>(`/properties/${propertyId}/bills${q}`);
    },
  },

  payments: {
    listByTenant: (tenantId: number) => fetchApi<RentPayment[]>(`/tenants/${tenantId}/payments`),
  },

  rentIncrease: {
    get: (tenantId: number) => fetchApi<RentIncreaseRule>(`/tenants/${tenantId}/rent-increase`),
    update: (tenantId: number, data: { increasePercent?: number; nextIncreaseDate?: string }) =>
      fetchApi<RentIncreaseRule>(`/tenants/${tenantId}/rent-increase`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
