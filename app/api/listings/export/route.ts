import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur depuis ta DB
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { filters, dateFilter } = body;

    // Construire les filtres
    const where: any = {
      ownerId: user.id,
    };

    // Filtre par statut
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }

    // Filtre par recherche
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    // Filtre par gouvernorat
    if (filters?.governorate) {
      where.governorate = filters.governorate;
    }

    // Filtre par prix
    if (filters?.minPrice) {
      where.OR = [
        { pricePerNight: { gte: filters.minPrice } },
        { pricePerMonth: { gte: filters.minPrice } },
      ];
    }
    if (filters?.maxPrice) {
      where.OR = [
        { pricePerNight: { lte: filters.maxPrice } },
        { pricePerMonth: { lte: filters.maxPrice } },
      ];
    }

    // Filtre par nombre de chambres
    if (filters?.minRooms) {
      where.bedrooms = { gte: filters.minRooms };
    }

    // Filtre par date de création
    if (dateFilter && dateFilter !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (dateFilter) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = new Date(0);
      }
      where.createdAt = { gte: startDate };
    }

    // Récupérer les annonces
    const listings = await prisma.listing.findMany({
      where,
      include: {
        photos: {
          take: 1,
          where: { isMain: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformer en CSV
    const headers = [
      "ID",
      "Titre",
      "Type",
      "Gouvernorat",
      "Statut",
      "Prix (TND)",
      "Type de prix",
      "Chambres",
      "Vues",
      "Réservations",
      "Favoris",
      "Date de création",
      "Dernière modification",
    ];

    const csvRows = [
      headers.join(","),
      ...listings.map((listing) => {
        const price = listing.pricePerNight ?? listing.pricePerMonth ?? 0;
        const priceType = listing.pricePerNight ? "nuit" : "mois";
        
        return [
          `"${listing.id.slice(-8)}"`,
          `"${(listing.title || "").replace(/"/g, '""')}"`,
          `"${listing.type || ""}"`,
          `"${listing.governorate || ""}"`,
          `"${listing.status || ""}"`,
          price,
          `"${priceType}"`,
          listing.bedrooms || 0,
          listing.viewCount || 0,
          listing.bookingCount || 0,
          listing.favoriteCount || 0,
          new Date(listing.createdAt).toLocaleDateString("fr-FR"),
          new Date(listing.updatedAt).toLocaleDateString("fr-FR"),
        ].join(",");
      }),
    ];

    const csv = csvRows.join("\n");
    const date = new Date().toISOString().split("T")[0];
    const filename = `annonces_${date}_${listings.length}_annonces.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'export" },
      { status: 500 }
    );
  }
}