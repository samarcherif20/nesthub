// app/api/bookings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "50");

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

    const whereClause: any = {};

    if (role === "tenant") {
      whereClause.tenantId = user.id;
    } else if (role === "owner") {
      whereClause.ownerId = user.id;
    } else {
      whereClause.OR = [{ tenantId: user.id }, { ownerId: user.id }];
    }

    if (status && status !== "ALL") {
      const statusList = status.split(",");
      whereClause.status = { in: statusList };
    }

    const skip = (page - 1) * pageSize;

    // Calcul des dates pour les stats hebdomadaires
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfNext30Days = new Date();
    endOfNext30Days.setDate(endOfNext30Days.getDate() + 30);
    endOfNext30Days.setHours(23, 59, 59, 999);

    // Récupérer les stats en parallèle
    const weeklyRequestsPromise = prisma.booking.count({
      where: {
        ...whereClause,
        createdAt: { gte: startOfWeek },
      },
    });

    const occupancySumPromise = prisma.booking.aggregate({
      where: {
        ...whereClause,
        status: { in: ["CONFIRMED", "ACCEPTED"] },
        checkIn: { gte: new Date() },
        checkIn: { lte: endOfNext30Days },
      },
      _sum: { totalNights: true },
    });

    const weeklyRevenueSumPromise = prisma.booking.aggregate({
      where: {
        ...whereClause,
        status: { in: ["CONFIRMED", "ACCEPTED"] },
        createdAt: { gte: startOfWeek },
      },
      _sum: { totalPrice: true },
    });

    const statusCountsPromise = prisma.booking.groupBy({
      by: ["status"],
      where: whereClause,
      _count: { status: true },
    });

    const [
      bookings,
      totalCount,
      weeklyRequests,
      occupancySum,
      weeklyRevenueSum,
      statusCounts,
    ] = await Promise.all([
      prisma.booking.findMany({
        where: whereClause,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              type: true,
              governorate: true,
              delegation: true,
              photos: {
                take: 1,
                where: { isMain: true },
                select: { url: true },
              },
            },
          },
          owner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              isIdentityVerified: true,
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
              profilePictureUrl: true,
              isIdentityVerified: true,
              stats: {
                select: { reliabilityScore: true },
              },
            },
          },
          offer: {
            select: {
              id: true,
              totalPrice: true,
              status: true,
            },
          },
          payments: {
            take: 1,
            orderBy: { createdAt: "desc" },
            select: { status: true, paidAt: true },
          },
          // ✅ CORRECTION : review → reviews (pluriel)
          reviews: {
            take: 1,  // Prendre un seul avis (le plus récent)
            orderBy: { createdAt: "desc" },
            select: { 
              id: true, 
              rating: true, 
              comment: true,
              targetType: true 
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.booking.count({ where: whereClause }),
      weeklyRequestsPromise,
      occupancySumPromise,
      weeklyRevenueSumPromise,
      statusCountsPromise,
    ]);

    // Calcul du taux d'occupation (sur 30 jours = 30 nuits maximum)
    const totalBookedNights = occupancySum._sum.totalNights || 0;
    const occupancyRate = Math.min(
      Math.round((totalBookedNights / 30) * 100),
      100,
    );

    // Extraire les compteurs par statut
    let pendingCount = 0;
    let acceptedCount = 0;
    let pastCount = 0;

    for (const stat of statusCounts) {
      if (stat.status === "PENDING") pendingCount = stat._count.status;
      if (stat.status === "ACCEPTED" || stat.status === "CONFIRMED")
        acceptedCount += stat._count.status;
      if (
        stat.status === "COMPLETED" ||
        stat.status === "CANCELLED" ||
        stat.status === "REJECTED"
      )
        pastCount += stat._count.status;
    }

    // ✅ CORRECTION : Utiliser hasListingReview et hasTenantReview
    const formattedBookings = bookings.map((booking) => {
      const isPaid =
        booking.paymentStatus === "PAID" ||
        booking.payments.some((p) => p.status === "PAID");

      const location = [booking.listing.governorate, booking.listing.delegation]
        .filter(Boolean)
        .join(", ");

      // Vérifier quels types d'avis existent
      const hasListingReview = booking.hasListingReview || false;
      const hasTenantReview = booking.hasTenantReview || false;
      const firstReview = booking.reviews?.[0];

      return {
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
        isPaid,
        hasReview: hasListingReview || hasTenantReview, // Pour compatibilité
        hasListingReview: hasListingReview,  // ✅ NOUVEAU
        hasTenantReview: hasTenantReview,    // ✅ NOUVEAU
        review: firstReview,                 // Pour compatibilité
        reviewRating: firstReview?.rating,
        tenantMessage: booking.tenantMessage,
        createdAt: booking.createdAt,
        confirmedAt: booking.confirmedAt,
        cancelledAt: booking.cancelledAt,
        tenant: {
          id: booking.tenant?.id,
          username: booking.tenant?.username || null,
          name: booking.tenant?.username || "Locataire",
          firstName: booking.tenant?.firstName,
          lastName: booking.tenant?.lastName,
          image: booking.tenant?.profilePictureUrl || null,
          score: booking.tenant?.stats?.reliabilityScore,
          isVerified: booking.tenant?.isIdentityVerified,
        },
        owner: {
          id: booking.owner?.id,
          username: booking.owner?.username || null,
          name: booking.owner?.username || "Hôte",
          firstName: booking.owner?.firstName,
          lastName: booking.owner?.lastName,
          image: booking.owner?.profilePictureUrl || null,
          rating: booking.owner?.stats?.averageRating,
          isVerified: booking.owner?.isIdentityVerified,
        },
        listing: {
          id: booking.listing.id,
          title: booking.listing.title,
          type: booking.listing.type,
          location: location || "Emplacement non spécifié",
          image: booking.listing.photos[0]?.url || null,
        },
        conversationId: undefined,
        bookingOfferId: booking.offerId || undefined,
      };
    });

    console.log(`✅ ${formattedBookings.length} réservations chargées`);

    // Retourner les stats dans la réponse
    return NextResponse.json({
      bookings: formattedBookings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      stats: {
        pendingCount,
        acceptedCount,
        pastCount,
        weeklyRequests,
        occupancyRate,
        weeklyRevenue: weeklyRevenueSum._sum.totalPrice || 0,
      },
    });
  } catch (error) {
    console.error("Erreur GET /api/bookings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}