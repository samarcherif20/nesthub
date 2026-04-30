import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ✅ GET - Récupérer une demande de prolongation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { id } = await params;
    console.log("🔵 API GET /extensions/[id] appelée avec ID:", id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: owner.id,
        type: "BOOKING_REQUEST",
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    const data = notification.data as any;

    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        tenant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            stats: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            governorate: true,
            delegation: true,
            street: true,
            photos: {
              take: 1,
              where: { isMain: true },
              select: { url: true },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      id: notification.id,
      bookingId: booking.id,
      requestedCheckOut: data.requestedCheckOut,
      additionalNights: data.additionalNights,
      additionalPrice: data.additionalPrice,
      message: data.message || null,
      status: "PENDING",
      createdAt: notification.createdAt,
      booking: {
        id: booking.id,
        reference: booking.reference,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalPrice: booking.totalPrice,
        pricePerNight: booking.pricePerNight,
        cleaningFee: booking.cleaningFee,
        serviceFee: booking.serviceFee,
        nights: booking.totalNights,
        tenant: booking.tenant,
        listing: booking.listing,
      },
    });
  } catch (error) {
    console.error("Erreur GET extension:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ✅ PUT - Répondre à une demande de prolongation
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const owner = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!owner) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const { action, rejectionReason } = await req.json();

    const notification = await prisma.notification.findFirst({
      where: {
        id: id,
        userId: owner.id,
        type: "BOOKING_REQUEST",
      },
    });

    if (!notification) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 },
      );
    }

    const data = notification.data as any;

    if (action === "ACCEPTED") {
      const currentCheckOut = new Date(data.currentCheckOut);
      const newCheckOut = new Date(data.requestedCheckOut);

      // Générer les dates supplémentaires à bloquer
      const additionalDates: Date[] = [];
      for (
        let d = new Date(currentCheckOut);
        d < newCheckOut;
        d.setDate(d.getDate() + 1)
      ) {
        if (d.toDateString() !== currentCheckOut.toDateString()) {
          additionalDates.push(new Date(d));
        }
      }

      // Transaction pour tout faire atomiquement
      await prisma.$transaction(async (tx) => {
        // 1. Mettre à jour la réservation
        await tx.booking.update({
          where: { id: data.bookingId },
          data: {
            checkOut: newCheckOut,
            totalNights: { increment: data.additionalNights },
            totalPrice: { increment: data.additionalPrice },
          },
        });

        // 2. Bloquer les nouvelles dates
        for (const date of additionalDates) {
          await tx.blockedDate.create({
            data: {
              listingId: data.listingId,
              startDate: date,
              endDate: date,
              reason: `Réservé - Prolongation (Booking: ${data.bookingId})`,
              blockedById: owner.id,
            },
          });
        }

        // 3. Supprimer les pending bookings associés
        await tx.pendingBooking.deleteMany({
          where: {
            listingId: data.listingId,
            AND: [
              { checkIn: { lte: newCheckOut } },
              { checkOut: { gte: currentCheckOut } },
            ],
          },
        });

        // 4. Marquer la notification comme lue
        await tx.notification.update({
          where: { id: notification.id },
          data: { isRead: true },
        });
      });

      // 5. Notifier le locataire (en dehors de la transaction)
      await prisma.notification.create({
        data: {
          userId: data.tenantId,
          type: "EXTENSION_ACCEPTED",
          title: "✅ Prolongation acceptée",
          content: `Votre demande de prolongation a été acceptée. Nouvelle date de départ: ${newCheckOut.toLocaleDateString("fr-FR")}`,
          data: { bookingId: data.bookingId },
        },
      });

      console.log(
        `✅ Prolongation acceptée pour la réservation ${data.bookingId}`,
      );
      console.log(`   - Nouvelles dates bloquées: ${additionalDates.length}`);

      return NextResponse.json({ success: true });
    }

    if (action === "REJECTED") {
      const currentCheckOut = new Date(data.currentCheckOut);
      const requestedCheckOut = new Date(data.requestedCheckOut);

      // Transaction pour le rejet
      await prisma.$transaction(async (tx) => {
        // 1. Marquer la notification comme lue
        await tx.notification.update({
          where: { id: notification.id },
          data: { isRead: true },
        });

        // 2. Supprimer les pending bookings associés
        await tx.pendingBooking.deleteMany({
          where: {
            listingId: data.listingId,
            AND: [
              { checkIn: { lte: requestedCheckOut } },
              { checkOut: { gte: currentCheckOut } },
            ],
          },
        });
      });

      // 3. Notifier le locataire
      await prisma.notification.create({
        data: {
          userId: data.tenantId,
          type: "EXTENSION_REJECTED",
          title: "❌ Prolongation refusée",
          content: `Votre demande de prolongation a été refusée.${rejectionReason ? ` Motif: ${rejectionReason}` : ""}`,
          data: { bookingId: data.bookingId },
        },
      });

      console.log(
        `❌ Prolongation refusée pour la réservation ${data.bookingId}`,
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("Erreur PUT extension:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
