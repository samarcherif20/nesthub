// app/api/cron/release-expired-bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs'; // Pour Vercel Edge
export const maxDuration = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    // Vérifier la clé API pour la sécurité
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error("❌ Cron: Authentification échouée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("🕐 Cron: Début de la libération des réservations expirées");
    const now = new Date();

    const expiredBookings = await prisma.pendingBooking.findMany({
      where: {
        expiresAt: { lt: now },
        isReleased: false,
      },
    });

    console.log(`📊 ${expiredBookings.length} réservation(s) expirée(s) trouvée(s)`);
    let releasedCount = 0;

    for (const booking of expiredBookings) {
      const dates = booking.dates as string[];
      
      // Libérer les dates
      for (const dateStr of dates) {
        const date = new Date(dateStr);
        await prisma.blockedDate.deleteMany({
          where: {
            listingId: booking.listingId,
            startDate: date,
            endDate: date,
            reason: { contains: "En attente de paiement" },
          },
        });

        await prisma.availabilityCalendar.updateMany({
          where: {
            listingId: booking.listingId,
            date: date,
          },
          data: {
            isAvailable: true,
            blockedReason: null,
          },
        });
      }

      // Marquer comme libéré
      await prisma.pendingBooking.update({
        where: { id: booking.id },
        data: { isReleased: true, releasedAt: now },
      });

      // Mettre à jour l'offre
      await prisma.offer.update({
        where: { id: booking.offerId },
        data: { status: "EXPIRED" },
      });

      // Récupérer l'offre pour la notification
      const offer = await prisma.offer.findUnique({
        where: { id: booking.offerId },
        include: { listing: true },
      });

      if (offer) {
        await prisma.notification.create({
          data: {
            userId: offer.tenantId,
            type: "OFFER_EXPIRED",
            title: "⏰ Offre expirée",
            content: `Votre délai de paiement pour "${offer.listing.title}" a expiré. Les dates sont à nouveau disponibles.`,
            channels: ["IN_APP", "EMAIL"],
          },
        });
      }

      releasedCount++;
      console.log(`✅ Réservation ${booking.id} libérée`);
    }

    console.log(`🎉 Cron terminé: ${releasedCount} réservation(s) libérée(s)`);
    return NextResponse.json({
      success: true,
      releasedCount,
      message: `${releasedCount} réservation(s) expirée(s) libérée(s)`,
    });
  } catch (error) {
    console.error("❌ Erreur cron:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}