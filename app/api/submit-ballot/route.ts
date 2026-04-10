import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp, normalizeEmail } from "@/lib/server/request";
import { sweepOldBuckets, tokenBucketLimit } from "@/lib/server/rate-limit";

type SubmitBallotPayload = {
  gameIds: number[];
};

const TOTAL_GAMES = 10;

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  sweepOldBuckets();

  const ip = getClientIp(req);

  // 6 submit attempts per 10 minutes per IP
  const ipLimit = tokenBucketLimit({
    key: `submit-ballot:ip:${ip}`,
    capacity: 6,
    refillPerSecond: 6 / 600,
  });

  if (!ipLimit.ok) {
    return NextResponse.json(
      {
        error: "Too many submission attempts. Please wait and try again.",
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

    if (!user.email_confirmed_at) {
      return NextResponse.json(
        { error: "Email not confirmed." },
        { status: 403 }
      );
    }

    const body = (await req.json()) as SubmitBallotPayload;

    if (!Array.isArray(body.gameIds)) {
      return NextResponse.json(
        { error: "gameIds must be an array." },
        { status: 400 }
      );
    }

    if (body.gameIds.length !== TOTAL_GAMES) {
      return NextResponse.json(
        { error: `You must submit exactly ${TOTAL_GAMES} ranked games.` },
        { status: 400 }
      );
    }

    const normalizedGameIds = body.gameIds.map((id) => Number(id));

    const hasInvalidIds = normalizedGameIds.some(
      (id) => !Number.isInteger(id) || id <= 0
    );

    if (hasInvalidIds) {
      return NextResponse.json(
        { error: "All gameIds must be valid positive integers." },
        { status: 400 }
      );
    }

    const uniqueIds = new Set(normalizedGameIds);

    if (uniqueIds.size !== TOTAL_GAMES) {
      return NextResponse.json(
        { error: "Your ballot must contain 10 unique games." },
        { status: 400 }
      );
    }

    const voterEmail = normalizeEmail(user.email);

    const { data: existingBallot, error: existingBallotError } = await supabase
      .from("ballots")
      .select("id")
      .eq("voter_email", voterEmail)
      .maybeSingle();

    if (existingBallotError) {
      console.error("Existing ballot check error:", existingBallotError);

      return NextResponse.json(
        { error: "Failed to check for an existing ballot." },
        { status: 500 }
      );
    }

    if (existingBallot) {
      return NextResponse.json(
        { error: "This email has already submitted a ballot." },
        { status: 409 }
      );
    }

    const { data: games, error: gamesError } = await supabase
      .from("games")
      .select("id, title")
      .in("id", normalizedGameIds);

    if (gamesError) {
      console.error("Games lookup error:", gamesError);

      return NextResponse.json(
        { error: "Failed to look up selected games." },
        { status: 500 }
      );
    }

    if (!games || games.length !== TOTAL_GAMES) {
      return NextResponse.json(
        { error: "One or more selected games could not be found." },
        { status: 400 }
      );
    }

    const titleById = new Map<number, string>();

    for (const game of games) {
      titleById.set(game.id, game.title);
    }

    const rankedTitles = normalizedGameIds.map((id) => titleById.get(id));

    if (rankedTitles.some((title) => !title)) {
      return NextResponse.json(
        { error: "Could not resolve every selected game to a title." },
        { status: 400 }
      );
    }

    const insertPayload = {
      voter_email: voterEmail,
      rank_1_name: rankedTitles[0]!,
      rank_2_name: rankedTitles[1]!,
      rank_3_name: rankedTitles[2]!,
      rank_4_name: rankedTitles[3]!,
      rank_5_name: rankedTitles[4]!,
      rank_6_name: rankedTitles[5]!,
      rank_7_name: rankedTitles[6]!,
      rank_8_name: rankedTitles[7]!,
      rank_9_name: rankedTitles[8]!,
      rank_10_name: rankedTitles[9]!,
    };

    const { data: insertedBallot, error: insertError } = await supabase
      .from("ballots")
      .insert(insertPayload)
      .select("id, voter_email, submitted_at")
      .single();

    if (insertError) {
      console.error("Ballot insert error:", insertError);

      const message = insertError.message?.toLowerCase() ?? "";

      if (
        message.includes("duplicate") ||
        message.includes("unique") ||
        message.includes("ballots_voter_email_unique_idx") ||
        (insertError as { code?: string }).code === "23505"
      ) {
        return NextResponse.json(
          { error: "This email has already submitted a ballot." },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: "Failed to submit ballot." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ballotId: insertedBallot.id,
      voterEmail: insertedBallot.voter_email,
      submittedAt: insertedBallot.submitted_at,
    });
  } catch (error) {
    console.error("Submit ballot error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}