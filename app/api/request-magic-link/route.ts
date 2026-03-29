import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getRedirectTo() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not set.");
  }

  return `${siteUrl.replace(/\/$/, "")}/auth/callback`;
}

export async function POST(request: NextRequest) {
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

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { count: recentRequestCount, error: requestCountError } =
      await supabaseAdmin
        .from("auth_magic_link_requests")
        .select("*", { count: "exact", head: true })
        .eq("email", email)
        .gte("created_at", oneHourAgo);

    if (requestCountError) {
      console.error("Magic link count check failed:", requestCountError);
      return NextResponse.json(
        { error: `Magic link count check failed: ${requestCountError.message}` },
        { status: 500 }
      );
    }

    if ((recentRequestCount ?? 0) >= 2) {
      return NextResponse.json(
        {
          error: "A magic link has already been sent.",
          code: "MAGIC_LINK_LIMIT_REACHED",
        },
        { status: 429 }
      );
    }

    const redirectTo = getRedirectTo();

    const { error: signInError, data: signInData } =
      await supabasePublic.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

    console.log("signInWithOtp result:", { signInData, signInError, redirectTo });

    if (signInError) {
      console.error("Failed to send magic link:", signInError);
      return NextResponse.json(
        { error: `Failed to send magic link: ${signInError.message}` },
        { status: 500 }
      );
    }

    const { error: insertError } = await supabaseAdmin
      .from("auth_magic_link_requests")
      .insert({ email });

    if (insertError) {
      console.error("Failed to record magic link request:", insertError);
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