// app/api/cron/release-expired-bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    //  Ajoute cette vérification d'auth
    const authHeader = req.headers.get("authorization");
    const isValidAuth = authHeader === `Bearer ${process.env.CRON_SECRET}`;
    const isDev = process.env.NODE_ENV === "development";

    if (!isValidAuth && !isDev) {
      console.error(" Cron: Authentification échouée");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    console.log(" Cron: Libération des réservations expirées");
    const now = new Date();

    const expiredBookings = await prisma.pendingBooking.findMany({
      where: {
        expiresAt: { lt: now },
        isReleased: false,
      },
    });

    console.log(` ${expiredBookings.length} réservation(s) expirée(s)`);
    let releasedCount = 0;

    for (const booking of expiredBookings) {
      const dates = booking.dates as string[];

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

      await prisma.pendingBooking.update({
        where: { id: booking.id },
        data: { isReleased: true, releasedAt: now },
      });

      await prisma.offer.update({
        where: { id: booking.offerId },
        data: { status: "EXPIRED" },
      });

      const offer = await prisma.offer.findUnique({
        where: { id: booking.offerId },
        include: { listing: true },
      });

      if (offer) {
        await prisma.notification.create({
          data: {
            userId: offer.tenantId,
            type: "OFFER_EXPIRED",
            title: " Offre expirée",
            content: `Votre délai de paiement pour "${offer.listing.title}" a expiré. Les dates sont à nouveau disponibles.`,
            channels: ["IN_APP", "EMAIL"],
          },
        });
      }

      releasedCount++;
    }

    return NextResponse.json({
      success: true,
      releasedCount,
      message: `${releasedCount} réservation(s) libérée(s)`,
    });
  } catch (error) {
    console.error(" Erreur cron:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
