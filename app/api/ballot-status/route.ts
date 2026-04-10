import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/server/request";
import { sweepOldBuckets, tokenBucketLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  sweepOldBuckets();

  const ip = getClientIp(req);

  // 30 checks per 10 minutes per IP
  const ipLimit = tokenBucketLimit({
    key: `ballot-status:ip:${ip}`,
    capacity: 30,
    refillPerSecond: 30 / 600,
  });

  if (!ipLimit.ok) {
    return NextResponse.json(
      { error: "Too many requests.", code: "RATE_LIMITED" },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipLimit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const supabase = createSupabaseAdmin(req);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Invalid or expired session." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("ballots")
      .select("id, submitted_at")
      .eq("voter_email", user.email)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      hasVoted: !!data,
      voterEmail: user.email,
      submittedAt: data?.submitted_at ?? null,
    });
  } catch (error) {
    console.error("Ballot status error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}