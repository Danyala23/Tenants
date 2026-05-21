import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { fetchOccupancies } from "@/lib/occupancy-queries";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  try {
    const list = await fetchOccupancies(supabase!, { floorId: id, activeOnly: true });
    return NextResponse.json(list);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
