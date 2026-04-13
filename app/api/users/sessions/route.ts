// app/api/users/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      console.log("[DEBUG] No clerkId found");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log("[DEBUG] Fetching sessions for clerkId:", clerkId);

    const clerk = await clerkClient();

    // Récupérer toutes les sessions de l'utilisateur
    const sessionsResponse = await clerk.sessions.getSessionList({
      userId: clerkId,
    });

    // Extract sessions array from response
    let sessions = [];

    if (Array.isArray(sessionsResponse)) {
      sessions = sessionsResponse;
    } else if (sessionsResponse && typeof sessionsResponse === "object") {
      if (Array.isArray(sessionsResponse.data)) {
        sessions = sessionsResponse.data;
      } else if (sessionsResponse.id) {
        sessions = [sessionsResponse];
      } else {
        console.error(
          "[ERROR] Unknown sessions response structure:",
          sessionsResponse,
        );
        return NextResponse.json({ sessions: [] }, { status: 200 });
      }
    }

    const currentSessionId = req.headers.get("x-session-id") || sessions[0]?.id;

    // Format sessions with data from latestActivity
    const formattedSessions = sessions.map((session) => {
      const activity = session.latestActivity || {};

      // Build device string from browser and device info
      let device = "Appareil inconnu";
      if (activity.browserName) {
        device = activity.browserName;
        if (activity.browserVersion) {
          device += ` ${activity.browserVersion}`;
        }
      }
      if (activity.deviceType && activity.deviceType !== "Unknown") {
        device = `${activity.deviceType} - ${device}`;
      }

      // Build location string from city and country
      let location = "Localisation inconnue";
      if (activity.city && activity.country) {
        location = `${activity.city}, ${activity.country}`;
      } else if (activity.city) {
        location = activity.city;
      } else if (activity.country) {
        location = activity.country;
      }

      return {
        id: session.id,
        device: device,
        location: location,
        ip: activity.ipAddress || "IP inconnue",
        isCurrent: session.id === currentSessionId,
        lastActive: session.lastActiveAt,
        status: session.status,
      };
    });

    // Filter to only show active sessions
    const activeSessions = formattedSessions.filter(
      (session) => session.status === "active",
    );

    console.log("[DEBUG] Active sessions count:", activeSessions.length);

    return NextResponse.json({ sessions: activeSessions });
  } catch (error) {
    console.error("[GET /api/users/sessions] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
