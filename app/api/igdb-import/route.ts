import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ImportGamePayload = {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  platforms: string | null;
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ImportGamePayload;

    if (!body.igdb_id || !body.title) {
      return NextResponse.json(
        { error: "Missing required game data." },
        { status: 400 }
      );
    }

    const slug = slugify(body.title);

    const { data, error } = await supabase
      .from("games")
      .upsert(
        {
          title: body.title,
          slug,
          cover_url: body.cover_url,
          release_year: body.release_year,
          platforms: body.platforms,
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