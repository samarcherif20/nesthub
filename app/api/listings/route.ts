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
  if (!data.surfaceArea || data.surfaceArea <= 0)
    errors.push("La surface est requise");
  if (data.floorNumber === null || data.floorNumber === undefined)
    errors.push("Le numéro d'étage est requis");
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

function filterValidPhotos(photos: any[]): any[] {
  if (!photos || !Array.isArray(photos)) return [];
  return photos.filter(
    (photo) =>
      photo?.url && !photo.url.startsWith("blob:") && photo.url.trim() !== "",
  );
}

// 🔥 FONCTION POUR ENVOYER UNE NOTIFICATION AU PROPRIÉTAIRE
async function sendNotificationToOwner(
  ownerId: string,
  title: string,
  content: string,
  type: string,
  listingId: string,
  listingTitle: string,
) {
  try {
    const owner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!owner) {
      console.log(`❌ Propriétaire non trouvé: ${ownerId}`);
      return;
    }

    const notification = await prisma.notification.create({
      data: {
        userId: ownerId,
        type: type as any,
        title: title,
        content: content,
        channels: ["IN_APP", "EMAIL"],
        data: {
          listingId,
          listingTitle,
          actionBy: "admin",
          actionAt: new Date().toISOString(),
        },
      },
    });

    console.log(
      `📧 [NOTIFICATION] Envoyée au propriétaire ${owner.email || ownerId}:`,
    );
    console.log(`   - Titre: ${title}`);
    console.log(`   - Type: ${type}`);

    return notification;
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de la notification:", error);
  }
}

// GET - Récupérer les annonces (CORRIGÉ POUR ADMIN)
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

    // 🔥 VÉRIFIER SI L'UTILISATEUR EST ADMIN
    let isAdmin = false;
    let userDb = null;

    if (clerkId) {
      userDb = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true, role: true },
      });
      isAdmin = userDb?.role === "ADMIN";
    }

    console.log(
      `🔐 [API] User: ${clerkId || "visitor"}, isAdmin: ${isAdmin}, role: ${userDb?.role}`,
    );

    let where: any = {};

    if (isMyListings && clerkId) {
      // Mode "mes annonces"
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
          where: { userId: permissions.userId, isActive: true },
          select: { listingId: true },
        });
        const listingIds = teamMemberships.map((tm) => tm.listingId);
        where.id = { in: listingIds };
      }

      if (status && status !== "ALL") {
        where.status = status;
      }
    } else {
      // 🔥 MODE PUBLIC - ADMIN voit TOUT, les autres voient seulement ACTIVE
      if (isAdmin) {
        // ADMIN : Ne pas filtrer par statut, voir TOUTES les annonces
        console.log("👑 ADMIN - Accès à toutes les annonces (tous statuts)");
        // Ne pas ajouter where.status
      } else {
        // Non-admin : seulement les annonces ACTIVE
        console.log("👤 VISITEUR - Accès uniquement aux annonces ACTIVE");
        where.status = "ACTIVE";
      }
    }

    // Appliquer les filtres supplémentaires
    if (type && type !== "ALL") {
      where.type = type;
    }
    if (governorate) {
      where.governorate = governorate;
    }
    if (minRooms) {
      where.rooms = { gte: minRooms };
    }

    // Filtre par prix
    if (minPrice !== undefined || maxPrice !== undefined) {
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

    // Recherche
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
          photos: { where: { isMain: true }, take: 1 },
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

    console.log(`📊 [API] Total annonces trouvées: ${totalCount}`);
    console.log(`📊 Statuts trouvés:`, [
      ...new Set(listings.map((l) => l.status)),
    ]);

    // Calcul des prix min/max pour les filtres
    const priceStats = await prisma.listing.aggregate({
      where: isAdmin ? {} : { status: "ACTIVE" },
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
      priceRange: { min: minPriceGlobal, max: maxPriceGlobal },
    });
  } catch (error) {
    console.error("[GET /api/listings] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une annonce
export async function POST(request: NextRequest) {
  try {
    console.log("🔵 POST /api/listings - Début");

    const { userId: clerkId } = getAuth(request);
    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const permissions = await getUserPermissions(clerkId);
    if (!permissions) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    if (permissions.role !== "OWNER") {
      return NextResponse.json(
        { error: "Permission refusée" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validationErrors = validateListingData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: "Données invalides", details: validationErrors.join(", ") },
        { status: 400 },
      );
    }

    const slug = `${body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const owner = await prisma.user.findUnique({
      where: { id: permissions.userId },
      select: { firstName: true, lastName: true, email: true },
    });

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
        owner: { connect: { id: permissions.userId } },
        status: "PENDING_REVIEW",
        publishedAt: null,
      },
    });

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

    // Notifier les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, firstName: true, lastName: true },
    });
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "LISTING_PENDING_REVIEW",
          title: "Nouvelle annonce à valider",
          content: `${listing.title} par ${owner?.firstName || "Un propriétaire"} ${owner?.lastName || ""} est en attente de validation.`,
          channels: ["IN_APP", "EMAIL"],
          data: {
            listingId: listing.id,
            listingTitle: listing.title,
            ownerName: `${owner?.firstName || ""} ${owner?.lastName || ""}`,
            ownerEmail: owner?.email,
          },
        })),
      });
    }

    return NextResponse.json(
      { success: true, id: listing.id, slug: listing.slug, listing },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[POST /api/listings] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 },
    );
  }
}

// PUT - Mettre à jour complète
export async function PUT(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!clerkId || !id)
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed)
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });

    const body = await request.json();
    const existingListing = await prisma.listing.findFirst({ where: { id } });
    if (!existingListing)
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );

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
        await prisma.listingMedia.deleteMany({ where: { listingId: id } });
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

// PATCH - Mise à jour partielle (AVEC NOTIFICATIONS AU PROPRIÉTAIRE)
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

    if (!clerkId || !id) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    // 🔥 RÉCUPÉRER L'ADMIN
    const adminUser = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    const isAdmin = adminUser?.role === "ADMIN";

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed) {
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });
    }

    const body = await request.json();
    const { status, action, ...updateFields } = body;

    const existingListing = await prisma.listing.findFirst({
      where: { id },
      include: {
        owner: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    let result;
    let updateData: any = { updatedAt: new Date() };
    let notificationSent = false;
    let notificationTitle = "";
    let notificationContent = "";
    let notificationType = "";

    // 🔥 CAS 1: Changement de statut par ADMIN
    if (status !== undefined && isAdmin) {
      const oldStatus = existingListing.status;
      const newStatus = status;

      console.log(
        `📝 [PATCH] ADMIN change le statut: ${oldStatus} -> ${newStatus}`,
      );

      updateData.status = status;
      result = await prisma.listing.update({ where: { id }, data: updateData });

      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: "STATUS_CHANGE_BY_ADMIN",
          oldValue: { status: oldStatus },
          newValue: { status: newStatus },
          changedBy: adminUser?.id || "",
        },
      });

      // 🔥 DÉTERMINER LA NOTIFICATION
      if (oldStatus === "PENDING_REVIEW" && newStatus === "ACTIVE") {
        notificationTitle = "✅ Annonce validée";
        notificationContent = `Votre annonce "${existingListing.title}" a été validée par l'administrateur et est maintenant en ligne.`;
        notificationType = "LISTING_ACTIVATED";
        notificationSent = true;
      } else if (oldStatus === "PENDING_REVIEW" && newStatus === "REJECTED") {
        notificationTitle = "❌ Annonce rejetée";
        notificationContent = `Votre annonce "${existingListing.title}" a été rejetée par l'administrateur. Veuillez la modifier et la soumettre à nouveau.`;
        notificationType = "LISTING_REJECTED";
        notificationSent = true;
      } else if (newStatus === "ACTIVE" && oldStatus !== "ACTIVE") {
        notificationTitle = "✅ Annonce activée";
        notificationContent = `Votre annonce "${existingListing.title}" a été activée par l'administrateur.`;
        notificationType = "LISTING_ACTIVATED";
        notificationSent = true;
      } else if (newStatus === "INACTIVE") {
        notificationTitle = "⛔ Annonce désactivée";
        notificationContent = `Votre annonce "${existingListing.title}" a été désactivée par l'administrateur.`;
        notificationType = "LISTING_SUSPENDED";
        notificationSent = true;
      } else if (newStatus === "ARCHIVED") {
        notificationTitle = "📦 Annonce archivée";
        notificationContent = `Votre annonce "${existingListing.title}" a été archivée par l'administrateur.`;
        notificationType = "SYSTEM_ALERT";
        notificationSent = true;
      }

      console.log(`✅ Statut changé par ADMIN: ${oldStatus} -> ${newStatus}`);
    }
    // CAS 2: Changement de statut par non-admin (refusé)
    else if (status !== undefined && !isAdmin) {
      return NextResponse.json(
        { error: "Seul un administrateur peut changer le statut" },
        { status: 403 },
      );
    }
    // CAS 3: Mise à jour partielle des données
    else if (Object.keys(updateFields).length > 0) {
      for (const [key, value] of Object.entries(updateFields)) {
        if (value !== null && value !== undefined) {
          updateData[key] = value;
        }
      }
      result = await prisma.listing.update({ where: { id }, data: updateData });
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: "PARTIAL_UPDATE",
          fieldName: "listing",
          oldValue: JSON.stringify({ title: existingListing.title }),
          newValue: JSON.stringify({
            title: updateFields.title || existingListing.title,
          }),
          changedBy: accessCheck.userPermissions?.userId || "",
        },
      });
    }
    // CAS 4: Action RESTORE
    else if (action === "RESTORE") {
      result = await prisma.listing.update({
        where: { id },
        data: { status: "INACTIVE", archivedAt: null, updatedAt: new Date() },
      });
    } else {
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 },
      );
    }

    // 🔥 ENVOYER LA NOTIFICATION AU PROPRIÉTAIRE SI NÉCESSAIRE
    if (notificationSent && existingListing.ownerId) {
      await sendNotificationToOwner(
        existingListing.ownerId,
        notificationTitle,
        notificationContent,
        notificationType,
        id,
        existingListing.title,
      );
    }

    // Gestion des photos si présentes
    if (body.photos && body.photos.length > 0) {
      const validPhotos = filterValidPhotos(body.photos);
      if (validPhotos.length > 0) {
        await prisma.listingMedia.deleteMany({ where: { listingId: id } });
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
      }
    }

    return NextResponse.json(result);
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

    if (!clerkId || !id)
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );

    const accessCheck = await checkListingAccess(clerkId, id, "edit");
    if (!accessCheck.allowed)
      return NextResponse.json({ error: accessCheck.error }, { status: 403 });

    if (permanent) {
      await prisma.listing.delete({ where: { id } });
      return NextResponse.json({ message: "Annonce supprimée définitivement" });
    } else {
      const listing = await prisma.listing.update({
        where: { id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });

      // 🔥 NOTIFIER LE PROPRIÉTAIRE QUE SON ANNONCE EST ARCHIVÉE
      if (listing.ownerId) {
        await sendNotificationToOwner(
          listing.ownerId,
          "📦 Annonce archivée",
          `Votre annonce "${listing.title}" a été archivée par l'administrateur.`,
          "SYSTEM_ALERT",
          id,
          listing.title,
        );
      }

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
