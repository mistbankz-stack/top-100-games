"use client";

import { FormEvent, useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
    <main
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 500,
          background: "#151515",
          border: "1px solid #222",
          borderRadius: 14,
          padding: 24,
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            fontWeight: "bold",
            marginBottom: 12,
          }}
        >
          Sign in to vote
        </h1>

        <p
          style={{
            color: "#aaa",
            marginBottom: 24,
            lineHeight: 1.5,
          }}
        >
          Enter your email and we’ll send you a magic link so you can submit your
          Top 10 games.
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
              padding: "14px 16px",
              borderRadius: 8,
              border: "1px solid #333",
              background: "#0d0d0d",
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
              marginTop: 16,
              padding: "14px 16px",
              borderRadius: 8,
              border: "none",
              background: "white",
              color: "black",
              fontSize: "16px",
              fontWeight: "bold",
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
              borderRadius: 8,
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
              borderRadius: 8,
              background: "#2a1111",
              border: "1px solid #5b2222",
              color: "#ffb3b3",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        ) : null}
      </div>
    </main>
  );
}