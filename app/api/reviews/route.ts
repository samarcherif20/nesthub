import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les avis
export async function GET(request: NextRequest) {
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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const tab = searchParams.get("tab") || "received";

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
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const { bookingId, cleanliness, communication, houseRules, comment, recommend } = await request.json();

    // Validation
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId requis" }, { status: 400 });
    }
    if (cleanliness === 0 || communication === 0 || houseRules === 0) {
      return NextResponse.json({ error: "Toutes les notes sont requises" }, { status: 400 });
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
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (booking.ownerId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Vérifier que la réservation est terminée
    if (booking.status !== "COMPLETED") {
      return NextResponse.json({ error: "La réservation doit être terminée" }, { status: 400 });
    }

    // Vérifier qu'un avis n'existe pas déjà
    const existingReview = await prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return NextResponse.json({ error: "Avis déjà existant" }, { status: 400 });
    }

    // Calculer la note moyenne
    const avgRating = Math.round((cleanliness + communication + houseRules) / 3);

    // Créer l'avis
    const review = await prisma.review.create({
      data: {
        bookingId,
        reviewerId: user.id,
        targetId: booking.tenant.id,
        targetType: "TENANT",
        rating: avgRating,
        cleanliness,
        communication,
        houseRules,
        recommend,
        comment: comment || null,
        isPublished: true,
      },
    });

    // Mettre à jour les stats de l'utilisateur cible
    const allUserReviews = await prisma.review.findMany({
      where: { targetId: booking.tenant.id, isPublished: true },
      select: { rating: true },
    });
    
    const averageRating = allUserReviews.reduce((acc, r) => acc + r.rating, 0) / allUserReviews.length;
    
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

    //  Créer la notification avec username et nom du listing
    await prisma.notification.create({
      data: {
        userId: booking.tenant.id,
        type: "NEW_REVIEW",
        title: " Nouvel avis reçu",
        content: `@{user.username} a laissé un avis sur votre séjour dans "${booking.listing.title}" - Note: ${avgRating}/5 ⭐`,
        data: {
          reviewId: review.id,
          bookingId,
          rating: avgRating,
          cleanliness,
          communication,
          houseRules,
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
      message: "Avis publié avec succès" 
    });
  } catch (error) {
    console.error("Erreur création avis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}