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
  { params }: { params: { id: string } },
) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const chargeId = params.id;

    // Lire le body de manière sécurisée
    let amount: number | undefined;
    try {
      const body = await request.json().catch(() => ({}));
      amount = body.amount;
    } catch {
      // Body vide ou invalide, on continue sans amount
    }

    // Vérifier si c'est un paiement Stripe
    try {
      const charge = await stripe.charges.retrieve(chargeId);

      if (charge.status !== "succeeded") {
        return NextResponse.json(
          { error: "Impossible de rembourser un paiement non réussi" },
          { status: 400 },
        );
      }

      // Vérifier si déjà remboursé
      if (charge.refunded) {
        return NextResponse.json(
          { error: "Cette transaction a déjà été remboursée" },
          { status: 400 },
        );
      }

      const refund = await stripe.refunds.create({
        charge: chargeId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      return NextResponse.json({
        success: true,
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
        },
      });
    } catch (stripeError) {
      // Si ce n'est pas un paiement Stripe, chercher dans la base de données
      const payment = await prisma.payment.findUnique({
        where: { id: chargeId },
      });

      if (!payment) {
        return NextResponse.json(
          { error: "Transaction non trouvée" },
          { status: 404 },
        );
      }

      if (payment.status !== "PAID") {
        return NextResponse.json(
          { error: "Impossible de rembourser un paiement non réussi" },
          { status: 400 },
        );
      }

      if (payment.status === "REFUNDED") {
        return NextResponse.json(
          { error: "Cette transaction a déjà été remboursée" },
          { status: 400 },
        );
      }

      // Mettre à jour le statut du paiement
      await prisma.payment.update({
        where: { id: chargeId },
        data: {
          status: "REFUNDED",
          refundAmount: amount || payment.amount,
          refundedAt: new Date(),
        },
      });

      // Mettre à jour le statut du booking associé
      if (payment.bookingId) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: "CANCELLED" },
        });
      }

      return NextResponse.json({
        success: true,
        refund: {
          id: payment.id,
          amount: amount || payment.amount,
          status: "REFUNDED",
        },
      });
    }
  } catch (error) {
    console.error("Refund error:", error);
    return NextResponse.json(
      { error: "Erreur lors du remboursement" },
      { status: 500 },
    );
  }
}
