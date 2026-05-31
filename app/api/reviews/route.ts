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
      targetType, // "LISTING" ou "TENANT"
      rating,
      comment,
      privateNote,
      criteria,
      cleanliness,
      communication,
      houseRules,
      recommend,
    } = body;

    // Extraire les critères du formulaire
    const {
      cleanliness: critCleanliness = 0,
      communication: critCommunication = 0,
      checkIn = 0,
      accuracy = 0,
      location = 0,
      value = 0,
    } = criteria || {};

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });
    }

    // Vérifier la réservation
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

    // Vérifier que la réservation est terminée
    if (booking.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "La réservation doit être terminée" },
        { status: 400 },
      );
    }

    // Vérifier qu'un avis n'existe pas déjà
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "Avis déjà existant" },
        { status: 400 },
      );
    }

    let reviewData: any = {};
    let targetId: string;
    let targetTypeValue: string;
    let notificationContent: string;

    // ============================================
    // CAS 1: Avis sur l'annonce (par le locataire)
    // ============================================
    if (targetType === "LISTING") {
      // Vérifier que l'utilisateur est le locataire
      if (booking.tenantId !== user.id) {
        return NextResponse.json(
          { error: "Seul le locataire peut noter l'annonce" },
          { status: 403 },
        );
      }

      targetId = booking.listing.id;
      targetTypeValue = "LISTING";

      // Calculer la note moyenne des 6 critères
      const avgRating = Math.round(
        (critCleanliness +
          critCommunication +
          checkIn +
          accuracy +
          location +
          value) /
          6,
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

      notificationContent = `@${user.username} a laissé un avis sur votre annonce "${booking.listing.title}" - Note: ${avgRating}/5 ⭐`;

      // Mettre à jour le trust score du listing
      try {
        const { updateListingTrustScore } =
          await import("@/lib/risk-scoring/ai-listing-scoring");
        await updateListingTrustScore(booking.listing.id, true);
      } catch (err) {
        console.log("Trust score update skipped");
      }
    }
    // ============================================
    // CAS 2: Avis sur le locataire (par le propriétaire)
    // ============================================
    else if (targetType === "TENANT") {
      // Vérifier que l'utilisateur est le propriétaire
      if (booking.ownerId !== user.id) {
        return NextResponse.json(
          { error: "Seul le propriétaire peut noter le locataire" },
          { status: 403 },
        );
      }

      if (!cleanliness || !communication || !houseRules) {
        return NextResponse.json(
          { error: "Toutes les notes sont requises" },
          { status: 400 },
        );
      }

      const avgRating = Math.round(
        (cleanliness + communication + houseRules) / 3,
      );

      targetId = booking.tenant.id;
      targetTypeValue = "TENANT";

      reviewData = {
        rating: avgRating,
        cleanliness,
        communication,
        houseRules,
        recommend: recommend || false,
        comment: comment || null,
        privateNote: privateNote || null,
      };

      notificationContent = `@${user.username} a laissé un avis sur votre séjour dans "${booking.listing.title}" - Note: ${avgRating}/5 ⭐`;

      // Mettre à jour les stats de l'utilisateur cible
      const allUserReviews = await prisma.review.findMany({
        where: {
          targetId: booking.tenant.id,
          targetType: "TENANT",
          isPublished: true,
        },
        select: { rating: true },
      });

      const averageRating =
        allUserReviews.length > 0
          ? allUserReviews.reduce((acc, r) => acc + r.rating, 0) /
            allUserReviews.length
          : avgRating;

      await prisma.userStats.upsert({
        where: { userId: booking.tenant.id },
        update: {
          averageRating,
          totalReviews: allUserReviews.length,
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
    } else {
      return NextResponse.json(
        { error: "targetType invalide. Utilisez LISTING ou TENANT" },
        { status: 400 },
      );
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
        userId:
          targetTypeValue === "LISTING" ? booking.ownerId! : booking.tenant.id,
        type: "NEW_REVIEW",
        title: "✨ Nouvel avis reçu",
        content: notificationContent,
        data: {
          reviewId: review.id,
          bookingId,
          rating: reviewData.rating,
          listingId: booking.listing.id,
          listingTitle: booking.listing.title,
          reviewerUsername: user.username,
          reviewerId: user.id,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: "Avis publié avec succès",
    });
  } catch (error) {
    console.error("Erreur création avis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
