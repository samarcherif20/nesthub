// app/api/listings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getUserPermissions, checkListingAccess } from "@/lib/auth/permissions";

// Fonction de validation des données
function validateListingData(data: any): string[] {
  const errors: string[] = [];

  if (!data.title?.trim()) errors.push("Le titre est requis");
  if (data.title?.length < 5)
    errors.push("Le titre doit contenir au moins 5 caractères");
  if (!data.description?.trim()) errors.push("La description est requise");
  if (data.description?.length < 20)
    errors.push("La description doit contenir au moins 20 caractères");
  if (!data.governorate) errors.push("Le gouvernorat est requis");
  if (!data.delegation?.trim()) errors.push("La délégation est requise");
  if (!data.street?.trim()) errors.push("La rue est requise");
  if (!data.latitude || !data.longitude)
    errors.push("La localisation est requise");
  if (data.rooms < 1) errors.push("Au moins 1 chambre est requise");
  if (data.bathrooms < 1) errors.push("Au moins 1 salle de bain est requise");
  if (data.numberOfKitchens < 1) errors.push("Au moins 1 cuisine est requise");

  // ✅ surfaceArea obligatoire
  if (!data.surfaceArea || data.surfaceArea <= 0)
    errors.push("La surface est requise");

  // ✅ floorNumber obligatoire
  if (data.floorNumber === null || data.floorNumber === undefined)
    errors.push("Le numéro d'étage est requis");

  // ✅ maxGuests optionnel (pas de validation)

  if (data.photos?.length === 0) errors.push("Au moins une photo est requise");

  if (data.rentalType === "SHORT_TERM" || data.rentalType === "BOTH") {
    if (!data.pricePerNight || data.pricePerNight <= 0) {
      errors.push(
        "Le prix par nuit est requis pour les locations courtes durées",
      );
    }
  }

  if (data.rentalType === "LONG_TERM" || data.rentalType === "BOTH") {
    if (!data.pricePerMonth || data.pricePerMonth <= 0) {
      errors.push(
        "Le prix par mois est requis pour les locations longues durées",
      );
    }
  }

  return errors;
}

// Fonction pour filtrer les photos valides
function filterValidPhotos(photos: any[]): any[] {
  if (!photos || !Array.isArray(photos)) return [];
  return photos.filter(
    (photo) =>
      photo?.url && !photo.url.startsWith("blob:") && photo.url.trim() !== "",
  );
}

// GET - Récupérer les annonces
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);

    const isMyListings = searchParams.get("my") === "true";
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type");

    const minPrice = searchParams.get("minPrice")
      ? parseFloat(searchParams.get("minPrice")!)
      : undefined;
    const maxPrice = searchParams.get("maxPrice")
      ? parseFloat(searchParams.get("maxPrice")!)
      : undefined;
    const minRooms = searchParams.get("minRooms")
      ? parseInt(searchParams.get("minRooms")!)
      : undefined;
    const governorate = searchParams.get("governorate") || undefined;

    let where: any = {};

    if (isMyListings && clerkId) {
      const permissions = await getUserPermissions(clerkId);

      if (!permissions) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 },
        );
      }

      if (permissions.role === "OWNER") {
        where.ownerId = permissions.userId;
      } else if (permissions.role === "CO_HOST") {
        const teamMemberships = await prisma.teamMember.findMany({
          where: {
            userId: permissions.userId,
            isActive: true,
          },
          select: { listingId: true },
        });
        const listingIds = teamMemberships.map((tm) => tm.listingId);
        where.id = { in: listingIds };
      }

      if (status && status !== "ALL") {
        where.status = status;
      }
    } else {
      where.status = "ACTIVE";
    }

    if (type) {
      where.type = type;
    }

    if (governorate) where.governorate = governorate;
    if (minRooms) where.rooms = { gte: minRooms };

    if (
      (minPrice !== undefined || maxPrice !== undefined) &&
      (minPrice !== undefined || maxPrice !== undefined)
    ) {
      const min = minPrice !== undefined ? minPrice : 0;
      const max = maxPrice !== undefined ? maxPrice : 999999;

      where.AND = [
        {
          OR: [
            { pricePerNight: { not: null } },
            { pricePerMonth: { not: null } },
          ],
        },
        {
          OR: [
            { pricePerNight: { gte: min, lte: max } },
            { pricePerMonth: { gte: min, lte: max } },
          ],
        },
      ];
    }

    if (search) {
      const searchOr = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
      if (where.AND) {
        where.AND.push({ OR: searchOr });
      } else {
        where.OR = searchOr;
      }
    }

    const skip = (page - 1) * pageSize;

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          photos: {
            where: { isMain: true },
            take: 1,
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    const priceStats = await prisma.listing.aggregate({
      where:
        isMyListings && clerkId
          ? { ownerId: where.ownerId }
          : { status: "ACTIVE" },
      _min: { pricePerNight: true, pricePerMonth: true },
      _max: { pricePerNight: true, pricePerMonth: true },
    });

    const minPriceGlobal = Math.min(
      priceStats._min.pricePerNight || 0,
      priceStats._min.pricePerMonth || 0,
    );
    const maxPriceGlobal = Math.max(
      priceStats._max.pricePerNight || 10000,
      priceStats._max.pricePerMonth || 10000,
    );

    return NextResponse.json({
      listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      priceRange: {
        min: minPriceGlobal,
        max: maxPriceGlobal,
      },
    });
  } catch (error) {
    console.error("[GET /api/listings] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une annonce (CORRIGÉ)
export async function POST(request: NextRequest) {
  try {
    console.log("🔵 POST /api/listings - Début");

    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      console.log("❌ Non authentifié");
      return NextResponse.json(
        { error: "Non authentifié", details: "Veuillez vous connecter" },
        { status: 401 },
      );
    }

    console.log(`✅ Utilisateur authentifié: ${clerkId}`);

    const permissions = await getUserPermissions(clerkId);

    if (!permissions) {
      console.log("❌ Utilisateur non trouvé");
      return NextResponse.json(
        {
          error: "Utilisateur non trouvé",
          details: "Compte utilisateur introuvable",
        },
        { status: 404 },
      );
    }

    console.log(
      `✅ Utilisateur trouvé: ${permissions.userId}, role: ${permissions.role}`,
    );

    if (permissions.role !== "OWNER") {
      console.log(`❌ Permission refusée: role=${permissions.role}`);
      return NextResponse.json(
        {
          error: "Permission refusée",
          details: "Vous devez être propriétaire pour créer une annonce",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log("📦 Données reçues:", {
      ...body,
      photos: `${body.photos?.length} photos`,
    });

    const validationErrors = validateListingData(body);
    if (validationErrors.length > 0) {
      console.log("❌ Validation échouée:", validationErrors);
      return NextResponse.json(
        { error: "Données invalides", details: validationErrors.join(", ") },
        { status: 400 },
      );
    }

    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;

    // ✅ CORRECTION : Utiliser connect pour lier l'owner
    const listing = await prisma.listing.create({
      data: {
        title: body.title,
        type: body.type,
        governorate: body.governorate,
        delegation: body.delegation,
        street: body.street,
        latitude: body.latitude,
        longitude: body.longitude,
        description: body.description,
        rooms: body.rooms,
        bathrooms: body.bathrooms,
        numberOfKitchens: body.numberOfKitchens || 1,
        maxGuests: body.maxGuests === null ? null : body.maxGuests,
        surfaceArea: body.surfaceArea,
        floorNumber: body.floorNumber,
        hasElevator: body.hasElevator || false,
        hasBalcony: body.hasBalcony || false,
        hasGarden: body.hasGarden || false,
        hasGarage: body.hasGarage || false,
        isFurnished: body.isFurnished || false,
        petsAllowed: body.petsAllowed || false,
        smokingAllowed: body.smokingAllowed || false,
        equipment: body.equipment || {},
        houseRules: body.houseRules || {},
        customRules: body.customRules || "",
        rentalType: body.rentalType,
        pricePerNight: body.pricePerNight,
        pricePerMonth: body.pricePerMonth,
        securityDeposit: body.securityDeposit,
        cleaningFee: body.cleaningFee || 0,
        weekendPriceMultiplier: body.weekendPriceMultiplier || 1.15,
        extraFees: body.extraFees ? JSON.stringify(body.extraFees) : "[]",
        seasonalRules: body.seasonalRules
          ? JSON.stringify(body.seasonalRules)
          : "[]",
        services: body.services ? JSON.stringify(body.services) : "{}",
        slug,
        owner: {
          connect: { id: permissions.userId },
        },
        status: "PENDING_REVIEW",
        publishedAt: body.status === "ACTIVE" ? new Date() : null,
      },
    });

    console.log(`✅ Annonce créée avec ID: ${listing.id}`);

    const validPhotos = filterValidPhotos(body.photos);
    if (validPhotos.length > 0) {
      await prisma.listingMedia.createMany({
        data: validPhotos.map((photo: any, index: number) => ({
          listingId: listing.id,
          url: photo.url,
          thumbnailUrl: photo.thumbnailUrl || photo.url,
          isMain: photo.isMain || index === 0,
          position: index,
          type: "IMAGE",
        })),
      });
      console.log(`✅ ${validPhotos.length} photos ajoutées à listingMedia`);
    }

    await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        actionType: "CREATE",
        fieldName: "listing",
        oldValue: null,
        newValue: JSON.stringify({ title: body.title, type: body.type }),
        changedBy: permissions.userId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        id: listing.id,
        slug: listing.slug,
        message: "Annonce créée avec succès",
        listing,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[POST /api/listings] Erreur détaillée:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Conflit", details: "Une annonce similaire existe déjà" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error.message || "Une erreur est survenue lors de la création",
      },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour une annonce
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!clerkId || !id) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });
    }

    const body = await request.json();

    const existingListing = await prisma.listing.findFirst({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        title: body.title,
        type: body.type,
        governorate: body.governorate,
        delegation: body.delegation,
        street: body.street,
        latitude: body.latitude,
        longitude: body.longitude,
        description: body.description,
        rooms: body.rooms,
        bathrooms: body.bathrooms,
        numberOfKitchens: body.numberOfKitchens || 1,
        maxGuests: body.maxGuests === null ? null : body.maxGuests,
        surfaceArea: body.surfaceArea,
        floorNumber: body.floorNumber,
        hasElevator: body.hasElevator || false,
        hasBalcony: body.hasBalcony || false,
        hasGarden: body.hasGarden || false,
        hasGarage: body.hasGarage || false,
        isFurnished: body.isFurnished || false,
        petsAllowed: body.petsAllowed || false,
        smokingAllowed: body.smokingAllowed || false,
        equipment: body.equipment || {},
        houseRules: body.houseRules || {},
        customRules: body.customRules || "",
        rentalType: body.rentalType,
        pricePerNight: body.pricePerNight,
        pricePerMonth: body.pricePerMonth,
        securityDeposit: body.securityDeposit,
        cleaningFee: body.cleaningFee || 0,
        weekendPriceMultiplier: body.weekendPriceMultiplier || 1.15,
        extraFees: body.extraFees ? JSON.stringify(body.extraFees) : "[]",
        seasonalRules: body.seasonalRules
          ? JSON.stringify(body.seasonalRules)
          : "[]",
        services: body.services ? JSON.stringify(body.services) : "{}",
        status: body.status,
        updatedAt: new Date(),
      },
    });

    if (body.photos && body.photos.length > 0) {
      const validPhotos = filterValidPhotos(body.photos);

      if (validPhotos.length > 0) {
        await prisma.listingMedia.deleteMany({
          where: { listingId: id },
        });

        await prisma.listingMedia.createMany({
          data: validPhotos.map((photo: any, index: number) => ({
            listingId: id,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl || photo.url,
            isMain: photo.isMain || index === 0,
            position: index,
            type: "IMAGE",
          })),
        });
        console.log(`✅ ${validPhotos.length} photos mises à jour`);
      }
    }

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: "UPDATE",
        fieldName: "listing",
        oldValue: JSON.stringify({ title: existingListing.title }),
        newValue: JSON.stringify({ title: body.title }),
        changedBy: accessCheck.userPermissions?.userId || "",
      },
    });

    return NextResponse.json({
      success: true,
      id: listing.id,
      slug: listing.slug,
      listing,
    });
  } catch (error) {
    console.error("[PUT /api/listings] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Changer le statut
export async function PATCH(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const url = new URL(request.url);

    const pathParts = url.pathname.split("/");
    const idFromPath = pathParts[pathParts.length - 1];
    const idFromQuery = url.searchParams.get("id");
    const id =
      idFromPath !== "listings" && idFromPath !== "my"
        ? idFromPath
        : idFromQuery;

    console.log(`🔧 PATCH - id: ${id}`);

    if (!clerkId || !id) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    const existingListing = await prisma.listing.findFirst({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: "STATUS_CHANGE",
        fieldName: "status",
        oldValue: existingListing.status,
        newValue: status,
        changedBy: accessCheck.userPermissions?.userId || "",
      },
    });

    return NextResponse.json(listing);
  } catch (error) {
    console.error("[PATCH /api/listings] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer ou archiver
export async function DELETE(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    const cancelBookings = searchParams.get("cancelBookings") === "true";

    if (!clerkId || !id) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });
    }

    if (permanent) {
      await prisma.listing.delete({ where: { id } });
      return NextResponse.json({ message: "Annonce supprimée définitivement" });
    } else {
      const listing = await prisma.listing.update({
        where: { id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });

      if (cancelBookings) {
        await prisma.booking.updateMany({
          where: {
            listingId: id,
            status: { in: ["PENDING", "ACCEPTED", "CONFIRMED"] },
          },
          data: {
            status: "CANCELLED",
            cancellationReason: "Annonce supprimée par le propriétaire",
          },
        });
      }

      return NextResponse.json({ message: "Annonce archivée", listing });
    }
  } catch (error) {
    console.error("[DELETE /api/listings] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
