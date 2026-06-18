// app/api/payments/create-payment-intent/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { tndToStripeAmount, getCurrentExchangeRate } from "@/lib/currency";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { offerId, conversationId } = await req.json();

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { listing: true, tenant: true, owner: true },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user || user.id !== offer.tenantId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (offer.status !== "ACCEPTED") {
      return NextResponse.json(
        { error: "Cette offre ne peut pas être payée" },
        { status: 400 },
      );
    }

    // Créer ou récupérer le customer Stripe
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`.trim(),
        metadata: { userId: user.id, clerkId: userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Conversion TND → EUR
    const amountTND = offer.totalPrice;
    const rate = await getCurrentExchangeRate();
    const amountInCents = await tndToStripeAmount(amountTND);
    const amountEUR = amountInCents / 100;

    console.log(` ${amountTND} TND → ${amountEUR.toFixed(2)} EUR (taux: ${rate.toFixed(4)})`);
    console.log(` Montant Stripe: ${amountInCents} centimes`);

    //  CRÉATION DU PAYMENTINTENT AVEC CAPTURE MANUELLE (SÉQUESTRE)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "eur",
      customer: customerId,
      capture_method: 'manual', // argent bloqué chez Stripe
      metadata: {
        offerId: offer.id,
        listingId: offer.listingId,
        tenantId: offer.tenantId,
        ownerId: offer.ownerId,
        conversationId: conversationId || "",
        type: "rent",
        amountTND: amountTND.toString(),
        exchangeRate: rate.toString(),
      },
      description: `Réservation: ${offer.listing.title} (${amountTND} TND ≈ ${amountEUR.toFixed(2)} EUR)`,
    });

    // Sauvegarder la transaction
    await prisma.paymentTransaction.create({
      data: {
        offerId: offer.id,
        userId: user.id,
        amount: offer.totalPrice,
        currency: "TND",
        status: "PENDING",
        provider: "STRIPE",
        providerTransactionId: paymentIntent.id,
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          amountEUR: amountEUR,
          exchangeRate: rate,
          amountInCents: amountInCents,
        },
      },
    });

    // Notification de paiement en cours
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: "Paiement en cours",
        content: `Votre paiement de ${amountTND.toLocaleString("fr-FR")} TND est en cours de traitement.`,
        data: { offerId: offer.id, paymentIntentId: paymentIntent.id },
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amountTND,
      amountEUR: amountEUR.toFixed(2),
      exchangeRate: rate,
    });
  } catch (error) {
    console.error("Erreur création PaymentIntent:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}