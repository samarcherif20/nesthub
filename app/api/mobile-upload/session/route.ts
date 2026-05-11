import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadSessions } from "@/lib/upload-sessions";
import { networkInterfaces } from 'os';

// ✅ Augmenter la durée de session à 60 minutes
const SESSION_DURATION = 60 * 60 * 1000; // 60 minutes

function getLocalIpAddress(): string {
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Skip internal (non-public) and non-IPv4 addresses
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  
  return 'localhost';
}

export async function POST(request: NextRequest) {
  const sessionId = randomUUID();
  const expiresAt = Date.now() + SESSION_DURATION;

  // Nettoyer les sessions expirées
  for (const [id, session] of uploadSessions.entries()) {
    if (session.expiresAt < Date.now()) {
      uploadSessions.delete(id);
    }
  }

  uploadSessions.set(sessionId, {
    id: sessionId,
    expiresAt,
    files: {},
    status: "waiting",
    createdAt: new Date().toISOString(),
  });

  // ✅ Auto-détecter l'IP locale
  const localIp = getLocalIpAddress();
  const baseUrl = `http://${localIp}:3000`;
  const qrUrl = `${baseUrl}/mobile-upload/${sessionId}`;
  
  console.log("🔗 Session créée:", sessionId);
  console.log("📱 QR URL:", qrUrl);
  console.log("⏰ Expire à:", new Date(expiresAt).toLocaleTimeString());
  console.log("💡 Assurez-vous que votre téléphone est sur le même WiFi");

  return NextResponse.json({
    sessionId,
    qrUrl,
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

  if (session.expiresAt < Date.now()) {
    uploadSessions.delete(sessionId);
    return NextResponse.json({ error: "Session expirée" }, { status: 410 });
  }

  return NextResponse.json(session);
}