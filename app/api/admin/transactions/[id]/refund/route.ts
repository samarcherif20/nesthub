// app/api/admin/transactions/[id]/refund/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;
    const { id } = await params;

    // Vérifier que l'utilisateur est ADMIN
    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Lire le body
    const body = await request.json().catch(() => ({}));
    const { amount, reason } = body;

    // 1. Récupérer la transaction depuis la base de données
    const payment = await prisma.payment.findUnique({
      where: { id },
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

    if (!payment) {
      return NextResponse.json(
        { error: "Transaction non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier si déjà remboursé
    if (payment.status === "REFUNDED") {
      return NextResponse.json(
        { error: "Cette transaction a déjà été remboursée" },
        { status: 400 },
      );
    }

    // Vérifier que le paiement peut être remboursé
    if (payment.status !== "PAID" && payment.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "Cette transaction ne peut pas être remboursée" },
        { status: 400 },
      );
    }

    const refundAmount = amount || payment.amount;
    let stripeRefund = null;

    // 2. Si c'est un paiement Stripe, effectuer le remboursement via Stripe
    if (payment.provider === "STRIPE" && payment.providerTransactionId) {
      try {
        // Récupérer le PaymentIntent
        const paymentIntent = await stripe.paymentIntents.retrieve(
          payment.providerTransactionId,
        );

        if (!paymentIntent) {
          throw new Error("PaymentIntent non trouvé");
        }

        // Créer le refund
        stripeRefund = await stripe.refunds.create({
          payment_intent: payment.providerTransactionId,
          amount: Math.round(refundAmount * 100), // Convertir en centimes
          reason: "requested_by_customer",
          metadata: {
            admin_reason: reason || "Remboursement administratif",
            transaction_id: payment.id,
            booking_id: payment.bookingId || "",
          },
        });

        console.log(`✅ Refund Stripe créé: ${stripeRefund.id}`);
      } catch (stripeError) {
        console.error("❌ Erreur Stripe:", stripeError);
        return NextResponse.json(
          { error: "Erreur lors du remboursement Stripe" },
          { status: 500 },
        );
      }
    }

    // 3. Mettre à jour le statut du paiement
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "REFUNDED",
        refundAmount: refundAmount,
        refundReason: reason || "Remboursement effectué par l'administrateur",
        refundedAt: new Date(),
        providerData: stripeRefund
          ? {
              refundId: stripeRefund.id,
              refundStatus: stripeRefund.status,
              refundAmount: stripeRefund.amount / 100,
            }
          : undefined,
      },
    });

    // 4. Créer une transaction de type REFUND
    await prisma.payment.create({
      data: {
        bookingId: payment.bookingId,
        amount: -refundAmount,
        type: "REFUND",
        status: "SUCCESS",
        provider: payment.provider,
        refundReason: reason || "Remboursement administratif",
        providerTransactionId: stripeRefund?.id,
      },
    });

    // 5. Mettre à jour le statut de la réservation (si elle existe)
    if (payment.bookingId) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: {
          status: "CANCELLED",
          paymentStatus: "REFUNDED",
          cancellationReason: reason || "Remboursement administratif",
          cancelledAt: new Date(),
        },
      });
    }

    // 6. Envoyer des notifications
    if (payment.booking) {
      const tenantId = payment.booking.tenantId;
      const ownerId = payment.booking.ownerId;
      const listingTitle = payment.booking.listing?.title || "la propriété";

      if (tenantId) {
        await prisma.notification.create({
          data: {
            userId: tenantId,
            type: "PAYMENT_REFUNDED",
            title: "Remboursement effectué",
            content: `Votre paiement de ${refundAmount.toFixed(2)} TND a été remboursé. Motif: ${reason || "Remboursement administratif"}`,
            channels: ["IN_APP", "EMAIL"],
            data: {
              transactionId: payment.id,
              bookingId: payment.bookingId,
              amount: refundAmount,
            },
          },
        });
      }

      if (ownerId) {
        await prisma.notification.create({
          data: {
            userId: ownerId,
            type: "PAYMENT_REFUNDED",
            title: "Remboursement effectué",
            content: `Un remboursement de ${refundAmount.toFixed(2)} TND a été effectué pour la réservation "${listingTitle}". Motif: ${reason || "Remboursement administratif"}`,
            channels: ["IN_APP", "EMAIL"],
            data: {
              transactionId: payment.id,
              bookingId: payment.bookingId,
              amount: refundAmount,
            },
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Remboursement effectué avec succès",
      refund: {
        id: updatedPayment.id,
        amount: refundAmount,
        status: "REFUNDED",
        stripeRefundId: stripeRefund?.id,
      },
    });
  } catch (error) {
    console.error("❌ Refund error:", error);
    return NextResponse.json(
      { error: "Erreur lors du remboursement" },
      { status: 500 },
    );
  }
}
