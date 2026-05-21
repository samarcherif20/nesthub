import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { networkInterfaces } from "os";

const SESSION_DURATION = 60 * 60 * 1000;

// Stockage global des sessions
declare global {
  // eslint-disable-next-line no-var
  var __uploadSessions: Map<string, any> | undefined;
}

const getUploadSessions = () => {
  if (!global.__uploadSessions) {
    global.__uploadSessions = new Map();
  }
  return global.__uploadSessions;
};

function getLocalIpAddress(): string {
  const nets = networkInterfaces();

  console.log("Detecting network interfaces...");

  // First, try to find the exact Wi-Fi adapter
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces || !Array.isArray(interfaces)) continue;

    // Look specifically for Wi-Fi adapter
    if (
      name.toLowerCase().includes("wi-fi") ||
      name.toLowerCase().includes("wlan")
    ) {
      for (const net of interfaces) {
        if (net.family === "IPv4" && !net.internal) {
          console.log(`Found Wi-Fi IP: ${net.address} on ${name}`);
          return net.address;
        }
      }
    }
  }

  // If Wi-Fi not found, look for any 192.168.x.x address
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces || !Array.isArray(interfaces)) continue;

    for (const net of interfaces) {
      if (net.family === "IPv4" && !net.internal) {
        const ip = net.address;
        console.log(`Found: ${ip} on ${name}`);

        if (ip.startsWith("192.168.")) {
          console.log(`Using IP: ${ip}`);
          return ip;
        }
      }
    }
  }

  console.error("No valid IP found, using localhost");
  return "localhost";
}

export async function POST(request: NextRequest) {
  try {
    const uploadSessions = getUploadSessions();

    // Nettoyer les sessions expirées
    for (const [id, session] of uploadSessions.entries()) {
      if (session.expiresAt < Date.now()) {
        uploadSessions.delete(id);
      }
    }

    const sessionId = randomUUID();
    const expiresAt = Date.now() + SESSION_DURATION;
    const { userId, mode, documentType, locale } = await request.json();

    uploadSessions.set(sessionId, {
      id: sessionId,
      expiresAt,
      files: {},
      status: "waiting",
      mode: mode || "inscription",
      locale: locale || "fr",

      documentType: documentType || "cin",

      createdAt: new Date().toISOString(),
    });
    const localIp = getLocalIpAddress();
    const port = process.env.PORT || 3000;
    const baseUrl = `http://${localIp}:${port}`;
    const qrUrl = `${baseUrl}/${locale || "fr"}/mobile-upload/${sessionId}`;
    console.log("\MOBILE UPLOAD SESSION ");
    console.log(` Session ID: ${sessionId}`);
    console.log(` QR URL: ${qrUrl}`);
    console.log(` Server IP: ${localIp}`);
    console.log(` Expires: ${new Date(expiresAt).toLocaleTimeString()}`);
    console.log(` Total sessions: ${uploadSessions.size}`);

    return NextResponse.json({
      sessionId,
      qrUrl,
      expiresAt,
      localIp,
      mode: mode || "inscription",
    });
  } catch (error) {
    console.error(" Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const uploadSessions = getUploadSessions();
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

    return NextResponse.json({
      ...session,
      mode: session.mode,
    });
  } catch (error) {
    console.error(" Error getting session:", error);
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 },
    );
  }
}

export { getUploadSessions };
