// app/api/offers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

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

    const offer = await prisma.offer.findFirst({
      where: {
        id,
        OR: [{ tenantId: user.id }, { ownerId: user.id }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            type: true,
            governorate: true,
            delegation: true,
            street: true,
            rooms: true,
            maxGuests: true,
            pricePerNight: true,
            cleaningFee: true,
            equipment: true,
            latitude: true,
            longitude: true,
            photos: {
              take: 1,
              where: { isMain: true },
              select: { url: true },
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
            cinNumber: true,
            isIdentityVerified: true,
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
            cinNumber: true,
            isIdentityVerified: true,
            createdAt: true,
            stats: {
              select: { averageRating: true, totalReviews: true },
            },
          },
        },
        infoRequest: true,
        booking: {
          select: {
            id: true,
            revealedInfo: true,
          },
        },
        paymentTransactions: {
          take: 1,
          where: { status: "SUCCESS" },
          select: { stripePaymentIntentId: true },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    console.log(" [DEBUG] Listing brut:", {
      id: offer.listing?.id,
      title: offer.listing?.title,
      latitude: offer.listing?.latitude,
      longitude: offer.listing?.longitude,
      photo: offer.listing?.photos[0]?.url,
    });

    console.log("[DEBUG] Owner createdAt brut:", offer.owner?.createdAt);
    console.log(
      " [DEBUG] Owner createdAt type:",
      typeof offer.owner?.createdAt,
    );

    //  Compter les annonces actives du propriétaire
    const listingsCount = offer.owner
      ? await prisma.listing.count({
          where: {
            ownerId: offer.owner.id,
            status: "ACTIVE",
          },
        })
      : 0;

    console.log(" [DEBUG] listingsCount calculé:", listingsCount);
    console.log(" [DEBUG] ownerId pour comptage:", offer.owner?.id);

    // Récupérer la conversation via l'infoRequest si besoin
    let conversationId = null;
    if (offer.infoRequest?.id) {
      const conversation = await prisma.conversation.findFirst({
        where: { infoRequestId: offer.infoRequest.id },
        select: { id: true },
      });
      conversationId = conversation?.id || null;
    }

    const joinedYearValue = offer.owner?.createdAt
      ? new Date(offer.owner.createdAt).getFullYear()
      : null;

    console.log(" [DEBUG] joinedYear calculé:", joinedYearValue);

    const formattedOffer = {
      id: offer.id,
      reference: offer.reference,
      checkIn: offer.checkIn,
      checkOut: offer.checkOut,
      nights: offer.nights,
      guests: offer.guests,
      pricePerNight: offer.pricePerNight,
      cleaningFee: offer.cleaningFee,
      serviceFee: offer.serviceFee,
      totalPrice: offer.totalPrice,
      status: offer.status,
      createdAt: offer.createdAt,
      expiresAt: offer.expiresAt,
      conversationId: conversationId,
      bookingId: offer.booking?.id,
      paymentIntentId:
        offer.paymentTransactions?.[0]?.stripePaymentIntentId || null, // ✅ AJOUTÉ
      revealedInfo: offer.booking?.revealedInfo,
      listing: {
        id: offer.listing.id,
        title: offer.listing.title,
        type: offer.listing.type,
        location:
          offer.listing.governorate && offer.listing.delegation
            ? `${offer.listing.delegation}, ${offer.listing.governorate}`
            : null,
        fullAddress: offer.booking?.revealedInfo?.exactAddress || null,
        bedrooms: offer.listing.rooms,
        maxGuests: offer.listing.maxGuests,
        pricePerNight: offer.listing.pricePerNight,
        cleaningFee: offer.listing.cleaningFee,
        image: offer.listing.photos[0]?.url,
        equipment: offer.listing.equipment,
        latitude: offer.listing.latitude,
        longitude: offer.listing.longitude,
      },
      tenant: offer.tenant
        ? {
            id: offer.tenant.id,
            username: offer.tenant.username,
            firstName: offer.tenant.firstName,
            lastName: offer.tenant.lastName,
            email: offer.tenant.email,
            phone: offer.tenant.phoneNumber,
            profilePictureUrl: offer.tenant.profilePictureUrl,
            cinNumber: offer.tenant.cinNumber,
            isIdentityVerified: offer.tenant.isIdentityVerified,
            name:
              offer.tenant.firstName && offer.tenant.lastName
                ? `${offer.tenant.firstName} ${offer.tenant.lastName}`
                : offer.tenant.username,
          }
        : null,
      owner: offer.owner
        ? {
            id: offer.owner.id,
            username: offer.owner.username,
            firstName: offer.owner.firstName,
            lastName: offer.owner.lastName,
            email: offer.owner.email,
            phone: offer.owner.phoneNumber,
            profilePictureUrl: offer.owner.profilePictureUrl,
            cinNumber: offer.owner.cinNumber,
            isIdentityVerified: offer.owner.isIdentityVerified,
            joinedYear: joinedYearValue,
            listingsCount: listingsCount,
            rating: offer.owner.stats?.averageRating,
            reviewCount: offer.owner.stats?.totalReviews,
            name:
              offer.owner.firstName && offer.owner.lastName
                ? `${offer.owner.firstName} ${offer.owner.lastName}`
                : offer.owner.username,
          }
        : null,
    };

    console.log("[DEBUG] formattedOffer.listing:", {
      id: formattedOffer.listing?.id,
      title: formattedOffer.listing?.title,
      latitude: formattedOffer.listing?.latitude,
      longitude: formattedOffer.listing?.longitude,
      image: formattedOffer.listing?.image,
    });

    console.log(" [DEBUG] formattedOffer.owner:", {
      joinedYear: formattedOffer.owner?.joinedYear,
      listingsCount: formattedOffer.owner?.listingsCount,
      phone: formattedOffer.owner?.phone,
      name: formattedOffer.owner?.name,
    });

    console.log("[DEBUG] formattedOffer.bookingId:", formattedOffer.bookingId);
    console.log(
      " [DEBUG] formattedOffer.paymentIntentId:",
      formattedOffer.paymentIntentId,
    );

    return NextResponse.json(formattedOffer);
  } catch (error) {
    console.error(" Erreur GET offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
