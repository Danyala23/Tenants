import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapTenant } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("tenants")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(mapTenant(data));
}

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.name != null) updates.name = body.name;
  if (body.phoneNumber != null) updates.phone_number = body.phoneNumber;

  const { data, error: dbError } = await supabase!
    .from("tenants")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapTenant(data));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { error: dbError } = await supabase!.from("tenants").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
