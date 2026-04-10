import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabasePublicServer } from "@/lib/supabase/public-server";
import {
  getClientIp,
  isValidEmail,
  normalizeEmail,
} from "@/lib/server/request";
import { sweepOldBuckets, tokenBucketLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

const MAGIC_LINK_COOLDOWN_MINUTES = 60;

function getRedirectTo() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set.");
  }

  return `${siteUrl.replace(/\/$/, "")}/auth/callback`;
}

function getMinutesSince(dateString: string) {
  const then = new Date(dateString).getTime();
  const now = Date.now();
  return (now - then) / (1000 * 60);
}

export async function POST(request: NextRequest) {
  sweepOldBuckets();

  const ip = getClientIp(request);

  // 8 requests per 10 minutes per IP
  const ipLimit = tokenBucketLimit({
    key: `magic-link:ip:${ip}`,
    capacity: 8,
    refillPerSecond: 8 / 600,
  });

  if (!ipLimit.ok) {
    return NextResponse.json(
      {
        error: "Too many requests. Please wait a bit before trying again.",
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(ipLimit.retryAfterSeconds),
        },
      }
    );
  }

  try {
    const body = await request.json();
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = normalizeEmail(rawEmail);

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdmin(request);

    const { data: existingBallot, error: ballotError } = await supabaseAdmin
      .from("ballots")
      .select("id")
      .eq("voter_email", email)
      .maybeSingle();

    if (ballotError) {
      console.error("Ballot check failed:", ballotError);
      return NextResponse.json(
        { error: `Ballot check failed: ${ballotError.message}` },
        { status: 500 }
      );
    }

    if (existingBallot) {
      return NextResponse.json(
        {
          error: "This email has already submitted a vote.",
          code: "ALREADY_VOTED",
        },
        { status: 409 }
      );
    }

    const { data: existingRequest, error: existingRequestError } =
      await supabaseAdmin
        .from("auth_magic_link_requests")
        .select("email, request_count, last_requested_at")
        .eq("email", email)
        .maybeSingle();

    if (existingRequestError) {
      console.error("Magic link request lookup failed:", existingRequestError);
      return NextResponse.json(
        {
          error: `Magic link request lookup failed: ${existingRequestError.message}`,
        },
        { status: 500 }
      );
    }

    if (existingRequest?.last_requested_at) {
      const minutesSinceLastRequest = getMinutesSince(
        existingRequest.last_requested_at
      );

      if (minutesSinceLastRequest < MAGIC_LINK_COOLDOWN_MINUTES) {
        const minutesRemaining = Math.ceil(
          MAGIC_LINK_COOLDOWN_MINUTES - minutesSinceLastRequest
        );

        return NextResponse.json(
          {
            error: `A magic link was already sent recently. Please check your inbox or wait ${minutesRemaining} more minute${
              minutesRemaining === 1 ? "" : "s"
            } before requesting another.`,
            code: "MAGIC_LINK_COOLDOWN_ACTIVE",
          },
          { status: 429 }
        );
      }
    }

    const redirectTo = getRedirectTo();

    const supabasePublic = createSupabasePublicServer(request);

    const { error: signInError } = await supabasePublic.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });

    if (signInError) {
      console.error("Failed to send magic link:", signInError);
      return NextResponse.json(
        { error: `Failed to send magic link: ${signInError.message}` },
        { status: 500 }
      );
    }

    const nextRequestCount = (existingRequest?.request_count ?? 0) + 1;
    const nowIso = new Date().toISOString();

    const { error: upsertError } = await supabaseAdmin
      .from("auth_magic_link_requests")
      .upsert(
        {
          email,
          request_count: nextRequestCount,
          last_requested_at: nowIso,
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      console.error("Failed to record magic link request:", upsertError);
    }

    return NextResponse.json({
      success: true,
      message: "Magic link sent. Check your email.",
    });
  } catch (error) {
    console.error("Unexpected request-magic-link error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}