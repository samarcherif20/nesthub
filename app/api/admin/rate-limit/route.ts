// app/api/admin/rate-limit/route.ts

import { NextResponse } from "next/server";

// Stockage en mémoire (en production: Redis)
interface RateLimitEntry {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

const rateLimits = new Map<string, RateLimitEntry>();

const MAX_ATTEMPTS = 3;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const WINDOW_MS = 60 * 60 * 1000; // 1 heure pour reset

function getClientIdentifier(req: Request): string {
  // Combine IP + User-Agent pour identifier le client
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return `${ip}:${ua.slice(0, 50)}`;
}

export async function GET(req: Request) {
  const identifier = getClientIdentifier(req);
  const now = Date.now();
  
  const entry = rateLimits.get(identifier);
  
  if (!entry) {
    return NextResponse.json({
      attempts: 0,
      remaining: MAX_ATTEMPTS,
      locked: false,
      lockedUntil: null,
    });
  }
  
  // Reset si la fenêtre est passée
  if (now - entry.lastAttempt > WINDOW_MS) {
    rateLimits.delete(identifier);
    return NextResponse.json({
      attempts: 0,
      remaining: MAX_ATTEMPTS,
      locked: false,
      lockedUntil: null,
    });
  }
  
  // Vérifier si toujours verrouillé
  const isLocked = entry.lockedUntil !== null && now < entry.lockedUntil;
  
  return NextResponse.json({
    attempts: entry.attempts,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.attempts),
    locked: isLocked,
    lockedUntil: entry.lockedUntil,
    remainingLockTime: isLocked ? entry.lockedUntil! - now : 0,
  });
}

export async function POST(req: Request) {
  const { action } = await req.json();
  const identifier = getClientIdentifier(req);
  const now = Date.now();
  
  if (action === "record-attempt") {
    let entry = rateLimits.get(identifier);
    
    if (!entry || now - entry.lastAttempt > WINDOW_MS) {
      // Nouvelle entrée ou reset
      entry = {
        attempts: 1,
        lockedUntil: null,
        lastAttempt: now,
      };
    } else {
      // Incrémenter
      entry.attempts += 1;
      entry.lastAttempt = now;
      
      // Verrouiller si max atteint
      if (entry.attempts >= MAX_ATTEMPTS) {
        entry.lockedUntil = now + LOCK_DURATION_MS;
      }
    }
    
    rateLimits.set(identifier, entry);
    
    const isLocked = entry.lockedUntil !== null && now < entry.lockedUntil;
    
    return NextResponse.json({
      attempts: entry.attempts,
      remaining: Math.max(0, MAX_ATTEMPTS - entry.attempts),
      locked: isLocked,
      lockedUntil: entry.lockedUntil,
    });
  }
  
  if (action === "reset") {
    rateLimits.delete(identifier);
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}