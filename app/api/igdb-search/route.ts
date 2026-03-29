import { NextRequest, NextResponse } from "next/server";

type IgdbGame = {
  id: number;
  name: string;
  category?: number;
  version_parent?: number | null;
  parent_game?: number | null;
  first_release_date?: number;
  cover?: {
    url?: string;
  };
  platforms?: { name: string }[];
};

type SearchResultGame = {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  platforms: string | null;
};

function normalizeTitle(title: string) {
  return title.trim().toLowerCase();
}

function isLikelyBaseGame(game: IgdbGame) {
  const title = game.name.toLowerCase().trim();

  const blockedPhrases = [
    "friend's pass",
    "friends pass",
    "season pass",
    "dlc",
    "expansion",
    "expansion pack",
    "soundtrack",
    "bundle",
    "double pack",
    "triple pack",
    "collection",
    "anthology",
    "compilation",
    "combo pack",
    "game pack",
    "add-on",
    "add on",
    "addon",
    "upgrade",
    "upgrade pack",
    "character pass",
    "starter pack",
    "cosmetic pack",
    "skin pack",
    "map pack",
    "bonus content",
    "art book",
    "artbook",
    "ost",
    "demo",
    "beta",
    "test server",
    "public test",
    "pts",
    "trial",
    "free trial",
    "closed beta",
    "open beta",
    "deluxe edition",
    "ultimate edition",
    "gold edition",
    "collector's edition",
    "collectors edition",
    "complete edition upgrade",
    "definitive edition upgrade",
    "game of the year edition",
    "goty edition",
  ];

  if (blockedPhrases.some((phrase) => title.includes(phrase))) {
    return false;
  }

  // Strong bundle filter (safe)
  if (title.includes(" + ")) {
    return false;
  }

  // Catch "2 in 1", "3 in 1", etc.
  if (/\b\d+\s+in\s+1\b/.test(title)) {
    return false;
  }

  // IGDB structural filter
  if (game.parent_game || game.version_parent) {
    return false;
  }

  return true;
}

function scoreGame(game: SearchResultGame, searchQuery: string) {
  const title = game.title.toLowerCase();
  const query = searchQuery.trim().toLowerCase();
  const platforms = (game.platforms || "").toLowerCase();

  let score = 0;

  // Strong relevance boosts
  if (title === query) score += 1000;
  if (title.startsWith(query)) score += 300;
  if (title.includes(query)) score += 100;

  // Prefer entries with platform data
  if (game.platforms) score += game.platforms.length;

  // Prefer major/mainstream platforms
  if (platforms.includes("playstation")) score += 20;
  if (platforms.includes("xbox")) score += 20;
  if (platforms.includes("pc")) score += 20;
  if (platforms.includes("windows")) score += 10;
  if (platforms.includes("switch")) score += 10;

  // Prefer broader releases
  if ((game.platforms || "").includes(",")) score += 15;

  // De-prioritize likely secondary/odd ports
  if (platforms.includes("nintendo ds")) score -= 15;
  if (platforms.includes("legacy mobile")) score -= 20;
  if (platforms.includes("mobile")) score -= 10;
  if (platforms.includes("wii")) score -= 5;

  return score;
}

function dedupeByTitle(games: SearchResultGame[], searchQuery: string) {
  const bestByTitle = new Map<string, SearchResultGame>();

  for (const game of games) {
    const normalizedTitle = normalizeTitle(game.title);
    const existing = bestByTitle.get(normalizedTitle);

    if (!existing) {
      bestByTitle.set(normalizedTitle, game);
      continue;
    }

    const existingScore = scoreGame(existing, searchQuery);
    const newScore = scoreGame(game, searchQuery);

    if (newScore > existingScore) {
      bestByTitle.set(normalizedTitle, game);
    }
  }

  return Array.from(bestByTitle.values());
}

function sortByRelevance(games: SearchResultGame[], searchQuery: string) {
  return [...games].sort((a, b) => {
    const aScore = scoreGame(a, searchQuery);
    const bScore = scoreGame(b, searchQuery);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return a.title.localeCompare(b.title);
  });
}

async function getTwitchAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Twitch credentials in environment variables.");
  }

  const response = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get Twitch token: ${text}`);
  }

  const data = await response.json();
  return data.access_token as string;
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string" || query.trim().length < 2) {
      return NextResponse.json(
        { error: "Query must be at least 2 characters." },
        { status: 400 }
      );
    }

    const safeQuery = query.replace(/"/g, "").trim();
    const accessToken = await getTwitchAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID!;

    const igdbResponse = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body: `
        search "${safeQuery}";
        fields name, category, version_parent, parent_game, first_release_date, cover.url, platforms.name;
        limit 20;
      `,
    });

    if (!igdbResponse.ok) {
      const text = await igdbResponse.text();
      throw new Error(`IGDB search failed: ${text}`);
    }

    const games = (await igdbResponse.json()) as IgdbGame[];

    // Step 1: remove likely DLC / passes / editions / add-ons
    const filteredGames = games.filter(isLikelyBaseGame);

    // Step 2: format
    const formattedGames: SearchResultGame[] = filteredGames.map((game) => ({
      igdb_id: game.id,
      title: game.name,
      cover_url: game.cover?.url
        ? `https:${game.cover.url.replace("t_thumb", "t_cover_big")}`
        : null,
      release_year: game.first_release_date
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null,
      platforms: game.platforms?.length
        ? game.platforms.map((p) => p.name).join(", ")
        : null,
    }));

    // Step 3: collapse exact duplicate titles
    const dedupedGames = dedupeByTitle(formattedGames, safeQuery);

    // Step 4: sort by best match
    const sortedGames = sortByRelevance(dedupedGames, safeQuery);

    return NextResponse.json({ games: sortedGames });
  } catch (error) {
    console.error("IGDB search error:", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown server error.",
      },
      { status: 500 }
    );
  }
}