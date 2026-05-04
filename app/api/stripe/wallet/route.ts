// app/api/stripe/wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, stripeCustomerId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    let customerId = user.stripeCustomerId;
    let paymentMethods: any[] = [];

    if (customerId) {
      const stripePaymentMethods = await stripe.paymentMethods.list({
        customer: customerId,
        type: "card",
      });
      paymentMethods = stripePaymentMethods.data.map((pm) => ({
        id: pm.id,
        type: "card",
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        expiryMonth: pm.card?.exp_month,
        expiryYear: pm.card?.exp_year,
        isDefault: false, // À gérer avec un champ en DB
      }));
    }

    // Récupérer les transactions
    const transactions = await prisma.paymentTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Récupérer les cautions
    const securityDeposits = await prisma.depositAuthorization.findMany({
      where: { booking: { tenantId: user.id }, status: "AUTHORIZED" },
      include: { booking: { include: { listing: true } } },
    });

    return NextResponse.json({
      balance: {
        available: 0,
        pending: 0,
        totalSpent: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      },
      securityDeposits: securityDeposits.map((d) => ({
        id: d.id,
        amount: d.amount,
        status: d.status,
        listingTitle: d.booking.listing.title,
        releaseDate: d.releasedAt,
        checkOutDate: d.booking.checkOut,
      })),
      upcomingPayments: [],
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        type: t.type === "PAYMENT" ? "PAYMENT" : "REFUND",
        status: t.status.toUpperCase(),
        description: `Paiement #${t.offerId?.slice(-6)}`,
        date: t.createdAt,
        reference: t.id.slice(-8).toUpperCase(),
      })),
      paymentMethods,
    });
  } catch (error) {
    console.error("Error fetching wallet data:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}