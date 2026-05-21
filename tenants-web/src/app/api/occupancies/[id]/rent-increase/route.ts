import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapRentIncrease } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("rent_increase_rules")
    .select("*")
    .eq("tenant_occupancy_id", id)
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapRentIncrease(data));
}

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.increasePercent != null) updates.increase_percent = body.increasePercent;
  if (body.nextIncreaseDate != null) updates.next_increase_date = body.nextIncreaseDate;

  const { data, error: dbError } = await supabase!
    .from("rent_increase_rules")
    .update(updates)
    .eq("tenant_occupancy_id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapRentIncrease(data));
}
