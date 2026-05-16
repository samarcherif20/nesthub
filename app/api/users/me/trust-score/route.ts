// app/api/users/me/trust-score/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const userStats = await prisma.userStats.findUnique({
      where: { userId: user.id },
      select: {
        reliabilityScore: true,
        trustLabel: true,
        trustBadge: true,
        scamFlags: true,
        lastScoredAt: true,
      },
    });

    if (!userStats) {
      return NextResponse.json({ 
        reliabilityScore: 50, 
        trustLabel: "Non évalué", 
        trustBadge: "gray" 
      });
    }

    return NextResponse.json(userStats);
    
  } catch (error) {
    console.error("[GET /api/users/me/trust-score] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}