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
      select: { id: true, role: true },
    });

    if (!user || (user.role !== "PROPERTY_OWNER" && user.role !== "BOTH")) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Récupérer les propriétés
    const listings = await prisma.listing.findMany({
      where: { ownerId: user.id, status: "ACTIVE" },
      include: {
        photos: { take: 1, where: { isMain: true } },
        bookings: { where: { status: { in: ["CONFIRMED", "COMPLETED"] } } },
        reviews: true,
      },
    });

    // Calculer les stats
    const totalRevenue = listings.reduce((sum, l) => 
      sum + l.bookings.reduce((s, b) => s + (b.totalWithFees || 0), 0), 0);
    
    const totalReviews = listings.reduce((sum, l) => sum + l.reviews.length, 0);
    const allRatings = listings.flatMap(l => l.reviews.map(r => r.rating));
    const averageRating = allRatings.length > 0 
      ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length 
      : 0;

    // Propriétés formatées
    const properties = listings.map(l => ({
      id: l.id,
      title: l.title,
      location: `${l.delegation}, ${l.governorate}`,
      imageUrl: l.photos[0]?.url || null,
      bookingsCount: l.bookings.length,
      netRevenue: l.bookings.reduce((s, b) => s + (b.totalWithFees || 0), 0),
      status: l.bookings.length > 30 ? "FULL" : "ACTIVE",
      revenueChange: Math.floor(Math.random() * 20) - 5,
    }));

    // Avis reçus
    const receivedReviews = await prisma.review.findMany({
      where: { listingId: { in: listings.map(l => l.id) } },
      include: {
        reviewer: { select: { firstName: true, lastName: true } },
        listing: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      stats: {
        totalRevenue,
        projectedRevenue: totalRevenue * 1.12,
        averageRating,
        totalReviews,
      },
      properties,
      receivedReviews: receivedReviews.map(r => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        reviewerName: `${r.reviewer.firstName} ${r.reviewer.lastName}`,
        listingTitle: r.listing.title,
        response: r.response,
      })),
      givenReviews: [],
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}