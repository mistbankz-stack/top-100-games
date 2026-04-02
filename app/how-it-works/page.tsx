import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Sign in with your email",
    text: "Use a magic link to sign in quickly. No password, no account setup headaches.",
  },
  {
    number: "02",
    title: "Build your personal Top 10",
    text: "Search the database, add your favorite games, and rank them from #1 to #10.",
  },
  {
    number: "03",
    title: "Submit one final ballot",
    text: "Each rank is worth points, so your order matters. Once you submit, your vote is locked in.",
  },
  {
    number: "04",
    title: "Help decide the final Top 100",
    text: "Every ballot contributes to the final community ranking that Bandit Banks will reveal in a video.",
  },
];

export default function HowItWorksPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "white",
        padding: "28px 18px 48px",
      }}
    >
      <div style={{ maxWidth: 980, margin: "0 auto" }}>
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
              }}
            >
              Vote now
            </Link>
          </div>
        </header>

        <section
          style={{
            padding: "28px",
            borderRadius: 24,
            background: "rgba(18,18,18,0.86)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#d6d6d6",
              fontSize: "0.9rem",
              marginBottom: 18,
            }}
          >
            How it works
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "clamp(2.4rem, 5vw, 4rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.05em",
              fontWeight: 900,
            }}
          >
            A Top 100 list
            <br />
            decided by the internet
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 760,
              color: "#b0b0b0",
              fontSize: "1.05rem",
              lineHeight: 1.72,
            }}
          >
            I&apos;m Bandit Banks, and I got tired of seeing “greatest games ever”
            lists decided by a tiny group of people. So I built this project to do
            it differently: one ballot at a time, with the final results turning into
            a full video reveal.
          </p>

          <div
            style={{
              marginTop: 28,
              display: "grid",
              gap: 14,
            }}
          >
            {STEPS.map((step) => (
              <div
                key={step.number}
                style={{
                  padding: "18px",
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    color: "#8f8f8f",
                    fontWeight: 800,
                    fontSize: "0.8rem",
                    letterSpacing: "0.08em",
                    marginBottom: 8,
                  }}
                >
                  {step.number}
                </div>
                <div
                  style={{
                    color: "white",
                    fontWeight: 800,
                    fontSize: "1.08rem",
                    marginBottom: 8,
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    color: "#aaaaaa",
                    lineHeight: 1.6,
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
              marginTop: 28,
              padding: "18px",
              borderRadius: 18,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              style={{
                color: "white",
                fontWeight: 800,
                marginBottom: 8,
                fontSize: "1.02rem",
              }}
            >
              A few quick rules
            </div>
            <div style={{ color: "#aaaaaa", lineHeight: 1.7, fontSize: "0.97rem" }}>
              One ballot per email. Your ranking order matters. If you can&apos;t find a
              game in the initial search, the site can pull deeper from the wider
              database. Once your ballot is submitted, it&apos;s final.
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