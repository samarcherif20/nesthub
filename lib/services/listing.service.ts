// lib/services/listing.service.ts - VERSION COMPLÈTE CORRIGÉE

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  CreateListingInput,
  UpdateListingInput,
} from "@/lib/validations/listing";

//  FONCTION POUR FORMATER LES VALEURS EN TEXTE LISIBLE POUR L'HISTORIQUE
function formatValueForHistory(value: any, fieldName: string): string {
  if (value === null || value === undefined) return "";
  
  // Pour le statut
  if (fieldName === "status") {
    const statusMap: Record<string, string> = {
      "ACTIVE": "Publiée",
      "INACTIVE": "Masquée",
      "DRAFT": "Brouillon",
      "ARCHIVED": "Archivée"
    };
    return statusMap[value] || value;
  }
  
  // Pour le type de location
  if (fieldName === "rentalType") {
    const rentalMap: Record<string, string> = {
      "SHORT_TERM": "Court terme",
      "LONG_TERM": "Long terme",
      "BOTH": "Les deux"
    };
    return rentalMap[value] || value;
  }
  
  // Pour l'ascenseur
  if (fieldName === "hasElevator") {
    return value ? "Oui" : "Non";
  }
  
  // Pour les prix
  if (fieldName === "pricePerNight" || fieldName === "pricePerMonth" || 
      fieldName === "securityDeposit" || fieldName === "cleaningFee") {
    return value ? `${value} TND` : "0 TND";
  }
  
  // Pour les équipements - transformer en texte lisible
  if (fieldName === "equipment" && typeof value === "object") {
    const equipmentMap: Record<string, string> = {
      "wifi": "Wi-Fi",
      "ac": "Climatisation",
      "heating": "Chauffage",
      "kitchen": "Cuisine équipée",
      "parking": "Parking",
      "pool": "Piscine",
      "gym": "Salle de sport",
      "washer": "Lave-linge",
      "tv": "Télévision",
      "balcony": "Balcon",
      "dishwasher": "Lave-vaisselle",
      "dryer": "Sèche-linge"
    };
    
    const activeEquipment = Object.entries(value)
      .filter(([, v]) => v === true)
      .map(([k]) => equipmentMap[k] || k);
    
    return activeEquipment.length > 0 ? activeEquipment.join(", ") : "Aucun équipement";
  }
  
  // Pour les nombres
  if (typeof value === "number") {
    return value.toString();
  }
  
  // Pour les strings simples
  if (typeof value === "string") {
    return value;
  }
  
  // Pour les objets (fallback)
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  
  return String(value);
}

export class ListingService {
  static async generateUniqueSlug(
    title: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    let slug = baseSlug;
    let counter = 1;

    while (
      await prisma.listing.findFirst({
        where: { slug, id: { not: excludeId } },
      })
    ) {
      slug = `${baseSlug}-${counter++}`;
    }

    return slug;
  }

  static async createListing(ownerId: string, data: CreateListingInput) {
    const slug = await this.generateUniqueSlug(data.title);

    const photosToCreate = (data.photos || [])
      .filter(
        (photo) =>
          photo?.url &&
          !photo.url.startsWith("blob:") &&
          photo.url.trim() !== "",
      )
      .map((photo, index) => ({
        url: photo.url,
        thumbnailUrl: photo.thumbnailUrl || photo.url,
        type: "IMAGE" as const,
        position: index,
        isMain: photo.isMain || index === 0,
      }));

    const listing = await prisma.listing.create({
      data: {
        title: data.title,
        slug,
        description: data.description || "",
        type: data.type,
        status: data.status || "DRAFT",
        governorate: data.governorate,
        delegation: data.delegation,
        street: data.street || "",
        neighborhood: data.neighborhood || "",
        postalCode: data.postalCode || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        rooms: data.rooms || 1,
        bathrooms: data.bathrooms || 1,
        maxGuests: data.maxGuests || 2,
        surfaceArea: data.surfaceArea || null,
        floorNumber: data.floorNumber || null,
        hasElevator: data.hasElevator || false,
        rentalType: data.rentalType || "SHORT_TERM",
        pricePerNight: data.pricePerNight || null,
        pricePerMonth: data.pricePerMonth || null,
        securityDeposit: data.securityDeposit || null,
        cleaningFee: data.cleaningFee || 0,
        weekendPriceMultiplier: data.weekendPriceMultiplier || 1.15,
        extraFees: data.extraFees ? JSON.stringify(data.extraFees) : "[]",
        seasonalRules: data.seasonalRules
          ? JSON.stringify(data.seasonalRules)
          : "[]",
        services: data.services ? JSON.stringify(data.services) : "{}",
        equipment: data.equipment || {},
        houseRules: data.houseRules || {},
        customRules: data.customRules || "",
        ownerId,
        publishedAt: data.status === "ACTIVE" ? new Date() : null,
        photos:
          photosToCreate.length > 0 ? { create: photosToCreate } : undefined,
      },
      include: { photos: true },
    });

    // ✅ Historique de création avec format lisible
    await prisma.listingHistory.create({
      data: {
        listingId: listing.id,
        actionType: "CREATE",
        fieldName: "listing",
        oldValue: null,
        newValue: `Création de l'annonce "${data.title}"`,
        changedBy: ownerId,
      },
    });

    return listing;
  }

  static async getListingById(id: string, incrementViews: boolean = true) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
            createdAt: true,
            stats: { select: { averageRating: true, totalReviews: true } },
          },
        },
        photos: { orderBy: { position: "asc" } },
        availability: {
          where: { date: { gte: new Date() } },
          take: 90,
          orderBy: { date: "asc" },
        },
      },
    });

    if (!listing) return null;

    const parsedListing = {
      ...listing,
      extraFees: listing.extraFees
        ? JSON.parse(listing.extraFees as string)
        : [],
      seasonalRules: listing.seasonalRules
        ? JSON.parse(listing.seasonalRules as string)
        : [],
      services: listing.services ? JSON.parse(listing.services as string) : {},
    };

    if (incrementViews) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      await prisma.$transaction([
        prisma.listing.update({
          where: { id },
          data: { viewCount: { increment: 1 } },
        }),
        prisma.listingStats.upsert({
          where: { listingId_date: { listingId: id, date: today } },
          update: { views: { increment: 1 } },
          create: { listingId: id, date: today, views: 1 },
        }),
      ]);
    }

    return parsedListing;
  }

  static async updateListing(
    id: string,
    ownerId: string,
    data: UpdateListingInput,
    newPhotos?: any[],
  ) {
    // Récupérer l'annonce existante
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: {
        ownerId: true,
        title: true,
        description: true,
        type: true,
        status: true,
        governorate: true,
        delegation: true,
        street: true,
        rooms: true,
        bathrooms: true,
        maxGuests: true,
        surfaceArea: true,
        hasElevator: true,
        rentalType: true,
        pricePerNight: true,
        pricePerMonth: true,
        securityDeposit: true,
        cleaningFee: true,
        weekendPriceMultiplier: true,
        equipment: true,
      },
    });

    if (!existing) throw new Error("Annonce non trouvée");
    if (existing.ownerId !== ownerId) throw new Error("Non autorisé");

    const existingPhotos = await prisma.listingMedia.findMany({
      where: { listingId: id },
      select: { url: true, isMain: true, position: true },
    });

    let slugUpdate = {};
    if (data.title && data.title !== existing.title) {
      const newSlug = await this.generateUniqueSlug(data.title, id);
      slugUpdate = { slug: newSlug };
    }

    const updateData: any = {
      ...slugUpdate,
      updatedAt: new Date(),
    };

    const changes: any[] = [];

    //  FONCTION addChange AVEC FORMATAGE POUR L'HISTORIQUE
    const addChange = (fieldName: string, oldValue: any, newValue: any) => {
      if (
        newValue !== undefined &&
        JSON.stringify(oldValue) !== JSON.stringify(newValue)
      ) {
        // Formater les valeurs pour l'historique (texte lisible)
        const formattedOldValue = formatValueForHistory(oldValue, fieldName);
        const formattedNewValue = formatValueForHistory(newValue, fieldName);
        
        changes.push({ 
          fieldName, 
          oldValue: formattedOldValue, 
          newValue: formattedNewValue 
        });
        updateData[fieldName] = newValue;
        return true;
      }
      return false;
    };

    // Comparer tous les champs
    addChange("title", existing.title, data.title);
    addChange("description", existing.description, data.description);
    addChange("type", existing.type, data.type);
    addChange("governorate", existing.governorate, data.governorate);
    addChange("delegation", existing.delegation, data.delegation);
    addChange("street", existing.street, data.street);
    addChange("rooms", existing.rooms, data.rooms);
    addChange("bathrooms", existing.bathrooms, data.bathrooms);
    addChange("maxGuests", existing.maxGuests, data.maxGuests);
    addChange("surfaceArea", existing.surfaceArea, data.surfaceArea);
    addChange("hasElevator", existing.hasElevator, data.hasElevator);
    addChange("rentalType", existing.rentalType, data.rentalType);
    addChange("pricePerNight", existing.pricePerNight, data.pricePerNight);
    addChange("pricePerMonth", existing.pricePerMonth, data.pricePerMonth);
    addChange("securityDeposit", existing.securityDeposit, data.securityDeposit);
    addChange("cleaningFee", existing.cleaningFee, data.cleaningFee);
    addChange("weekendPriceMultiplier", existing.weekendPriceMultiplier, data.weekendPriceMultiplier);

    // Gérer les JSON
    if (data.equipment !== undefined) {
      const oldEquipment = (existing.equipment as Record<string, boolean>) || {};
      const newEquipment = data.equipment as Record<string, boolean>;
      if (JSON.stringify(oldEquipment) !== JSON.stringify(newEquipment)) {
        const formattedOld = formatValueForHistory(oldEquipment, "equipment");
        const formattedNew = formatValueForHistory(newEquipment, "equipment");
        changes.push({
          fieldName: "equipment",
          oldValue: formattedOld,
          newValue: formattedNew,
        });
        updateData.equipment = newEquipment as Prisma.JsonValue;
      }
    }

    if (data.extraFees !== undefined) {
      const newExtraFees = JSON.stringify(data.extraFees);
      const oldExtraFees = (existing.extraFees as string) || "[]";
      if (oldExtraFees !== newExtraFees) {
        changes.push({
          fieldName: "extraFees",
          oldValue: oldExtraFees,
          newValue: newExtraFees,
        });
        updateData.extraFees = newExtraFees;
      }
    }

    if (data.seasonalRules !== undefined) {
      const newSeasonalRules = JSON.stringify(data.seasonalRules);
      const oldSeasonalRules = (existing.seasonalRules as string) || "[]";
      if (oldSeasonalRules !== newSeasonalRules) {
        changes.push({
          fieldName: "seasonalRules",
          oldValue: oldSeasonalRules,
          newValue: newSeasonalRules,
        });
        updateData.seasonalRules = newSeasonalRules;
      }
    }

    if (data.services !== undefined) {
      const newServices = JSON.stringify(data.services);
      const oldServices = (existing.services as string) || "{}";
      if (oldServices !== newServices) {
        changes.push({
          fieldName: "services",
          oldValue: oldServices,
          newValue: newServices,
        });
        updateData.services = newServices;
      }
    }

    // Gérer le status
    if (data.status !== undefined && data.status !== existing.status) {
      addChange("status", existing.status, data.status);
      updateData.status = data.status;
      if (data.status === "ACTIVE") updateData.publishedAt = new Date();
    }

    // Mettre à jour l'annonce
    if (Object.keys(updateData).length > 1) {
      await prisma.listing.update({
        where: { id },
        data: updateData,
      });
    }

    //  Enregistrer les changements dans l'historique (avec valeurs formatées en texte)
    for (const change of changes) {
      let actionType = "UPDATE";
      if (change.fieldName === "status") actionType = "STATUS_CHANGE";
      else if (change.fieldName === "pricePerNight" || change.fieldName === "pricePerMonth")
        actionType = "PRICE_UPDATE";
      else if (change.fieldName === "equipment") actionType = "EQUIPMENT_UPDATE";
      else if (change.fieldName === "photos") actionType = "PHOTO_UPDATE";

      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType,
          fieldName: change.fieldName,
          oldValue: change.oldValue,  
          newValue: change.newValue,  
          changedBy: ownerId,
        },
      });
    }

    // Gérer les photos
    if (newPhotos !== undefined && newPhotos.length > 0) {
      const newPhotoUrls = newPhotos
        .map((p) => p.url)
        .filter((url) => url && !url.startsWith("blob:"))
        .sort();
      const oldPhotoUrls = existingPhotos.map((p) => p.url).sort();
      const hasPhotoChanges =
        JSON.stringify(newPhotoUrls) !== JSON.stringify(oldPhotoUrls);

      if (hasPhotoChanges) {
        await prisma.listingMedia.deleteMany({
          where: { listingId: id },
        });

        const photosToCreate = newPhotos
          .filter(
            (photo) =>
              photo?.url &&
              !photo.url.startsWith("blob:") &&
              photo.url.trim() !== "",
          )
          .map((photo, index) => ({
            listingId: id,
            url: photo.url,
            thumbnailUrl: photo.thumbnailUrl || photo.url,
            type: "IMAGE" as const,
            position: index,
            isMain: photo.isMain || index === 0,
          }));

        if (photosToCreate.length > 0) {
          await prisma.listingMedia.createMany({
            data: photosToCreate,
          });

          await prisma.listingHistory.create({
            data: {
              listingId: id,
              actionType: "PHOTO_UPDATE",
              fieldName: "photos",
              oldValue: oldPhotoUrls[0] || null,
              newValue: newPhotoUrls[0] || null,
              changedBy: ownerId,
            },
          });
        }
      }
    }

    const updatedListing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: { orderBy: { position: "asc" } } },
    });

    if (!updatedListing) return null;

    return {
      ...updatedListing,
      extraFees: updatedListing.extraFees
        ? JSON.parse(updatedListing.extraFees as string)
        : [],
      seasonalRules: updatedListing.seasonalRules
        ? JSON.parse(updatedListing.seasonalRules as string)
        : [],
      services: updatedListing.services
        ? JSON.parse(updatedListing.services as string)
        : {},
    };
  }

  static async archiveListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error("Annonce non trouvée");
    if (existing.ownerId !== ownerId) throw new Error("Non autorisé");
    if (existing.status === "ARCHIVED") throw new Error("Annonce déjà archivée");

    const listing = await prisma.listing.update({
      where: { id },
      data: { status: "ARCHIVED", isArchived: true, archivedAt: new Date() },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: "STATUS_CHANGE",
        fieldName: "status",
        oldValue: formatValueForHistory(existing.status, "status"),
        newValue: "Archivée",
        changedBy: ownerId,
      },
    });

    return listing;
  }

  static async restoreListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      select: { ownerId: true, status: true },
    });

    if (!existing) throw new Error("Annonce non trouvée");
    if (existing.ownerId !== ownerId) throw new Error("Non autorisé");
    if (existing.status !== "ARCHIVED") throw new Error("Cette annonce n'est pas archivée");

    const listing = await prisma.listing.update({
      where: { id },
      data: { status: "INACTIVE", isArchived: false, archivedAt: null },
    });

    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: "STATUS_CHANGE",
        fieldName: "status",
        oldValue: "Archivée",
        newValue: "Masquée",
        changedBy: ownerId,
      },
    });

    return listing;
  }

  static async deleteListing(id: string, ownerId: string) {
    const existing = await prisma.listing.findUnique({
      where: { id },
      include: {
        bookings: {
          where: { status: { in: ["PENDING", "CONFIRMED", "PAID"] } },
        },
      },
    });

    if (!existing) throw new Error("Annonce non trouvée");
    if (existing.ownerId !== ownerId) throw new Error("Non autorisé");

    if (existing.bookings.length > 0) {
      throw new Error("Impossible de supprimer: des réservations sont en cours");
    }

    return prisma.listing.delete({ where: { id } });
  }

  static async getMyListings(
    ownerId: string,
    filters: {
      status?: string;
      page?: number;
      pageSize?: number;
      search?: string;
    },
  ) {
    const { status, page = 1, pageSize = 10, search } = filters;

    const where: Prisma.ListingWhereInput = { ownerId };

    if (status && status !== "ALL") {
      where.status = status as any;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          photos: { orderBy: { position: "asc" } },
          stats: { orderBy: { date: "desc" }, take: 1 },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    return {
      listings: listings.map((listing) => ({
        ...listing,
        extraFees: listing.extraFees
          ? JSON.parse(listing.extraFees as string)
          : [],
        seasonalRules: listing.seasonalRules
          ? JSON.parse(listing.seasonalRules as string)
          : [],
        services: listing.services
          ? JSON.parse(listing.services as string)
          : {},
        recentViews: listing.stats[0]?.views || 0,
        recentBookings: listing.stats[0]?.bookings || 0,
        mainPhoto: listing.photos.find((p) => p.isMain) || listing.photos[0],
      })),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}

export default ListingService;