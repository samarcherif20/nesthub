// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // ✅ Pour les tests en local, on peut accepter les appels sans signature
  if (!sig && process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️ Webhook appelé sans signature Stripe (mode développement)",
    );
    try {
      const event = JSON.parse(body);
      await processEvent(event);
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("Erreur traitement webhook:", err);
      return NextResponse.json({ error: "Webhook error" }, { status: 400 });
    }
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  await processEvent(event);

  return NextResponse.json({ received: true });
}

async function processEvent(event: any) {
  // Sauvegarder l'événement pour audit
  await prisma.stripeWebhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      data: event.data,
      processed: false,
    },
  });

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object);
      break;

    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
  }

  // Marquer comme traité
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId: event.id },
    data: { processed: true, processedAt: new Date() },
  });
}

async function handlePaymentSuccess(paymentIntent: any) {
  console.log("💰 PaymentIntent réussi:", paymentIntent.id);

  // 1. Mettre à jour la transaction
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { stripePaymentIntentId: paymentIntent.id },
    include: {
      offer: {
        include: {
          listing: true,
          tenant: true,
          owner: true,
        },
      },
    },
  });

  if (!transaction) {
    console.error(
      "❌ Transaction non trouvée pour paymentIntent:",
      paymentIntent.id,
    );
    return;
  }

  if (!transaction.offer) {
    console.error("❌ Offre non trouvée pour transaction:", transaction.id);
    return;
  }

  // Mettre à jour le statut de la transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: "SUCCESS",
      paidAt: new Date(),
      providerTransactionId: paymentIntent.id,
    },
  });

  // 2. Mettre à jour le statut de l'offre
  await prisma.offer.update({
    where: { id: transaction.offerId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  // 3. Vérifier si la réservation existe déjà (éviter les doublons)
  const existingBooking = await prisma.booking.findFirst({
    where: { offerId: transaction.offerId },
  });

  let bookingId: string;
  let bookingReference: string;

  if (existingBooking) {
    bookingId = existingBooking.id;
    bookingReference = existingBooking.reference;
    console.log("✅ Réservation déjà existante:", bookingReference);

    // ✅ CRITICAL: Mettre à jour avec stripePaymentIntentId
    await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        stripePaymentIntentId: paymentIntent.id, // ← AJOUTÉ !
        confirmedAt: new Date(),
      },
    });
    console.log(
      "✅ Réservation mise à jour avec stripePaymentIntentId:",
      paymentIntent.id,
    );
  } else {
    // 4. Créer la réservation AVEC stripePaymentIntentId
    const newBooking = await prisma.booking.create({
      data: {
        reference: `NH-${Date.now()}-${transaction.offerId.slice(-6)}`,
        listingId: transaction.offer.listingId,
        tenantId: transaction.offer.tenantId,
        ownerId: transaction.offer.ownerId,
        checkIn: transaction.offer.checkIn,
        checkOut: transaction.offer.checkOut,
        guests: transaction.offer.guests,
        totalNights: transaction.offer.nights,
        pricePerNight: transaction.offer.pricePerNight,
        totalPrice: transaction.offer.totalPrice,
        cleaningFee: transaction.offer.cleaningFee,
        serviceFee: transaction.offer.serviceFee,
        totalWithFees: transaction.offer.totalPrice,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        offerId: transaction.offerId,
        stripePaymentIntentId: paymentIntent.id, // ← AJOUTÉ !
        confirmedAt: new Date(),
      },
    });
    bookingId = newBooking.id;
    bookingReference = newBooking.reference;
    console.log(
      "✅ Réservation créée avec stripePaymentIntentId:",
      paymentIntent.id,
    );
  }

  // 5. Créer ou mettre à jour l'enregistrement de paiement
  const existingPayment = await prisma.payment.findFirst({
    where: { bookingId: bookingId },
  });

  if (existingPayment) {
    await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "PAID",
        providerTransactionId: paymentIntent.id,
        paidAt: new Date(),
      },
    });
    console.log("✅ Paiement mis à jour:", existingPayment.id);
  } else {
    await prisma.payment.create({
      data: {
        bookingId: bookingId,
        amount: transaction.amount,
        currency: "TND",
        type: "BOOKING",
        status: "PAID",
        provider: "STRIPE",
        providerTransactionId: paymentIntent.id,
        paidAt: new Date(),
      },
    });
    console.log("✅ Paiement créé pour réservation:", bookingReference);
  }

  // 6. Notifier le propriétaire
  await prisma.notification.create({
    data: {
      userId: transaction.offer.ownerId,
      type: "PAYMENT_RECEIVED",
      title: "Paiement reçu",
      content: `Le paiement pour ${transaction.offer.listing.title} a été confirmé. Réservation #${bookingReference}`,
      data: { bookingId: bookingId, amount: transaction.amount },
    },
  });

  // 7. Notifier le locataire
  await prisma.notification.create({
    data: {
      userId: transaction.offer.tenantId,
      type: "BOOKING_CONFIRMED",
      title: "Réservation confirmée",
      content: `Votre réservation pour ${transaction.offer.listing.title} est confirmée. Votre référence: ${bookingReference}`,
      data: { bookingId: bookingId },
    },
  });

  // 8. Envoyer un message système dans la conversation
  const conversation = await prisma.conversation.findFirst({
    where: {
      listingId: transaction.offer.listingId,
      tenantId: transaction.offer.tenantId,
      ownerId: transaction.offer.ownerId,
    },
  });

  if (conversation) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: transaction.offer.tenantId,
        receiverId: transaction.offer.ownerId,
        content: `✅ Paiement confirmé ! Votre réservation est maintenant validée. Référence: ${bookingReference}`,
        isSystem: true,
      },
    });
  }
}

async function handlePaymentFailure(paymentIntent: any) {
  console.log("❌ PaymentIntent échoué:", paymentIntent.id);

  await prisma.paymentTransaction.update({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "FAILED",
      error: paymentIntent.last_payment_error?.message || "Paiement échoué",
    },
  });
}

async function handleRefund(charge: any) {
  console.log("💰 Refund processed:", charge.id);
}
