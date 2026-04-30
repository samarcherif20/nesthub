// app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const { reason } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer la réservation
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier qui annule
    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.ownerId === user.id;

    if (!isTenant && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier si déjà annulée
    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Réservation déjà annulée" },
        { status: 400 },
      );
    }

    // Vérifier si le séjour a déjà commencé
    if (new Date(booking.checkIn) < new Date()) {
      return NextResponse.json(
        { error: "Impossible d'annuler un séjour déjà commencé" },
        { status: 400 },
      );
    }

    // Calculer les jours avant le check-in
    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );

    // Calculer le remboursement
    let refundPercentage = 0;
    let refundAmount = 0;

    if (isTenant) {
      // Locataire annule
      if (daysUntilCheckIn >= 30) {
        refundPercentage = 100;
      } else if (daysUntilCheckIn >= 7) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }
      refundAmount = (booking.totalPrice * refundPercentage) / 100;
    } else {
      // Propriétaire annule → remboursement total
      refundPercentage = 100;
      refundAmount = booking.totalPrice;
    }

    // Remboursement Stripe
    let stripeRefundId = null;
    if (
      booking.paymentStatus === "PAID" &&
      booking.stripePaymentIntentId &&
      refundAmount > 0
    ) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: booking.stripePaymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: "requested_by_customer",
        });
        stripeRefundId = refund.id;
      } catch (stripeError) {
        console.error("Erreur remboursement Stripe:", stripeError);
        // Continue sans remboursement auto
      }
    }

    // Mettre à jour la réservation
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason:
          reason ||
          (isTenant
            ? "Annulation par le locataire"
            : "Annulation par le propriétaire"),
        cancellationFee: refundPercentage === 0 ? booking.totalPrice : 0,
        refundAmount: refundAmount,
        paymentStatus: refundAmount > 0 ? "REFUNDED" : booking.paymentStatus,
        stripeRefundId: stripeRefundId,
      },
    });

    // Libérer les dates bloquées
    await prisma.blockedDate.deleteMany({
      where: {
        listingId: booking.listingId,
        startDate: { gte: booking.checkIn },
        endDate: { lte: booking.checkOut },
      },
    });

    // Mettre à jour les dates disponibles dans le calendrier
    let currentDate = new Date(booking.checkIn);
    while (currentDate < new Date(booking.checkOut)) {
      const dateStr = currentDate.toISOString().split("T")[0];
      await prisma.availabilityCalendar.upsert({
        where: {
          listingId_date: {
            listingId: booking.listingId,
            date: currentDate,
          },
        },
        update: { isAvailable: true },
        create: {
          listingId: booking.listingId,
          date: currentDate,
          isAvailable: true,
        },
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Notifier l'autre partie
    const otherUserId = isTenant ? booking.ownerId : booking.tenantId;

    await prisma.notification.create({
      data: {
        userId: otherUserId!,
        type: "BOOKING_CANCELLED",
        title: isTenant
          ? "❌ Réservation annulée"
          : "⚠️ Le propriétaire a annulé votre réservation",
        content: `${booking.listing.title} - ${refundAmount > 0 ? `Remboursement: ${refundAmount} TND` : "Aucun remboursement"}`,
        channels: ["IN_APP", "EMAIL"],
        data: {
          bookingId: booking.id,
          listingTitle: booking.listing.title,
          refundAmount: refundAmount,
          cancelledBy: isTenant ? "TENANT" : "OWNER",
        },
      },
    });

    // Notifier aussi l'admin
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: "📢 Annulation de réservation",
          content: `${isTenant ? "Locataire" : "Propriétaire"} a annulé: ${booking.listing.title} - Remboursement: ${refundAmount} TND`,
          channels: ["IN_APP"],
          data: { bookingId: booking.id },
        },
      });
    }

    // Si c'est le propriétaire qui annule, ajouter une pénalité
    if (isOwner) {
      await prisma.userStats.update({
        where: { userId: booking.ownerId! },
        data: { cancellationCount: { increment: 1 } },
      });

      // Récupérer le nombre d'annulations du propriétaire
      const ownerStats = await prisma.userStats.findUnique({
        where: { userId: booking.ownerId! },
      });

      let penaltyMessage = "";
      if (ownerStats?.cancellationCount === 1) {
        penaltyMessage = "⚠️ Avertissement: première annulation.";
      } else if (ownerStats?.cancellationCount === 2) {
        penaltyMessage =
          "⚠️ Deuxième annulation: votre listing est désactivé pour 7 jours.";
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: "INACTIVE", blockReason: "Annulations répétées" },
        });
      } else if (ownerStats && ownerStats.cancellationCount >= 3) {
        penaltyMessage =
          "⚠️ Troisième annulation: votre compte est suspendu temporairement.";
        await prisma.user.update({
          where: { id: booking.ownerId! },
          data: {
            status: "TEMPORARILY_SUSPENDED",
            suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      // Notifier le propriétaire de la pénalité
      if (penaltyMessage) {
        await prisma.notification.create({
          data: {
            userId: booking.ownerId!,
            type: "SYSTEM_ALERT",
            title: "⚠️ Pénalité d'annulation",
            content: penaltyMessage,
            channels: ["IN_APP"],
            data: { cancellationCount: ownerStats?.cancellationCount },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      refundAmount,
      refundPercentage,
      message: `Réservation annulée. Remboursement: ${refundAmount} TND (${refundPercentage}%)`,
      booking: updatedBooking,
    });
  } catch (error) {
    console.error("Erreur annulation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
