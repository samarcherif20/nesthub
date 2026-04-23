// app/api/bookings/[id]/route.ts
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

    console.log("🔍 [API] Recherche de la réservation:", {
      id,
      tenantId: user.id,
    });

    const booking = await prisma.booking.findFirst({
      where: {
        id: id,
        tenantId: user.id,
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
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            stats: {
              select: { averageRating: true, totalReviews: true },
            },
          },
        },
        revealedInfo: true,
        contract: true,
        review: true,
      },
    });

    if (!booking) {
      console.log("❌ [API] Réservation non trouvée");
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    const hasReview = !!booking.review;

    console.log("📊 [API] DONNÉES DE LA DB:", {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      hasReview: hasReview,
      isCompleted: booking.status === "COMPLETED",
    });

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
        firstName: booking.owner?.firstName,
        lastName: booking.owner?.lastName,
        profilePictureUrl: booking.owner?.profilePictureUrl,
        rating: booking.owner?.stats?.averageRating,
        reviewCount: booking.owner?.stats?.totalReviews,
      },
      revealedInfo: booking.revealedInfo,
      contract: booking.contract,
    });
  } catch (error) {
    console.error("❌ [API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
