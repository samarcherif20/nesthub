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

function mergeWithPendingRevision(original: any, pending: any): any {
  console.log(`[mergeWithPendingRevision] DEBUT`);
  console.log(`Original - title: ${original?.title}, pricePerNight: ${original?.pricePerNight}`);
  console.log(`Pending - title: ${pending?.title}, pricePerNight: ${pending?.pricePerNight}`);

  if (!pending) {
    console.log(`Aucune donnee pending, retour original`);
    return original;
  }

  const merged = { ...original };

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
        console.log(`Fusion du champ "${field}": ${JSON.stringify(oldValue)} -> ${JSON.stringify(newValue)}`);
      }
      merged[field] = pending[field];
    }
  }

  if (pending.photos && pending.photos.length > 0) {
    console.log(`Fusion des photos: ${pending.photos.length} photos`);
    merged.photos = pending.photos;
  }

  console.log(`[mergeWithPendingRevision] FIN - merged title: ${merged.title}, pricePerNight: ${merged.pricePerNight}`);
  return merged;
}

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
      console.log(`Proprietaire non trouve: ${ownerId}`);
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

    console.log(`[NOTIFICATION] Envoyee au proprietaire ${owner.email || ownerId}:`);
    console.log(`   - Titre: ${title}`);
    console.log(`   - Type: ${type}`);
    console.log(`   - Contenu: ${content}`);

    return notification;
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
  }
}

// GET - Recupere TOUTES les donnees d'une annonce (avec fusion des revisions en attente)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[GET] Recuperation de l'annonce: ${id}`);
    console.log(`Utilisateur: ${clerkId || "non authentifie"}`);
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
          console.log(`Utilisateur est le PROPRIETAIRE de l'annonce`);
        } else {
          console.log(`Utilisateur n'est PAS le proprietaire`);
        }
      }
    }

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
      console.log(`Annonce non trouvee: ${id}`);
      return NextResponse.json(
        { error: "Annonce non trouvee" },
        { status: 404 },
      );
    }

    const ownerVacation = await prisma.user.findUnique({
      where: { id: listing.ownerId },
      select: {
        vacationMode: true,
        vacationMessage: true,
        vacationStartDate: true,
        vacationEndDate: true,
      },
    });

    console.log(`Mode vacances proprietaire:`, {
      vacationMode: ownerVacation?.vacationMode,
      startDate: ownerVacation?.vacationStartDate,
      endDate: ownerVacation?.vacationEndDate,
    });

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

    const reviewsList = bookingsWithReviews
      .filter((b) => b.review)
      .map((b) => b.review);

    console.log(`Annonce trouvee:`);
    console.log(`   - Titre: ${listing.title}`);
    console.log(`   - Statut: ${listing.status}`);
    console.log(`   - hasPendingRevision: ${listing.hasPendingRevision}`);
    console.log(`   - Nombre de reviews: ${reviewsList.length}`);

    let displayData = { ...listing };

    if (listing.hasPendingRevision && listing.pendingRevision) {
      console.log(`\n[GET] Annonce ${id} a des modifications EN ATTENTE de validation`);
      const pendingData = listing.pendingRevision;
      displayData = mergeWithPendingRevision(displayData, pendingData);
      console.log(`Donnees fusionnees - nouveau titre: ${displayData.title}`);
    } else {
      console.log(`Aucune revision en attente pour cette annonce`);
    }

    if (shouldIncrementViews) {
      await prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
      displayData.viewCount += 1;
      console.log(`Vue incrementee - nouveau total: ${displayData.viewCount}`);
    }

    const bookingCount = await prisma.booking.count({
      where: {
        listingId: id,
        status: { in: ["CONFIRMED", "COMPLETED", "ACCEPTED", "PAID"] },
      },
    });

    const totalRevenueResult = await prisma.booking.aggregate({
      where: {
        listingId: id,
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _sum: { totalPrice: true },
    });
    const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

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
      vacationMode: ownerVacation?.vacationMode || listing.vacationMode || false,
      vacationMessage: ownerVacation?.vacationMessage || listing.vacationMessage || null,
      vacationStartDate: ownerVacation?.vacationStartDate || listing.vacationStartDate,
      vacationEndDate: ownerVacation?.vacationEndDate || listing.vacationEndDate,
    };

    console.log(`\nREPONSE FINALE:`);
    console.log(`   - Titre: ${response.title}`);
    console.log(`   - Statut: ${response.status}`);
    console.log(`   - Prix par nuit: ${response.pricePerNight}`);
    console.log(`   - Revision en attente: ${response.hasPendingRevision}`);
    console.log(`   - Nombre de reviews: ${response.reviews.length}`);
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json(response);
  } catch (error) {
    console.error("[GET /api/listings/:id] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mise a jour complete
export const PUT = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();

    console.log(`\n[PUT] Debut - ID: ${id}, User: ${user.id}`);

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
        { error: "Donnees invalides", details: validationResult.error.issues },
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

    console.log(`[PUT] Annonce mise a jour avec succes`);
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
      return NextResponse.json({ message: "Annonce supprimee definitivement" });
    } else {
      const listing = await prisma.listing.update({
        where: { id },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });

      if (listing.ownerId) {
        await sendNotificationToOwner(
          listing.ownerId,
          "Annonce archivee",
          `Votre annonce "${listing.title}" a ete archivee par l'administrateur.`,
          "SYSTEM_ALERT",
          id,
          listing.title,
        );
      }

      return NextResponse.json({ message: "Annonce archivee", listing });
    }
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);

// PATCH - Changer le statut ou mettre a jour partiellement (AVEC NOTIFICATIONS)
export const PATCH = withAuth(
  async (request: NextRequest, { params }: RouteParams) => {
    const user = (request as any).user;
    const { id } = await params;
    const body = await request.json();
    const { status, action, isRevision, ...updateFields } = body;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`[PATCH] Debut - ID: ${id}, User:`, user);
    console.log(`User.id (UUID): ${user.id}`);
    console.log(`User.clerkId: ${user.clerkId}`);
    console.log(`${"=".repeat(60)}`);

    const existingListing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      console.log(`Annonce non trouvee pour l'ID: ${id}`);
      return NextResponse.json(
        { error: "Annonce non trouvee" },
        { status: 404 },
      );
    }

    const isAdmin = user.role === "ADMIN";
    const isOwner = existingListing.ownerId === user.id;

    console.log(`Annonce existante:`);
    console.log(`   - Titre: ${existingListing.title}`);
    console.log(`   - Statut: ${existingListing.status}`);
    console.log(`   - OwnerId: ${existingListing.ownerId}`);
    console.log(`   - isAdmin: ${isAdmin}`);
    console.log(`   - isOwner: ${isOwner}`);

    if (!isAdmin && !isOwner) {
      console.log(`Acces refuse - n'est ni admin ni proprietaire`);
      return NextResponse.json(
        { error: "Acces non autorise" },
        { status: 403 },
      );
    }

    console.log(`   - hasPendingRevision: ${existingListing.hasPendingRevision}`);

    let result;
    let notificationTitle = "";
    let notificationContent = "";
    let notificationType = "";
    let shouldNotify = false;

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

    const filterAllowedFields = (fields: any) => {
      const filtered: any = {};
      for (const key of allowedDirectFields) {
        if (fields[key] !== undefined) {
          filtered[key] = fields[key];
        }
      }
      return filtered;
    };

    // CAS 1: Changement de statut par ADMIN
    if (status && isAdmin) {
      const oldStatus = existingListing.status;
      const newStatus = status;

      console.log(`CAS 1: ADMIN change le statut: ${oldStatus} -> ${newStatus}`);
      
      result = await prisma.listing.update({ where: { id }, data: { status } });
      
      await prisma.listingHistory.create({
        data: {
          listingId: id,
          actionType: "STATUS_CHANGE_BY_ADMIN",
          oldValue: { status: oldStatus },
          newValue: { status: newStatus },
          changedBy: user.id,
        },
      });

      if (oldStatus === "PENDING_REVIEW" && newStatus === "ACTIVE") {
        notificationTitle = "Annonce validee";
        notificationContent = `Votre annonce "${existingListing.title}" a ete validee par l'administrateur et est maintenant en ligne.`;
        notificationType = "LISTING_ACTIVATED";
        shouldNotify = true;
      } else if (oldStatus === "PENDING_REVIEW" && newStatus === "REJECTED") {
        notificationTitle = "Annonce rejetee";
        notificationContent = `Votre annonce "${existingListing.title}" a ete rejetee par l'administrateur. Veuillez la modifier et la soumettre a nouveau.`;
        notificationType = "LISTING_REJECTED";
        shouldNotify = true;
      } else if (newStatus === "ACTIVE" && oldStatus !== "ACTIVE") {
        notificationTitle = "Annonce activee";
        notificationContent = `Votre annonce "${existingListing.title}" a ete activee par l'administrateur.`;
        notificationType = "LISTING_ACTIVATED";
        shouldNotify = true;
      } else if (newStatus === "INACTIVE") {
        notificationTitle = "Annonce desactivee";
        notificationContent = `Votre annonce "${existingListing.title}" a ete desactivee par l'administrateur.`;
        notificationType = "LISTING_SUSPENDED";
        shouldNotify = true;
      } else if (newStatus === "ARCHIVED") {
        notificationTitle = "Annonce archivee";
        notificationContent = `Votre annonce "${existingListing.title}" a ete archivee par l'administrateur.`;
        notificationType = "SYSTEM_ALERT";
        shouldNotify = true;
      }

      console.log(`Statut change par ADMIN: ${oldStatus} -> ${newStatus}`);
    }
    // CAS 2: Mise a jour d'une annonce ACTIVE → CREER UNE REVISION
    else if (
      existingListing.status === "ACTIVE" &&
      Object.keys(updateFields).length > 0
    ) {
      console.log(`CAS 2: Annonce ACTIVE - Creation d'une revision`);

      const revisionData = filterAllowedFields(updateFields);
      console.log(`Champs pour revision:`, Object.keys(revisionData));

      if (Object.keys(revisionData).length === 0) {
        console.log(`Aucun champ valide a reviser`);
        return NextResponse.json(
          { error: "Aucun champ valide a modifier" },
          { status: 400 },
        );
      }

      result = await prisma.listing.update({
        where: { id },
        data: {
          pendingRevision: revisionData,
          hasPendingRevision: true,
          updatedAt: new Date(),
        },
      });

      console.log(`Revision creee - hasPendingRevision: true`);
    }
    // CAS 3: Mise a jour d'une annonce non-ACTIVE → modification directe
    else if (Object.keys(updateFields).length > 0) {
      console.log(`CAS 3: Annonce ${existingListing.status} - Modification directe`);

      const directData = filterAllowedFields(updateFields);
      console.log(`Champs a modifier directement:`, Object.keys(directData));

      if (Object.keys(directData).length === 0) {
        console.log(`Aucun champ valide a modifier`);
        return NextResponse.json(
          { error: "Aucun champ valide a modifier" },
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
      console.log(`Modification directe effectuee`);
    }
    // CAS 4: Action RESTORE
    else if (action === "RESTORE") {
      console.log(`CAS 4: Action RESTORE`);
      result = await prisma.listing.update({
        where: { id },
        data: { status: "INACTIVE", archivedAt: null },
      });
    }
    // CAS 5: Action TOGGLE_STATUS
    else if (action === "TOGGLE_STATUS") {
      console.log(`CAS 5: Action TOGGLE_STATUS`);
      const newStatus = existingListing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      result = await prisma.listing.update({
        where: { id },
        data: { status: newStatus },
      });
      console.log(`Statut toggled vers ${newStatus}`);
    } else {
      console.log(`Aucune modification fournie`);
      return NextResponse.json(
        { error: "Aucune modification fournie" },
        { status: 400 },
      );
    }

    if (shouldNotify && existingListing.ownerId) {
      await sendNotificationToOwner(
        existingListing.ownerId,
        notificationTitle,
        notificationContent,
        notificationType,
        id,
        existingListing.title,
      );
    }

    console.log(`[PATCH] Termine avec succes`);
    console.log(`${"=".repeat(60)}\n`);

    return NextResponse.json(result);
  },
  {
    requireListingAccess: true,
    requiredPermission: "edit",
  },
);