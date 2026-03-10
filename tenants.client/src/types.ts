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
  collectedAt?: string | null;
}

export interface RentIncreaseRule {
  id: number;
  tenantOccupancyId: number;
  increasePercent: number;
  nextIncreaseDate: string;
}

export interface Bill {
  id: number;
  tenantOccupancyId: number | null;
  propertyId: number;
  floorId: number | null;
  type: string;
  year: number;
  month: number;
  amount: number;
  isPaid: boolean;
  dueDate: string | null;
  unitsConsumed: number | null;
  scrapedAt: string | null;
  hasSnapshot: boolean;
}

export interface UtilityConnection {
  id: number;
  propertyId: number;
  floorId: number | null;
  type: string;
  referenceNumber: string | null;
  consumerNumber: string | null;
  providerName: string | null;
}

export interface BillSummary {
  propertyId: number;
  unpaidCount: number;
  totalCount: number;
}
