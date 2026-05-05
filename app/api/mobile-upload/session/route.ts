// app/api/mobile-upload/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadSessions } from "@/lib/upload-sessions";

export async function POST() {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  uploadSessions.set(sessionId, {
    id: sessionId,
    expiresAt,
    files: {},
    status: "waiting",
    createdAt: new Date().toISOString(),
  });

  setTimeout(
    () => {
      uploadSessions.delete(sessionId);
    },
    10 * 60 * 1000,
  );

  return NextResponse.json({
    sessionId,
    qrUrl: `http://192.168.1.18:3000/mobile-upload/${sessionId}`,
    expiresAt,
  });
}

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
  }

  const session = uploadSessions.get(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Session expirée" }, { status: 404 });
  }

  return NextResponse.json(session);
}
