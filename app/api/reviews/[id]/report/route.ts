// app/api/reviews/[id]/report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    // Mettre à jour le flag de l'avis
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isFlagged: true },
    });

    // Optionnel: créer un rapport dans la table ListingReport
    await prisma.listingReport.create({
      data: {
        listingId: review.bookingId, // Utiliser bookingId comme référence
        reporterId: user.id,
        reason: "Avis inapproprié",
        description: "Signalement d'avis par utilisateur",
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reporting review:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}