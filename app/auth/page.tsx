"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
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

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [games, setGames] = useState<HomeGame[]>([]);
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
    async function loadGames() {
      try {
        const { data, error } = await supabase
          .from("games")
          .select("id, title, cover_url")
          .not("cover_url", "is", null)
          .limit(40);

        if (error) {
          console.error("Failed to load auth background games:", error.message);
          return;
        }

        setGames(shuffleArray(data ?? []).slice(0, 20));
      } catch (error) {
        console.error("Failed to load auth background games:", error);
      }
    }

    loadGames();
  }, []);

  const topRowGames = useMemo(() => duplicateGames(games.slice(0, 10)), [games]);
  const bottomRowGames = useMemo(() => duplicateGames(games.slice(10, 20)), [games]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/request-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setMessage(data.message || "Magic link sent. Check your email.");
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @keyframes authMarqueeLeft {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        @keyframes authMarqueeRight {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }

        .auth-marquee-left {
          animation: authMarqueeLeft 48s linear infinite;
        }

        .auth-marquee-right {
          animation: authMarqueeRight 52s linear infinite;
        }

        @media (max-width: 900px) {
          .auth-marquee-left,
          .auth-marquee-right {
            animation-duration: 68s;
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
                "linear-gradient(to bottom, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.78) 32%, rgba(5,5,5,0.78) 68%, rgba(5,5,5,0.95) 100%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(5,5,5,0.96) 0%, rgba(5,5,5,0.42) 18%, rgba(5,5,5,0.42) 82%, rgba(5,5,5,0.96) 100%)",
              zIndex: 2,
            }}
          />

          {games.length > 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: isMobile ? 16 : 24,
                transform: isMobile ? "rotate(-6deg) scale(1.2)" : "rotate(-6deg) scale(1.08)",
                opacity: isMobile ? 0.13 : 0.18,
                zIndex: 1,
              }}
            >
              <div style={{ overflow: "hidden", width: "100%" }}>
                <div
                  className="auth-marquee-left"
                  style={{
                    display: "flex",
                    gap: 16,
                    width: "max-content",
                  }}
                >
                  {topRowGames.map((game, index) => (
                    <div
                      key={`auth-top-${game.id}-${index}`}
                      style={{
                        width: isMobile ? 95 : 130,
                        height: isMobile ? 132 : 180,
                        borderRadius: isMobile ? 10 : 14,
                        overflow: "hidden",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
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
                  className="auth-marquee-right"
                  style={{
                    display: "flex",
                    gap: 16,
                    width: "max-content",
                  }}
                >
                  {bottomRowGames.map((game, index) => (
                    <div
                      key={`auth-bottom-${game.id}-${index}`}
                      style={{
                        width: isMobile ? 95 : 130,
                        height: isMobile ? 132 : 180,
                        borderRadius: isMobile ? 10 : 14,
                        overflow: "hidden",
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.06)",
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
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              maxWidth: 1100,
              width: "100%",
              margin: "0 auto",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                letterSpacing: "0.04em",
              }}
            >
              vote100games.com
            </Link>

            <Link
              href="/"
              style={{
                color: "#b0b0b0",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.95rem",
              }}
            >
              ← Back home
            </Link>
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
                width: "100%",
                maxWidth: 1060,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 430px",
                gap: isMobile ? 26 : 34,
                alignItems: "center",
              }}
            >
              <div
                style={{
                  display: isMobile ? "none" : "block",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
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
                  One ballot per account
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: "clamp(2.6rem, 5vw, 4.4rem)",
                    lineHeight: 1.04,
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    maxWidth: 540,
                  }}
                >
                  Sign in and
                  <br />
                  build your
                  <br />
                  Top 10
                </h1>

                <p
                  style={{
                    marginTop: 20,
                    maxWidth: 520,
                    color: "#b0b0b0",
                    fontSize: "1.05rem",
                    lineHeight: 1.7,
                  }}
                >
                  We&apos;ll send you a secure magic link so you can vote without
                  creating a password. Fast, simple, and one step away from your ballot.
                </p>
              </div>

              <div
                style={{
                  width: "100%",
                  maxWidth: 430,
                  margin: isMobile ? "0 auto" : "0 0 0 auto",
                  background: "rgba(18,18,18,0.88)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 22,
                  padding: isMobile ? 20 : 26,
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  style={{
                    display: "inline-flex",
                    padding: "7px 12px",
                    borderRadius: 999,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#cfcfcf",
                    fontSize: "0.82rem",
                    marginBottom: 16,
                  }}
                >
                  Sign in to vote
                </div>

                <h1
                  style={{
                    fontSize: isMobile ? "2rem" : "2.1rem",
                    fontWeight: 900,
                    margin: "0 0 10px 0",
                    lineHeight: 1.05,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Get your magic link
                </h1>

                <p
                  style={{
                    color: "#aaaaaa",
                    marginBottom: 22,
                    lineHeight: 1.6,
                    fontSize: "0.98rem",
                  }}
                >
                  Enter your email and we&apos;ll send you a secure sign-in link so
                  you can submit your Top 10 games.
                </p>

                <form onSubmit={handleSubmit}>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    disabled={loading}
                    style={{
                      width: "100%",
                      padding: "15px 16px",
                      borderRadius: 12,
                      border: "1px solid #2f2f2f",
                      background: "#0c0c0c",
                      color: "white",
                      fontSize: "16px",
                      outline: "none",
                    }}
                  />

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      width: "100%",
                      marginTop: 14,
                      padding: "15px 16px",
                      borderRadius: 12,
                      border: "none",
                      background: "white",
                      color: "black",
                      fontSize: "16px",
                      fontWeight: 800,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                    }}
                  >
                    {loading ? "Sending..." : "Send magic link"}
                  </button>
                </form>

                {message ? (
                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 12,
                      background: "#102117",
                      border: "1px solid #1d4d2f",
                      color: "#9ee6b0",
                      lineHeight: 1.5,
                    }}
                  >
                    {message}
                  </div>
                ) : null}

                {error ? (
                  <div
                    style={{
                      marginTop: 18,
                      padding: 14,
                      borderRadius: 12,
                      background: "#2a1111",
                      border: "1px solid #5b2222",
                      color: "#ffb3b3",
                      lineHeight: 1.5,
                    }}
                  >
                    {error}
                  </div>
                ) : null}

                <div
                  style={{
                    marginTop: 18,
                    color: "#7f7f7f",
                    fontSize: "0.9rem",
                    lineHeight: 1.55,
                  }}
                >
                  One email. One ballot. No password needed.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}