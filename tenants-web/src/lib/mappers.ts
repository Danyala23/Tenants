import type {
  Bill,
  Floor,
  Occupancy,
  Property,
  RentIncreaseRule,
  RentPayment,
  Tenant,
  UtilityConnection,
} from "./types";

export function mapProperty(row: Record<string, unknown>): Property {
  return {
    id: Number(row.id),
    houseNumber: String(row.house_number ?? ""),
    address: String(row.address ?? ""),
    size: Number(row.size ?? 0),
    createdAt: String(row.created_at ?? ""),
  };
}

export function mapFloor(row: Record<string, unknown>): Floor {
  return {
    id: Number(row.id),
    propertyId: Number(row.property_id),
    floorNumber: Number(row.floor_number),
    label: String(row.label ?? ""),
  };
}

export function mapTenant(row: Record<string, unknown>): Tenant {
  return {
    id: Number(row.id),
    name: String(row.name ?? ""),
    phoneNumber: String(row.phone_number ?? ""),
  };
}

export function mapOccupancy(
  row: Record<string, unknown>,
  tenant?: { name: string; phone_number: string },
  floor?: { label: string } | null
): Occupancy {
  const floorId = row.floor_id != null ? Number(row.floor_id) : null;
  return {
    id: Number(row.id),
    tenantId: Number(row.tenant_id),
    tenantName: tenant?.name ?? String(row.tenant_name ?? ""),
    tenantPhone: tenant?.phone_number ?? String(row.tenant_phone ?? ""),
    propertyId: Number(row.property_id),
    floorId,
    floorLabel: floor?.label ?? (row.floor_label != null ? String(row.floor_label) : null),
    isWholeProperty: floorId == null,
    rent: Number(row.rent ?? 0),
    securityDeposit: Number(row.security_deposit ?? 0),
    startDate: String(row.start_date ?? "").slice(0, 10),
  };
}

export function mapBill(row: Record<string, unknown>): Bill {
  return {
    id: Number(row.id),
    tenantOccupancyId:
      row.tenant_occupancy_id != null ? Number(row.tenant_occupancy_id) : null,
    propertyId: Number(row.property_id),
    floorId: row.floor_id != null ? Number(row.floor_id) : null,
    type: String(row.type ?? ""),
    year: Number(row.year),
    month: Number(row.month),
    amount: Number(row.amount ?? 0),
    isPaid: Boolean(row.is_paid),
    dueDate: row.due_date != null ? String(row.due_date) : null,
    unitsConsumed: row.units_consumed != null ? Number(row.units_consumed) : null,
    scrapedAt: row.scraped_at != null ? String(row.scraped_at) : null,
    hasSnapshot: Boolean(row.bill_html_content),
  };
}

export function mapUtility(row: Record<string, unknown>): UtilityConnection {
  return {
    id: Number(row.id),
    propertyId: Number(row.property_id),
    floorId: row.floor_id != null ? Number(row.floor_id) : null,
    type: String(row.type ?? ""),
    referenceNumber: row.reference_number != null ? String(row.reference_number) : null,
    consumerNumber: row.consumer_number != null ? String(row.consumer_number) : null,
    providerName: row.provider_name != null ? String(row.provider_name) : null,
  };
}

export function mapRentPayment(row: Record<string, unknown>): RentPayment {
  return {
    id: Number(row.id),
    tenantOccupancyId: Number(row.tenant_occupancy_id),
    year: Number(row.year),
    month: Number(row.month),
    isPaid: Boolean(row.is_paid),
    amountPaid: Number(row.amount_paid ?? 0),
    collectedAt: row.collected_at != null ? String(row.collected_at) : null,
  };
}

export function mapRentIncrease(row: Record<string, unknown>): RentIncreaseRule {
  return {
    id: Number(row.id),
    tenantOccupancyId: Number(row.tenant_occupancy_id),
    increasePercent: Number(row.increase_percent ?? 10),
    nextIncreaseDate: String(row.next_increase_date ?? ""),
  };
}
