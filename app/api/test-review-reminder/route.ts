// app/api/test-review-reminder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Trouver une réservation COMPLETED sans notification
    const booking = await prisma.booking.findFirst({
      where: {
        tenantId: user.id,
        status: "COMPLETED",
      },
      include: { listing: true },
    });

    if (!booking) {
      return NextResponse.json({
        error: "Aucune réservation COMPLETED trouvée",
      });
    }

    // Vérifier si notification existe déjà
    const existingNotif = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: "REVIEW_REMINDER",
        bookingId: booking.id,
      },
    });

    if (existingNotif) {
      return NextResponse.json({
        message: "Notification déjà envoyée",
        notification: existingNotif,
      });
    }

    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: "REVIEW_REMINDER",
        title: "Partagez votre expérience ! ✨",
        content: `Votre séjour à "${booking.listing.title}" est terminé. Laissez un avis !`,
        data: { bookingId: booking.id, action: "leave_review" },
        bookingId: booking.id,
      },
    });

    return NextResponse.json({
      success: true,
      notification,
      booking: { id: booking.id, reference: booking.reference },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
