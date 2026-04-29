// app/api/admin/listings/route.ts - VERSION CORRIGÉE
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
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const type = searchParams.get("type") || "all";
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    // 🔥 CORRECTION : Logique de base pour les statuts
    let statusFilter: any = [];
    
    if (type === "pending") {
      // Uniquement les nouvelles annonces PENDING_REVIEW
      statusFilter = [{ status: "PENDING_REVIEW", hasPendingRevision: false }];
    } else if (type === "revisions") {
      // Uniquement les modifications en attente (ACTIVE + hasPendingRevision)
      statusFilter = [{ status: "ACTIVE", hasPendingRevision: true }];
    } else {
      // Toutes les annonces en attente de validation
      statusFilter = [
        { status: "PENDING_REVIEW" },
        { status: "ACTIVE", hasPendingRevision: true },
      ];
    }

    const where: any = {
      OR: statusFilter,
    };

    // 🔥 CORRECTION : Logique de recherche améliorée
    if (search && search.trim() !== "") {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { 
              owner: {
                OR: [
                  { firstName: { contains: search, mode: "insensitive" } },
                  { lastName: { contains: search, mode: "insensitive" } },
                  { email: { contains: search, mode: "insensitive" } },
                ]
              }
            },
          ],
        },
      ];
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
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.listing.count({ where }),
    ]);

    const formattedListings = listings.map((listing) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      type: listing.type,
      status: listing.status,
      governorate: listing.governorate,
      delegation: listing.delegation,
      street: listing.street,
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
      images: listing.photos.map((p) => p.url), // 🔥 Ajout pour la compatibilité
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
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    }));

    return NextResponse.json({
      listings: formattedListings,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin listings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}