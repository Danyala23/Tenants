export interface Property {
  id: number;
  houseNumber: string;
  address: string;
  size: number;
  createdAt: string;
}

export interface Floor {
  id: number;
  propertyId: number;
  floorNumber: number;
  label: string;
}

export interface Tenant {
  id: number;
  floorId: number;
  name: string;
  phoneNumber: string;
  rent: number;
  securityDeposit: number;
  startDate: string;
}

export interface RentPayment {
  id: number;
  tenantId: number;
  year: number;
  month: number;
  isPaid: boolean;
}

export interface RentIncreaseRule {
  id: number;
  tenantId: number;
  increasePercent: number;
  nextIncreaseDate: string;
}

export interface Bill {
  id: number;
  tenantId: number | null;
  propertyId: number;
  floorId: number | null;
  type: string;
  year: number;
  month: number;
  amount: number;
  isPaid: boolean;
}
