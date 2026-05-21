import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapUtility } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

function nullIfEmpty(s: string | null | undefined) {
  const t = s?.trim();
  return t ? t : null;
}

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const updates: Record<string, unknown> = {};
  if (body.floorId !== undefined) updates.floor_id = body.floorId;
  if (body.referenceNumber != null) updates.reference_number = nullIfEmpty(body.referenceNumber);
  if (body.consumerNumber != null) updates.consumer_number = nullIfEmpty(body.consumerNumber);
  if (body.providerName != null) updates.provider_name = nullIfEmpty(body.providerName);

  const { data, error: dbError } = await supabase!
    .from("utility_connections")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapUtility(data));
}

export async function DELETE(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { error: dbError } = await supabase!
    .from("utility_connections")
    .delete()
    .eq("id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
