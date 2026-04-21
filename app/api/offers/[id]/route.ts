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
            rooms: true,
            maxGuests: true,
            pricePerNight: true,
            cleaningFee: true,
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
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },
        infoRequest: true,
      },
    });

    if (!offer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Formater la réponse pour la page de paiement
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
      listing: {
        id: offer.listing.id,
        title: offer.listing.title,
        type: offer.listing.type,
        location:
          offer.listing.governorate && offer.listing.delegation
            ? `${offer.listing.governorate}, ${offer.listing.delegation}`
            : null,
        bedrooms: offer.listing.rooms,
        maxGuests: offer.listing.maxGuests,
        pricePerNight: offer.listing.pricePerNight,
        cleaningFee: offer.listing.cleaningFee,
        image: offer.listing.photos[0]?.url,
      },
      tenant: offer.tenant
        ? {
            id: offer.tenant.id,
            name:
              offer.tenant.firstName && offer.tenant.lastName
                ? `${offer.tenant.firstName} ${offer.tenant.lastName}`
                : offer.tenant.username,
          }
        : null,
      owner: offer.owner
        ? {
            id: offer.owner.id,
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
