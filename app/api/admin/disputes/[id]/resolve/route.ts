// app/api/admin/disputes/[id]/resolve/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const { resolution, refundAmount, depositWithheld } = await request.json();

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: { booking: true }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Remboursement Stripe si nécessaire
    let stripeRefundId = null;
    if (refundAmount > 0 && dispute.booking.stripePaymentIntentId) {
      const refund = await stripe.refunds.create({
        payment_intent: dispute.booking.stripePaymentIntentId,
        amount: Math.round(refundAmount * 100),
        reason: "fraudulent"
      });
      stripeRefundId = refund.id;
    }

    // Mettre à jour le litige
    const updatedDispute = await prisma.dispute.update({
      where: { id },
      data: {
        status: "RESOLVED",
        resolution,
        refundAmount: refundAmount || null,
        depositWithheld: depositWithheld || false,
        resolvedAt: new Date(),
        assignedTo: admin.id
      }
    });

    // Mettre à jour la réservation si remboursement
    if (refundAmount > 0) {
      await prisma.booking.update({
        where: { id: dispute.bookingId },
        data: {
          refundAmount,
          paymentStatus: "REFUNDED",
          stripeRefundId
        }
      });
    }

    // Notifier les deux parties
    const parties = [
      dispute.openedBy,
      dispute.booking.tenantId,
      dispute.booking.ownerId
    ].filter((v, i, a) => a.indexOf(v) === i);

    for (const partyId of parties) {
      await prisma.notification.create({
        data: {
          userId: partyId,
          type: "DISPUTE_RESOLVED",
          title: "✅ Litige résolu",
          content: resolution,
          data: { disputeId: dispute.id }
        }
      });
    }

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}