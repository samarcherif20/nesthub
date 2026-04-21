import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { offerId, method, amount, cardHolder, last4 } = await req.json();

    if (!offerId) {
      return NextResponse.json({ error: "Offre requise" }, { status: 400 });
    }

    // Récupérer l'offre
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: true,
        infoRequest: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    if (offer.tenantId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (offer.status !== "PENDING") {
      return NextResponse.json({ error: "Cette offre n'est plus disponible" }, { status: 400 });
    }

    // Créer la réservation
    const booking = await prisma.booking.create({
      data: {
        reference: `BOOK_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        listingId: offer.listingId,
        tenantId: offer.tenantId,
        ownerId: offer.ownerId,
        checkIn: offer.checkIn,
        checkOut: offer.checkOut,
        guests: offer.guests,
        totalNights: offer.nights,
        pricePerNight: offer.pricePerNight,
        totalPrice: offer.totalPrice,
        cleaningFee: offer.cleaningFee,
        serviceFee: offer.serviceFee,
        totalWithFees: offer.totalPrice + offer.cleaningFee + offer.serviceFee,
        status: "PENDING",
        paymentStatus: "PENDING",
        infoRequestId: offer.infoRequestId,
        offerId: offer.id,
      },
    });

    // Mettre à jour l'offre
    await prisma.offer.update({
      where: { id: offer.id },
      data: { status: "ACCEPTED" },
    });

    // Créer la transaction de paiement
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: amount,
        currency: "TND",
        type: method,
        status: "PAID",
        provider: method === "card" ? "CARD" : "KONNECT",
        paidAt: new Date(),
      },
    });

    // Mettre à jour le statut de la réservation
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "PAID",
        paymentStatus: "PAID",
      },
    });

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: offer.tenantId,
        type: "PAYMENT_RECEIVED",
        title: "Paiement confirmé",
        content: `Votre paiement de ${amount} TND pour "${offer.listing.title}" a été confirmé.`,
        channels: ["IN_APP", "EMAIL"],
      },
    });

    await prisma.notification.create({
      data: {
        userId: offer.ownerId,
        type: "BOOKING_CONFIRMED",
        title: "Nouvelle réservation confirmée",
        content: `${user.firstName || "Un locataire"} a réservé "${offer.listing.title}" du ${offer.checkIn.toLocaleDateString()} au ${offer.checkOut.toLocaleDateString()}.`,
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error("Erreur paiement:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}