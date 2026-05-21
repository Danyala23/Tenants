import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const { supabase, error } = await requireAuth();
  if (error) return error;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { data, error: dbError } = await supabase!
    .from("monthly_bills")
    .select("property_id, is_paid")
    .eq("year", year)
    .eq("month", month);

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });

  const byProperty = new Map<number, { unpaid: number; total: number }>();
  for (const row of data ?? []) {
    const pid = Number(row.property_id);
    const cur = byProperty.get(pid) ?? { unpaid: 0, total: 0 };
    cur.total++;
    if (!row.is_paid) cur.unpaid++;
    byProperty.set(pid, cur);
  }

  const summaries = [...byProperty.entries()].map(([propertyId, s]) => ({
    propertyId,
    unpaidCount: s.unpaid,
    totalCount: s.total,
  }));

  return NextResponse.json(summaries);
}
