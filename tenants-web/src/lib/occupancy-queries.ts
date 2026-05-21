import type { SupabaseClient } from "@supabase/supabase-js";
import { mapOccupancy } from "./mappers";

export async function fetchOccupancies(
  supabase: SupabaseClient,
  filter: { propertyId?: string; floorId?: string; tenantId?: string; activeOnly?: boolean }
) {
  let q = supabase
    .from("tenant_occupancies")
    .select("*, tenants(name, phone_number), floors(label)");

  if (filter.propertyId) q = q.eq("property_id", filter.propertyId);
  if (filter.floorId) q = q.eq("floor_id", filter.floorId);
  if (filter.tenantId) q = q.eq("tenant_id", filter.tenantId);
  if (filter.activeOnly) q = q.is("end_date", null);

  const { data, error } = await q;
  if (error) throw error;

  return (data ?? []).map((row) => {
    const tenant = row.tenants as { name: string; phone_number: string } | null;
    const floor = row.floors as { label: string } | null;
    return mapOccupancy(row, tenant ?? undefined, floor);
  });
}
