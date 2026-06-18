// app/api/admin/transactions/[id]/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { reason, amount } = await req.json();
    const transactionId = params.id;

    // Trouver la transaction
    let payment = await prisma.payment.findUnique({
      where: { id: transactionId },
      include: {
        booking: {
          include: {
            listing: true,
            tenant: true,
            owner: true,
          },
        },
      },
    });

    let stripePaymentIntentId = payment?.providerTransactionId;
    let booking = payment?.booking;

    if (!payment) {
      const paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              listing: { include: { owner: true } },
              tenant: true,
            }
          }
        }
      });
      stripePaymentIntentId = paymentTransaction?.stripePaymentIntentId;
      booking = paymentTransaction?.offer?.booking;
    }

    if (!stripePaymentIntentId) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
    }

    // Effectuer le remboursement Stripe
    const refund = await stripe.refunds.create({
      payment_intent: stripePaymentIntentId,
      amount: amount ? amount * 100 : undefined,
      reason: "requested_by_customer",
      metadata: {
        adminReason: reason || "Remboursement admin",
        transactionId: transactionId,
      },
    });

    const refundAmount = amount || payment?.amount || 0;

    // Mettre à jour la base de données
    if (payment) {
      await prisma.payment.update({
        where: { id: transactionId },
        data: {
          status: "REFUNDED",
          refundAmount: refundAmount,
          refundReason: reason || "Remboursement admin",
          refundedAt: new Date(),
          providerData: {
            refundId: refund.id,
            refundReason: reason,
          },
        },
      });

      // Mettre à jour la réservation
      if (payment.booking) {
        await prisma.booking.update({
          where: { id: payment.booking.id },
          data: {
            paymentStatus: "REFUNDED",
            status: "CANCELLED",
            refundAmount: refundAmount,
            refundReason: reason || "Remboursement admin",
            refundedAt: new Date(),
          },
        });
      }
    } else {
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: "REFUNDED",
          metadata: {
            refundId: refund.id,
            refundReason: reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });
    }

    //  NOTIFICATION au locataire
    if (booking?.tenantId) {
      await prisma.notification.create({
        data: {
          userId: booking.tenantId,
          type: "PAYMENT_REFUNDED",
          title: " Remboursement effectué",
          content: `Votre paiement de ${refundAmount.toLocaleString("fr-FR")} TND a été remboursé pour la réservation #${booking.reference || transactionId.slice(-8)}.`,
          data: { bookingId: booking.id, amount: refundAmount },
        },
      });
    }

    //  NOTIFICATION au propriétaire
    if (booking?.ownerId) {
      await prisma.notification.create({
        data: {
          userId: booking.ownerId,
          type: "SYSTEM_ALERT",
          title: " Réservation annulée",
          content: `La réservation #${booking.reference || transactionId.slice(-8)} a été annulée et remboursée au locataire.`,
          data: { bookingId: booking.id },
        },
      });
    }

    return NextResponse.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      },
    });
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json({ error: "Erreur lors du remboursement" }, { status: 500 });
  }
}