import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapFloor } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("floors")
    .select("*")
    .eq("property_id", id)
    .order("floor_number");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapFloor));
}

export async function POST(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const { data, error: dbError } = await supabase!
    .from("floors")
    .insert({
      property_id: id,
      floor_number: body.floorNumber,
      label: body.label ?? "",
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapFloor(data), { status: 201 });
}
