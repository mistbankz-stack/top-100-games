export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050505",
        color: "white",
        textAlign: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          padding: "32px 24px",
          borderRadius: 20,
          background: "rgba(18,18,18,0.9)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            fontSize: "0.8rem",
            letterSpacing: "0.08em",
            color: "#888",
            marginBottom: 12,
          }}
        >
          vote100games.com
        </div>

        <h1
          style={{
            fontSize: "2rem",
            fontWeight: 900,
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          We’ll be back soon
        </h1>

        <p
          style={{
            marginTop: 16,
            color: "#aaa",
            lineHeight: 1.6,
            fontSize: "0.95rem",
          }}
        >
          I’m putting the final touches on the{" "}
          <strong>The Internet’s Top 100 Games</strong> project.
        </p>

        <p
          style={{
            marginTop: 10,
            color: "#777",
            fontSize: "0.9rem",
            lineHeight: 1.5,
          }}
        >
          You’ll be able to vote for your Top 10 soon and help decide the final
          list.
        </p>

        <div
          style={{
            marginTop: 22,
            fontSize: "0.85rem",
            color: "#666",
          }}
        >
          — Bandit Banks
        </div>
      </div>
    </main>
  );
}