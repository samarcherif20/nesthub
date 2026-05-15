// app/api/payments/transaction/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const paymentIntentId = searchParams.get("payment_intent");

    if (!paymentIntentId) {
      return NextResponse.json({ error: "payment_intent requis" }, { status: 400 });
    }

    // Trouver la transaction
    const transaction = await prisma.paymentTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId },
      include: { offer: true },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
    }

    // Trouver le booking lié à cette offre
    const booking = await prisma.booking.findFirst({
      where: { offerId: transaction.offerId },
    });

    return NextResponse.json({
      transactionId: transaction.id,
      offerId: transaction.offerId,
      bookingId: booking?.id || null,
      status: transaction.status,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}