import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est ADMIN
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // ✅ Récupérer les paramètres de filtres depuis l'URL
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "all";
    const ratingFilter = searchParams.get("ratingFilter") || "all";
    const dateFilter = searchParams.get("dateFilter") || "all";
    const search = searchParams.get("search") || "";

    // ✅ Construire la clause WHERE dynamique
    let where: any = {};

    // Filtre par type (all, flagged, pending)
    if (filter === "flagged") {
      where.isFlagged = true;
    } else if (filter === "pending") {
      where.response = null;
    }

    // Filtre par note (all, low, high, 1-5)
    if (ratingFilter !== "all") {
      if (ratingFilter === "low") {
        where.rating = { lte: 2 };
      } else if (ratingFilter === "high") {
        where.rating = { gte: 4 };
      } else {
        where.rating = parseInt(ratingFilter);
      }
    }

    // ✅ Filtre par date (all, today, week, month)
    if (dateFilter !== "all") {
      const now = new Date();
      let startDate = new Date();
      
      if (dateFilter === "today") {
        startDate.setHours(0, 0, 0, 0);
      } else if (dateFilter === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateFilter === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }
      where.createdAt = { gte: startDate };
    }

    // ✅ Recherche textuelle
    if (search) {
      where.OR = [
        { comment: { contains: search, mode: "insensitive" } },
        { reviewer: { firstName: { contains: search, mode: "insensitive" } } },
        { reviewer: { lastName: { contains: search, mode: "insensitive" } } },
        { booking: { listing: { title: { contains: search, mode: "insensitive" } } } },
        { booking: { reference: { contains: search, mode: "insensitive" } } },
      ];
    }

    // ✅ Compter le total des avis (pour la pagination)
    const totalCount = await prisma.review.count({ where });

    // ✅ Récupérer les avis avec pagination
    const reviews = await prisma.review.findMany({
      where,
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        target: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        booking: {
          select: {
            id: true,
            reference: true,
            checkIn: true,
            checkOut: true,
            listing: {
              select: {
                id: true,
                title: true,
                governorate: true,
                delegation: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // ✅ Formater les données (optionnel, l'interface l'attend déjà)
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      response: review.response,
      responseAt: review.responseAt,
      createdAt: review.createdAt,
      isPublished: review.isPublished,
      isFlagged: review.isFlagged,
      flagReason: review.flagReason,
      reviewer: {
        id: review.reviewer.id,
        firstName: review.reviewer.firstName,
        lastName: review.reviewer.lastName,
        profilePictureUrl: review.reviewer.profilePictureUrl,
      },
      target: review.target ? {
        id: review.target.id,
        firstName: review.target.firstName,
        lastName: review.target.lastName,
        profilePictureUrl: review.target.profilePictureUrl,
      } : null,
      booking: {
        id: review.booking.id,
        reference: review.booking.reference,
        checkIn: review.booking.checkIn,
        checkOut: review.booking.checkOut,
        listing: {
          id: review.booking.listing.id,
          title: review.booking.listing.title,
          governorate: review.booking.listing.governorate,
          delegation: review.booking.listing.delegation,
        },
      },
    }));

    // ✅ Retourner les données avec les infos de pagination
    return NextResponse.json({
      reviews: formattedReviews,
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des avis:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}