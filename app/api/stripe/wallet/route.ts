// app/api/stripe/wallet/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

    // Récupérer les paiements AVEC les infos du booking et listing
    const payments = await prisma.payment.findMany({
      where: {
        booking: { tenantId: user.id },
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                photos: { take: 1, where: { isMain: true } },
                governorate: true,
                delegation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    //  Récupérer les cautions avec détails du séjour
    const depositAuthorizations = await prisma.depositAuthorization.findMany({
      where: {
        booking: { tenantId: user.id },
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                governorate: true,
                delegation: true,
              },
            },
          },
        },
      },
    });

    //  Récupérer les réservations futures pour les échéances
    const futureBookings = await prisma.booking.findMany({
      where: {
        tenantId: user.id,
        status: { in: ["CONFIRMED", "PAID"] },
        checkIn: { gt: new Date() },
        paymentStatus: "PENDING",
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            governorate: true,
            delegation: true,
            photos: { take: 1, where: { isMain: true } },
          },
        },
      },
      orderBy: { checkIn: "asc" },
      take: 10,
    });

    // Formater les transactions avec les infos du séjour
    const transactions = payments.map(p => ({
      id: p.id,
      amount: p.amount,
      type: p.status === "REFUNDED" ? "REFUND" : "PAYMENT",
      status: p.status,
      description: p.status === "REFUNDED" ? "Remboursement" : "Paiement",
      date: p.createdAt,
      reference: p.providerTransactionId || p.id.slice(-8).toUpperCase(),
      stripePaymentIntentId: p.providerTransactionId,
      refundAmount: p.refundAmount,
      refundReason: p.refundReason,
      refundedAt: p.refundedAt,
      //  INFOS DU SÉJOUR (via booking existant)
      stay: p.booking ? {
        bookingId: p.booking.id,
        listingId: p.booking.listing.id,
        listingTitle: p.booking.listing.title,
        listingImage: p.booking.listing.photos?.[0]?.url || null,
        location: `${p.booking.listing.delegation}, ${p.booking.listing.governorate}`,
        checkIn: p.booking.checkIn,
        checkOut: p.booking.checkOut,
        nights: p.booking.totalNights,
        guests: p.booking.guests,
        status: p.booking.status,
        reference: p.booking.reference,
      } : null,
    }));

    //  Cautions avec détails du séjour
    const securityDeposits = depositAuthorizations.map(d => ({
      id: d.id,
      amount: d.amount,
      status: d.status,
      releaseDate: d.releasedAt,
      listingId: d.booking.listing.id,
      listingTitle: d.booking.listing.title,
      location: `${d.booking.listing.delegation}, ${d.booking.listing.governorate}`,
      checkInDate: d.booking.checkIn,
      checkOutDate: d.booking.checkOut,
      authorizedAt: d.authorizedAt,
      expiresAt: d.expiresAt,
      nights: d.booking.totalNights,
      bookingReference: d.booking.reference,
    }));

    //  Échéances à venir
    const upcomingPayments = futureBookings.map(b => ({
      id: b.id,
      type: "RENT" as const,
      amount: b.totalWithFees,
      dueDate: b.checkIn,
      description: `Séjour à ${b.listing.title}`,
      listingId: b.listing.id,
      listingTitle: b.listing.title,
      listingImage: b.listing.photos?.[0]?.url || null,
      location: `${b.listing.delegation}, ${b.listing.governorate}`,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      nights: b.totalNights,
      guests: b.guests,
      bookingReference: b.reference,
    }));

    //  Calculer les soldes
    const totalSpent = payments
      .filter(p => p.status === "PAID" || p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0);

    const totalRefunded = payments
      .filter(p => p.status === "REFUNDED")
      .reduce((sum, p) => sum + (p.refundAmount || p.amount), 0);

    const pendingAmount = payments
      .filter(p => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({
      balance: {
        available: totalRefunded,
        pending: pendingAmount,
        totalSpent: totalSpent,
        totalRefunded: totalRefunded,
      },
      securityDeposits,
      upcomingPayments,
      transactions,
    });
  } catch (error) {
    console.error("Erreur wallet:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}