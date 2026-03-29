import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type SubmitBallotPayload = {
  gameIds: number[];
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authorization token." },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();

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

    const body = (await req.json()) as SubmitBallotPayload;

    if (!Array.isArray(body.gameIds)) {
      return NextResponse.json(
        { error: "gameIds must be an array." },
        { status: 400 }
      );
    }

    if (body.gameIds.length !== 10) {
      return NextResponse.json(
        { error: "You must submit exactly 10 ranked games." },
        { status: 400 }
      );
    }

    const uniqueIds = new Set(body.gameIds);
    if (uniqueIds.size !== 10) {
      return NextResponse.json(
        { error: "Your ballot must contain 10 unique games." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase.rpc("submit_ballot", {
      p_voter_email: user.email,
      p_game_ids: body.gameIds,
    });

    if (error) {
      const message = error.message || "Failed to submit ballot.";

      if (message.toLowerCase().includes("already submitted")) {
        return NextResponse.json(
          { error: "This email has already submitted a ballot." },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      ballotId: data,
      voterEmail: user.email,
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