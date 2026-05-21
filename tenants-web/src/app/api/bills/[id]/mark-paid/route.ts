import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

type Params = { params: Promise<{ id: string }> };

export async function PUT(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data: bill, error: fetchErr } = await supabase!
    .from("monthly_bills")
    .select("is_paid")
    .eq("id", id)
    .single();

  if (fetchErr || !bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error: dbError } = await supabase!
    .from("monthly_bills")
    .update({ is_paid: !bill.is_paid })
    .eq("id", id)
    .select("is_paid")
    .single();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ isPaid: data.is_paid });
}
