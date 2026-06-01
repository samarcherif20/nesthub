// app/api/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les avis
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const searchParams = request.nextUrl.searchParams;

    const targetType = searchParams.get("targetType") || "LISTING";
    const targetId = searchParams.get("targetId");
    const tab = searchParams.get("tab") || "received";
    const bookingId = searchParams.get("bookingId");

    // Si on demande les avis d'une annonce spécifique (public)
    if (targetId && targetType === "LISTING") {
      const reviews = await prisma.review.findMany({
        where: {
          targetId: targetId,
          targetType: "LISTING",
          isPublished: true,
        },
        include: {
          reviewer: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
            },
          },
          booking: {
            select: {
              checkIn: true,
              checkOut: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : 0;

      return NextResponse.json({
        reviews,
        averageRating,
        totalCount: reviews.length,
      });
    }

    // Si on demande l'avis pour un booking spécifique
    if (bookingId && clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (user) {
        const existingReview = await prisma.review.findFirst({
          where: {
            bookingId: bookingId,
            reviewerId: user.id,
            targetType: targetType,
          },
        });

        return NextResponse.json({
          hasReview: !!existingReview,
          review: existingReview,
        });
      }
    }

    // Pour les avis personnels (nécessite authentification)
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    let whereCondition = {};
    if (tab === "received") {
      whereCondition = {
        targetId: user.id,
        targetType: "TENANT",
        isPublished: true,
      };
    } else {
      whereCondition = {
        reviewerId: user.id,
        targetType: "TENANT",
        isPublished: true,
      };
    }

    const reviews = await prisma.review.findMany({
      where: whereCondition,
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                type: true,
                governorate: true,
                delegation: true,
                photos: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un avis
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const {
      bookingId,
      targetType,
      rating,
      comment,
      privateNote,
      criteria,
      cleanliness,
      communication,
      houseRules,
      recommend,
    } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });
    }

    if (!targetType || !["LISTING", "TENANT"].includes(targetType)) {
      return NextResponse.json(
        { error: "targetType invalide. Utilisez LISTING ou TENANT" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        tenant: { select: { id: true, username: true } },
        listing: { select: { id: true, title: true, ownerId: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Réservation non trouvée" },
        { status: 404 },
      );
    }

    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "La réservation doit être terminée pour laisser un avis" },
        { status: 400 },
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        bookingId: bookingId,
        targetType: targetType,
      },
    });

    if (existingReview) {
      return NextResponse.json(
        { 
          error: `Un avis de type "${targetType === 'LISTING' ? 'sur l\'annonce' : 'sur le locataire'}" existe déjà pour cette réservation`,
          existingReview: existingReview,
          targetType: targetType,
        },
        { status: 400 },
      );
    }

    let reviewData: any = {};
    let targetId: string = "";
    let targetTypeValue: string = "";
    let notificationContent: string = "";
    let notificationTitle: string = "";

    // ============================================
    // CAS 1: Avis sur l'annonce (par le locataire)
    // ============================================
    if (targetType === "LISTING") {
      if (booking.tenantId !== user.id) {
        return NextResponse.json(
          { error: "Seul le locataire peut noter l'annonce" },
          { status: 403 },
        );
      }

      const ownerId = booking.ownerId;
      
      if (!ownerId) {
        return NextResponse.json(
          { error: "Propriétaire non trouvé" },
          { status: 404 },
        );
      }

      const owner = await prisma.user.findUnique({
        where: { id: ownerId }
      });

      if (!owner) {
        return NextResponse.json(
          { error: "Propriétaire non trouvé" },
          { status: 404 },
        );
      }

      targetId = ownerId;
      targetTypeValue = "LISTING";

      const {
        cleanliness: critCleanliness = 0,
        communication: critCommunication = 0,
        checkIn = 0,
        accuracy = 0,
        location = 0,
        value = 0,
      } = criteria || {};

      const avgRating = Math.round(
        (critCleanliness + critCommunication + checkIn + accuracy + location + value) / 6,
      );

      reviewData = {
        rating: avgRating,
        cleanliness: critCleanliness,
        communication: critCommunication,
        checkIn: checkIn,
        accuracy: accuracy,
        location: location,
        value: value,
        comment: comment || null,
        privateNote: privateNote || null,
      };

      notificationTitle = "✨ Nouvel avis sur votre annonce";
      notificationContent = `@${user.username} a laissé un avis sur votre annonce "${booking.listing.title}" - Note: ${avgRating}/5 ⭐`;

      try {
        const { updateListingTrustScore } =
          await import("@/lib/risk-scoring/ai-listing-scoring");
        await updateListingTrustScore(booking.listing.id, true);
      } catch (err) {
        console.log("Trust score update skipped");
      }

      await prisma.booking.update({
        where: { id: bookingId },
        data: { hasListingReview: true },
      });
    }
    // ============================================
    // CAS 2: Avis sur le locataire (par le propriétaire)
    // ============================================
    else if (targetType === "TENANT") {
      if (booking.ownerId !== user.id) {
        return NextResponse.json(
          { error: "Seul le propriétaire peut noter le locataire" },
          { status: 403 },
        );
      }

      const finalCleanliness = cleanliness || rating || 0;
      const finalCommunication = communication || rating || 0;
      const finalHouseRules = houseRules || rating || 0;

      const avgRating = Math.round(
        (finalCleanliness + finalCommunication + finalHouseRules) / 3,
      );

      targetId = booking.tenant.id;
      targetTypeValue = "TENANT";

      reviewData = {
        rating: avgRating,
        cleanliness: finalCleanliness,
        communication: finalCommunication,
        houseRules: finalHouseRules,
        recommend: recommend || false,
        comment: comment || null,
        privateNote: privateNote || null,
      };

      notificationTitle = "📝 Nouvel avis sur votre séjour";
      notificationContent = `@${user.username} a laissé un avis sur votre séjour dans "${booking.listing.title}" - Note: ${avgRating}/5 ⭐`;

      await prisma.booking.update({
        where: { id: bookingId },
        data: { hasTenantReview: true },
      });

      const allUserReviews = await prisma.review.findMany({
        where: {
          targetId: booking.tenant.id,
          targetType: "TENANT",
          isPublished: true,
        },
        select: { rating: true },
      });

      const totalReviews = allUserReviews.length + 1;
      const sumRatings = allUserReviews.reduce((acc, r) => acc + r.rating, 0) + avgRating;
      const averageRating = sumRatings / totalReviews;

      await prisma.userStats.upsert({
        where: { userId: booking.tenant.id },
        update: {
          averageRating,
          totalReviews: totalReviews,
        },
        create: {
          userId: booking.tenant.id,
          averageRating,
          totalReviews: 1,
          totalBookings: 0,
          totalListings: 0,
          reliabilityScore: 50,
          fraudScore: 0,
        },
      });
    }

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: user.id,
        targetId: targetId,
        targetType: targetTypeValue,
        ...reviewData,
        isPublished: true,
      },
    });

    // Créer la notification
    await prisma.notification.create({
      data: {
        userId: targetTypeValue === "LISTING" ? booking.ownerId! : booking.tenant.id,
        type: "NEW_REVIEW",
        title: notificationTitle,
        content: notificationContent,
        data: {
          reviewId: review.id,
          bookingId,
          rating: reviewData.rating,
          listingId: booking.listing.id,
          listingTitle: booking.listing.title,
          reviewerUsername: user.username,
          reviewerId: user.id,
          targetType: targetTypeValue,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: targetType === "LISTING" 
        ? "Votre avis sur l'annonce a été publié avec succès" 
        : "Votre avis sur le locataire a été publié avec succès",
    });
  } catch (error) {
    console.error("Erreur création avis:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la création de l'avis" }, { status: 500 });
  }
}

// DELETE - Supprimer un avis
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const reviewId = searchParams.get("reviewId");
    const bookingId = searchParams.get("bookingId");
    const targetType = searchParams.get("targetType");

    if (!reviewId && (!bookingId || !targetType)) {
      return NextResponse.json(
        { error: "reviewId ou (bookingId + targetType) requis" },
        { status: 400 },
      );
    }

    let reviewToDelete;

    if (reviewId) {
      reviewToDelete = await prisma.review.findUnique({
        where: { id: reviewId },
      });
    } else {
      reviewToDelete = await prisma.review.findFirst({
        where: {
          bookingId: bookingId!,
          targetType: targetType!,
          reviewerId: user.id,
        },
      });
    }

    if (!reviewToDelete) {
      return NextResponse.json(
        { error: "Avis non trouvé" },
        { status: 404 },
      );
    }

    if (reviewToDelete.reviewerId !== user.id) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à supprimer cet avis" },
        { status: 403 },
      );
    }

    await prisma.review.delete({
      where: { id: reviewToDelete.id },
    });

    if (reviewToDelete.targetType === "LISTING") {
      await prisma.booking.update({
        where: { id: reviewToDelete.bookingId },
        data: { hasListingReview: false },
      });
    } else if (reviewToDelete.targetType === "TENANT") {
      await prisma.booking.update({
        where: { id: reviewToDelete.bookingId },
        data: { hasTenantReview: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Avis supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur suppression avis:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression" },
      { status: 500 },
    );
  }
}