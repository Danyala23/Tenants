import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapRentPayment } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id: occupancyId } = await params;

  const { data: occupancy, error: oErr } = await supabase!
    .from("tenant_occupancies")
    .select("start_date, rent")
    .eq("id", occupancyId)
    .single();

  if (oErr || !occupancy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: payments, error: pErr } = await supabase!
    .from("rent_payments")
    .select("*")
    .eq("tenant_occupancy_id", occupancyId);

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const lookup = new Map(
    (payments ?? []).map((p) => [`${p.year}-${p.month}`, p])
  );

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const start = new Date(occupancy.start_date);
  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1;

  const result = [];
  for (let y = startYear; y <= currentYear; y++) {
    const mStart = y === startYear ? startMonth : 1;
    const mEnd = y === currentYear ? currentMonth : 12;
    for (let m = mStart; m <= mEnd; m++) {
      const key = `${y}-${m}`;
      const p = lookup.get(key);
      if (p) {
        result.push(mapRentPayment(p));
      } else {
        result.push({
          id: 0,
          tenantOccupancyId: Number(occupancyId),
          year: y,
          month: m,
          isPaid: false,
          amountPaid: 0,
          collectedAt: null,
        });
      }
    }
  }

  result.sort((a, b) => b.year - a.year || b.month - a.month);
  return NextResponse.json(result);
}
