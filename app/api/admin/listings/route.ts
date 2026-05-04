// app/api/admin/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // 🔥 LOGIQUE DE FILTRAGE SELON LE TYPE (CORRIGÉE)
    let where: any = {};

    if (type === "pending") {
      // Uniquement les nouvelles annonces en attente
      where = {
        status: "PENDING_REVIEW",
        hasPendingRevision: false,
      };
    } else if (type === "revisions") {
      // Uniquement les modifications en attente
      where = {
        status: "ACTIVE",
        hasPendingRevision: true,
      };
    } else if (type === "history") {
      // Historique - annonces déjà validées ou rejetées
      where = {
        OR: [
          { status: "ACTIVE", hasPendingRevision: false },
          { status: "REJECTED" },
          { status: "ARCHIVED" },
          { status: "INACTIVE" },
        ],
      };
    } else if (type === "all") {
      // Toutes les annonces en attente de validation
      where = {
        OR: [
          { status: "PENDING_REVIEW", hasPendingRevision: false },
          { status: "ACTIVE", hasPendingRevision: true },
        ],
      };
    }

    // 🔥 RECHERCHE (CORRIGÉE)
    if (search && search.trim() !== "") {
      const searchCondition = {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          {
            owner: {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          },
        ],
      };

      // Fusionner avec le where existant
      if (Object.keys(where).length === 0) {
        where = searchCondition;
      } else {
        where = {
          AND: [where, searchCondition],
        };
      }
    }

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
              phoneNumber: true,
              isIdentityVerified: true,
              createdAt: true,
            },
          },
          photos: {
            orderBy: { position: "asc" },
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              isMain: true,
              position: true,
            },
          },
        },
        orderBy:
          type === "history" ? { updatedAt: "desc" } : { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      slug: listing.slug,
      description: listing.description,
      type: listing.type,
      status: listing.status,
      governorate: listing.governorate,
      delegation: listing.delegation,
      street: listing.street,
      neighborhood: listing.neighborhood,
      postalCode: listing.postalCode,
      latitude: listing.latitude,
      longitude: listing.longitude,
      rooms: listing.rooms,
      bathrooms: listing.bathrooms,
      numberOfKitchens: listing.numberOfKitchens,
      maxGuests: listing.maxGuests,
      surfaceArea: listing.surfaceArea,
      floorNumber: listing.floorNumber,
      hasElevator: listing.hasElevator,
      hasBalcony: listing.hasBalcony,
      hasGarden: listing.hasGarden,
      hasGarage: listing.hasGarage,
      isFurnished: listing.isFurnished,
      petsAllowed: listing.petsAllowed,
      smokingAllowed: listing.smokingAllowed,
      equipment: listing.equipment,
      services: listing.services,
      houseRules: listing.houseRules,
      customRules: listing.customRules,
      rentalType: listing.rentalType,
      pricePerNight: listing.pricePerNight,
      pricePerMonth: listing.pricePerMonth,
      securityDeposit: listing.securityDeposit,
      cleaningFee: listing.cleaningFee,
      weekendPriceMultiplier: listing.weekendPriceMultiplier,
      extraFees: listing.extraFees,
      seasonalRules: listing.seasonalRules,
      images: listing.photos.map((p) => p.url),
      photos: listing.photos.map((p) => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        isMain: p.isMain,
        position: p.position,
      })),
      viewCount: listing.viewCount,
      bookingCount: listing.bookingCount,
      totalRevenue: 0,
      hasPendingRevision: listing.hasPendingRevision || false,
      pendingRevision: listing.pendingRevision,
      rejectionReason: listing.rejectionReason,
      rejectionDetails: listing.rejectionDetails,
      rejectedAt: listing.rejectedAt,
      rejectedBy: listing.rejectedBy,
      publishedAt: listing.publishedAt,
      validatedAt: listing.validatedAt,
      validatedBy: listing.validatedBy,
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
      archivedAt: listing.archivedAt,
      owner: {
        id: listing.owner.id,
        firstName: listing.owner.firstName,
        lastName: listing.owner.lastName,
        email: listing.owner.email,
        phoneNumber: listing.owner.phoneNumber,
        profilePictureUrl: listing.owner.profilePictureUrl,
        isIdentityVerified: listing.owner.isIdentityVerified,
        createdAt: listing.owner.createdAt,
      },
    }));

    // Calcul des statistiques par statut
    const statusCounts = await prisma.listing.groupBy({
      by: ["status"],
      _count: true,
    });

    const stats = {
      total: await prisma.listing.count(),
      pending: statusCounts.find((s) => s.status === "PENDING_REVIEW")?._count || 0,
      revisions: await prisma.listing.count({
        where: { hasPendingRevision: true },
      }),
      active: statusCounts.find((s) => s.status === "ACTIVE")?._count || 0,
      rejected: statusCounts.find((s) => s.status === "REJECTED")?._count || 0,
      archived: statusCounts.find((s) => s.status === "ARCHIVED")?._count || 0,
    };

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats,
    });
  } catch (error) {
    console.error("Error fetching admin listings:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement des annonces" },
      { status: 500 },
    );
  }
}