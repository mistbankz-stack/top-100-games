"use client";

import Link from "next/link";
import { CSS } from "@dnd-kit/utilities";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useMemo, useRef, useState } from "react";
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

type SearchMode = "clean" | "expanded";

const TOTAL_GAMES = 10;
const DRAFT_STORAGE_KEY = "top-100-games-ballot-draft";

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

    const aContains = aTitle.includes(normalizedQuery);
    const bContains = bTitle.includes(normalizedQuery);

    if (aContains && !bContains) return -1;
    if (!aContains && bContains) return 1;

    return aTitle.localeCompare(bTitle);
  });
}

function getPointsForRank(rank: number) {
  return TOTAL_GAMES + 1 - rank;
}

function getGameImage(coverUrl: string | null) {
  return coverUrl || "https://placehold.co/80x100?text=No+Image";
}

function moveFilledGame(
  games: (Game | null)[],
  fromIndex: number,
  toIndex: number
): (Game | null)[] {
  const filled = games.filter(Boolean) as Game[];

  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= filled.length ||
    toIndex >= filled.length
  ) {
    return games;
  }

  const updated = [...filled];
  const [moved] = updated.splice(fromIndex, 1);
  updated.splice(toIndex, 0, moved);

  return [...updated, ...Array(TOTAL_GAMES - updated.length).fill(null)];
}

type SortableBallotItemProps = {
  slotId: string;
  game: Game;
  index: number;
  selectedCount: number;
  interactionsLocked: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  isMobileLayout: boolean;
};

function SortableBallotItem({
  slotId,
  game,
  index,
  selectedCount,
  interactionsLocked,
  onMoveUp,
  onMoveDown,
  onRemove,
  isMobileLayout,
}: SortableBallotItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: slotId,
    disabled: interactionsLocked,
  });

  const rank = index + 1;
  const points = getPointsForRank(rank);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.82 : 1,
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: "flex",
        gap: 12,
        alignItems: "center",
        background: "rgba(16,16,16,0.94)",
        padding: isMobileLayout ? 12 : 14,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.07)",
        minHeight: isMobileLayout ? 108 : 118,
        boxShadow: isDragging ? "0 14px 36px rgba(0,0,0,0.36)" : "none",
      }}
    >
      <div
        style={{
          width: isMobileLayout ? 52 : 58,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: isMobileLayout ? "1.05rem" : "1.2rem",
            fontWeight: 900,
            color: "white",
            lineHeight: 1,
          }}
        >
          #{rank}
        </div>
        <div
          style={{
            color: "#8f8f8f",
            fontSize: "0.78rem",
            marginTop: 6,
          }}
        >
          {points} pts
        </div>
      </div>

      <img
        src={getGameImage(game.cover_url)}
        alt={game.title}
        style={{
          width: isMobileLayout ? 58 : 68,
          height: isMobileLayout ? 78 : 88,
          objectFit: "cover",
          borderRadius: 10,
          background: "#222",
          flexShrink: 0,
        }}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            fontSize: isMobileLayout ? "0.96rem" : "1rem",
            fontWeight: 800,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {game.title}
        </h2>

        <p style={{ color: "#aaa", margin: "6px 0 0 0", fontSize: "0.9rem" }}>
          Year: {game.release_year ?? "Unknown"}
        </p>

        <p
          style={{
            color: "#777",
            margin: "6px 0 0 0",
            fontSize: "0.84rem",
            lineHeight: 1.3,
          }}
        >
          Platforms: {game.platforms || "Unknown"}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 36px)",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          disabled={interactionsLocked}
          aria-label={`Drag to reorder ${game.title}`}
          title={`Drag to reorder ${game.title}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#262626",
            color: "white",
            fontSize: "1rem",
            fontWeight: 900,
            cursor: interactionsLocked ? "not-allowed" : "grab",
            opacity: interactionsLocked ? 0.5 : 1,
          }}
        >
          ≡
        </button>

        <button
          type="button"
          disabled={interactionsLocked || index === 0}
          onClick={() => onMoveUp(index)}
          aria-label={`Move ${game.title} up`}
          title={`Move ${game.title} up`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#262626",
            color: "white",
            fontSize: "1rem",
            fontWeight: 900,
            cursor: interactionsLocked || index === 0 ? "not-allowed" : "pointer",
            opacity: interactionsLocked || index === 0 ? 0.5 : 1,
          }}
        >
          ↑
        </button>

        <button
          type="button"
          disabled={interactionsLocked || index === selectedCount - 1}
          onClick={() => onMoveDown(index)}
          aria-label={`Move ${game.title} down`}
          title={`Move ${game.title} down`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#262626",
            color: "white",
            fontSize: "1rem",
            fontWeight: 900,
            cursor:
              interactionsLocked || index === selectedCount - 1
                ? "not-allowed"
                : "pointer",
            opacity:
              interactionsLocked || index === selectedCount - 1 ? 0.5 : 1,
          }}
        >
          ↓
        </button>

        <button
          type="button"
          disabled={interactionsLocked}
          onClick={() => onRemove(index)}
          aria-label={`Remove ${game.title}`}
          title={`Remove ${game.title}`}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: "none",
            background: "#3a1717",
            color: "white",
            fontSize: "1rem",
            fontWeight: 900,
            cursor: interactionsLocked ? "not-allowed" : "pointer",
            opacity: interactionsLocked ? 0.7 : 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default function VotePage() {
  const ballotRef = useRef<HTMLDivElement | null>(null);
  const [isMobileLayout, setIsMobileLayout] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 6,
      },
    })
  );

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
  const [signOutLoading, setSignOutLoading] = useState(false);

  const [highlightedResultIndex, setHighlightedResultIndex] = useState(0);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitMessage, setSubmitMessage] = useState("");
  const [hasVoted, setHasVoted] = useState(false);
  const [voterEmail, setVoterEmail] = useState<string | null>(null);

  const [lastSearchMode, setLastSearchMode] = useState<SearchMode>("clean");
  const [hasTriedCleanFallback, setHasTriedCleanFallback] = useState(false);
  const [hasTriedExpandedFallback, setHasTriedExpandedFallback] = useState(false);
  const [fallbackModeUsed, setFallbackModeUsed] = useState<SearchMode | null>(null);

  const [showSubmitReview, setShowSubmitReview] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const isBallotComplete = useMemo(
    () => selectedGames.every((game) => game !== null),
    [selectedGames]
  );

  const selectedCount = useMemo(
    () => selectedGames.filter(Boolean).length,
    [selectedGames]
  );

  const remainingCount = TOTAL_GAMES - selectedCount;

  const interactionsLocked =
    hasVoted || submissionLoading || signOutLoading || statusLoading;

  const filledGames = useMemo(
    () => selectedGames.filter(Boolean) as Game[],
    [selectedGames]
  );

  const sortableIds = useMemo(
    () => filledGames.map((game) => `game-${game.id}`),
    [filledGames]
  );

  useEffect(() => {
    function handleResize() {
      setIsMobileLayout(window.innerWidth < 900);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

      if (!savedDraft) return;

      const parsedDraft = JSON.parse(savedDraft);

      if (Array.isArray(parsedDraft) && parsedDraft.length === TOTAL_GAMES) {
        setSelectedGames(parsedDraft);
      }
    } catch (error) {
      console.error("Failed to load saved ballot draft:", error);
    }
  }, []);

  useEffect(() => {
    if (statusLoading) return;

    if (hasVoted) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(selectedGames));
    } catch (error) {
      console.error("Failed to save ballot draft:", error);
    }
  }, [selectedGames, hasVoted, statusLoading]);

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

        if (data.hasVoted) {
          setSelectedGames(Array(TOTAL_GAMES).fill(null));
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
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
        setHighlightedResultIndex(0);
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
        setHighlightedResultIndex(0);
      }

      setLoading(false);
    }

    const timeout = setTimeout(() => {
      searchGames();
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function clearMessages() {
    setErrorMessage("");
    setSubmitMessage("");
  }

  function resetFallbackState() {
    setFallbackResults([]);
    setHasTriedCleanFallback(false);
    setHasTriedExpandedFallback(false);
    setFallbackModeUsed(null);
    setLastSearchMode("clean");
  }

  function addGameToRanking(game: Game, options?: { imported?: boolean }) {
    if (hasVoted) return;

    clearMessages();

    const alreadySelected = selectedGames.some(
      (selectedGame) => selectedGame?.id === game.id
    );

    if (alreadySelected) {
      setErrorMessage("That game is already in your Top 10.");
      return;
    }

    const nextOpenIndex = selectedGames.findIndex((slot) => slot === null);

    if (nextOpenIndex === -1) {
      setErrorMessage("Your Top 10 is already full. Remove or reorder a game first.");
      return;
    }

    const updatedGames = [...selectedGames];
    updatedGames[nextOpenIndex] = game;
    setSelectedGames(updatedGames);

    const rank = nextOpenIndex + 1;
    const points = getPointsForRank(rank);

    setSubmitMessage(
      options?.imported
        ? `Imported and added ${game.title} to #${rank} (${points} pts).`
        : `Added ${game.title} to #${rank} (${points} pts).`
    );

    setQuery("");
    setResults([]);
    setFallbackResults([]);
    setHighlightedResultIndex(0);
    resetFallbackState();
  }

  function removeGame(index: number) {
    if (hasVoted) return;

    const game = selectedGames[index];

    const updatedGames = [...selectedGames];
    updatedGames[index] = null;

    const compactedGames = updatedGames.filter(Boolean) as Game[];
    const rebuiltGames = [
      ...compactedGames,
      ...Array(TOTAL_GAMES - compactedGames.length).fill(null),
    ];

    setSelectedGames(rebuiltGames);
    clearMessages();

    if (game) {
      setSubmitMessage(`Removed ${game.title} from your ballot.`);
    }
  }

  function moveGame(index: number, direction: "up" | "down") {
    if (hasVoted) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= selectedCount) return;

    setSelectedGames((current) => moveFilledGame(current, index, targetIndex));
    clearMessages();

    const newRank = targetIndex + 1;
    const movedGame = selectedGames[index];

    if (movedGame) {
      setSubmitMessage(
        `${movedGame.title} moved to #${newRank} (${getPointsForRank(newRank)} pts).`
      );
    }
  }

  function openClearConfirm() {
    if (hasVoted) return;

    const hasAnySelection = selectedGames.some(Boolean);

    if (!hasAnySelection) {
      setSubmitMessage("Your ballot is already empty.");
      return;
    }

    setShowClearConfirm(true);
  }

  function confirmClearBallot() {
    setSelectedGames(Array(TOTAL_GAMES).fill(null));
    setQuery("");
    setResults([]);
    setFallbackResults([]);
    setHighlightedResultIndex(0);
    clearMessages();
    resetFallbackState();
    setSubmitMessage("Your ballot has been cleared.");
    setShowClearConfirm(false);
  }

  function jumpToBallot() {
    ballotRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (interactionsLocked) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      setResults([]);
      setFallbackResults([]);
      setHighlightedResultIndex(0);
      clearMessages();
      resetFallbackState();
      return;
    }

    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedResultIndex((current) =>
        Math.min(current + 1, results.length - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedResultIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const selectedResult = results[highlightedResultIndex] ?? results[0];
      if (selectedResult) {
        addGameToRanking(selectedResult);
      }
    }
  }

  async function searchFullDatabase(mode: SearchMode = "clean") {
    if (hasVoted) return;
    if (query.trim().length < 2) return;

    setFallbackLoading(true);
    clearMessages();
    setFallbackResults([]);
    setLastSearchMode(mode);
    setFallbackModeUsed(mode);

    try {
      const response = await fetch("/api/igdb-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.error || "IGDB fallback failed.");
        return;
      }

      if (mode === "clean") {
        setHasTriedCleanFallback(true);
      } else {
        setHasTriedExpandedFallback(true);
      }

      const games = Array.isArray(data.games) ? data.games : [];
      setFallbackResults(games);

      if (games.length === 0) {
        setErrorMessage(
          mode === "expanded"
            ? "No matches found, even with the broader search."
            : "No strong matches found. You can try a broader search."
        );
        return;
      }

      setSubmitMessage(
        mode === "expanded"
          ? "Showing broader search results. Pick the closest match below."
          : "Showing deeper search results. Pick the best match below."
      );
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
    clearMessages();

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

      addGameToRanking(data.game, { imported: true });
      setFallbackResults([]);
      setQuery("");
      setResults([]);
      resetFallbackState();
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage("Something went wrong importing the selected game.");
    } finally {
      setImportLoadingId(null);
    }
  }

  async function finalSubmitVote() {
    if (hasVoted) {
      setErrorMessage("This email has already submitted a ballot.");
      return;
    }

    if (!isBallotComplete) {
      setErrorMessage("Fill all 10 ranking slots before submitting.");
      return;
    }

    setSubmissionLoading(true);
    clearMessages();

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const token = session?.access_token;

      if (!token) {
        setErrorMessage("You must be logged in to submit your vote.");
        setShowSubmitReview(false);
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
      setSubmitMessage("Your vote has been submitted successfully.");
      setVoterEmail(data.voterEmail ?? voterEmail);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setResults([]);
      setFallbackResults([]);
      setQuery("");
      resetFallbackState();
      setShowSubmitReview(false);
    } catch (error) {
      console.error("Submit vote error:", error);
      setErrorMessage("Something went wrong submitting your vote.");
    } finally {
      setSubmissionLoading(false);
    }
  }

  async function handleSignOut() {
    setSignOutLoading(true);
    clearMessages();

    try {
      await supabase.auth.signOut();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Sign out error:", error);
      setErrorMessage("Something went wrong signing out.");
      setSignOutLoading(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    if (interactionsLocked) return;

    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const fromIndex = sortableIds.indexOf(String(active.id));
    const toIndex = sortableIds.indexOf(String(over.id));

    if (fromIndex === -1 || toIndex === -1) return;

    setSelectedGames((current) => moveFilledGame(current, fromIndex, toIndex));
    clearMessages();

    const movedGame = filledGames[fromIndex];
    if (movedGame) {
      const newRank = toIndex + 1;
      setSubmitMessage(
        `${movedGame.title} moved to #${newRank} (${getPointsForRank(newRank)} pts).`
      );
    }
  }

  const ruleCards = [
    {
      title: "One final ballot",
      text: "You get one vote per email, so make sure your order is how you actually want it before you lock it in.",
    },
    {
      title: "Order matters",
      text: "Your #1 gets the most points, your #10 gets the least, so this is not just a random list of 10 games.",
    },
    {
      title: "DLC rule",
      text: "DLCs and expansions might show up in deeper search, but only base games count. Elden Ring counts. Shadow of the Erdtree doesn’t.",
    },
  ];

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.05) 0%, rgba(5,5,5,0) 28%), #050505",
          color: "white",
          padding: isMobileLayout ? 14 : 26,
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
              marginBottom: 22,
            }}
          >
            <div>
              <Link
                href="/"
                style={{
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                }}
              >
                vote100games.com
              </Link>
              <div
                style={{
                  marginTop: 4,
                  fontSize: "0.82rem",
                  color: "#7f7f7f",
                  fontWeight: 600,
                }}
              >
                made by Bandit Banks
              </div>
            </div>

            {!statusLoading && voterEmail && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#bbb",
                  fontSize: "0.95rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  backdropFilter: "blur(12px)",
                  width: isMobileLayout ? "100%" : "auto",
                }}
              >
                <div>
                  Voting as{" "}
                  <span style={{ color: "white", fontWeight: 800 }}>
                    {voterEmail}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signOutLoading}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid #333",
                    background: "#0f0f0f",
                    color: "white",
                    cursor: signOutLoading ? "not-allowed" : "pointer",
                    opacity: signOutLoading ? 0.7 : 1,
                    fontWeight: 700,
                  }}
                >
                  {signOutLoading ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </header>

          <div
            style={{
              marginBottom: 22,
              padding: isMobileLayout ? 18 : 28,
              borderRadius: 28,
              background: "rgba(18,18,18,0.84)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
              backdropFilter: "blur(14px)",
            }}
          >
            <h1
              style={{
                fontSize: isMobileLayout ? "2.05rem" : "3.3rem",
                fontWeight: 900,
                margin: 0,
                lineHeight: 1.02,
                letterSpacing: "-0.05em",
                maxWidth: 820,
              }}
            >
              Build your Top 10
            </h1>

            <p
              style={{
                color: "#acacac",
                margin: "14px 0 0 0",
                lineHeight: 1.72,
                fontSize: isMobileLayout ? "0.98rem" : "1.05rem",
                maxWidth: 820,
              }}
            >
              This is where you lock in the list. Search your favorite games, rank them
              properly, and build the Top 10 you actually want counted in the final Top
              100.
            </p>

            <div
              style={{
                marginTop: 22,
                display: "grid",
                gridTemplateColumns: isMobileLayout
                  ? "1fr"
                  : "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {ruleCards.map((card) => (
                <div
                  key={card.title}
                  style={{
                    padding: "16px 16px",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontWeight: 800,
                      fontSize: "1rem",
                      marginBottom: 8,
                    }}
                  >
                    {card.title}
                  </div>
                  <div
                    style={{
                      color: "#a8a8a8",
                      lineHeight: 1.62,
                      fontSize: "0.93rem",
                    }}
                  >
                    {card.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginBottom: 24,
              padding: 18,
              borderRadius: 20,
              background: "rgba(18,18,18,0.88)",
              border: "1px solid rgba(255,255,255,0.07)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: "1rem", fontWeight: 800, marginBottom: 4 }}>
                Ballot progress: {selectedCount} / {TOTAL_GAMES}
              </div>
              <div style={{ color: "#999", fontSize: "0.95rem" }}>
                {remainingCount === 0
                  ? "Your Top 10 is complete."
                  : `${remainingCount} slot${remainingCount === 1 ? "" : "s"} left to fill.`}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                width: isMobileLayout ? "100%" : "auto",
              }}
            >
              <button
                type="button"
                onClick={jumpToBallot}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#0f0f0f",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                  width: isMobileLayout ? "100%" : "auto",
                }}
              >
                Jump to my Top 10
              </button>

              <button
                type="button"
                onClick={openClearConfirm}
                disabled={interactionsLocked}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid #333",
                  background: "#0f0f0f",
                  color: "white",
                  cursor: interactionsLocked ? "not-allowed" : "pointer",
                  opacity: interactionsLocked ? 0.7 : 1,
                  fontWeight: 700,
                  width: isMobileLayout ? "100%" : "auto",
                }}
              >
                Clear all
              </button>
            </div>
          </div>

          {statusLoading && (
            <p style={{ color: "#aaa", marginBottom: 16 }}>Checking vote status...</p>
          )}

          {!statusLoading && hasVoted && (
            <div
              style={{
                background: "#132a13",
                border: "1px solid #1f5d1f",
                color: "#b8ffb8",
                padding: "16px 18px",
                borderRadius: 14,
                marginBottom: 20,
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>Vote submitted</div>
              <div>
                {voterEmail
                  ? `A ballot has already been submitted for ${voterEmail}.`
                  : "A ballot has already been submitted for this account."}
              </div>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                color: "#ffb3b3",
                background: "#2a1111",
                border: "1px solid #5b2222",
                padding: "12px 14px",
                borderRadius: 14,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {errorMessage}
            </div>
          )}

          {submitMessage && (
            <div
              style={{
                color: "#b8ffb8",
                background: "#132a13",
                border: "1px solid #1f5d1f",
                padding: "12px 14px",
                borderRadius: 14,
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              {submitMessage}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobileLayout
                ? "1fr"
                : "minmax(0, 1.06fr) minmax(380px, 0.94fr)",
              gap: 24,
              alignItems: "start",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  background: "rgba(14,14,14,0.9)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 22,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    color: "#f3f3f3",
                    fontSize: "1rem",
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Search for games
                </div>
                <div
                  style={{
                    color: "#9e9e9e",
                    fontSize: "0.94rem",
                    lineHeight: 1.55,
                    marginBottom: 12,
                  }}
                >
                  Search by title, then add games to the next open slot in your ballot.
                  If something is missing, you can search deeper through the wider
                  database.
                </div>

                <input
                  type="text"
                  placeholder="Search for a game..."
                  value={query}
                  disabled={interactionsLocked}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setFallbackResults([]);
                    setHasTriedCleanFallback(false);
                    setHasTriedExpandedFallback(false);
                    setFallbackModeUsed(null);
                    setLastSearchMode("clean");
                    setErrorMessage("");
                    setSubmitMessage("");
                  }}
                  onKeyDown={handleSearchKeyDown}
                  style={{
                    width: "100%",
                    padding: "14px 15px",
                    fontSize: "16px",
                    borderRadius: 12,
                    border: "1px solid #333",
                    background: interactionsLocked ? "#0d0d0d" : "#111",
                    color: "white",
                    outline: "none",
                  }}
                />
              </div>

              {loading && <p style={{ color: "#aaa" }}>Searching...</p>}

              {results.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    marginTop: 8,
                    marginBottom: 24,
                  }}
                >
                  {results.map((game, index) => (
                    <button
                      key={game.id}
                      type="button"
                      disabled={interactionsLocked}
                      onClick={() => addGameToRanking(game)}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        background:
                          index === highlightedResultIndex
                            ? "rgba(32,32,32,0.95)"
                            : "rgba(18,18,18,0.9)",
                        padding: 14,
                        borderRadius: 18,
                        border:
                          index === highlightedResultIndex
                            ? "1px solid #5b5b5b"
                            : "1px solid rgba(255,255,255,0.07)",
                        cursor: interactionsLocked ? "not-allowed" : "pointer",
                        textAlign: "left",
                        color: "white",
                        opacity: interactionsLocked ? 0.7 : 1,
                        transition: "transform 0.16s ease, border-color 0.16s ease",
                      }}
                    >
                      <img
                        src={getGameImage(game.cover_url)}
                        alt={game.title}
                        style={{
                          width: isMobileLayout ? 64 : 72,
                          height: isMobileLayout ? 84 : 92,
                          objectFit: "cover",
                          borderRadius: 10,
                          background: "#222",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                          style={{
                            fontSize: "1rem",
                            fontWeight: 800,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {game.title}
                        </h2>

                        <p
                          style={{
                            color: "#aaa",
                            margin: "6px 0 0 0",
                            fontSize: "0.92rem",
                          }}
                        >
                          Year: {game.release_year ?? "Unknown"}
                        </p>

                        <p
                          style={{
                            color: "#777",
                            margin: "6px 0 0 0",
                            fontSize: "0.88rem",
                            lineHeight: 1.3,
                          }}
                        >
                          Platforms: {game.platforms || "Unknown"}
                        </p>
                      </div>

                      {!isMobileLayout && (
                        <div
                          style={{
                            color: "#999",
                            fontSize: "0.9rem",
                            flexShrink: 0,
                            fontWeight: 700,
                          }}
                        >
                          Add
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {!loading && query.trim().length >= 2 && !hasVoted && (
                <div
                  style={{
                    marginTop: 20,
                    marginBottom: 30,
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(14,14,14,0.9)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  {!hasTriedCleanFallback && (
                    <>
                      <p
                        style={{
                          color: "#aaa",
                          margin: 0,
                          marginBottom: 12,
                          lineHeight: 1.55,
                        }}
                      >
                        {results.length === 0
                          ? "No local matches found. Try a deeper search."
                          : "Still don’t see it? Search deeper."}
                      </p>

                      <button
                        type="button"
                        onClick={() => searchFullDatabase("clean")}
                        disabled={fallbackLoading || interactionsLocked}
                        style={{
                          padding: "11px 16px",
                          borderRadius: 12,
                          border: "none",
                          background: "white",
                          color: "black",
                          cursor:
                            fallbackLoading || interactionsLocked
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 800,
                          opacity: fallbackLoading || interactionsLocked ? 0.7 : 1,
                        }}
                      >
                        {fallbackLoading && lastSearchMode === "clean"
                          ? "Searching deeper..."
                          : "Still don’t see it? Search deeper"}
                      </button>
                    </>
                  )}

                  {hasTriedCleanFallback && !hasTriedExpandedFallback && (
                    <div>
                      <p
                        style={{
                          color: "#aaa",
                          margin: 0,
                          marginBottom: 12,
                          lineHeight: 1.55,
                        }}
                      >
                        Still not finding the right one? Try a broader search.
                      </p>

                      <button
                        type="button"
                        onClick={() => searchFullDatabase("expanded")}
                        disabled={fallbackLoading || interactionsLocked}
                        style={{
                          padding: "11px 16px",
                          borderRadius: 12,
                          border: "1px solid #333",
                          background: "#151515",
                          color: "white",
                          cursor:
                            fallbackLoading || interactionsLocked
                              ? "not-allowed"
                              : "pointer",
                          fontWeight: 800,
                          opacity: fallbackLoading || interactionsLocked ? 0.7 : 1,
                        }}
                      >
                        {fallbackLoading && lastSearchMode === "expanded"
                          ? "Trying broader search..."
                          : "Try broader search"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {hasTriedCleanFallback && !hasVoted && fallbackResults.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gap: 14,
                    marginTop: 20,
                    marginBottom: 18,
                  }}
                >
                  <p style={{ color: "#aaa", margin: 0 }}>
                    {fallbackModeUsed === "expanded"
                      ? "Select the best match from the broader search:"
                      : "Select the best match from the deeper search:"}
                  </p>

                  {fallbackResults.map((game) => (
                    <button
                      key={game.igdb_id}
                      type="button"
                      onClick={() => importSelectedIgdbGame(game)}
                      disabled={importLoadingId === game.igdb_id || interactionsLocked}
                      style={{
                        display: "flex",
                        gap: 14,
                        alignItems: "center",
                        background: "rgba(18,18,18,0.9)",
                        padding: 14,
                        borderRadius: 18,
                        border: "1px solid rgba(255,255,255,0.07)",
                        cursor:
                          importLoadingId === game.igdb_id || interactionsLocked
                            ? "not-allowed"
                            : "pointer",
                        textAlign: "left",
                        color: "white",
                        opacity:
                          importLoadingId === game.igdb_id || interactionsLocked
                            ? 0.7
                            : 1,
                      }}
                    >
                      <img
                        src={getGameImage(game.cover_url)}
                        alt={game.title}
                        style={{
                          width: isMobileLayout ? 64 : 72,
                          height: isMobileLayout ? 84 : 92,
                          objectFit: "cover",
                          borderRadius: 10,
                          background: "#222",
                          flexShrink: 0,
                        }}
                      />

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h2
                          style={{
                            fontSize: "1rem",
                            fontWeight: 800,
                            margin: 0,
                            lineHeight: 1.2,
                          }}
                        >
                          {game.title}
                        </h2>

                        <p
                          style={{
                            color: "#aaa",
                            margin: "6px 0 0 0",
                            fontSize: "0.92rem",
                          }}
                        >
                          Year: {game.release_year ?? "Unknown"}
                        </p>

                        <p
                          style={{
                            color: "#777",
                            margin: "6px 0 0 0",
                            fontSize: "0.88rem",
                            lineHeight: 1.3,
                          }}
                        >
                          Platforms: {game.platforms || "Unknown"}
                        </p>
                      </div>

                      <div style={{ fontWeight: 800, flexShrink: 0 }}>
                        {importLoadingId === game.igdb_id ? "Adding..." : "Select"}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {isMobileLayout && (
                <div style={{ marginTop: 18, marginBottom: 24 }}>
                  <button
                    type="button"
                    onClick={jumpToBallot}
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid #333",
                      background: "#0f0f0f",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    Jump to my Top 10
                  </button>
                </div>
              )}
            </div>

            <div
              ref={ballotRef}
              style={{
                position: isMobileLayout ? "static" : "sticky",
                top: isMobileLayout ? undefined : 24,
                alignSelf: "start",
              }}
            >
              <div
                style={{
                  padding: 18,
                  borderRadius: 22,
                  background: "rgba(14,14,14,0.92)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    marginBottom: 6,
                    fontSize: "1.3rem",
                    fontWeight: 900,
                  }}
                >
                  My Top 10
                </div>

                <div
                  style={{
                    color: "#999",
                    fontSize: "0.92rem",
                    lineHeight: 1.56,
                  }}
                >
                  Drag to reorder, use the arrows, or remove games. Higher ranks are
                  worth more points, so your order absolutely matters.
                </div>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortableIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ display: "grid", gap: 14, marginBottom: 20 }}>
                    {selectedGames.map((game, index) => {
                      if (!game) {
                        const rank = index + 1;
                        const points = getPointsForRank(rank);

                        return (
                          <div
                            key={`empty-${index}`}
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              background: "rgba(14,14,14,0.9)",
                              padding: isMobileLayout ? 12 : 14,
                              borderRadius: 18,
                              border: "1px solid rgba(255,255,255,0.07)",
                              minHeight: isMobileLayout ? 108 : 118,
                            }}
                          >
                            <div
                              style={{
                                width: isMobileLayout ? 52 : 58,
                                textAlign: "center",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: isMobileLayout ? "1.05rem" : "1.2rem",
                                  fontWeight: 900,
                                  color: "white",
                                  lineHeight: 1,
                                }}
                              >
                                #{rank}
                              </div>
                              <div
                                style={{
                                  color: "#8f8f8f",
                                  fontSize: "0.78rem",
                                  marginTop: 6,
                                }}
                              >
                                {points} pts
                              </div>
                            </div>

                            <div style={{ color: "#666", fontSize: "0.95rem" }}>
                              Empty slot
                            </div>
                          </div>
                        );
                      }

                      return (
                        <SortableBallotItem
                          key={`game-${game.id}`}
                          slotId={`game-${game.id}`}
                          game={game}
                          index={index}
                          selectedCount={selectedCount}
                          interactionsLocked={interactionsLocked}
                          onMoveUp={(i) => moveGame(i, "up")}
                          onMoveDown={(i) => moveGame(i, "down")}
                          onRemove={removeGame}
                          isMobileLayout={isMobileLayout}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {!hasVoted && (
                <div
                  style={{
                    padding: 16,
                    borderRadius: 18,
                    background: "rgba(14,14,14,0.92)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      color: "white",
                      fontWeight: 800,
                      fontSize: "1rem",
                      marginBottom: 6,
                    }}
                  >
                    Before you submit
                  </div>
                  <div
                    style={{
                      color: "#9a9a9a",
                      lineHeight: 1.6,
                      fontSize: "0.92rem",
                    }}
                  >
                    Make sure your order is right. Once you submit, that ballot is final.
                  </div>
                </div>
              )}

              {!hasVoted && isBallotComplete && (
                <button
                  type="button"
                  onClick={() => setShowSubmitReview(true)}
                  disabled={submissionLoading || statusLoading}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 14,
                    border: "none",
                    background: "#ffffff",
                    color: "#000000",
                    fontSize: "1rem",
                    fontWeight: 900,
                    cursor:
                      submissionLoading || statusLoading ? "not-allowed" : "pointer",
                    opacity: submissionLoading || statusLoading ? 0.7 : 1,
                    boxShadow: "0 10px 26px rgba(255,255,255,0.08)",
                  }}
                >
                  Review and submit
                </button>
              )}

              {!hasVoted && !isBallotComplete && (
                <button
                  type="button"
                  disabled
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "#141414",
                    color: "#6f6f6f",
                    fontSize: "1rem",
                    fontWeight: 900,
                    cursor: "not-allowed",
                  }}
                >
                  Fill all 10 spots to submit
                </button>
              )}

              <div
                style={{
                  marginTop: 18,
                  color: "#666",
                  fontSize: "0.82rem",
                  lineHeight: 1.55,
                  textAlign: isMobileLayout ? "center" : "left",
                }}
              >
                Game data provided by IGDB.
              </div>
            </div>
          </div>
        </div>
      </main>

      {showClearConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 460,
              background: "rgba(16,16,16,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
            }}
          >
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 900,
                marginBottom: 10,
              }}
            >
              Clear your ballot?
            </div>
            <div
              style={{
                color: "#a8a8a8",
                lineHeight: 1.65,
                fontSize: "0.96rem",
                marginBottom: 20,
              }}
            >
              This will remove everything from your current Top 10 and let you start over.
            </div>

            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#151515",
                  color: "white",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Never mind
              </button>

              <button
                type="button"
                onClick={confirmClearBallot}
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: "13px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "white",
                  color: "black",
                  fontWeight: 900,
                  cursor: "pointer",
                }}
              >
                Clear it
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubmitReview && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.76)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1001,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 760,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "rgba(16,16,16,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 26,
              padding: isMobileLayout ? 18 : 24,
              boxShadow: "0 24px 80px rgba(0,0,0,0.48)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: isMobileLayout ? "1.5rem" : "1.9rem",
                    fontWeight: 900,
                    lineHeight: 1.05,
                    marginBottom: 8,
                  }}
                >
                  Confirm your Top 10
                </div>
                <div
                  style={{
                    color: "#a8a8a8",
                    lineHeight: 1.65,
                    fontSize: "0.96rem",
                    maxWidth: 560,
                  }}
                >
                  This is your final review screen. Once you submit this list, that ballot
                  is locked in and counted.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitReview(false)}
                disabled={submissionLoading}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  border: "none",
                  background: "#202020",
                  color: "white",
                  fontSize: "1.1rem",
                  fontWeight: 900,
                  cursor: submissionLoading ? "not-allowed" : "pointer",
                  opacity: submissionLoading ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                marginBottom: 18,
                padding: 16,
                borderRadius: 18,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#cfcfcf",
                fontSize: "0.94rem",
                lineHeight: 1.6,
              }}
            >
              Quick reminder: DLCs and expansions may appear in deeper search, but only
              base games count toward the final list.
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {filledGames.map((game, index) => {
                const rank = index + 1;
                const points = getPointsForRank(rank);

                return (
                  <div
                    key={`review-${game.id}`}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                      background: "rgba(18,18,18,0.92)",
                      padding: isMobileLayout ? 12 : 14,
                      borderRadius: 18,
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      style={{
                        width: isMobileLayout ? 52 : 58,
                        textAlign: "center",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          fontSize: isMobileLayout ? "1.05rem" : "1.2rem",
                          fontWeight: 900,
                          color: "white",
                          lineHeight: 1,
                        }}
                      >
                        #{rank}
                      </div>
                      <div
                        style={{
                          color: "#8f8f8f",
                          fontSize: "0.78rem",
                          marginTop: 6,
                        }}
                      >
                        {points} pts
                      </div>
                    </div>

                    <img
                      src={getGameImage(game.cover_url)}
                      alt={game.title}
                      style={{
                        width: isMobileLayout ? 54 : 62,
                        height: isMobileLayout ? 72 : 82,
                        objectFit: "cover",
                        borderRadius: 10,
                        background: "#222",
                        flexShrink: 0,
                      }}
                    />

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "white",
                          fontWeight: 800,
                          fontSize: "0.98rem",
                          lineHeight: 1.25,
                        }}
                      >
                        {game.title}
                      </div>
                      <div
                        style={{
                          color: "#8f8f8f",
                          fontSize: "0.88rem",
                          marginTop: 6,
                        }}
                      >
                        {game.release_year ?? "Unknown"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                marginTop: 20,
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={() => setShowSubmitReview(false)}
                disabled={submissionLoading}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#151515",
                  color: "white",
                  fontWeight: 800,
                  cursor: submissionLoading ? "not-allowed" : "pointer",
                  opacity: submissionLoading ? 0.7 : 1,
                }}
              >
                Go back and edit
              </button>

              <button
                type="button"
                onClick={finalSubmitVote}
                disabled={submissionLoading}
                style={{
                  flex: 1,
                  minWidth: 180,
                  padding: "14px 18px",
                  borderRadius: 12,
                  border: "none",
                  background: "white",
                  color: "black",
                  fontWeight: 900,
                  cursor: submissionLoading ? "not-allowed" : "pointer",
                  opacity: submissionLoading ? 0.7 : 1,
                  boxShadow: "0 10px 26px rgba(255,255,255,0.08)",
                }}
              >
                {submissionLoading ? "Submitting vote..." : "Submit my final ballot"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}