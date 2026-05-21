import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { fetchOccupancies } from "@/lib/occupancy-queries";
import { mapOccupancy } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  try {
    const list = await fetchOccupancies(supabase!, { propertyId: id, activeOnly: true });
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id: propertyId } = await params;
  const body = await request.json();

  let tenantId = body.tenantId as number | undefined;
  if (!tenantId) {
    const { data: tenant, error: tErr } = await supabase!
      .from("tenants")
      .insert({ name: body.name ?? "", phone_number: body.phoneNumber ?? "" })
      .select()
      .single();
    if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 });
    tenantId = tenant.id;
  }

  const { data: occ, error: oErr } = await supabase!
    .from("tenant_occupancies")
    .insert({
      tenant_id: tenantId,
      property_id: propertyId,
      floor_id: body.floorId ?? null,
      rent: body.rent,
      security_deposit: body.securityDeposit,
      start_date: body.startDate,
    })
    .select("*, tenants(name, phone_number), floors(label)")
    .single();

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });

  const startDate = new Date(body.startDate);
  const nextIncrease = new Date(startDate);
  nextIncrease.setFullYear(nextIncrease.getFullYear() + 1);

  await supabase!.from("rent_increase_rules").insert({
    tenant_occupancy_id: occ.id,
    increase_percent: 10,
    next_increase_date: nextIncrease.toISOString(),
  });

  const tenant = occ.tenants as { name: string; phone_number: string };
  const floor = occ.floors as { label: string } | null;
  return NextResponse.json(mapOccupancy(occ, tenant, floor), { status: 201 });
}
