"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type HomeGame = {
  id: number;
  title: string;
  cover_url: string | null;
};

function duplicateGames(games: HomeGame[]) {
  if (games.length === 0) return [];
  return [...games, ...games];
}

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

const FEATURE_CARDS = [
  {
    step: "01",
    title: "Vote your Top 10",
    text: "Search for your favorite games, rank them in order, and lock in your personal all-time list.",
  },
  {
    step: "02",
    title: "The internet decides",
    text: "Every ballot contributes points toward the final community-ranked Top 100.",
  },
  {
    step: "03",
    title: "Watch the reveal",
    text: "Bandit Banks will turn the final results into a full YouTube video reveal.",
  },
];

export default function Home() {
  const [totalVotesSubmitted, setTotalVotesSubmitted] = useState<number | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(true);
  const [games, setGames] = useState<HomeGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    async function loadSiteStats() {
      try {
        const response = await fetch("/api/site-stats");
        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to load site stats:", data);
          setTotalVotesSubmitted(0);
          return;
        }

        setTotalVotesSubmitted(data.totalVotesSubmitted ?? 0);
      } catch (error) {
        console.error("Failed to fetch site stats:", error);
        setTotalVotesSubmitted(0);
      } finally {
        setLoadingVotes(false);
      }
    }

    async function loadGames() {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("id, title, cover_url")
          .not("cover_url", "is", null)
          .limit(80);

        if (error) {
          console.error("Failed to load homepage games:", error.message);
          setGames([]);
          return;
        }

        const shuffled = shuffleArray(data ?? []).slice(0, 24);
        setGames(shuffled);
      } catch (error) {
        console.error("Failed to fetch homepage games:", error);
        setGames([]);
      } finally {
        setLoadingGames(false);
      }
    }

    loadSiteStats();
    loadGames();

    const interval = setInterval(loadGames, 60000);
    return () => clearInterval(interval);
  }, []);

  const topRowGames = useMemo(() => duplicateGames(games.slice(0, 12)), [games]);
  const bottomRowGames = useMemo(() => duplicateGames(games.slice(12, 24)), [games]);

  return (
    <>
      <style>{`
        @keyframes marqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes marqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .home-marquee-left {
          animation: marqueeLeft 42s linear infinite;
        }

        .home-marquee-right {
          animation: marqueeRight 46s linear infinite;
        }

        @media (max-width: 900px) {
          .home-marquee-left,
          .home-marquee-right {
            animation-duration: 62s;
          }
        }
      `}</style>

      <main
        style={{
          minHeight: "100vh",
          background: "#050505",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at center, rgba(255,255,255,0.085) 0%, rgba(0,0,0,0) 48%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(5,5,5,0.84) 0%, rgba(5,5,5,0.56) 30%, rgba(5,5,5,0.56) 70%, rgba(5,5,5,0.84) 100%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.28) 18%, rgba(5,5,5,0.28) 82%, rgba(5,5,5,0.92) 100%)",
              zIndex: 2,
            }}
          />

          {!loadingGames && games.length > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: isMobile ? 18 : 30,
                transform: isMobile ? "rotate(-6deg) scale(1.18)" : "rotate(-6deg) scale(1.08)",
                opacity: isMobile ? 0.28 : 0.38,
                zIndex: 1,
              }}
            >
              <div style={{ overflow: "hidden", width: "100%" }}>
                <div
                  className="home-marquee-left"
                  style={{
                    display: "flex",
                    gap: 18,
                    width: "max-content",
                  }}
                >
                  {topRowGames.map((game, index) => (
                    <div
                      key={`top-${game.id}-${index}`}
                      style={{
                        width: isMobile ? 110 : 170,
                        height: isMobile ? 150 : 230,
                        borderRadius: isMobile ? 12 : 18,
                        overflow: "hidden",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                        flexShrink: 0,
                      }}
                    >
                      {game.cover_url ? (
                        <img
                          src={game.cover_url}
                          alt={game.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ overflow: "hidden", width: "100%" }}>
                <div
                  className="home-marquee-right"
                  style={{
                    display: "flex",
                    gap: 18,
                    width: "max-content",
                  }}
                >
                  {bottomRowGames.map((game, index) => (
                    <div
                      key={`bottom-${game.id}-${index}`}
                      style={{
                        width: isMobile ? 110 : 170,
                        height: isMobile ? 150 : 230,
                        borderRadius: isMobile ? 12 : 18,
                        overflow: "hidden",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                        flexShrink: 0,
                      }}
                    >
                      {game.cover_url ? (
                        <img
                          src={game.cover_url}
                          alt={game.title}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 3,
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            padding: isMobile ? "18px 14px 28px" : "28px 20px 40px",
          }}
        >
          <header
            style={{
              display: "flex",
              justifyContent: isMobile ? "center" : "space-between",
              alignItems: "center",
              gap: 12,
              maxWidth: 1200,
              width: "100%",
              margin: "0 auto",
              flexWrap: "wrap",
            }}
          >
            <div style={{ textAlign: isMobile ? "center" : "left" }}>
              <div
                style={{
                  fontWeight: 900,
                  fontSize: "1rem",
                  letterSpacing: "0.05em",
                  color: "#f5f5f5",
                }}
              >
                vote100games.com
              </div>
              <div
                style={{
                  marginTop: 4,
                  fontSize: "0.82rem",
                  color: "#7f7f7f",
                  fontWeight: 600,
                }}
              >
                by Bandit Banks
              </div>
            </div>

            <div
              style={{
                padding: "12px 16px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(12px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                width: isMobile ? "100%" : undefined,
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ffffff",
                  opacity: 0.9,
                }}
              />
              <div style={{ color: "#a8a8a8", fontSize: "0.9rem" }}>
                Votes Submitted:
              </div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                {loadingVotes ? "..." : totalVotesSubmitted?.toLocaleString()}
              </div>
              <div style={{ color: "#777", fontSize: "0.75rem" }}>
                and counting...
              </div>
            </div>
          </header>

          <section
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
            }}
          >
            <div
              style={{
                maxWidth: 980,
                width: "100%",
                textAlign: "center",
                padding: isMobile ? "26px 8px 18px" : "44px 20px",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 14px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "#d4d4d4",
                  fontSize: "0.9rem",
                  marginBottom: 24,
                  backdropFilter: "blur(12px)",
                }}
              >
                Community ranking project
              </div>

              <h1
                style={{
                  fontSize: "clamp(2.8rem, 7vw, 5.7rem)",
                  lineHeight: 1.01,
                  fontWeight: 900,
                  letterSpacing: "-0.05em",
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                The Internet&apos;s
                <br />
                Top 100 Games
              </h1>

              <div
                style={{
                  marginTop: 12,
                  color: "#9a9a9a",
                  fontSize: isMobile ? "0.95rem" : "1rem",
                  fontWeight: 600,
                }}
              >
                Final results revealed in an upcoming Bandit Banks video
              </div>

              <p
                style={{
                  margin: "22px auto 0",
                  maxWidth: 760,
                  color: "#b0b0b0",
                  fontSize: isMobile ? "1rem" : "1.12rem",
                  lineHeight: 1.7,
                }}
              >
                I&apos;m <strong style={{ color: "white" }}>Bandit Banks</strong>, and
                I&apos;m tired of “Top 100 Games of All Time” lists decided by a handful
                of people.
                <br />
                <br />
                So I&apos;m making one where <strong style={{ color: "white" }}>the internet decides</strong>.
                Vote for your personal Top 10, help shape the final ranking, and be part of the list before the reveal video drops.
              </p>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                  flexWrap: "wrap",
                  marginTop: 30,
                  width: "100%",
                }}
              >
                <Link
                  href="/auth"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    minWidth: isMobile ? "100%" : 190,
                    maxWidth: isMobile ? 340 : undefined,
                    width: isMobile ? "100%" : undefined,
                    borderRadius: 12,
                    background: "white",
                    color: "black",
                    textDecoration: "none",
                    fontWeight: 900,
                    fontSize: "1rem",
                    boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 16px 38px rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,255,255,0.08)";
                  }}
                >
                  Vote Your Top 10
                </Link>

                <Link
                  href="/how-it-works"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    minWidth: isMobile ? "100%" : 190,
                    maxWidth: isMobile ? 340 : undefined,
                    width: isMobile ? "100%" : undefined,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    border: "1px solid rgba(255,255,255,0.12)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  How It Works
                </Link>
              </div>

              <div
                style={{
                  marginTop: 12,
                  color: "#888",
                  fontSize: "0.85rem",
                }}
              >
                Takes less than 60 seconds
              </div>

              <div
                style={{
                  marginTop: 34,
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(3, minmax(0, 1fr))",
                  gap: 14,
                  textAlign: "left",
                }}
              >
                {FEATURE_CARDS.map((item) => (
                  <div
                    key={item.step}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(14px)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 800,
                        color: "#8f8f8f",
                        marginBottom: 10,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {item.step}
                    </div>
                    <div
                      style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        marginBottom: 8,
                        color: "white",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        color: "#aaaaaa",
                        fontSize: "0.95rem",
                        lineHeight: 1.58,
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <footer
            style={{
              maxWidth: 1200,
              width: "100%",
              margin: "0 auto",
              paddingTop: 10,
              display: "flex",
              justifyContent: "space-between",
              alignItems: isMobile ? "flex-start" : "center",
              gap: 14,
              flexDirection: isMobile ? "column" : "row",
              color: "#666",
              fontSize: "0.82rem",
            }}
          >
            <div>Game data provided by IGDB.</div>
            <div>
              Built by Bandit Banks (while learning how to make a website...LMAO)
            </div>
          </footer>
        </div>
      </main>
    </>
  );
}