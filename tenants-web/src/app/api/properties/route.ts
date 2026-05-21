import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapProperty } from "@/lib/mappers";

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("properties")
    .select("*")
    .order("address");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapProperty));
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const body = await request.json();
  const { data, error: dbError } = await supabase!
    .from("properties")
    .insert({
      house_number: body.houseNumber ?? "",
      address: body.address ?? "",
      size: body.size ?? 0,
    })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapProperty(data), { status: 201 });
}
