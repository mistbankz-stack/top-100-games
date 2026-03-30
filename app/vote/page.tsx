"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Game = {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  release_year: number | null;
  platforms: string | null;
};

type IgdbSearchGame = {
  igdb_id: number;
  title: string;
  cover_url: string | null;
  release_year: number | null;
  platforms: string | null;
};

function sortGamesByRelevance(games: Game[], searchQuery: string) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return [...games].sort((a, b) => {
    const aTitle = a.title.toLowerCase();
    const bTitle = b.title.toLowerCase();

    const aExact = aTitle === normalizedQuery;
    const bExact = bTitle === normalizedQuery;

    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStartsWith = aTitle.startsWith(normalizedQuery);
    const bStartsWith = bTitle.startsWith(normalizedQuery);

    if (aStartsWith && !bStartsWith) return -1;
    if (!aStartsWith && bStartsWith) return 1;

    return aTitle.localeCompare(bTitle);
  });
}

export default function VotePage() {
  const TOTAL_GAMES = 10;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Game[]>([]);
  const [fallbackResults, setFallbackResults] = useState<IgdbSearchGame[]>([]);
  const [selectedGames, setSelectedGames] = useState<(Game | null)[]>(
    Array(TOTAL_GAMES).fill(null)
  );

  const [loading, setLoading] = useState(false);
  const [fallbackLoading, setFallbackLoading] = useState(false);
  const [importLoadingId, setImportLoadingId] = useState<number | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [voterEmail, setVoterEmail] = useState<string | null>(null);

  const isBallotComplete = useMemo(
    () => selectedGames.every((game) => game !== null),
    [selectedGames]
  );

  useEffect(() => {
    async function checkBallotStatus() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        const email = session?.user?.email ?? null;

        setVoterEmail(email);

        if (!token) {
          setStatusLoading(false);
          return;
        }

        const response = await fetch("/api/ballot-status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          console.error("Ballot status error:", data);
          setStatusLoading(false);
          return;
        }

        setHasVoted(data.hasVoted);
        setVoterEmail(data.voterEmail ?? email);
      } catch (error) {
        console.error("Status check error:", error);
      } finally {
        setStatusLoading(false);
      }
    }

    checkBallotStatus();
  }, []);

  useEffect(() => {
    async function searchGames() {
      setFallbackResults([]);
      setErrorMessage("");
      setSubmitMessage("");

      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("games")
        .select("id, title, slug, cover_url, release_year, platforms")
        .ilike("title", `%${query}%`)
        .limit(10);

      if (error) {
        console.error("Search error:", error.message);
        setResults([]);
      } else {
        const sortedResults = sortGamesByRelevance(data || [], query);
        setResults(sortedResults);
      }

      setLoading(false);
    }

    const timeout = setTimeout(() => {
      searchGames();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function addGameToRanking(game: Game) {
    if (hasVoted) return;

    setErrorMessage("");
    setSubmitMessage("");

    const alreadySelected = selectedGames.some(
      (selectedGame) => selectedGame?.id === game.id
    );

    if (alreadySelected) {
      setErrorMessage("That game is already in your ranking.");
      return;
    }

    const nextOpenIndex = selectedGames.findIndex((slot) => slot === null);

    if (nextOpenIndex === -1) {
      setErrorMessage("Your Top 10 is already full. Remove a game to add another.");
      return;
    }

    const updatedGames = [...selectedGames];
    updatedGames[nextOpenIndex] = game;
    setSelectedGames(updatedGames);

    setQuery("");
    setResults([]);
    setFallbackResults([]);
  }

  function removeGame(index: number) {
    if (hasVoted) return;

    const updatedGames = [...selectedGames];
    updatedGames[index] = null;

    const compactedGames = updatedGames.filter(Boolean) as Game[];
    const rebuiltGames = [
      ...compactedGames,
      ...Array(TOTAL_GAMES - compactedGames.length).fill(null),
    ];

    setSelectedGames(rebuiltGames);
    setErrorMessage("");
    setSubmitMessage("");
  }

  async function searchFullDatabase() {
    if (hasVoted) return;
    if (query.trim().length < 2) return;

    setFallbackLoading(true);
    setErrorMessage("");
    setSubmitMessage("");
    setFallbackResults([]);

    try {
      const response = await fetch("/api/igdb-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "IGDB fallback failed.");
        return;
      }

      if (!data.games || data.games.length === 0) {
        setErrorMessage("No matches found in the full database.");
        return;
      }

      setFallbackResults(data.games);
    } catch (error) {
      console.error("Fallback search error:", error);
      setErrorMessage("Something went wrong searching the full database.");
    } finally {
      setFallbackLoading(false);
    }
  }

  async function importSelectedIgdbGame(game: IgdbSearchGame) {
    if (hasVoted) return;

    setImportLoadingId(game.igdb_id);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      const response = await fetch("/api/igdb-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(game),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to import selected game.");
        return;
      }

      if (!data.game) {
        setErrorMessage("Import succeeded, but no game was returned.");
        return;
      }

      addGameToRanking(data.game);
      setFallbackResults([]);
      setQuery("");
      setResults([]);
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage("Something went wrong importing the selected game.");
    } finally {
      setImportLoadingId(null);
    }
  }

  async function submitVote() {
    if (hasVoted) {
      setErrorMessage("This email has already submitted a ballot.");
      return;
    }

    if (!isBallotComplete) {
      setErrorMessage("Fill all 10 ranking slots before submitting.");
      return;
    }

    setSubmissionLoading(true);
    setErrorMessage("");
    setSubmitMessage("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setErrorMessage("You must be logged in to submit your vote.");
        return;
      }

      const gameIds = selectedGames.map((game) => game!.id);

      const response = await fetch("/api/submit-ballot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gameIds }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "Failed to submit vote.");
        return;
      }

      setHasVoted(true);
      setSubmitMessage("Vote submitted successfully.");
      setVoterEmail(data.voterEmail ?? voterEmail);
    } catch (error) {
      console.error("Submit vote error:", error);
      setErrorMessage("Something went wrong submitting your vote.");
    } finally {
      setSubmissionLoading(false);
    }
  }

  const interactionsLocked = hasVoted || submissionLoading;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        padding: 30,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", marginBottom: 10 }}>
          Vote for Your Top 10 Games
        </h1>

        {!statusLoading && voterEmail && (
  <div
    style={{
      marginBottom: 16,
      padding: "12px 14px",
      borderRadius: 10,
      background: "#151515",
      border: "1px solid #222",
      color: "#bbb",
      fontSize: "0.95rem",
    }}
  >
    Voting as:{" "}
    <span style={{ color: "white", fontWeight: 600 }}>
      {voterEmail}
    </span>
  </div>
)}

        <p style={{ color: "#aaa", marginBottom: 30 }}>
          Search for a game, then click it to add it to the next open ranking slot.
        </p>

        {statusLoading && (
          <p style={{ color: "#aaa", marginBottom: 16 }}>Checking vote status...</p>
        )}

        {!statusLoading && hasVoted && (
          <div
            style={{
              background: "#132a13",
              border: "1px solid #1f5d1f",
              color: "#b8ffb8",
              padding: "14px 16px",
              borderRadius: 10,
              marginBottom: 20,
            }}
          >
            {voterEmail
              ? `A ballot has already been submitted for ${voterEmail}.`
              : "A ballot has already been submitted for this account."}
          </div>
        )}

        {errorMessage && (
          <p style={{ color: "#ff6b6b", marginBottom: 16 }}>{errorMessage}</p>
        )}

        {submitMessage && (
          <p style={{ color: "#7dff8a", marginBottom: 16 }}>{submitMessage}</p>
        )}

        <input
          type="text"
          placeholder="Search for a game..."
          value={query}
          disabled={interactionsLocked}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%",
            padding: "14px",
            fontSize: "16px",
            borderRadius: 8,
            border: "1px solid #333",
            marginBottom: 20,
            background: interactionsLocked ? "#0d0d0d" : "#111",
            color: "white",
          }}
        />

        {loading && <p style={{ color: "#aaa" }}>Searching...</p>}

        {results.length > 0 && (
          <div
            style={{
              display: "grid",
              gap: 16,
              marginTop: 20,
              marginBottom: 24,
            }}
          >
            {results.map((game) => (
              <button
                key={game.id}
                type="button"
                disabled={interactionsLocked}
                onClick={() => addGameToRanking(game)}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  background: "#151515",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #222",
                  cursor: interactionsLocked ? "not-allowed" : "pointer",
                  textAlign: "left",
                  color: "white",
                  opacity: interactionsLocked ? 0.7 : 1,
                }}
              >
                <img
                  src={game.cover_url || "https://placehold.co/80x100?text=No+Image"}
                  alt={game.title}
                  style={{
                    width: 80,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#222",
                    flexShrink: 0,
                  }}
                />

                <div>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>
                    {game.title}
                  </h2>

                  <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
                    Year: {game.release_year ?? "Unknown"}
                  </p>

                  <p style={{ color: "#777", margin: "6px 0 0 0" }}>
                    Platforms: {game.platforms || "Unknown"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {!loading && query.trim().length >= 2 && !hasVoted && (
          <div style={{ marginTop: 20, marginBottom: 30 }}>
            {results.length === 0 ? (
              <p style={{ color: "#aaa", marginBottom: 10 }}>No local matches found.</p>
            ) : (
              <p style={{ color: "#aaa", marginBottom: 10 }}>
                Don&apos;t see the right game? Search the full database.
              </p>
            )}

            <button
              type="button"
              onClick={searchFullDatabase}
              disabled={fallbackLoading || interactionsLocked}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "white",
                color: "black",
                cursor:
                  fallbackLoading || interactionsLocked ? "not-allowed" : "pointer",
                fontWeight: "bold",
                opacity: fallbackLoading || interactionsLocked ? 0.7 : 1,
              }}
            >
              {fallbackLoading ? "Searching full database..." : "Search full database"}
            </button>
          </div>
        )}

        {fallbackResults.length > 0 && !hasVoted && (
          <div
            style={{
              display: "grid",
              gap: 16,
              marginTop: 20,
              marginBottom: 40,
            }}
          >
            <p style={{ color: "#aaa", margin: 0 }}>
              Select the best match from the full database:
            </p>

            {fallbackResults.map((game) => (
              <button
                key={game.igdb_id}
                type="button"
                onClick={() => importSelectedIgdbGame(game)}
                disabled={importLoadingId === game.igdb_id || interactionsLocked}
                style={{
                  display: "flex",
                  gap: 16,
                  alignItems: "center",
                  background: "#151515",
                  padding: 16,
                  borderRadius: 12,
                  border: "1px solid #222",
                  cursor:
                    importLoadingId === game.igdb_id || interactionsLocked
                      ? "not-allowed"
                      : "pointer",
                  textAlign: "left",
                  color: "white",
                  opacity:
                    importLoadingId === game.igdb_id || interactionsLocked ? 0.7 : 1,
                }}
              >
                <img
                  src={game.cover_url || "https://placehold.co/80x100?text=No+Image"}
                  alt={game.title}
                  style={{
                    width: 80,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: 8,
                    background: "#222",
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1 }}>
                  <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>
                    {game.title}
                  </h2>

                  <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
                    Year: {game.release_year ?? "Unknown"}
                  </p>

                  <p style={{ color: "#777", margin: "6px 0 0 0" }}>
                    Platforms: {game.platforms || "Unknown"}
                  </p>
                </div>

                <div style={{ fontWeight: "bold", flexShrink: 0 }}>
                  {importLoadingId === game.igdb_id ? "Adding..." : "Select"}
                </div>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 16, marginBottom: 30 }}>
          {selectedGames.map((game, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                background: game ? "#151515" : "#101010",
                padding: 16,
                borderRadius: 12,
                border: "1px solid #222",
                minHeight: 120,
              }}
            >
              <div
                style={{
                  width: 60,
                  textAlign: "center",
                  fontSize: "1.4rem",
                  fontWeight: "bold",
                  color: "white",
                  flexShrink: 0,
                }}
              >
                #{index + 1}
              </div>

              {game ? (
                <>
                  <img
                    src={game.cover_url || "https://placehold.co/80x100?text=No+Image"}
                    alt={game.title}
                    style={{
                      width: 80,
                      height: 100,
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#222",
                      flexShrink: 0,
                    }}
                  />

                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>
                      {game.title}
                    </h2>

                    <p style={{ color: "#aaa", margin: "6px 0 0 0" }}>
                      Year: {game.release_year ?? "Unknown"}
                    </p>

                    <p style={{ color: "#777", margin: "6px 0 0 0" }}>
                      Platforms: {game.platforms || "Unknown"}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={interactionsLocked}
                    onClick={() => removeGame(index)}
                    aria-label={`Remove ${game.title}`}
                    title={`Remove ${game.title}`}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      border: "none",
                      background: "#2a2a2a",
                      color: "white",
                      fontSize: "1rem",
                      fontWeight: "bold",
                      cursor: interactionsLocked ? "not-allowed" : "pointer",
                      flexShrink: 0,
                      opacity: interactionsLocked ? 0.7 : 1,
                    }}
                  >
                    X
                  </button>
                </>
              ) : (
                <div style={{ color: "#666" }}>Empty slot</div>
              )}
            </div>
          ))}
        </div>

        {!hasVoted && isBallotComplete && (
          <button
            type="button"
            onClick={submitVote}
            disabled={submissionLoading || statusLoading}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 10,
              border: "none",
              background: "#ffffff",
              color: "#000000",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor:
                submissionLoading || statusLoading ? "not-allowed" : "pointer",
              opacity: submissionLoading || statusLoading ? 0.7 : 1,
            }}
          >
            {submissionLoading ? "Submitting vote..." : "Submit Vote"}
          </button>
        )}
      </div>
    </main>
  );
}