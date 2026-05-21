import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapOccupancy } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("tenant_occupancies")
    .select("*, tenants(name, phone_number), floors(label)")
    .eq("id", id)
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tenant = data.tenants as { name: string; phone_number: string };
  const floor = data.floors as { label: string } | null;
  return NextResponse.json(mapOccupancy(data, tenant, floor));
}

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.floorId !== undefined) updates.floor_id = body.floorId;
  if (body.rent != null) updates.rent = body.rent;
  if (body.securityDeposit != null) updates.security_deposit = body.securityDeposit;
  if (body.startDate != null) updates.start_date = body.startDate;

  const { data, error: dbError } = await supabase!
    .from("tenant_occupancies")
    .update(updates)
    .eq("id", id)
    .select("*, tenants(name, phone_number), floors(label)")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  const tenant = data.tenants as { name: string; phone_number: string };
  const floor = data.floors as { label: string } | null;
  return NextResponse.json(mapOccupancy(data, tenant, floor));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { error: dbError } = await supabase!
    .from("tenant_occupancies")
    .delete()
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
