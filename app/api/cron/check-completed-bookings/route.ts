// app/api/cron/check-completed-bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  return handleRequest(req);
}

export async function POST(req: NextRequest) {
  return handleRequest(req);
}

async function handleRequest(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.CRON_SECRET}`;

    console.log("🔑 Auth header reçu:", authHeader);
    console.log("🔐 Expected:", expected);

    if (authHeader !== expected) {
      console.error("❌ Cron: Authentification échouée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("🕐 Cron: Vérification des séjours terminés");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedBookings = await prisma.booking.findMany({
      where: {
        status: "CONFIRMED",
        checkOut: { lt: today },
      },
      include: {
        tenant: true,
        listing: { select: { title: true, id: true } },
      },
    });

    console.log(
      `📋 ${completedBookings.length} réservations terminées trouvées`,
    );

    let processedCount = 0;

    for (const booking of completedBookings) {
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

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "COMPLETED" },
      });

      await prisma.notification.create({
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

      processedCount++;
      console.log(`✅ Notification envoyée pour ${booking.reference}`);
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
    });
  } catch (error) {
    console.error("Erreur cron check-completed-bookings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
