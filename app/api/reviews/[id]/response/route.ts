// app/api/reviews/[id]/response/route.ts
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

    const body = await request.json();
    const { response } = body;

    if (!response || typeof response !== "string") {
      return NextResponse.json({ error: "Réponse invalide" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est bien le target de l'avis
    const review = await prisma.review.findFirst({
      where: {
        id,
        targetId: user.id,
        targetType: "USER",
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé ou non autorisé" }, { status: 404 });
    }

    const updatedReview = await prisma.review.update({
      where: { id },
      data: {
        response,
        responseAt: new Date(),
      },
    });

    // Créer une notification pour le reviewer
    await prisma.notification.create({
      data: {
        userId: review.reviewerId,
        type: "NEW_REVIEW",
        title: "Réponse à votre avis",
        content: `L'hôte a répondu à votre avis.`,
        channels: ["IN_APP"],
        data: { reviewId: review.id },
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error("Error adding response:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}