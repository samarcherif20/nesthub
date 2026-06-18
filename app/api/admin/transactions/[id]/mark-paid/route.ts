// app/api/admin/transactions/[id]/mark-paid/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

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

    const { amount } = await req.json();
    const transactionId = params.id;

    // Trouver le paiement
    let payment = await prisma.payment.findUnique({
      where: { id: transactionId },
      include: {
        booking: {
          include: {
            listing: { include: { owner: true } },
            tenant: true,
          },
        },
      },
    });

    let paymentTransaction = null;
    if (!payment) {
      paymentTransaction = await prisma.paymentTransaction.findUnique({
        where: { id: transactionId },
        include: {
          offer: {
            include: {
              listing: { include: { owner: true } },
              tenant: true,
            },
          },
        },
      });
    }

    if (!payment && !paymentTransaction) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
    }

    const booking = payment?.booking || paymentTransaction?.offer?.booking;
    const owner = payment?.booking?.listing?.owner || paymentTransaction?.offer?.listing?.owner;

    // Mettre à jour le paiement
    if (payment) {
      await prisma.payment.update({
        where: { id: transactionId },
        data: {
          status: "PAID_MANUALLY",
          providerData: {
            paidManuallyAt: new Date().toISOString(),
            paidByAdmin: sessionClaims?.sub,
            paidAmount: amount,
          },
        },
      });
    }

    if (paymentTransaction) {
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: "PAID_MANUALLY",
          metadata: {
            ...(paymentTransaction.metadata as any),
            paidManuallyAt: new Date().toISOString(),
            paidByAdmin: sessionClaims?.sub,
            paidAmount: amount,
          },
        },
      });
    }

    // Mettre à jour la réservation
    if (booking) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          escrowStatus: "PAID_MANUALLY",
          paymentStatus: "PAID_MANUALLY",
          note: `Virement manuel effectué par l'admin le ${new Date().toLocaleDateString("fr-FR")} - ${amount} TND`,
        },
      });
    }

    // Notification au propriétaire
    if (owner) {
      await prisma.notification.create({
        data: {
          userId: owner.id,
          type: "PAYMENT_RECEIVED",
          title: " Paiement reçu",
          content: `Un virement de ${amount.toLocaleString("fr-FR")} TND a été effectué sur votre compte pour la réservation #${booking?.reference || transactionId.slice(-8)}.`,
          data: { transactionId, amount: amount },
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Virement marqué comme effectué",
    });
  } catch (error) {
    console.error("Mark paid error:", error);
    return NextResponse.json({ error: "Erreur lors du marquage" }, { status: 500 });
  }
}