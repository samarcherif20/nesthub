// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { onBookingCompleted } from "@/lib/risk-scoring";

// FONCTIONS UTILITAIRES

async function getOrCreateTransaction(paymentIntent: any) {
  console.log("Recherche transaction pour:", paymentIntent.id);

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

  let retries = 0;
  while (!transaction && retries < 5) {
    console.log(` Transaction non trouvée, tentative ${retries + 1}/5...`);
    await new Promise((resolve) => setTimeout(resolve, 2000));
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

  if (!transaction) {
    console.log(" Création manuelle de la transaction...");
    const metadata = paymentIntent.metadata;

    if (!metadata?.offerId) {
      console.error(" Pas d'offerId dans metadata");
      return null;
    }

    const offer = await prisma.offer.findUnique({
      where: { id: metadata.offerId },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    if (!offer) {
      console.error(" Offre non trouvée:", metadata.offerId);
      return null;
    }

    transaction = await prisma.paymentTransaction.create({
      data: {
        offerId: offer.id,
        userId: offer.tenantId,
        amount: parseFloat(metadata.amountTND || offer.totalPrice.toString()),
        currency: "TND",
        status: "PENDING",
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
    console.log(" Transaction créée manuellement:", transaction.id);
  }

  return transaction;
}

async function createOrUpdateBooking(
  transaction: any,
  paymentIntent: any,
  isCaptured: boolean = false,
) {
  console.log(" Création/mise à jour de la réservation");
  console.log("   isCaptured:", isCaptured);

  if (!transaction.offer) {
    console.error(" Offre non trouvée pour transaction:", transaction.id);
    return null;
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      listingId: transaction.offer.listingId,
      tenantId: transaction.offer.tenantId,
      ownerId: transaction.offer.ownerId,
    },
  });

  const existingBooking = await prisma.booking.findFirst({
    where: { offerId: transaction.offerId },
  });

  let bookingId: string;
  let bookingReference: string;

  if (existingBooking) {
    bookingId = existingBooking.id;
    bookingReference = existingBooking.reference;
    console.log(" Réservation existante:", bookingReference);

    await prisma.booking.update({
      where: { id: existingBooking.id },
      data: {
        paymentStatus: isCaptured ? "RELEASED" : "HELD",
        escrowStatus: isCaptured ? "RELEASED" : "HELD",
        escrowHeldAt: isCaptured ? undefined : new Date(),
        escrowReleasedAt: isCaptured ? new Date() : undefined,
        status: "CONFIRMED",
        stripePaymentIntentId: paymentIntent.id,
        confirmedAt: new Date(),
        ...(conversation && !existingBooking.conversationId
          ? { conversationId: conversation.id }
          : {}),
      },
    });

    if (conversation && !conversation.bookingId) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { bookingId: existingBooking.id },
      });
    }
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
        paymentStatus: "HELD",
        escrowStatus: "HELD",
        escrowHeldAt: new Date(),
        offerId: transaction.offerId,
        stripePaymentIntentId: paymentIntent.id,
        confirmedAt: new Date(),
        conversationId: conversation?.id || null,
      },
    });

    bookingId = newBooking.id;
    bookingReference = newBooking.reference;
    console.log(" Nouvelle réservation CRÉÉE:", bookingReference);

    if (conversation) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { bookingId: newBooking.id },
      });
      console.log(" Conversation liée à la réservation");
    }
  }

  // Mettre à jour la transaction
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: "SUCCESS",
      paidAt: new Date(),
    },
  });

  // Mettre à jour l'offre
  await prisma.offer.update({
    where: { id: transaction.offerId },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  // Créer ou mettre à jour le paiement
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
  }

  // Créer le contrat
  await createContractForBooking(bookingId);

  // Notifications
  await prisma.notification.create({
    data: {
      userId: transaction.offer.ownerId,
      type: "PAYMENT_RECEIVED",
      title: isCaptured ? "Paiement libéré" : " Paiement confirmé (en attente)",
      content: isCaptured
        ? `Le paiement de ${transaction.amount.toLocaleString("fr-FR")} TND pour ${transaction.offer.listing.title} a été libéré.`
        : `Le locataire a payé ${transaction.amount.toLocaleString("fr-FR")} TND pour ${transaction.offer.listing.title}. L'argent sera libéré après son arrivée + 2h. Réservation #${bookingReference}`,
      data: {
        bookingId: bookingId,
        amount: transaction.amount,
        escrow: !isCaptured,
      },
    },
  });

  await prisma.notification.create({
    data: {
      userId: transaction.offer.tenantId,
      type: "BOOKING_CONFIRMED",
      title: " Réservation confirmée",
      content: `Votre réservation pour ${transaction.offer.listing.title} est confirmée. N'oubliez pas de confirmer votre arrivée pour libérer le paiement. Réf: ${bookingReference}`,
      data: { bookingId: bookingId },
    },
  });

  if (conversation) {
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: transaction.offer.tenantId,
        receiverId: transaction.offer.ownerId,
        content: isCaptured
          ? ` Paiement libéré ! Le propriétaire a reçu ${transaction.amount.toLocaleString("fr-FR")} TND.`
          : `Paiement confirmé ! Votre réservation est validée. Le paiement (${transaction.amount.toLocaleString("fr-FR")} TND) sera libéré après votre arrivée + 2h. Référence: ${bookingReference}`,
        isSystem: true,
      },
    });
  }

  // Envoyer les infos dévoilées (seulement si pas encore envoyé)
  if (!isCaptured && conversation) {
    await sendRevealedInfoAfterPayment(bookingId, conversation.id);
  }

  await onBookingCompleted(bookingId);

  console.log("Booking traité avec succès");
  return { bookingId, bookingReference };
}

// FONCTIONS SPÉCIFIQUES

async function sendRevealedInfoAfterPayment(
  bookingId: string,
  conversationId: string,
) {
  console.log(
    "[REVEALED INFO] Début dévoilement des informations pour:",
    bookingId,
  );

  try {
    // Créer ou récupérer les infos dévoilées
    let revealedInfo = await prisma.revealedInfo.findUnique({
      where: { bookingId: bookingId },
    });

    if (!revealedInfo) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          listing: true,
          tenant: true,
          owner: true,
        },
      });

      if (booking) {
        revealedInfo = await prisma.revealedInfo.create({
          data: {
            bookingId: bookingId,
            exactAddress:
              `${booking.listing.street || ""}, ${booking.listing.delegation || ""}, ${booking.listing.governorate || ""}`.trim(),
            accessCode: Math.floor(1000 + Math.random() * 9000).toString(),
            checkinInstructions:
              "Arrivée à partir de 15h00. Veuillez contacter le propriétaire pour les détails d'accès.",
            ownerPhone: booking.owner?.phoneNumber || "",
            emergencyPhone: booking.owner?.phoneNumber || "",
            revealedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        console.log("[REVEALED INFO] Infos dévoilées créées:", revealedInfo.id);
      }
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phoneNumber: true,
                email: true,
                cinNumber: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            cinNumber: true,
          },
        },
      },
    });

    if (!booking) return;

    const tenantMessage = `[SYSTÈME] Votre réservation est confirmée.

Informations du logement :
- Adresse exacte : ${revealedInfo?.exactAddress || "À confirmer"}
- Code d'accès : ${revealedInfo?.accessCode || "À communiquer"}
- Instructions d'arrivée : ${revealedInfo?.checkinInstructions || "Contactez le propriétaire"}

Coordonnées du propriétaire :
- Nom : ${booking.listing.owner.firstName || ""} ${booking.listing.owner.lastName || ""}
- Téléphone : ${revealedInfo?.ownerPhone || booking.listing.owner.phoneNumber || "Non communiqué"}

Détails du séjour :
- Dates : ${new Date(booking.checkIn).toLocaleDateString("fr-FR")} au ${new Date(booking.checkOut).toLocaleDateString("fr-FR")}
- Nombre de nuits : ${booking.totalNights}
- Nombre de voyageurs : ${booking.guests || 1}

Ces informations sont confidentielles.`;

    const ownerMessage = `[SYSTÈME] Réservation confirmée et payée.

Informations du locataire :
- Nom : ${booking.tenant.firstName || ""} ${booking.tenant.lastName || ""}
- Téléphone : ${booking.tenant.phoneNumber || "Non communiqué"}
- Email : ${booking.tenant.email || "Non communiqué"}

Détails de la réservation :
- Référence : ${booking.reference}
- Dates : ${new Date(booking.checkIn).toLocaleDateString("fr-FR")} au ${new Date(booking.checkOut).toLocaleDateString("fr-FR")}
- Montant : ${booking.totalPrice?.toLocaleString("fr-FR") || 0} TND (en séquestre)

Informations à fournir au locataire :
- Adresse : ${revealedInfo?.exactAddress || "À communiquer"}
- Instructions : ${revealedInfo?.checkinInstructions || "À communiquer"}`;

    await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: booking.ownerId!,
        receiverId: booking.tenantId,
        content: tenantMessage,
        isSystem: true,
        isRead: false,
      },
    });

    await prisma.message.create({
      data: {
        conversationId: conversationId,
        senderId: booking.tenantId,
        receiverId: booking.ownerId!,
        content: ownerMessage,
        isSystem: true,
        isRead: false,
      },
    });
    // AJOUT : NOTIFICATIONS POUR LES 2 UTILISATEURS
    await prisma.notification.create({
      data: {
        userId: booking.tenantId,
        type: "SYSTEM_ALERT",
        title: "Informations du logement dévoilées",
        content: `Les informations du logement "${booking.listing.title}" sont maintenant disponibles. Consultez les messages pour l'adresse exacte et le code d'accès.`,
        data: {
          bookingId: booking.id,
          conversationId: conversationId,
          listingId: booking.listingId,
          listingTitle: booking.listing.title,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.ownerId!,
        type: "SYSTEM_ALERT",
        title: " Informations du locataire dévoilées",
        content: `Les informations du locataire pour la réservation "${booking.listing.title}" sont disponibles. Consultez les messages pour ses coordonnées.`,
        data: {
          bookingId: booking.id,
          conversationId: conversationId,
          listingId: booking.listingId,
          listingTitle: booking.listing.title,
          tenantName: `${booking.tenant.firstName || ""} ${booking.tenant.lastName || ""}`,
          tenantEmail: booking.tenant.email,
          tenantPhone: booking.tenant.phoneNumber,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });
    console.log("[REVEALED INFO] Messages envoyés");
  } catch (error) {
    console.error("[REVEALED INFO] Erreur:", error);
  }
}

async function createContractForBooking(bookingId: string) {
  console.log("[CONTRAT] Création du contrat pour:", bookingId);

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { tenant: true, owner: true, listing: true },
    });

    if (!booking) return null;

    const totalNights =
      booking.totalNights ||
      Math.ceil(
        (new Date(booking.checkOut).getTime() -
          new Date(booking.checkIn).getTime()) /
          (1000 * 60 * 60 * 24),
      );

    const contractData = {
      reference: `CTR-${Date.now().toString(36)}`,
      bookingId: booking.id,
      tenant: {
        firstName: booking.tenant?.firstName || "Client",
        lastName: booking.tenant?.lastName || "",
        email: booking.tenant?.email || "",
        phone: booking.tenant?.phoneNumber || "",
        cinNumber: booking.tenant?.cinNumber || "",
      },
      owner: {
        firstName: booking.owner?.firstName || "Propriétaire",
        lastName: booking.owner?.lastName || "",
        email: booking.owner?.email || "",
        phone: booking.owner?.phoneNumber || "",
        cinNumber: booking.owner?.cinNumber || "",
      },
      dates: {
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: totalNights,
      },
      price: {
        pricePerNight: booking.pricePerNight || 0,
        basePrice: (booking.pricePerNight || 0) * totalNights,
        cleaningFee: booking.cleaningFee || 0,
        serviceFee: booking.serviceFee || 0,
        totalPrice: booking.totalPrice || 0,
      },
      deposit: { amount: booking.securityDeposit || 0, status: "AUTHORIZED" },
      createdAt: new Date(),
    };

    const existingContract = await prisma.contract.findUnique({
      where: { bookingId: booking.id },
    });

    if (existingContract) {
      await prisma.contract.update({
        where: { id: existingContract.id },
        data: { content: contractData, updatedAt: new Date() },
      });
    } else {
      await prisma.contract.create({
        data: {
          reference: contractData.reference,
          bookingId: booking.id,
          pdfUrl: "",
          content: contractData,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    }
    console.log("[CONTRAT] Contrat créé/mis à jour");
  } catch (error) {
    console.error("[CONTRAT] Erreur:", error);
  }
}

// HANDLERS

async function handlePaymentCapturable(paymentIntent: any) {
  console.log(" [CAPTURABLE] Paiement reçu, argent capturable !");
  console.log("   ID:", paymentIntent.id);
  console.log("   Montant:", paymentIntent.amount / 100, "EUR");

  const transaction = await getOrCreateTransaction(paymentIntent);
  if (!transaction) {
    console.error(" Transaction non trouvée/créée");
    return;
  }

  await createOrUpdateBooking(transaction, paymentIntent, false);
  console.log(" [CAPTURABLE] Booking créé avec séquestre");
}

async function handlePaymentSuccess(paymentIntent: any) {
  console.log(" [SUCCESS] Paiement capturé (libération) !");
  console.log("   ID:", paymentIntent.id);

  const transaction = await getOrCreateTransaction(paymentIntent);
  if (!transaction) {
    console.error(" Transaction non trouvée");
    return;
  }

  await createOrUpdateBooking(transaction, paymentIntent, true);
  console.log(" [SUCCESS] Argent libéré au propriétaire");
}

async function handlePaymentFailure(paymentIntent: any) {
  console.log(" PaymentIntent échoué:", paymentIntent.id);

  await prisma.paymentTransaction.updateMany({
    where: { stripePaymentIntentId: paymentIntent.id },
    data: {
      status: "FAILED",
      error: paymentIntent.last_payment_error?.message || "Paiement échoué",
    },
  });
}

async function handleRefund(charge: any) {
  console.log(" Refund processed:", charge.id);
}

// PROCESS EVENT

async function processEvent(event: any) {
  console.log(" [PROCESS] Événement reçu:", event.type, event.id);

  await prisma.stripeWebhookEvent.create({
    data: {
      stripeEventId: event.id,
      type: event.type,
      data: event.data,
      processed: false,
    },
  });

  switch (event.type) {
    case "payment_intent.amount_capturable_updated":
      await handlePaymentCapturable(event.data.object);
      break;
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object);
      break;
    case "payment_intent.created":
      console.log(" PaymentIntent créé (en attente de paiement)");
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailure(event.data.object);
      break;
    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
    default:
      console.log(` Type non traité: ${event.type}`);
  }

  await prisma.stripeWebhookEvent.update({
    where: { stripeEventId: event.id },
    data: { processed: true, processedAt: new Date() },
  });
}

// MAIN POST

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  console.log(" [WEBHOOK] Requête reçue, signature:", !!sig);

  if (!sig && process.env.NODE_ENV === "development") {
    console.warn(" Webhook appelé sans signature Stripe (mode développement)");
    try {
      const event = JSON.parse(body);
      await processEvent(event);
      return NextResponse.json({ received: true });
    } catch (err) {
      console.error(" Erreur traitement webhook:", err);
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
    console.log("[WEBHOOK] Signature vérifiée, événement:", event.type);
  } catch (err) {
    console.error(" Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }

  await processEvent(event);
  return NextResponse.json({ received: true });
}
