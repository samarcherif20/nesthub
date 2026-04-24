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
        infoRequest: true,
        booking: {
          select: {
            id: true,
            revealedInfo: true,
          },
        },
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Récupérer la conversation via l'infoRequest si besoin
    let conversationId = null;
    if (offer.infoRequest?.id) {
      const conversation = await prisma.conversation.findFirst({
        where: { infoRequestId: offer.infoRequest.id },
        select: { id: true },
      });
      conversationId = conversation?.id || null;
    }

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
            rating: offer.owner.stats?.averageRating,
            reviewCount: offer.owner.stats?.totalReviews,
            name:
              offer.owner.firstName && offer.owner.lastName
                ? `${offer.owner.firstName} ${offer.owner.lastName}`
                : offer.owner.username,
          }
        : null,
    };

    return NextResponse.json(formattedOffer);
  } catch (error) {
    console.error("Erreur GET offre:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
