import type { Property, Floor, Tenant, Occupancy, RentPayment, RentIncreaseRule, Bill } from './types';

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
    list: () => fetchApi<Tenant[]>('/tenants'),
    get: (id: number) => fetchApi<Tenant>(`/tenants/${id}`),
    create: (data: { name: string; phoneNumber: string }) =>
      fetchApi<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; phoneNumber?: string }) =>
      fetchApi<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/tenants/${id}`, { method: 'DELETE' }),
  },

  occupancies: {
    listByFloor: (floorId: number) => fetchApi<Occupancy[]>(`/floors/${floorId}/occupancies`),
    listByProperty: (propertyId: number) => fetchApi<Occupancy[]>(`/properties/${propertyId}/occupancies`),
    listByTenant: (tenantId: number) => fetchApi<Occupancy[]>(`/tenants/${tenantId}/occupancies`),
    get: (id: number) => fetchApi<Occupancy>(`/occupancies/${id}`),
    create: (propertyId: number, data: { tenantId?: number; name?: string; phoneNumber?: string; floorId?: number; rent: number; securityDeposit: number; startDate: string }) =>
      fetchApi<Occupancy>(`/properties/${propertyId}/occupancies`, { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: { floorId?: number | null; rent?: number; securityDeposit?: number; startDate?: string }) =>
      fetchApi<Occupancy>(`/occupancies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/occupancies/${id}`, { method: 'DELETE' }),
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
    listByOccupancy: (occupancyId: number) => fetchApi<RentPayment[]>(`/occupancies/${occupancyId}/payments`),
  },

  rentIncrease: {
    get: (occupancyId: number) => fetchApi<RentIncreaseRule>(`/occupancies/${occupancyId}/rent-increase`),
    update: (occupancyId: number, data: { increasePercent?: number; nextIncreaseDate?: string }) =>
      fetchApi<RentIncreaseRule>(`/occupancies/${occupancyId}/rent-increase`, { method: 'PUT', body: JSON.stringify(data) }),
  },
};
