import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapOccupancy } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const today = new Date().toISOString().slice(0, 10);
  const { data, error: dbError } = await supabase!
    .from("tenant_occupancies")
    .update({ end_date: today })
    .eq("id", id)
    .select("*, tenants(name, phone_number), floors(label)")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  const tenant = data.tenants as { name: string; phone_number: string };
  const floor = data.floors as { label: string } | null;
  return NextResponse.json(mapOccupancy(data, tenant, floor));
}
