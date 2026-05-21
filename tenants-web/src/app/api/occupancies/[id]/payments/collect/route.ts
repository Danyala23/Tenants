import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapRentPayment } from "@/lib/mappers";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id: occupancyId } = await params;
  const body = await request.json();

  const { data: occupancy, error: oErr } = await supabase!
    .from("tenant_occupancies")
    .select("rent")
    .eq("id", occupancyId)
    .single();

  if (oErr || !occupancy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const collectedAt = body.collectedAt ?? new Date().toISOString();
  const isPaid = body.amountPaid >= Number(occupancy.rent);

  const { data: existing } = await supabase!
    .from("rent_payments")
    .select("*")
    .eq("tenant_occupancy_id", occupancyId)
    .eq("year", body.year)
    .eq("month", body.month)
    .maybeSingle();

  let payment;
  if (existing) {
    const { data, error: uErr } = await supabase!
      .from("rent_payments")
      .update({
        amount_paid: body.amountPaid,
        is_paid: isPaid,
        collected_at: collectedAt,
      })
      .eq("id", existing.id)
      .select()
      .single();
    if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
    payment = data;
  } else {
    const { data, error: iErr } = await supabase!
      .from("rent_payments")
      .insert({
        tenant_occupancy_id: occupancyId,
        year: body.year,
        month: body.month,
        amount_paid: body.amountPaid,
        is_paid: isPaid,
        collected_at: collectedAt,
      })
      .select()
      .single();
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
    payment = data;
  }

  return NextResponse.json(mapRentPayment(payment));
}
