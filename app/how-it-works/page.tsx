import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Sign in with your email",
    text: "Use a magic link and get in quick. No password, no account setup, no extra nonsense.",
  },
  {
    number: "02",
    title: "Build your Top 10",
    text: "Search for your favorite games, add them to your list, and rank them from #1 to #10.",
  },
  {
    number: "03",
    title: "Double check the order",
    text: "Your ranking matters, so make sure your list is in the right order before you lock it in.",
  },
  {
    number: "04",
    title: "Submit your ballot",
    text: "Once you submit, your vote is locked, added to the totals, and counted toward the final Top 100.",
  },
];

const RULES = [
  "One ballot per email.",
  "Your ranking order matters.",
  "Can’t find a game? You can expand the search.",
  "DLCs and expansions may appear in deeper search results, but only base games will count toward the final list.",
  "For example: Elden Ring counts, but Shadow of the Erdtree doesn’t. The Witcher 3 counts, but Blood and Wine doesn’t.... you get the idea",
  "Once you submit your ballot, it’s locked in.",
];

export default function HowItWorksPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top, rgba(255,255,255,0.06) 0%, rgba(5,5,5,0) 30%), #050505",
        color: "white",
        padding: "28px 18px 56px",
      }}
    >
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 34,
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
                fontSize: "1rem",
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

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                textDecoration: "none",
                color: "white",
                fontWeight: 700,
                backdropFilter: "blur(12px)",
              }}
            >
              Back home
            </Link>
            <Link
              href="/auth"
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                background: "white",
                color: "black",
                textDecoration: "none",
                fontWeight: 900,
                boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
              }}
            >
              Vote now
            </Link>
          </div>
        </header>

        <section
          style={{
            padding: "clamp(22px, 4vw, 34px)",
            borderRadius: 28,
            background: "rgba(18,18,18,0.82)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 24px 70px rgba(0,0,0,0.35)",
            backdropFilter: "blur(14px)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.5rem, 5vw, 4.35rem)",
              lineHeight: 1.02,
              letterSpacing: "-0.05em",
              fontWeight: 900,
              maxWidth: 780,
            }}
          >
            How this works
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 760,
              color: "#b0b0b0",
              fontSize: "1.06rem",
              lineHeight: 1.75,
            }}
          >
            Pretty simple. You sign in, build your Top 10, rank it properly, and submit
            one final ballot. After that, your vote gets added to the totals that will
            decide the final Top 100.
          </p>

          <div
            style={{
              marginTop: 30,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.number}
                style={{
                  padding: "20px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    color: "#8f8f8f",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    letterSpacing: "0.08em",
                    marginBottom: 10,
                  }}
                >
                  {step.number}
                </div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: "1.08rem",
                    marginBottom: 10,
                    lineHeight: 1.3,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    color: "#aaaaaa",
                    lineHeight: 1.68,
                    fontSize: "0.97rem",
                  }}
                >
                  {step.text}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 30,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "20px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: "white",
                  fontWeight: 800,
                  marginBottom: 10,
                  fontSize: "1.02rem",
                }}
              >
                Why the ranking matters
              </div>
              <div
                style={{
                  color: "#aaaaaa",
                  lineHeight: 1.7,
                  fontSize: "0.97rem",
                }}
              >
                This isn’t just a list of games people like. The order matters too. A
                game ranked #1 is worth more than a game ranked #10, so where you place
                something can make a real difference.
              </div>
            </div>

            <div
              style={{
                padding: "20px",
                borderRadius: 20,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div
                style={{
                  color: "white",
                  fontWeight: 800,
                  marginBottom: 10,
                  fontSize: "1.02rem",
                }}
              >
                A few quick rules
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                {RULES.map((rule) => (
                  <div
                    key={rule}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      color: "#aaaaaa",
                      lineHeight: 1.6,
                      fontSize: "0.97rem",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "white",
                        marginTop: 8,
                        flexShrink: 0,
                        opacity: 0.9,
                      }}
                    />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 30,
              padding: "22px",
              borderRadius: 22,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "1.08rem",
                fontWeight: 800,
                color: "white",
                marginBottom: 8,
              }}
            >
              Ready to lock in your list?
            </div>
            <div
              style={{
                color: "#aaaaaa",
                lineHeight: 1.7,
                fontSize: "0.97rem",
                maxWidth: 620,
                margin: "0 auto 18px",
              }}
            >
              Build your Top 10, submit your ballot, and help decide the final Top 100.
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/auth"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "white",
                  color: "black",
                  textDecoration: "none",
                  fontWeight: 900,
                  minWidth: 180,
                  boxShadow: "0 10px 30px rgba(255,255,255,0.08)",
                }}
              >
                Vote your Top 10
              </Link>

              <a
                href="https://www.youtube.com/@banditbanks"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "14px 20px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 800,
                  minWidth: 220,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                Check out my YouTube channel →
              </a>
            </div>
          </div>
        </section>

        <footer
          style={{
            marginTop: 20,
            color: "#666",
            fontSize: "0.82rem",
            textAlign: "center",
          }}
        >
          Game data provided by IGDB.
        </footer>
      </div>
    </main>
  );
}