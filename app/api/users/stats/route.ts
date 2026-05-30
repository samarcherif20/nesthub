// app/api/users/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // 1. COMPTER LES ANNONCES (totalListings)
    const listingsCount = await prisma.listing.count({
      where: { ownerId: user.id },
    });

    // 2. COMPTER LES RÉSERVATIONS (totalBookings)
    const tenantBookings = await prisma.booking.count({
      where: { tenantId: user.id },
    });
    const ownerBookings = await prisma.booking.count({
      where: { ownerId: user.id },
    });
    const totalBookings = tenantBookings + ownerBookings;

    // 3. COMPTER LES AVIS REÇUS (totalReviews)
    const totalReviews = await prisma.review.count({
      where: { targetId: user.id },
    });

    // 4. NOTE MOYENNE DES AVIS (averageRating)
    const reviewsAgg = await prisma.review.aggregate({
      where: { targetId: user.id },
      _avg: { rating: true },
    });
    const averageRating = reviewsAgg._avg.rating || 0;

    // 5. GAINS TOTAUX (totalEarned) - CORRIGÉ
    let totalEarned = 0;

    // Essayer depuis UserStats d'abord
    if (user.stats?.totalEarned) {
      totalEarned = user.stats.totalEarned;
    }

    // Sinon, calculer depuis les réservations terminées
    if (totalEarned === 0) {
      const completedBookings = await prisma.booking.findMany({
        where: {
          ownerId: user.id,
          status: "COMPLETED",
        },
        select: {
          totalWithFees: true,
        },
      });

      totalEarned = completedBookings.reduce(
        (sum, booking) => sum + (booking.totalWithFees || 0),
        0,
      );
    }

    // Si toujours 0, essayer depuis PaymentTransaction
    if (totalEarned === 0) {
      try {
        const payments = await prisma.payment.aggregate({
          where: {
            booking: {
              ownerId: user.id,
            },
            status: "PAID",
          },
          _sum: {
            amount: true,
          },
        });
        totalEarned = payments._sum.amount || 0;
      } catch (error) {
        console.log("[users/stats] Payment table error:", error);
      }
    }

    // 6. TAUX DE RÉPONSE DYNAMIQUE (responseRate)
    const receivedMessages = await prisma.bookingMessage.findMany({
      where: { receiverId: user.id },
      select: {
        id: true,
        isRead: true,
      },
    });

    const responseRate =
      receivedMessages.length > 0
        ? Math.round(
            (receivedMessages.filter((m) => m.isRead).length /
              receivedMessages.length) *
              100,
          )
        : 100;

    // 7. TEMPS DE RÉPONSE MOYEN (responseTime)
    let responseTime = "--";

    // 8. TAUX DE COMPLÉTION DU PROFIL (completionRate)
    let completedFields = 0;
    const totalFields = 10;

    if (user.firstName && user.firstName.trim().length > 0) completedFields++;
    if (user.lastName && user.lastName.trim().length > 0) completedFields++;
    if (user.username && user.username.trim().length > 0) completedFields++;
    if (
      user.phoneNumber &&
      user.phoneNumber.trim().length > 0 &&
      user.phoneVerifiedAt
    )
      completedFields++;
    if (user.bio && user.bio.length > 20) completedFields++;
    if (user.profilePictureUrl) completedFields++;
    if (user.spokenLanguages && user.spokenLanguages.length > 0)
      completedFields++;
    if (user.profession && user.profession.trim().length > 0) completedFields++;
    if (user.isIdentityVerified) completedFields++;
    if (
      user.availability &&
      Object.keys(user.availability as object).length > 0
    )
      completedFields++;

    const completionRate = Math.round((completedFields / totalFields) * 100);

    // 9. BADGES DYNAMIQUES
    const reliabilityScore = user.stats?.reliabilityScore || 50;
    const badges: string[] = [];

    let actualScore = reliabilityScore;

    if (responseRate >= 90) actualScore = Math.min(100, actualScore + 10);
    else if (responseRate >= 70) actualScore = Math.min(100, actualScore + 5);
    else if (responseRate < 50) actualScore = Math.max(0, actualScore - 10);

    if (totalBookings >= 20) actualScore = Math.min(100, actualScore + 15);
    else if (totalBookings >= 10) actualScore = Math.min(100, actualScore + 10);
    else if (totalBookings >= 5) actualScore = Math.min(100, actualScore + 5);

    if (averageRating >= 4.8) actualScore = Math.min(100, actualScore + 10);
    else if (averageRating >= 4.5) actualScore = Math.min(100, actualScore + 5);
    else if (averageRating < 3) actualScore = Math.max(0, actualScore - 15);

    if (actualScore >= 90) badges.push("SUPERHOST");
    if (actualScore >= 75) badges.push("EXPERT");
    if (actualScore >= 50) badges.push("RELIABLE");
    if (user.isIdentityVerified) badges.push("VERIFIED");
    if (totalBookings >= 10) badges.push("BOOKING_MASTER");
    if (listingsCount >= 3) badges.push("MULTI_LISTING");

    // 10. MEMBER SINCE
    const memberSince = user.createdAt.getFullYear().toString();

    // 11. RÉPONSE FINALE
    return NextResponse.json({
      stats: {
        reliabilityScore: actualScore,
        totalBookings,
        totalListings: listingsCount,
        totalReviews,
        averageRating,
        totalEarned,
        responseRate,
        responseTime,
        completionRate,
        badges,
        memberSince,
      },
    });
  } catch (error) {
    console.error("[users/stats] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
