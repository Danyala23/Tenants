import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapUtility } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

function nullIfEmpty(s: string | null | undefined) {
  const t = s?.trim();
  return t ? t : null;
}

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("utility_connections")
    .select("*")
    .eq("property_id", id);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapUtility));
}

export async function POST(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const { data, error: dbError } = await supabase!
    .from("utility_connections")
    .insert({
      property_id: id,
      floor_id: body.floorId ?? null,
      type: body.type ?? "Gas",
      reference_number: nullIfEmpty(body.referenceNumber),
      consumer_number: nullIfEmpty(body.consumerNumber),
      provider_name: nullIfEmpty(body.providerName),
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapUtility(data), { status: 201 });
}
