// app/api/mobile-upload/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadSessions } from "@/lib/upload-sessions";

export async function POST() {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + 10 * 60 * 1000;

  console.log("🆕 Création nouvelle session:", sessionId);
  console.log("📊 Sessions existantes avant création:", uploadSessions.size);

  uploadSessions.set(sessionId, {
    id: sessionId,
    expiresAt,
    files: {},
    status: "waiting",
    createdAt: new Date().toISOString(),
  });

  console.log("📊 Sessions après création:", uploadSessions.size);
  console.log("🔑 Clés des sessions:", Array.from(uploadSessions.keys()));

  setTimeout(
    () => {
      console.log("⏰ Expiration session:", sessionId);
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

  console.log("🔍 Vérification session:", sessionId);
  console.log("📊 Sessions disponibles:", Array.from(uploadSessions.keys()));
  console.log("📊 Nombre de sessions:", uploadSessions.size);

  if (!sessionId) {
    console.log("❌ Pas de sessionId fourni");
    return NextResponse.json({ error: "sessionId requis" }, { status: 400 });
  }

  const session = uploadSessions.get(sessionId);

  if (!session) {
    console.log("❌ Session non trouvée:", sessionId);
    return NextResponse.json({ error: "Session expirée" }, { status: 404 });
  }

  console.log("✅ Session trouvée:", sessionId);
  return NextResponse.json(session);
}
