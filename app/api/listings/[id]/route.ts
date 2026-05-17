// app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { updateListingSchema } from "@/lib/validations/listing";
import { withAuth } from "@/lib/api/withAuth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface FormattedBooking {
  id: string;
  tenantName: string;
  tenantAvatar: string | null;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  totalPrice: number;
}

// Fonction helper pour calculer les scores des avis
function calculateReviewScoresFromList(reviews: any[]) {
  if (!reviews || reviews.length === 0) {
    return {
      cleanliness: 4.5,
      accuracy: 4.5,
      communication: 4.5,
      location: 4.5,
      checkin: 4.5,
      value: 4.5,
    };
  }
  
  const getAvg = (field: string) => {
    const sum = reviews.reduce((acc, r) => acc + (r[field] || 0), 0);
    return +(sum / reviews.length).toFixed(1);
  };
  
  return {
    cleanliness: getAvg("cleanliness") || 4.5,
    accuracy: getAvg("accuracy") || 4.5,
    communication: getAvg("communication") || 4.5,
    location: getAvg("location") || 4.5,
    checkin: getAvg("checkin") || 4.5,
    value: getAvg("value") || 4.5,
  };
}

// Fonction utilitaire pour fusionner les données originales avec la révision en attente
function mergeWithPendingRevision(original: any, pending: any): any {
  console.log(`🔧 [mergeWithPendingRevision] DEBUT`);
  console.log(
    `🔧 Original - title: ${original?.title}, pricePerNight: ${original?.pricePerNight}`,
  );
  console.log(
    `🔧 Pending - title: ${pending?.title}, pricePerNight: ${pending?.pricePerNight}`,
  );

  if (!pending) {
    console.log(`🔧 Aucune donnée pending, retour original`);
    return original;
  }

  const merged = { ...original };

  // Champs de base à fusionner
  const fieldsToMerge = [
    "title",
    "description",
    "type",
    "governorate",
    "delegation",
    "street",
    "latitude",
    "longitude",
    "rooms",
    "bathrooms",
    "numberOfKitchens",
    "maxGuests",
    "surfaceArea",
    "floorNumber",
    "hasElevator",
    "hasBalcony",
    "hasGarden",
    "hasGarage",
    "isFurnished",
    "petsAllowed",
    "smokingAllowed",
    "equipment",
    "services",
    "houseRules",
    "customRules",
    "rentalType",
    "pricePerNight",
    "pricePerMonth",
    "securityDeposit",
    "cleaningFee",
    "weekendPriceMultiplier",
    "extraFees",
    "seasonalRules",
  ];

  for (const field of fieldsToMerge) {
    if (pending[field] !== undefined && pending[field] !== null) {
      const oldValue = merged[field];
      const newValue = pending[field];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        console.log(
          `🔧 Fusion du champ "${field}": ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`,
        );
      }
      merged[field] = pending[field];
    }
  }

  // Gérer les photos de la révision
  if (pending.photos && pending.photos.length > 0) {
    console.log(`🔧 Fusion des photos: ${pending.photos.length} photos`);
    merged.photos = pending.photos;
  }

  console.log(
    `🔧 [mergeWithPendingRevision] FIN - merged title: ${merged.title}, pricePerNight: ${merged.pricePerNight}`,
  );
  return merged;
}

// GET - Récupère TOUTES les données d'une annonce (avec fusion des révisions en attente)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🔍 [GET] Récupération de l'annonce: ${id}`);
    console.log(`👤 Utilisateur: ${clerkId || "non authentifié"}`);
    console.log(`${"=".repeat(60)}`);

    let shouldIncrementViews = true;
    let isOwner = false;

    if (clerkId) {
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (user) {
        const listingOwner = await prisma.listing.findFirst({
          where: { id, ownerId: user.id },
          select: { id: true, ownerId: true },
        });
        if (listingOwner) {
          shouldIncrementViews = false;
          isOwner = true;
          console.log(`✅ Utilisateur est le PROPRIÉTAIRE de l'annonce`);
        } else {
          console.log(`👤 Utilisateur n'est PAS le propriétaire`);
        }
      }
    }

    // ✅ Récupérer l'annonce SANS reviews (car pas de relation directe)
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
            createdAt: true,
            bio: true,
            stats: {
              select: { averageRating: true, totalReviews: true },
            },
          },
        },
        photos: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!listing) {
      console.log(`❌ Annonce non trouvée: ${id}`);
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    // ✅ Récupérer les reviews via les bookings du listing
    const bookingsWithReviews = await prisma.booking.findMany({
      where: {
        listingId: id,
        review: { isNot: null },
        status: { in: ["COMPLETED", "CONFIRMED"] },
      },
      include: {
        review: {
          include: {
            reviewer: {
              select: {
                username: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    // Extraire les reviews
    const reviewsList = bookingsWithReviews
      .filter(b => b.review)
      .map(b => b.review);

    console.log(`📋 Annonce trouvée:`);
    console.log(`   - Titre: ${listing.title}`);
    console.log(`   - Statut: ${listing.status}`);
    console.log(`   - hasPendingRevision: ${listing.hasPendingRevision}`);
    console.log(`   - Nombre de reviews: ${reviewsList.length}`);

    // 🔥 CRUCIAL: Fusionner avec les données en attente de révision
    let displayData = { ...listing };

    if (listing.hasPendingRevision && listing.pendingRevision) {
      console.log(
        `\n📝 [GET] Annonce ${id} a des modifications EN ATTENTE de validation`,
      );
      const pendingData = listing.pendingRevision;
      displayData = mergeWithPendingRevision(displayData, pendingData);
      console.log(
        `✅ Données fusionnées - nouveau titre: ${displayData.title}`,
      );
    } else {
      console.log(`📝 Aucune révision en attente pour cette annonce`);
    }

    // Incrémenter les vues (sauf pour le propriétaire)
    if (shouldIncrementViews) {
      await prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      displayData.viewCount += 1;
      console.log(
        `👁️ Vue incrémentée - nouveau total: ${displayData.viewCount}`,
      );
    }

    // Récupérer le nombre de réservations
    const bookingCount = await prisma.booking.count({
      where: {
        listingId: id,
        status: { in: ["CONFIRMED", "COMPLETED", "ACCEPTED", "PAID"] },
      },
    });

    // Récupérer le revenu total
    const totalRevenueResult = await prisma.booking.aggregate({
      where: {
        listingId: id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { totalPrice: true },
    });
    const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

    // Récupérer les dates bloquées
    const pendingBookings = await prisma.pendingBooking.findMany({
      where: {
        listingId: id,
        expiresAt: { gt: new Date() },
        isReleased: false,
      },
    });
    const pendingDates = pendingBookings.flatMap((pb) => {
      const dates = pb.dates as string[];
      return dates.map((dateStr) => dateStr.split("T")[0]);
    });

    const blockedDatesList = await prisma.blockedDate.findMany({
      where: {
        listingId: id,
        startDate: { gte: new Date() },
      },
    });
    const blockedDates = blockedDatesList.map(
      (bd) => bd.startDate.toISOString().split("T")[0],
    );

    // Récupérer les réservations (seulement pour le propriétaire)
    let upcomingBookings: FormattedBooking[] = [];
    let pastBookings: FormattedBooking[] = [];

    if (isOwner) {
      const now = new Date();

      const upcomingBookingsRaw = await prisma.booking.findMany({
        where: {
          listingId: id,
          checkOut: { gte: now },
          status: { in: ["CONFIRMED", "PAID", "ACCEPTED"] },
        },
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: { checkIn: "asc" },
        take: 10,
      });

      const pastBookingsRaw = await prisma.booking.findMany({
        where: {
          listingId: id,
          checkOut: { lt: now },
          status: { in: ["COMPLETED", "CANCELLED", "REJECTED"] },
        },
        include: {
          tenant: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              profilePictureUrl: true,
            },
          },
        },
        orderBy: { checkOut: "desc" },
        take: 10,
      });

      upcomingBookings = upcomingBookingsRaw.map((b) => ({
        id: b.id,
        tenantName: b.tenant?.firstName
          ? `${b.tenant.firstName} ${b.tenant.lastName || ""}`.trim()
          : b.tenant?.username || "Locataire",
        tenantAvatar: b.tenant?.profilePictureUrl || null,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.totalNights,
        status: b.status,
        totalPrice: b.totalPrice,
      }));

      pastBookings = pastBookingsRaw.map((b) => ({
        id: b.id,
        tenantName: b.tenant?.firstName
          ? `${b.tenant.firstName} ${b.tenant.lastName || ""}`.trim()
          : b.tenant?.username || "Locataire",
        tenantAvatar: b.tenant?.profilePictureUrl || null,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        nights: b.totalNights,
        status: b.status,
        totalPrice: b.totalPrice,
      }));
    }

    // Formater les reviews pour la réponse
    const formattedReviews = reviewsList.map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      author: review.reviewer?.username || review.reviewer?.firstName || "Anonyme",
      authorAvatar: review.reviewer?.profilePictureUrl,
      createdAt: review.createdAt,
      date: new Date(review.createdAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    }));

    // 🔥 CONSTRUIRE LA RÉPONSE
    const response = {
      id: displayData.id,
      title: displayData.title,
      description: displayData.description,
      slug: displayData.slug,
      type: displayData.type,
      status: displayData.status,
      rejectionReason: displayData.rejectionReason,
      rejectionDetails: displayData.rejectionDetails,
      rejectedAt: displayData.rejectedAt,
      rejectedBy: displayData.rejectedBy,
      hasPendingRevision: listing.hasPendingRevision || false,
      governorate: displayData.governorate,
      delegation: displayData.delegation,
      street: displayData.street,
      latitude: displayData.latitude,
      longitude: displayData.longitude,
      rooms: displayData.rooms,
      bathrooms: displayData.bathrooms,
      numberOfKitchens: displayData.numberOfKitchens,
      maxGuests: displayData.maxGuests,
      surfaceArea: displayData.surfaceArea,
      floorNumber: displayData.floorNumber,
      hasElevator: displayData.hasElevator,
      hasBalcony: displayData.hasBalcony,
      hasGarden: displayData.hasGarden,
      hasGarage: displayData.hasGarage,
      isFurnished: displayData.isFurnished,
      petsAllowed: displayData.petsAllowed,
      smokingAllowed: displayData.smokingAllowed,
      equipment: displayData.equipment,
      services: displayData.services,
      houseRules: displayData.houseRules,
      customRules: displayData.customRules,
      rentalType: displayData.rentalType,
      pricePerNight: displayData.pricePerNight,
      pricePerMonth: displayData.pricePerMonth,
      securityDeposit: displayData.securityDeposit,
      cleaningFee: displayData.cleaningFee,
      weekendPriceMultiplier: displayData.weekendPriceMultiplier,
      extraFees: displayData.extraFees,
      seasonalRules: displayData.seasonalRules,
      photos: displayData.photos.map((p: any) => ({
        id: p.id,
        url: p.url,
        thumbnailUrl: p.thumbnailUrl,
        isMain: p.isMain,
        position: p.position,
      })),
      viewCount: displayData.viewCount,
      bookingCount: displayData.bookingCount,
      favoriteCount: displayData.favoriteCount,
      createdAt: displayData.createdAt,
      updatedAt: displayData.updatedAt,
      publishedAt: displayData.publishedAt,
      archivedAt: displayData.archivedAt,
      totalBookings: bookingCount,
      totalRevenue: totalRevenue,
      owner: displayData.owner,
      blockedDates: blockedDates,
      pendingDates: pendingDates,
      upcomingBookings: upcomingBookings,
      pastBookings: pastBookings,
      isOwner: isOwner,
      reviews: formattedReviews,
      reviewScores: calculateReviewScoresFromList(reviewsList),
    };

    console.log(`\n✅ RÉPONSE FINALE:`);
    console.log(`   - Titre: ${response.title}`);
    console.log(`   - Statut: ${response.status}`);
    console.log(`   - Prix par nuit: ${response.pricePerNight}`);
    console.log(`   - Révision en attente: ${response.hasPendingRevision}`);
    console.log(`   - Nombre de reviews: ${response.reviews.length}`);
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/listings/:id] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
// PUT - Mise à jour complète
export const PUT = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();

    console.log(`\n📝 [PUT] Début - ID: ${id}, User: ${user.id}`);

    const convertNullToUndefined = (obj: any): any => {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null) result[key] = undefined;
        else if (Array.isArray(value)) result[key] = value;
        else if (typeof value === "object" && value !== null) {
          result[key] = convertNullToUndefined(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    };

    const cleanedBody = convertNullToUndefined(body);
    const { photos, ...updateData } = cleanedBody;

    const validationResult = updateListingSchema.safeParse(updateData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validationResult.error.issues },
        { status: 400 },
      );
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: {
        ...validationResult.data,
        updatedAt: new Date(),
      },
    });

    if (photos && photos.length > 0) {
      const validPhotos = photos.filter(
        (photo: any) => photo?.url && !photo.url.startsWith("blob:"),
      );
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

    console.log(`✅ [PUT] Annonce mise à jour avec succès`);
    return NextResponse.json(listing);
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);

// DELETE - Supprimer ou archiver
export const DELETE = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const permanent = searchParams.get("permanent") === "true";

    if (permanent) {
      await prisma.listing.delete({ where: { id } });
      return NextResponse.json({ message: "Annonce supprimée définitivement" });
    } else {
      const listing = await prisma.listing.update({
        where: { id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
      return NextResponse.json({ message: "Annonce archivée", listing });
    }
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);
// app/api/listings/[id]/route.ts - PARTIE PATCH CORRIGÉE

// PATCH - Changer le statut ou mettre à jour partiellement (AVEC GESTION DES RÉVISIONS)
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();
    const { status, action, isRevision, ...updateFields } = body;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`📝 [PATCH] Début - ID: ${id}, User: ${user.id}`);
    console.log(`${"=".repeat(60)}`);

    // Récupérer l'annonce actuelle
    const existingListing = await prisma.listing.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!existingListing) {
      console.log(`❌ Annonce non trouvée`);
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    console.log(`📋 Annonce existante:`);
    console.log(`   - Titre: ${existingListing.title}`);
    console.log(`   - Statut: ${existingListing.status}`);
    console.log(
      `   - hasPendingRevision: ${existingListing.hasPendingRevision}`,
    );

    let result;

    // 🔥 CHAMPS AUTORISÉS POUR LA MODIFICATION DIRECTE (ceux que Prisma accepte)
    const allowedDirectFields = [
      "title",
      "description",
      "type",
      "governorate",
      "delegation",
      "street",
      "latitude",
      "longitude",
      "rooms",
      "bathrooms",
      "numberOfKitchens",
      "maxGuests",
      "surfaceArea",
      "floorNumber",
      "hasElevator",
      "hasBalcony",
      "hasGarden",
      "hasGarage",
      "isFurnished",
      "petsAllowed",
      "smokingAllowed",
      "equipment",
      "services",
      "houseRules",
      "customRules",
      "rentalType",
      "pricePerNight",
      "pricePerMonth",
      "securityDeposit",
      "cleaningFee",
      "weekendPriceMultiplier",
      "extraFees",
      "seasonalRules",
    ];

    // 🔥 CHAMPS À EXCLURE (ne pas envoyer à Prisma)
    const excludedFields = [
      "id",
      "slug",
      "createdAt",
      "updatedAt",
      "publishedAt",
      "archivedAt",
      "viewCount",
      "bookingCount",
      "favoriteCount",
      "conversionRate",
      "isArchived",
      "isBlocked",
      "blockReason",
      "ownerId",
      "photos",
      "owner",
      "stats",
      "blockedDates",
      "pendingDates",
      "upcomingBookings",
      "pastBookings",
      "isOwner",
      "totalBookings",
      "totalRevenue",
      "hasPendingRevision",
      "rejectionReason",
      "rejectionDetails",
      "rejectedAt",
      "rejectedBy",
    ];

    // 🔥 Filtrer les champs pour garder uniquement ceux autorisés
    const filterAllowedFields = (fields: any) => {
      const filtered: any = {};
      for (const key of allowedDirectFields) {
        if (fields[key] !== undefined) {
          filtered[key] = fields[key];
        }
      }
      return filtered;
    };

    // 🔥 CAS 1: Changement de statut (admin)
    if (status) {
      console.log(`📝 CAS 1: Changement de statut vers ${status}`);
      result = await prisma.listing.update({ where: { id }, data: { status } });
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: "STATUS_CHANGE",
          oldValue: { status: existingListing.status },
          newValue: { status },
          changedBy: user.id,
        },
      });
      console.log(`✅ Statut changé`);
    }
    // 🔥 CAS 2: Mise à jour d'une annonce ACTIVE → CRÉER UNE RÉVISION
    else if (
      existingListing.status === "ACTIVE" &&
      Object.keys(updateFields).length > 0
    ) {
      console.log(`📝 CAS 2: Annonce ACTIVE - Création d'une révision`);

      // Filtrer les champs pour la révision
      const revisionData = filterAllowedFields(updateFields);
      console.log(`📝 Champs pour révision:`, Object.keys(revisionData));

      if (Object.keys(revisionData).length === 0) {
        console.log(`⚠️ Aucun champ valide à réviser`);
        return NextResponse.json(
          { error: "Aucun champ valide à modifier" },
          { status: 400 },
        );
      }

      // Sauvegarder les modifications dans pendingRevision
      result = await prisma.listing.update({
        where: { id },
        data: {
          pendingRevision: revisionData,
          hasPendingRevision: true,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Révision créée - hasPendingRevision: true`);
    }
    // 🔥 CAS 3: Mise à jour d'une annonce non-ACTIVE → modification directe
    else if (Object.keys(updateFields).length > 0) {
      console.log(
        `📝 CAS 3: Annonce ${existingListing.status} - Modification directe`,
      );

      // Filtrer les champs autorisés
      const directData = filterAllowedFields(updateFields);
      console.log(`📝 Champs à modifier directement:`, Object.keys(directData));

      if (Object.keys(directData).length === 0) {
        console.log(`⚠️ Aucun champ valide à modifier`);
        return NextResponse.json(
          { error: "Aucun champ valide à modifier" },
          { status: 400 },
        );
      }

      result = await prisma.listing.update({
        where: { id },
        data: {
          ...directData,
          updatedAt: new Date(),
        },
      });
      console.log(`✅ Modification directe effectuée`);
    }
    // 🔥 CAS 4: Action RESTORE
    else if (action === "RESTORE") {
      console.log(`📝 CAS 4: Action RESTORE`);
      result = await prisma.listing.update({
        where: { id },
        data: { status: "INACTIVE", archivedAt: null },
      });
    }
    // 🔥 CAS 5: Action TOGGLE_STATUS
    else if (action === "TOGGLE_STATUS") {
      console.log(`📝 CAS 5: Action TOGGLE_STATUS`);
      const newStatus =
        existingListing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      result = await prisma.listing.update({
        where: { id },
        data: { status: newStatus },
      });
      console.log(`✅ Statut togglé vers ${newStatus}`);
    } else {
      console.log(`❌ Aucune modification fournie`);
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 },
      );
    }

    console.log(`✅ [PATCH] Terminé avec succès`);
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json(result);
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);
