// app/api/cron/check-completed-bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Vérifier la clé secrète pour sécuriser le cron
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Trouver les réservations qui se terminent aujourd'hui ou sont déjà terminées
    const completedBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED", // Uniquement les réservations confirmées
        checkOut: {
          lt: today, // Date de check-out passée
        },
      },
      include: {
        tenant: true,
        listing: {
          select: { title: true, id: true },
        },
      },
    });

    console.log(`📋 ${completedBookings.length} réservations terminées trouvées`);

    const results = [];

    for (const booking of completedBookings) {
      // Vérifier si une notification a déjà été envoyée
      const existingNotification = await prisma.notification.findFirst({
        where: {
          bookingId: booking.id,
          type: "REVIEW_REMINDER",
        },
      });

      if (existingNotification) {
        console.log(`⏭️ Notification déjà envoyée pour ${booking.reference}`);
        continue;
      }

      // Marquer la réservation comme COMPLETED
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" },
      });

      // Créer la notification
      const notification = await prisma.notification.create({
        data: {
          userId: booking.tenantId,
          type: "REVIEW_REMINDER",
          title: "Partagez votre expérience !",
          content: `Votre séjour à "${booking.listing.title}" est terminé. Laissez un avis pour aider la communauté !`,
          data: {
            bookingId: booking.id,
            listingId: booking.listing.id,
            action: "leave_review",
          },
          bookingId: booking.id,
        },
      });

      results.push({
        bookingId: booking.id,
        reference: booking.reference,
        notificationId: notification.id,
      });

      console.log(`✅ Notification envoyée pour ${booking.reference}`);
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Erreur cron check-completed-bookings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}