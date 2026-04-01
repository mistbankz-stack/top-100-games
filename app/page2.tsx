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
          .limit(60);

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
            animation-duration: 60s;
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
                "radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 45%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(5,5,5,0.94) 0%, rgba(5,5,5,0.74) 30%, rgba(5,5,5,0.74) 70%, rgba(5,5,5,0.94) 100%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.35) 18%, rgba(5,5,5,0.35) 82%, rgba(5,5,5,0.95) 100%)",
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
                opacity: isMobile ? 0.18 : 0.26,
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
                        transition: "transform 0.2s ease",
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
            <div
              style={{
                fontWeight: 800,
                fontSize: "1rem",
                letterSpacing: "0.04em",
                color: "#f5f5f5",
              }}
            >
              vote100games.com
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
                Total Votes:
              </div>
              <div style={{ fontWeight: 800, fontSize: "1rem" }}>
                {loadingVotes ? "..." : totalVotesSubmitted?.toLocaleString()}
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
                maxWidth: 900,
                width: "100%",
                textAlign: "center",
                padding: isMobile ? "24px 8px 18px" : "40px 20px",
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
                  fontSize: "clamp(2.5rem, 7vw, 5.2rem)",
                  lineHeight: 1.02,
                  fontWeight: 900,
                  letterSpacing: "-0.04em",
                  margin: 0,
                  textWrap: "balance",
                }}
              >
                The Internet&apos;s
                <br />
                Top 100 Games
              </h1>

              <p
                style={{
                  margin: "22px auto 0",
                  maxWidth: 700,
                  color: "#b0b0b0",
                  fontSize: isMobile ? "1rem" : "1.12rem",
                  lineHeight: 1.65,
                }}
              >
                Pick your personal Top 10 and help shape the definitive
                community-ranked list of the greatest games of all time.
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
                    minWidth: isMobile ? "100%" : 170,
                    maxWidth: isMobile ? 320 : undefined,
                    width: isMobile ? "100%" : undefined,
                    borderRadius: 12,
                    background: "white",
                    color: "black",
                    textDecoration: "none",
                    fontWeight: 800,
                    fontSize: "1rem",
                    boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
                  }}
                >
                  Vote Now
                </Link>

                <a
                  href="#how-it-works"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "15px 24px",
                    minWidth: isMobile ? "100%" : 170,
                    maxWidth: isMobile ? 320 : undefined,
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
                </a>
              </div>

              <div
                id="how-it-works"
                style={{
                  marginTop: 34,
                  display: "grid",
                  gridTemplateColumns: isMobile
                    ? "1fr"
                    : "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 14,
                  textAlign: "left",
                }}
              >
                {[
                  {
                    step: "01",
                    title: "Build your Top 10",
                    text: "Search the database and rank your favorite games in order.",
                  },
                  {
                    step: "02",
                    title: "Add missing titles",
                    text: "Can’t find something? Pull it in from the wider database.",
                  },
                  {
                    step: "03",
                    title: "Shape the final list",
                    text: "Every ballot contributes points toward the overall Top 100.",
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    style={{
                      padding: 18,
                      borderRadius: 16,
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
                        lineHeight: 1.55,
                      }}
                    >
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}