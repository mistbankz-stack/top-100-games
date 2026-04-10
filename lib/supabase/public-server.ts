import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getClientIp, getUserAgent } from "@/lib/server/request";

export function createSupabasePublicServer(req?: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const headers: Record<string, string> = {};

  if (req) {
    const ip = getClientIp(req);
    const ua = getUserAgent(req);

    headers["x-forwarded-for"] = ip;
    headers["user-agent"] = ua;
    headers["sb-forwarded-for"] = ip;
  }

  return createClient(url, key, {
    global: { headers },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}