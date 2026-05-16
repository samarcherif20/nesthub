// app/api/bookings/[id]/cancel/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { tndToStripeAmount, getCurrentExchangeRate } from "@/lib/currency";
import { onBookingCancelled } from "@/lib/risk-scoring";

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

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        owner: true,
        payments: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    const isTenant = booking.tenantId === user.id;
    const isOwner = booking.ownerId === user.id;

    if (!isTenant && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Réservation déjà annulée" },
        { status: 400 },
      );
    }

    if (new Date(booking.checkIn) < new Date()) {
      return NextResponse.json(
        { error: "Impossible d'annuler un séjour déjà commencé" },
        { status: 400 },
      );
    }

    const today = new Date();
    const checkInDate = new Date(booking.checkIn);
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
    );

    let refundPercentage = 0;
    let refundAmount = 0;

    if (isTenant) {
      if (daysUntilCheckIn >= 30) {
        refundPercentage = 100;
      } else if (daysUntilCheckIn >= 7) {
        refundPercentage = 50;
      } else {
        refundPercentage = 0;
      }
      refundAmount = (booking.totalPrice * refundPercentage) / 100;
    } else {
      refundPercentage = 100;
      refundAmount = booking.totalPrice;
    }

    let paymentIntentId = booking.stripePaymentIntentId;

    if (
      !paymentIntentId &&
      booking.paymentStatus === "PAID" &&
      refundAmount > 0
    ) {
      const transaction = await prisma.paymentTransaction.findFirst({
        where: { offerId: booking.offerId!, status: "SUCCESS" },
      });

      if (transaction?.stripePaymentIntentId) {
        paymentIntentId = transaction.stripePaymentIntentId;
        console.log(
          "✅ PaymentIntent trouvé via transaction:",
          paymentIntentId,
        );
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripePaymentIntentId: paymentIntentId },
        });
      }

      if (!paymentIntentId) {
        const payment = booking.payments[0];
        if (payment?.providerTransactionId) {
          paymentIntentId = payment.providerTransactionId;
          console.log("✅ PaymentIntent trouvé via payment:", paymentIntentId);
          await prisma.booking.update({
            where: { id: booking.id },
            data: { stripePaymentIntentId: paymentIntentId },
          });
        }
      }
    }

    let stripeRefundId = null;
    if (
      booking.paymentStatus === "PAID" &&
      paymentIntentId &&
      refundAmount > 0
    ) {
      try {
        console.log(
          `💰 Tentative remboursement ${refundAmount} TND (${refundPercentage}%) pour paymentIntent: ${paymentIntentId}`,
        );

        const rate = await getCurrentExchangeRate();
        console.log(`📊 Taux de change: 1 TND = ${rate} EUR`);

        const refundAmountInCents = await tndToStripeAmount(refundAmount);
        console.log(
          `💰 Montant remboursement: ${refundAmount} TND = ${refundAmountInCents / 100} EUR`,
        );

        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);
        const originalAmountInCents = paymentIntent.amount;
        console.log(
          `💰 Montant original Stripe: ${originalAmountInCents / 100} ${paymentIntent.currency.toUpperCase()}`,
        );

        let finalRefundAmount = refundAmountInCents;
        if (refundAmountInCents > originalAmountInCents) {
          console.warn(
            `⚠️ Montant remboursement (${refundAmountInCents / 100} EUR) > montant original (${originalAmountInCents / 100} EUR), ajustement...`,
          );
          finalRefundAmount = originalAmountInCents;
        }

        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: finalRefundAmount,
          reason: "requested_by_customer",
        });

        stripeRefundId = refund.id;
        console.log("✅ Remboursement Stripe effectué:", refund.id);
      } catch (stripeError) {
        console.error("❌ Erreur remboursement Stripe:", stripeError);
      }
    }

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

    let currentDate = new Date(booking.checkIn);
    while (currentDate < new Date(booking.checkOut)) {
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

    // ============================================
    // ✅ NOTIFICATIONS CORRIGÉES - LES DEUX PARTIES
    // ============================================

    // 1. NOTIFICATION POUR LE LOCATAIRE
    const tenantRefundMessage =
      refundAmount > 0
        ? `✅ Un remboursement de ${refundAmount} TND a été initié. Il sera crédité sur votre carte bancaire sous 2 à 4 jours ouvrés (délai bancaire standard).`
        : `❌ Aucun remboursement n'a été effectué car l'annulation est trop tardive.`;

    await prisma.notification.create({
      data: {
        userId: booking.tenantId,
        type: "BOOKING_CANCELLED",
        title: isTenant
          ? "✅ Votre réservation a été annulée"
          : "❌ Le propriétaire a annulé votre réservation",
        content: `${
          isTenant ? "Vous avez annulé" : "Le propriétaire a annulé"
        } la réservation pour "${booking.listing.title}".\n\n${tenantRefundMessage}${
          refundAmount > 0
            ? `\n\n💰 Montant remboursé : ${refundAmount} TND (soit ${refundPercentage}% du montant total).`
            : ""
        }`,
        channels: ["IN_APP", "EMAIL"],
        data: {
          bookingId: booking.id,
          listingTitle: booking.listing.title,
          refundAmount: refundAmount,
          refundPercentage: refundPercentage,
          cancelledBy: isTenant ? "TENANT" : "OWNER",
          expectedDelay: "2 à 4 jours ouvrés",
        },
      },
    });

    // 2. NOTIFICATION POUR LE PROPRIÉTAIRE
    const ownerRefundMessage =
      refundAmount > 0
        ? `Le locataire a été remboursé de ${refundAmount} TND (${refundPercentage}% du montant total).${
            refundPercentage < 100
              ? ` Vous conservez ${booking.totalPrice - refundAmount} TND.`
              : " Vous ne recevrez rien pour cette réservation."
          }`
        : "Aucun remboursement n'a été effectué. Vous conservez l'intégralité du paiement.";

    await prisma.notification.create({
      data: {
        userId: booking.ownerId!,
        type: "BOOKING_CANCELLED",
        title: isOwner
          ? "✅ Vous avez annulé une réservation"
          : "❌ Un locataire a annulé sa réservation",
        content: `${isOwner ? "Vous avez annulé" : "Le locataire a annulé"} la réservation pour "${booking.listing.title}".\n\n${ownerRefundMessage}${
          isOwner && refundAmount > 0
            ? `\n\n⚠️ Pénalité : Cette annulation est comptabilisée dans votre historique.`
            : ""
        }`,
        channels: ["IN_APP", "EMAIL"],
        data: {
          bookingId: booking.id,
          listingTitle: booking.listing.title,
          refundAmount: refundAmount,
          refundPercentage: refundPercentage,
          cancelledBy: isTenant ? "TENANT" : "OWNER",
          ownerKept:
            refundPercentage < 100 ? booking.totalPrice - refundAmount : 0,
        },
      },
    });

    // 3. NOTIFICATION POUR L'ADMIN
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: "📢 Annulation de réservation",
          content: `${isTenant ? "Locataire" : "Propriétaire"} a annulé: ${booking.listing.title} - Remboursement: ${refundAmount} TND (${refundPercentage}%)`,
          channels: ["IN_APP"],
          data: {
            bookingId: booking.id,
            cancelledBy: isTenant ? "TENANT" : "OWNER",
            refundAmount: refundAmount,
          },
        },
      });
    }

    // 4. PÉNALITÉ POUR LE PROPRIÉTAIRE (si c'est lui qui annule)
    if (isOwner) {
      await prisma.userStats.update({
        where: { userId: booking.ownerId! },
        data: { cancellationCount: { increment: 1 } },
      });

      const ownerStats = await prisma.userStats.findUnique({
        where: { userId: booking.ownerId! },
      });

      let penaltyMessage = "";
      if (ownerStats?.cancellationCount === 1) {
        penaltyMessage =
          "⚠️ Avertissement: première annulation. Deux autres annulations entraîneront une suspension.";
      } else if (ownerStats?.cancellationCount === 2) {
        penaltyMessage =
          "⚠️ Deuxième annulation: votre listing est désactivé pour 7 jours.";
        await prisma.listing.update({
          where: { id: booking.listingId },
          data: { status: "INACTIVE", blockReason: "Annulations répétées" },
        });
      } else if (ownerStats && ownerStats.cancellationCount >= 3) {
        // ✅ AMÉLIORATION CAS 7 : Désactiver TOUS les listings du propriétaire
        penaltyMessage =
          "⚠️ Troisième annulation: votre compte est suspendu temporairement pour 30 jours. Tous vos listings ont été désactivés.";

        // Désactiver TOUS les listings du propriétaire
        await prisma.listing.updateMany({
          where: { ownerId: booking.ownerId! },
          data: {
            status: "INACTIVE",
            blockReason: "Compte suspendu pour annulations répétées",
          },
        });

        // Suspendre le compte
        await prisma.user.update({
          where: { id: booking.ownerId! },
          data: {
            status: "TEMPORARILY_SUSPENDED",
            suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

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
    await onBookingCancelled(booking.id);

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
