import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapBill } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  let q = supabase!
    .from("monthly_bills")
    .select("id, tenant_occupancy_id, property_id, floor_id, type, year, month, amount, is_paid, due_date, units_consumed, scraped_at, bill_html_content")
    .eq("property_id", id);

  if (year) q = q.eq("year", year);
  if (month) q = q.eq("month", month);

  const { data, error: dbError } = await q;
  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapBill));
}
