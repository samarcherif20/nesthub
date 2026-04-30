import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ✅ GET existant - Récupérer les détails d'une réservation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { id } = await params;

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        OR: [{ tenantId: user.id }, { ownerId: user.id }],
      },
      include: {
        listing: {
          include: {
            photos: {
              orderBy: { position: "asc" },
              select: { url: true, isMain: true },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            stats: {
              select: { averageRating: true, totalReviews: true },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
          },
        },
        revealedInfo: true,
        contract: true,
        review: true,
        offer: {
          select: { id: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    let conversationId = null;
    if (booking.infoRequestId) {
      const conversation = await prisma.conversation.findFirst({
        where: { infoRequestId: booking.infoRequestId },
        select: { id: true },
      });
      conversationId = conversation?.id || null;
    }

    const hasReview = !!booking.review;

    return NextResponse.json({
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: booking.totalNights,
      guests: booking.guests,
      totalPrice: booking.totalPrice,
      pricePerNight: booking.pricePerNight,
      cleaningFee: booking.cleaningFee || 0,
      serviceFee: booking.serviceFee || 0,
      hasReview: hasReview,
      conversationId: conversationId,
      offerId: booking.offer?.id,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
        type: booking.listing.type,
        governorate: booking.listing.governorate,
        delegation: booking.listing.delegation,
        street: booking.listing.street,
        latitude: booking.listing.latitude,
        longitude: booking.listing.longitude,
        description: booking.listing.description,
        photos: booking.listing.photos,
        houseRules: booking.listing.houseRules,
        equipment: booking.listing.equipment,
      },
      owner: {
        id: booking.owner?.id,
        username: booking.owner?.username,
        firstName: booking.owner?.firstName,
        lastName: booking.owner?.lastName,
        email: booking.owner?.email,
        phone: booking.owner?.phoneNumber,
        profilePictureUrl: booking.owner?.profilePictureUrl,
        rating: booking.owner?.stats?.averageRating,
        reviewCount: booking.owner?.stats?.totalReviews,
      },
      tenant: {
        id: booking.tenant?.id,
        username: booking.tenant?.username,
        firstName: booking.tenant?.firstName,
        lastName: booking.tenant?.lastName,
        email: booking.tenant?.email,
        phone: booking.tenant?.phoneNumber,
        profilePictureUrl: booking.tenant?.profilePictureUrl,
      },
      revealedInfo: booking.revealedInfo,
      contract: booking.contract,
    });
  } catch (error) {
    console.error("❌ [API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ✅ POST pour la prolongation avec détails enrichis
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const { newCheckOut, message } = await req.json();

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: true,
        tenant: true,
        owner: true,
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que c'est le locataire
    if (booking.tenantId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (booking.status === "COMPLETED" || booking.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cette réservation ne peut pas être prolongée" },
        { status: 400 },
      );
    }

    const newCheckOutDate = new Date(newCheckOut);
    const currentCheckOut = new Date(booking.checkOut);

    if (newCheckOutDate <= currentCheckOut) {
      return NextResponse.json(
        {
          error: "La nouvelle date doit être après la date de départ actuelle",
        },
        { status: 400 },
      );
    }

    const additionalNights = Math.ceil(
      (newCheckOutDate.getTime() - currentCheckOut.getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const additionalPrice = booking.pricePerNight * additionalNights;

    // ✅ Récupérer les infos du locataire et du listing pour la notification
    const tenantName =
      booking.tenant.firstName && booking.tenant.lastName
        ? `${booking.tenant.firstName} ${booking.tenant.lastName}`
        : booking.tenant.username || "Un locataire";

    const listingTitle = booking.listing.title;

    // Formatage des dates pour la notification
    const formattedCurrentCheckOut = currentCheckOut.toLocaleDateString(
      "fr-FR",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      },
    );
    const formattedNewCheckOut = newCheckOutDate.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // ✅ Créer une notification détaillée pour le propriétaire
    await prisma.notification.create({
      data: {
        userId: booking.ownerId!,
        type: "BOOKING_REQUEST",
        title: "📅 Demande de prolongation de séjour",
        content: `${tenantName} souhaite prolonger son séjour à "${listingTitle}" du ${formattedCurrentCheckOut} au ${formattedNewCheckOut}. Supplément: ${additionalPrice.toLocaleString()} TND`,
        data: {
          bookingId: booking.id,
          tenantId: booking.tenantId,
          tenantName: tenantName,
          tenantUsername: booking.tenant.username,
          listingId: booking.listingId,
          listingTitle: listingTitle,
          currentCheckOut: booking.checkOut,
          requestedCheckOut: newCheckOutDate,
          additionalNights: additionalNights,
          additionalPrice: additionalPrice,
          message: message || null,
        },
      },
    });

    console.log(`✅ Demande de prolongation envoyée pour la réservation ${id}`);
    console.log(`   - Locataire: ${tenantName}`);
    console.log(`   - Logement: ${listingTitle}`);
    console.log(`   - Nuits supplémentaires: ${additionalNights}`);
    console.log(`   - Supplément: ${additionalPrice} TND`);

    return NextResponse.json({
      success: true,
      additionalNights,
      additionalPrice,
      message: "Demande envoyée au propriétaire",
    });
  } catch (error) {
    console.error("❌ Erreur prolongation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
