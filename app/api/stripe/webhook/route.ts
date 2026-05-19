import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { onBookingCompleted } from "@/lib/risk-scoring";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  console.log("📡 [WEBHOOK] Requête reçue, signature présente:", !!sig);

  // ✅ Pour les tests en local, on peut accepter les appels sans signature
  if (!sig && process.env.NODE_ENV === "development") {
    console.warn(
      "⚠️ Webhook appelé sans signature Stripe (mode développement)",
    );
    try {
      const event = JSON.parse(body);
      console.log(
        "📦 [WEBHOOK] Événement parsé (mode dev):",
        event.type,
        event.id,
      );
      await processEvent(event);
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error("❌ Erreur traitement webhook:", err);
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
    console.log(
      "✅ [WEBHOOK] Signature vérifiée, événement:",
      event.type,
      event.id,
    );
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  await processEvent(event);

  return NextResponse.json({ received: true });
}

async function processEvent(event: any) {
  console.log("🔥🔥🔥 [PROCESS] Événement reçu:", event.type, event.id);
  console.log(
    "📦 [PROCESS] Données:",
    JSON.stringify(event.data.object, null, 2).slice(0, 500),
  );

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
      console.log("💰💰💰 [PROCESS] C'est un payment_intent.succeeded !");
      await handlePaymentSuccess(event.data.object);
      break;

    case "payment_intent.created":
      console.log("📝 [PROCESS] PaymentIntent créé (en attente de paiement)");
      // Ne rien faire
      break;

    case "payment_intent.payment_failed":
      console.log("❌ [PROCESS] PaymentIntent échoué");
      await handlePaymentFailure(event.data.object);
      break;

    case "charge.refunded":
      console.log("💰 [PROCESS] Refund processed");
      await handleRefund(event.data.object);
      break;

    default:
      console.log(`⚠️ [PROCESS] Type non traité: ${event.type}`);
  }

  // Marquer comme traité
  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId: event.id },
    data: { processed: true, processedAt: new Date() },
  });
  console.log("✅ [PROCESS] Événement marqué comme traité");
}

async function handlePaymentSuccess(paymentIntent: any) {
  console.log("💰💰💰 [SUCCESS] Début traitement pour:", paymentIntent.id);
  console.log(
    "🔍 [SUCCESS] Recherche transaction avec stripePaymentIntentId:",
    paymentIntent.id,
  );

  // ✅ ÉTAPE 1: Attendre 1.5 secondes pour laisser le temps à la transaction d'être écrite
  await new Promise(resolve => setTimeout(resolve, 1500));

  // ✅ ÉTAPE 2: Chercher la transaction avec retry
  let transaction = await prisma.paymentTransaction.findFirst({
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

  // ✅ ÉTAPE 3: Réessayer 3 fois si pas trouvée
  let retries = 0;
  while (!transaction && retries < 3) {
    console.log(`🔄 [SUCCESS] Transaction non trouvée, tentative ${retries + 1}/3...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
    transaction = await prisma.paymentTransaction.findFirst({
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
    retries++;
  }

  // ✅ ÉTAPE 4: Si toujours pas trouvée, créer la transaction manuellement depuis les métadonnées
  if (!transaction) {
    console.log("⚠️ [SUCCESS] Transaction toujours non trouvée, création manuelle...");
    
    const metadata = paymentIntent.metadata;
    if (!metadata?.offerId) {
      console.error("❌ [SUCCESS] Impossible de créer la transaction: pas d'offerId dans metadata");
      return;
    }

    // Récupérer l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: metadata.offerId },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    if (!offer) {
      console.error("❌ [SUCCESS] Offre non trouvée pour création manuelle:", metadata.offerId);
      return;
    }

    // Créer la transaction
    transaction = await prisma.paymentTransaction.create({
      data: {
        offerId: offer.id,
        userId: offer.tenantId,
        amount: parseFloat(metadata.amountTND || offer.totalPrice.toString()),
        currency: "TND",
        status: "SUCCESS",
        provider: "STRIPE",
        stripePaymentIntentId: paymentIntent.id,
        providerTransactionId: paymentIntent.id,
        paidAt: new Date(),
        metadata: {
          amountEUR: metadata.amountEUR,
          exchangeRate: metadata.exchangeRate,
        },
      },
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
    console.log("✅ [SUCCESS] Transaction créée manuellement:", transaction.id);
  }

  console.log("✅ [SUCCESS] Transaction trouvée/créée:", transaction.id);
  console.log("📦 [SUCCESS] Offer associée:", transaction.offer?.id);

  if (!transaction.offer) {
    console.error(
      "❌ [SUCCESS] Offre non trouvée pour transaction:",
      transaction.id,
    );
    return;
  }

  // Mettre à jour le statut de la transaction (si pas déjà SUCCESS)
  if (transaction.status !== "SUCCESS") {
    await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: "SUCCESS",
        paidAt: new Date(),
        providerTransactionId: paymentIntent.id,
      },
    });
    console.log("✅ [SUCCESS] Transaction mise à jour");
  }

  // 2. Mettre à jour le statut de l'offre
  await prisma.offer.update({
    where: { id: transaction.offerId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });
  console.log("✅ [SUCCESS] Offre mise à jour");

  // 3. Vérifier si la réservation existe déjà
  const existingBooking = await prisma.booking.findFirst({
    where: { offerId: transaction.offerId },
  });

  let bookingId: string;
  let bookingReference: string;

  if (existingBooking) {
    bookingId = existingBooking.id;
    bookingReference = existingBooking.reference;
    console.log("✅ [SUCCESS] Réservation déjà existante:", bookingReference);

    await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        paymentStatus: "PAID",
        status: "CONFIRMED",
        stripePaymentIntentId: paymentIntent.id,
        confirmedAt: new Date(),
      },
    });
    console.log(
      "✅ [SUCCESS] Réservation mise à jour avec stripePaymentIntentId:",
      paymentIntent.id,
    );
  } else {
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
        stripePaymentIntentId: paymentIntent.id,
        confirmedAt: new Date(),
      },
    });
    bookingId = newBooking.id;
    bookingReference = newBooking.reference;
    console.log("✅ [SUCCESS] Réservation CRÉÉE:", bookingReference);
  }

  // 4. Créer ou mettre à jour l'enregistrement de paiement
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
    console.log("✅ [SUCCESS] Paiement mis à jour:", existingPayment.id);
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
    console.log(
      "✅ [SUCCESS] Paiement créé pour réservation:",
      bookingReference,
    );
  }

  await onBookingCompleted(bookingId);

  // 5. Notifications
  await prisma.notification.create({
    data: {
      userId: transaction.offer.ownerId,
      type: "PAYMENT_RECEIVED",
      title: "Paiement reçu",
      content: `Le paiement pour ${transaction.offer.listing.title} a été confirmé. Réservation #${bookingReference}`,
      data: { bookingId: bookingId, amount: transaction.amount },
    },
  });
  console.log("✅ [SUCCESS] Notification propriétaire envoyée");

  await prisma.notification.create({
    data: {
      userId: transaction.offer.tenantId,
      type: "BOOKING_CONFIRMED",
      title: "Réservation confirmée",
      content: `Votre réservation pour ${transaction.offer.listing.title} est confirmée. Votre référence: ${bookingReference}`,
      data: { bookingId: bookingId },
    },
  });
  console.log("✅ [SUCCESS] Notification locataire envoyée");

  // 6. Message système
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
    console.log("✅ [SUCCESS] Message système envoyé");
  }

  console.log("🎉 [SUCCESS] FIN - Tout est OK !");
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