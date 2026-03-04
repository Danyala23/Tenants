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
  name: string;
  phoneNumber: string;
}

/** Represents a tenant's occupancy of a floor — a tenant can have multiple occupancies (multiple floors). */
export interface Occupancy {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone: string;
  propertyId: number;
  floorId: number | null;
  floorLabel: string | null;
  isWholeProperty: boolean;
  rent: number;
  securityDeposit: number;
  startDate: string;
}

export interface RentPayment {
  id: number;
  tenantOccupancyId: number;
  year: number;
  month: number;
  isPaid: boolean;
  amountPaid: number;
}

export interface RentIncreaseRule {
  id: number;
  tenantOccupancyId: number;
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
