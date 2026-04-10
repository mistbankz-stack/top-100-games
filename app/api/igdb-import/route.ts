import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getClientIp } from "@/lib/server/request";
import { sweepOldBuckets, tokenBucketLimit } from "@/lib/server/rate-limit";

export const runtime = "nodejs";

type ImportGamePayload = {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  platforms: string | null;
};

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function isTrustedCoverUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith("igdb.com");
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  sweepOldBuckets();

  const ip = getClientIp(req);

  // 30 imports per minute per IP
  const ipLimit = tokenBucketLimit({
    key: `igdb-import:ip:${ip}`,
    capacity: 30,
    refillPerSecond: 0.5,
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
      error: userErr,
    } = await supabase.auth.getUser(token);

    if (userErr || !user?.email) {
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

    const email = user.email.toLowerCase();

    // 40 imports per hour per user
    const userLimit = tokenBucketLimit({
      key: `igdb-import:user:${email}`,
      capacity: 10,
      refillPerSecond: 40 / 3600,
    });

    if (!userLimit.ok) {
      return NextResponse.json(
        { error: "Too many imports.", code: "RATE_LIMITED_USER" },
        {
          status: 429,
          headers: {
            "Retry-After": String(userLimit.retryAfterSeconds),
          },
        }
      );
    }

    const body = (await req.json()) as ImportGamePayload;

    if (!body?.igdb_id || typeof body.igdb_id !== "number" || !body.title) {
      return NextResponse.json(
        { error: "Missing required game data." },
        { status: 400 }
      );
    }

    const title = String(body.title).trim();

    if (title.length < 1 || title.length > 200) {
      return NextResponse.json({ error: "Invalid title." }, { status: 400 });
    }

    const slug = slugify(title);

    const coverUrl =
      body.cover_url && isTrustedCoverUrl(body.cover_url) ? body.cover_url : null;

    const releaseYear =
      typeof body.release_year === "number" &&
      body.release_year >= 1950 &&
      body.release_year <= 2100
        ? body.release_year
        : null;

    const platforms =
      typeof body.platforms === "string" && body.platforms.length <= 400
        ? body.platforms
        : null;

    const { data, error } = await supabase
      .from("games")
      .upsert(
        {
          title,
          slug,
          cover_url: coverUrl,
          release_year: releaseYear,
          platforms,
          source: "igdb",
          source_id: String(body.igdb_id),
        },
        {
          onConflict: "source,source_id",
        }
      )
      .select("id, title, slug, cover_url, release_year, platforms")
      .single();

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({ game: data });
  } catch (error) {
    console.error("IGDB import error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}