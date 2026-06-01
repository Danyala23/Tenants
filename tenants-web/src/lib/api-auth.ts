import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseWithAccessToken, extractBearerToken } from "@/lib/supabase/bearer";

export async function requireAuth() {
  const headerStore = await headers();
  const bearerToken = extractBearerToken(headerStore.get("authorization"));

  if (bearerToken) {
    const supabase = createSupabaseWithAccessToken(bearerToken);
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(bearerToken);
    if (error || !user) {
      return {
        supabase,
        user: null,
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    return { supabase, user, error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { supabase, user, error: null };
}
