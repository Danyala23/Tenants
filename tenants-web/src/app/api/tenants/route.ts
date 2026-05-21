import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapTenant } from "@/lib/mappers";

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("tenants")
    .select("*")
    .order("name");

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapTenant));
}

export async function POST(request: Request) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const body = await request.json();

  const { data, error: dbError } = await supabase!
    .from("tenants")
    .insert({ name: body.name ?? "", phone_number: body.phoneNumber ?? "" })
    .select()
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json(mapTenant(data), { status: 201 });
}
