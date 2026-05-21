import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapProperty } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("properties")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapProperty(data));
}

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.houseNumber != null) updates.house_number = body.houseNumber;
  if (body.address != null) updates.address = body.address;
  if (body.size != null) updates.size = body.size;

  const { data, error: dbError } = await supabase!
    .from("properties")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapProperty(data));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { error: dbError } = await supabase!.from("properties").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
