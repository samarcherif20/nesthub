// app/api/reviews/route.ts
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
      select: { id: true, username: true }, // ✅ Garder seulement username
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Lire le FormData
    const formData = await req.formData();
    const bookingId = formData.get("bookingId") as string;
    const rating = parseInt(formData.get("rating") as string);
    const criteriaStr = formData.get("criteria") as string;
    const publicComment = formData.get("publicComment") as string;
    const privateNote = formData.get("privateNote") as string;

    const criteria = criteriaStr ? JSON.parse(criteriaStr) : null;

    // Vérifier que la réservation appartient à l'utilisateur
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        tenantId: user.id,
        status: "COMPLETED",
      },
      select: { id: true, ownerId: true, listingId: true },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier si un avis existe déjà
    const existingReview = await prisma.review.findFirst({
      where: { bookingId: booking.id },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Un avis a déjà été laissé pour cette réservation" },
        { status: 400 },
      );
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        reviewerId: user.id,
        targetId: booking.ownerId!,
        targetType: "OWNER",
        rating,
        comment: publicComment,
        response: privateNote,
        isPublished: true,
      },
    });

    // Mettre à jour les stats de l'utilisateur
    await prisma.userStats.upsert({
      where: { userId: booking.ownerId! },
      update: {
        totalReviews: { increment: 1 },
        averageRating: await calculateAverageRating(booking.ownerId!),
      },
      create: {
        userId: booking.ownerId!,
        totalReviews: 1,
        averageRating: rating,
        totalBookings: 0,
        totalListings: 0,
        reliabilityScore: 50,
        fraudScore: 0,
        loginCount: 0,
        reportCount: 0,
        disputeCount: 0,
        cancellationCount: 0,
      },
    });

    // ✅ Utiliser le username de l'utilisateur
    const userName = user.username || "Un locataire";

    // Créer une notification pour l'hôte
    await prisma.notification.create({
      data: {
        userId: booking.ownerId!,
        type: "NEW_REVIEW",
        title: "Nouvel avis reçu",
        content: `${userName} a laissé un avis sur votre propriété. Note: ${rating}/5`,
        data: { reviewId: review.id, bookingId: booking.id },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Erreur création avis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

async function calculateAverageRating(userId: string): Promise<number> {
  const reviews = await prisma.review.aggregate({
    where: { targetId: userId },
    _avg: { rating: true },
  });
  return reviews._avg.rating || 0;
}