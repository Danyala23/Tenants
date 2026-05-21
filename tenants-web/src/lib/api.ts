import type {
  Property,
  Floor,
  Tenant,
  Occupancy,
  RentPayment,
  RentIncreaseRule,
  Bill,
  UtilityConnection,
  BillSummary,
} from "./types";

const API = "/api";

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `API error: ${res.status}`);
  }
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      fetchApi<{ success: boolean; username: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    register: (email: string, password: string) =>
      fetchApi<{ success: boolean; username: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    logout: () => fetchApi<void>("/auth/logout", { method: "POST" }),
    isAuthenticated: () => true,
  },

  properties: {
    list: () => fetchApi<Property[]>("/properties"),
    get: (id: number) => fetchApi<Property>(`/properties/${id}`),
    create: (data: { houseNumber: string; address: string; size: number }) =>
      fetchApi<Property>("/properties", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { houseNumber?: string; address?: string; size?: number }) =>
      fetchApi<Property>(`/properties/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/properties/${id}`, { method: "DELETE" }),
  },

  floors: {
    listByProperty: (propertyId: number) => fetchApi<Floor[]>(`/properties/${propertyId}/floors`),
    get: (id: number) => fetchApi<Floor>(`/floors/${id}`),
    create: (propertyId: number, data: { floorNumber: number; label?: string }) =>
      fetchApi<Floor>(`/properties/${propertyId}/floors`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { floorNumber?: number; label?: string }) =>
      fetchApi<Floor>(`/floors/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/floors/${id}`, { method: "DELETE" }),
  },

  tenants: {
    list: () => fetchApi<Tenant[]>("/tenants"),
    get: (id: number) => fetchApi<Tenant>(`/tenants/${id}`),
    create: (data: { name: string; phoneNumber: string }) =>
      fetchApi<Tenant>("/tenants", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: { name?: string; phoneNumber?: string }) =>
      fetchApi<Tenant>(`/tenants/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    delete: (id: number) => fetchApi<void>(`/tenants/${id}`, { method: "DELETE" }),
  },

  occupancies: {
    listByFloor: (floorId: number) => fetchApi<Occupancy[]>(`/floors/${floorId}/occupancies`),
    listByProperty: (propertyId: number) =>
      fetchApi<Occupancy[]>(`/properties/${propertyId}/occupancies`),
    listByTenant: (tenantId: number) => fetchApi<Occupancy[]>(`/tenants/${tenantId}/occupancies`),
    get: (id: number) => fetchApi<Occupancy>(`/occupancies/${id}`),
    create: (
      propertyId: number,
      data: {
        tenantId?: number;
        name?: string;
        phoneNumber?: string;
        floorId?: number;
        rent: number;
        securityDeposit: number;
        startDate: string;
      }
    ) =>
      fetchApi<Occupancy>(`/properties/${propertyId}/occupancies`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: {
        floorId?: number | null;
        rent?: number;
        securityDeposit?: number;
        startDate?: string;
      }
    ) =>
      fetchApi<Occupancy>(`/occupancies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    vacate: (id: number) =>
      fetchApi<Occupancy>(`/occupancies/${id}/vacate`, { method: "PUT" }),
    delete: (id: number) => fetchApi<void>(`/occupancies/${id}`, { method: "DELETE" }),
  },

  bills: {
    list: (propertyId: number, year?: number, month?: number) => {
      const params = new URLSearchParams();
      if (year != null) params.set("year", String(year));
      if (month != null) params.set("month", String(month));
      const q = params.toString() ? `?${params}` : "";
      return fetchApi<Bill[]>(`/properties/${propertyId}/bills${q}`);
    },
    markPaid: (id: number) =>
      fetchApi<{ isPaid: boolean }>(`/bills/${id}/mark-paid`, { method: "PUT" }),
    billSummary: () => fetchApi<BillSummary[]>("/properties/bill-summary"),
    snapshotUrl: (id: number) => `${API}/bills/${id}/snapshot`,
    getSnapshotHtml: async (id: number) => {
      const res = await fetch(`${API}/bills/${id}/snapshot`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load snapshot");
      return res.text();
    },
    openSnapshot: async (id: number) => {
      const res = await fetch(`${API}/bills/${id}/snapshot`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load snapshot");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    },
    scrapeNow: (type?: "Electricity" | "Gas") =>
      fetchApi<{ success?: boolean; message?: string; error?: string }>(
        `/bills/scrape-now${type ? `?type=${type}` : ""}`,
        { method: "POST" }
      ),
  },

  utilityConnections: {
    listByProperty: (propertyId: number) =>
      fetchApi<UtilityConnection[]>(`/properties/${propertyId}/utility-connections`),
    create: (
      propertyId: number,
      data: {
        floorId?: number | null;
        type: string;
        referenceNumber?: string | null;
        consumerNumber?: string | null;
        providerName?: string | null;
      }
    ) =>
      fetchApi<UtilityConnection>(`/properties/${propertyId}/utility-connections`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: number,
      data: {
        floorId?: number | null;
        referenceNumber?: string | null;
        consumerNumber?: string | null;
        providerName?: string | null;
      }
    ) =>
      fetchApi<UtilityConnection>(`/utility-connections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      fetchApi<void>(`/utility-connections/${id}`, { method: "DELETE" }),
  },

  payments: {
    listByOccupancy: (occupancyId: number) =>
      fetchApi<RentPayment[]>(`/occupancies/${occupancyId}/payments`),
    collect: (
      occupancyId: number,
      data: { year: number; month: number; amountPaid: number; collectedAt?: string }
    ) =>
      fetchApi<RentPayment>(`/occupancies/${occupancyId}/payments/collect`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    collectBulk: (
      propertyId: number,
      tenantId: number,
      data: {
        year: number;
        month: number;
        collectedAt?: string;
        allocations: { occupancyId: number; amountPaid: number }[];
      }
    ) =>
      fetchApi<RentPayment[]>(
        `/properties/${propertyId}/tenants/${tenantId}/payments/collect-bulk`,
        { method: "PUT", body: JSON.stringify(data) }
      ),
  },

  rentIncrease: {
    get: (occupancyId: number) =>
      fetchApi<RentIncreaseRule>(`/occupancies/${occupancyId}/rent-increase`),
    update: (
      occupancyId: number,
      data: { increasePercent?: number; nextIncreaseDate?: string }
    ) =>
      fetchApi<RentIncreaseRule>(`/occupancies/${occupancyId}/rent-increase`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};
