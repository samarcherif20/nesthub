import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

export async function DELETE(
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

    // Récupérer l'avis avant suppression
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        reviewer: {
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

    // Supprimer l'avis
    await prisma.review.delete({
      where: { id },
    });

    //  CRÉER UNE NOTIFICATION POUR L'UTILISATEUR
    await prisma.notification.create({
      data: {
        userId: review.reviewer.id,
        type: "SYSTEM_ALERT",
        title: " Avis supprimé",
        content: `Votre avis sur "${review.booking.listing.title}" a été supprimé par l'équipe de modération.`,
        channels: ["IN_APP", "EMAIL"],
        data: {
          reviewId: id,
          listingTitle: review.booking.listing.title,
          action: "REVIEW_DELETED",
          adminName: `${admin.firstName} ${admin.lastName}`,
        },
      },
    });

    // Log l'action admin
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "REVIEW_DELETED",
        actionType: "MODERATION",
        targetType: "REVIEW",
        targetId: id,
        details: { 
          listingTitle: review.booking.listing.title,
          rating: review.rating,
          reviewerId: review.reviewer.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}