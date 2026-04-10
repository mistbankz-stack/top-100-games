import type { NextRequest } from "next/server";

const FALLBACK_IP = "0.0.0.0";

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }

  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const xVercelForwardedFor = req.headers.get("x-vercel-forwarded-for");
  if (xVercelForwardedFor) return xVercelForwardedFor.trim();

  return FALLBACK_IP;
}

export function getUserAgent(req: NextRequest): string {
  return req.headers.get("user-agent")?.slice(0, 300) ?? "";
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}