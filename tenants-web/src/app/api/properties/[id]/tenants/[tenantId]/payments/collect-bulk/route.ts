import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { mapRentPayment } from "@/lib/mappers";

type Params = { params: Promise<{ id: string; tenantId: string }> };

export async function PUT(request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id: propertyId, tenantId } = await params;
  const body = await request.json();

  const { data: occupancies, error: oErr } = await supabase!
    .from("tenant_occupancies")
    .select("id, rent")
    .eq("property_id", propertyId)
    .eq("tenant_id", tenantId)
    .is("end_date", null);

  if (oErr) return NextResponse.json({ error: oErr.message }, { status: 500 });
  if (!occupancies?.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const occIds = new Set(occupancies.map((o) => o.id));
  const allocByOcc = new Map(
    (body.allocations as { occupancyId: number; amountPaid: number }[]).map((a) => [
      a.occupancyId,
      a,
    ])
  );

  for (const alloc of body.allocations ?? []) {
    if (!occIds.has(alloc.occupancyId)) {
      return NextResponse.json(
        { error: `Occupancy ${alloc.occupancyId} does not belong to tenant` },
        { status: 400 }
      );
    }
  }
  for (const occId of occIds) {
    if (!allocByOcc.has(occId)) {
      return NextResponse.json(
        { error: `Missing allocation for occupancy ${occId}` },
        { status: 400 }
      );
    }
  }

  const collectedAt = body.collectedAt ?? new Date().toISOString();
  const results = [];

  for (const occ of occupancies) {
    const alloc = allocByOcc.get(occ.id)!;
    const isPaid = alloc.amountPaid >= Number(occ.rent);

    const { data: existing } = await supabase!
      .from("rent_payments")
      .select("id")
      .eq("tenant_occupancy_id", occ.id)
      .eq("year", body.year)
      .eq("month", body.month)
      .maybeSingle();

    if (existing) {
      const { data, error: uErr } = await supabase!
        .from("rent_payments")
        .update({
          amount_paid: alloc.amountPaid,
          is_paid: isPaid,
          collected_at: collectedAt,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });
      results.push(mapRentPayment(data));
    } else {
      const { data, error: iErr } = await supabase!
        .from("rent_payments")
        .insert({
          tenant_occupancy_id: occ.id,
          year: body.year,
          month: body.month,
          amount_paid: alloc.amountPaid,
          is_paid: isPaid,
          collected_at: collectedAt,
        })
        .select()
        .single();
      if (iErr) return NextResponse.json({ error: iErr.message }, { status: 500 });
      results.push(mapRentPayment(data));
    }
  }

  return NextResponse.json(results);
}
