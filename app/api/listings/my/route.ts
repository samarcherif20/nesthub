// app/api/listings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer les paramètres
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRooms = searchParams.get("minRooms");
    const governorate = searchParams.get("governorate");

    // Construction du WHERE
    let where: any = {
      ownerId: user.id,
    };

    // Mapper les statuts (selon l'enum ListingStatus)
    let statusFilter = null;
    switch (statusParam) {
      case "ALL":
        statusFilter = null;
        break;
      case "ACTIVE":
        statusFilter = "ACTIVE";
        break;
      case "INACTIVE":
        statusFilter = "INACTIVE";
        break;
      case "DRAFT":
        statusFilter = "DRAFT";
        break;
      case "ARCHIVED":
        statusFilter = "ARCHIVED";
        break;
      case "PENDING":
      case "PENDING_REVIEW":
        statusFilter = "PENDING_REVIEW";
        break;
      case "REJECTED":
        statusFilter = "REJECTED";
        break;
      default:
        statusFilter = null;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    // Filtre par recherche
    if (search && search !== "") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtre par prix (pricePerNight ou pricePerMonth)
    if (minPrice || maxPrice) {
      where.AND = [];
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : 999999;

      where.AND.push({
        OR: [
          { pricePerNight: { gte: min, lte: max } },
          { pricePerMonth: { gte: min, lte: max } },
        ],
      });
    }

    // Filtre par nombre de pièces
    if (minRooms && minRooms !== "") {
      where.rooms = { gte: parseInt(minRooms) };
    }

    // Filtre par gouvernorat
    if (governorate && governorate !== "") {
      where.governorate = governorate;
    }

    const skip = (page - 1) * pageSize;

    // Récupérer les annonces avec TOUTES les données
    const [listings, totalCount, priceRangeResult] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          governorate: true,
          delegation: true,
          status: true,
          viewCount: true,
          favoriteCount: true,
          pricePerNight: true,
          pricePerMonth: true,
          rooms: true,
          createdAt: true,
          publishedAt: true,
          photos: {
            where: { isMain: true },
            take: 1,
            select: { url: true, isMain: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
      prisma.listing.aggregate({
        where: { ownerId: user.id },
        _min: { pricePerNight: true, pricePerMonth: true },
        _max: { pricePerNight: true, pricePerMonth: true },
      }),
    ]);

    // Récupérer les réservations pour chaque annonce (en une seule requête)
    const listingIds = listings.map((l) => l.id);
    const bookings = await prisma.booking.findMany({
      where: { listingId: { in: listingIds } },
      select: {
        listingId: true,
        status: true,
        totalWithFees: true,
      },
    });

    // Grouper les réservations par annonce
    const bookingsByListing = new Map();
    for (const booking of bookings) {
      if (!bookingsByListing.has(booking.listingId)) {
        bookingsByListing.set(booking.listingId, {
          total: 0,
          count: 0,
          revenue: 0,
        });
      }
      const stats = bookingsByListing.get(booking.listingId);
      stats.count++;
      if (booking.status === "COMPLETED" || booking.status === "CONFIRMED") {
        stats.revenue += booking.totalWithFees;
      }
    }

    // Construire la réponse avec les données enrichies
    const listingsWithStats = listings.map((listing) => {
      const bookingStats = bookingsByListing.get(listing.id) || {
        count: 0,
        revenue: 0,
      };
      return {
        ...listing,
        bookingCount: bookingStats.count,
        totalRevenue: bookingStats.revenue,
      };
    });

    // Calculer la plage de prix
    const minNight = priceRangeResult._min.pricePerNight || 0;
    const minMonth = priceRangeResult._min.pricePerMonth || 0;
    const maxNight = priceRangeResult._max.pricePerNight || 0;
    const maxMonth = priceRangeResult._max.pricePerMonth || 0;
    const minPriceAll = Math.min(minNight, minMonth);
    const maxPriceAll = Math.max(maxNight, maxMonth);

    console.log(
      `📊 ${listings.length} annonces trouvées pour l'utilisateur ${user.id}`,
    );

    return NextResponse.json({
      listings: listingsWithStats,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      priceRange: {
        min: minPriceAll,
        max: maxPriceAll,
      },
    });
  } catch (error) {
    console.error("[GET /api/listings/my] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
