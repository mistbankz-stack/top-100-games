"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [totalVotesSubmitted, setTotalVotesSubmitted] = useState<number | null>(null);
  const [loadingVotes, setLoadingVotes] = useState(true);

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

    loadSiteStats();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 20,
      }}
    >
      <div style={{ maxWidth: 700, width: "100%" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: "bold" }}>
          The Internet&apos;s Top 100 Games of All Time
        </h1>

        <p style={{ marginTop: 20, color: "#aaa" }}>
          Pick your top 10 games and help decide the ultimate community-ranked list.
        </p>

        <div
          style={{
            marginTop: 30,
            padding: 24,
            borderRadius: 14,
            background: "#151515",
            border: "1px solid #222",
          }}
        >
          <div
            style={{
              color: "#888",
              fontSize: "0.95rem",
              marginBottom: 8,
            }}
          >
            Total Votes Submitted
          </div>

          <div
            style={{
              fontSize: "2.5rem",
              fontWeight: "bold",
            }}
          >
            {loadingVotes ? "Loading..." : totalVotesSubmitted?.toLocaleString()}
          </div>
        </div>

        <Link
          href="/auth"
          style={{
            display: "inline-block",
            marginTop: 30,
            padding: "14px 24px",
            fontSize: "16px",
            background: "white",
            color: "black",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Vote Now
        </Link>
      </div>
    </main>
  );
}