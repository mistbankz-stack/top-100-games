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

const BULLETS = [
  "One vote per email",
  "No password needed",
  "Your ballot shapes the final Top 100",
];

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
          .limit(50);

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
                "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0) 48%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(5,5,5,0.84) 0%, rgba(5,5,5,0.58) 32%, rgba(5,5,5,0.58) 68%, rgba(5,5,5,0.84) 100%)",
              zIndex: 2,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.32) 18%, rgba(5,5,5,0.32) 82%, rgba(5,5,5,0.92) 100%)",
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
                opacity: isMobile ? 0.24 : 0.32,
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
                by Bandit Banks
              </div>
            </div>

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
                maxWidth: 1080,
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) 430px",
                gap: isMobile ? 26 : 36,
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
                    fontSize: "clamp(2.8rem, 5vw, 4.5rem)",
                    lineHeight: 1.03,
                    fontWeight: 900,
                    letterSpacing: "-0.05em",
                    maxWidth: 560,
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
                    maxWidth: 540,
                    color: "#b0b0b0",
                    fontSize: "1.05rem",
                    lineHeight: 1.72,
                  }}
                >
                  This whole project exists because I wanted a Top 100 Games list
                  decided by the internet, not a handful of people. Sign in, cast
                  your ballot, and help shape the final Bandit Banks video reveal.
                </p>

                <div
                  style={{
                    marginTop: 22,
                    display: "grid",
                    gap: 10,
                    maxWidth: 460,
                  }}
                >
                  {BULLETS.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        color: "#d6d6d6",
                        fontSize: "0.98rem",
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "white",
                          flexShrink: 0,
                        }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
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
                    lineHeight: 1.62,
                    fontSize: "0.98rem",
                  }}
                >
                  Enter your email and I&apos;ll send you a secure sign-in link so
                  you can submit your Top 10. One vote per email.
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
                      fontWeight: 900,
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.7 : 1,
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-1px) scale(1.01)";
                      e.currentTarget.style.boxShadow = "0 16px 36px rgba(255,255,255,0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0) scale(1)";
                      e.currentTarget.style.boxShadow = "0 10px 30px rgba(255,255,255,0.08)";
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
                  Check your inbox carefully — and your spam folder if needed.
                </div>
              </div>
            </div>
          </section>

          <footer
            style={{
              maxWidth: 1100,
              width: "100%",
              margin: "0 auto",
              color: "#666",
              fontSize: "0.82rem",
              paddingTop: 8,
            }}
          >
            Game data provided by IGDB.
          </footer>
        </div>
      </main>
    </>
  );
}