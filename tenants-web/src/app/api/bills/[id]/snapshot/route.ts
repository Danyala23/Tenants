import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { injectBillViewerScript } from "@/lib/html-cleaner";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { supabase, error } = await requireAuth();
  if (error) return error;
  const { id } = await params;

  const { data, error: dbError } = await supabase!
    .from("monthly_bills")
    .select("bill_html_content")
    .eq("id", id)
    .maybeSingle();

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  if (!data?.bill_html_content) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const html = injectBillViewerScript(data.bill_html_content);
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
