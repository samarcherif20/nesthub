import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function PUT(
  req: NextRequest,
  { params }: { params: Params }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { isPublished } = await req.json();

    // Récupérer l'avis avec les infos nécessaires pour la notification
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
          select: { id: true, firstName: true, lastName: true },
        },
        target: {
          select: { id: true, firstName: true, lastName: true },
        },
        booking: {
          include: {
            listing: {
              select: { title: true },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    // Mettre à jour l'avis
    const updatedReview = await prisma.review.update({
      where: { id },
      data: { isPublished },
    });

    //  CRÉER UNE NOTIFICATION POUR L'UTILISATEUR CONCERNÉ (reviewer ou target)
    const actionType = isPublished ? "REVIEW_SHOWN" : "REVIEW_HIDDEN";
    const actionMessage = isPublished 
      ? `Votre avis sur "${review.booking.listing.title}" a été réactivé par l'équipe de modération.`
      : `Votre avis sur "${review.booking.listing.title}" a été masqué par l'équipe de modération.`;

    await prisma.notification.create({
      data: {
        userId: review.reviewer.id, // Notifier l'auteur de l'avis
        type: "SYSTEM_ALERT",
        title: isPublished ? " Avis réactivé" : " Avis masqué",
        content: actionMessage,
        channels: ["IN_APP", "EMAIL"],
        data: {
          reviewId: id,
          listingTitle: review.booking.listing.title,
          action: actionType,
          adminName: `${admin.firstName} ${admin.lastName}`,
        },
      },
    });

    // Log l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: actionType,
        actionType: "MODERATION",
        targetType: "REVIEW",
        targetId: id,
        details: { isPublished, listingTitle: review.booking.listing.title },
      },
    });

    return NextResponse.json({ success: true, review: updatedReview });
  } catch (error) {
    console.error("Erreur lors du changement de visibilité:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}