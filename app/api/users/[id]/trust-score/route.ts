// app/api/users/[id]/trust-score/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

//  Définir le type des params
type RouteParams = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(
  req: NextRequest,
  { params }: RouteParams
) {
  try {
    const { userId: clerkId } = await auth();
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    //  IMPORTANT: await params dans Next.js 15+
    const { id } = await params;
    
    // Vérifier si l'utilisateur demandé existe
    const targetUser = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, clerkId: true }
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les stats de l'utilisateur
    const userStats = await prisma.userStats.findUnique({
      where: { userId: id },
      select: {
        reliabilityScore: true,
        trustLabel: true,
        trustBadge: true,
        scamFlags: true,
        lastScoredAt: true,
      },
    });

    // Si pas de stats, retourner valeurs par défaut
    if (!userStats) {
      return NextResponse.json({ 
        reliabilityScore: 50, 
        trustLabel: "Non évalué", 
        trustBadge: "gray",
        lastScoredAt: null
      });
    }

    return NextResponse.json(userStats);
    
  } catch (error) {
    console.error("[GET /api/users/:id/trust-score] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}