import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function POST(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { reason } = await req.json();
    const { id: reviewId } = await params;

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: "Veuillez fournir une raison" }, { status: 400 });
    }

    if (!reviewId) {
      return NextResponse.json({ error: "ID de l'avis manquant" }, { status: 400 });
    }

    // Vérifier que l'avis existe
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // ✅ AJOUTER ICI - Vérifier si l'utilisateur a déjà signalé cet avis récemment (24h)
    const existingReport = await prisma.auditLog.findFirst({
      where: {
        adminId: user.id,
        action: "REVIEW_REPORTED",
        targetId: reviewId,
        createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 heures
      }
    });

    if (existingReport) {
      return NextResponse.json({ 
        error: "Vous avez déjà signalé cet avis récemment. Veuillez patienter 24h." 
      }, { status: 429 });
    }

    // Marquer l'avis comme signalé
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        isFlagged: true,
        flagReason: reason.trim(),
      }
    });

    // Créer une entrée dans les logs
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "REVIEW_REPORTED",
        actionType: "MODERATION",
        targetType: "REVIEW",
        targetId: reviewId,
        details: { reason: reason.trim(), reportedBy: user.id },
      }
    });

    return NextResponse.json({ success: true, message: "Avis signalé avec succès" });
  } catch (error) {
    console.error("Erreur lors du signalement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}