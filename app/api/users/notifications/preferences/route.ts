import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Valeurs par défaut des catégories de notifications
const DEFAULT_CATEGORIES = {
  bookings: true,
  payments: true,
  messages: true,
  reviews: true,
  listings: true,
  alerts: true,
  disputes: true,
  offers: true,
  system: true,
};

const DEFAULT_QUIET_HOURS = { start: "22:00", end: "07:00", enabled: true };

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ 
      where: { clerkId },
      select: { notificationPreferences: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les préférences ou utiliser les valeurs par défaut
    const prefs = user.notificationPreferences as any || {};
    
    return NextResponse.json({ 
      categories: prefs.categories || DEFAULT_CATEGORIES,
      quietHours: prefs.quietHours || DEFAULT_QUIET_HOURS
    });
  } catch (error) {
    console.error("GET preferences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { categories, quietHours } = await req.json();

    // Récupérer les préférences existantes
    const existingUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { notificationPreferences: true }
    });

    const existingPrefs = (existingUser?.notificationPreferences as any) || {};
    
    // Mettre à jour les préférences
    const updatedPrefs = {
      ...existingPrefs,
      categories: categories || DEFAULT_CATEGORIES,
      quietHours: quietHours || DEFAULT_QUIET_HOURS,
    };

    await prisma.user.update({
      where: { clerkId },
      data: {
        notificationPreferences: updatedPrefs,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT preferences error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}