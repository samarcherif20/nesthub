// app/api/admin/listings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

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

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
            createdAt: true,
            stats: {
              select: {
                averageRating: true,
                totalReviews: true,
              },
            },
          },
        },
        photos: {
          orderBy: { position: "asc" },
        },
        bookings: {
          where: {
            checkIn: {
              gte: new Date(),
            },
            status: "CONFIRMED",
          },
          take: 5,
          orderBy: { checkIn: "asc" },
          include: {
            tenant: {
              select: {
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    //  Vérifier correctement s'il y a une révision en attente
    const hasPendingRevision = listing.hasPendingRevision === true;

    //  Récupérer les changements proposés depuis le champ pendingRevision
    let previousVersionData = null;
    if (hasPendingRevision && listing.pendingRevision) {
      try {
        const pendingData =
          typeof listing.pendingRevision === "string"
            ? JSON.parse(listing.pendingRevision)
            : listing.pendingRevision;

        // Générer la liste des changements
        const changes = [];

        // Comparer les champs importants
        const fieldsToCompare = [
          "title",
          "description",
          "pricePerNight",
          "pricePerMonth",
          "cleaningFee",
          "securityDeposit",
          "rooms",
          "bathrooms",
          "surfaceArea",
          "maxGuests",
          "floorNumber",
          "hasElevator",
          "hasBalcony",
          "hasGarden",
          "hasGarage",
          "isFurnished",
          "petsAllowed",
          "smokingAllowed",
          "type",
          "governorate",
          "delegation",
        ];

        for (const field of fieldsToCompare) {
          const oldValue = listing[field as keyof typeof listing];
          const newValue = pendingData[field];

          if (
            newValue !== undefined &&
            JSON.stringify(oldValue) !== JSON.stringify(newValue)
          ) {
            changes.push({
              field,
              oldValue,
              newValue,
            });
          }
        }

        // Vérifier les équipements
        if (pendingData.equipment && listing.equipment) {
          const oldEquipment = listing.equipment as Record<string, boolean>;
          const newEquipment = pendingData.equipment;

          const equipmentChanges = [];
          const allKeys = new Set([
            ...Object.keys(oldEquipment),
            ...Object.keys(newEquipment),
          ]);

          for (const key of allKeys) {
            if (oldEquipment[key] !== newEquipment[key]) {
              equipmentChanges.push({
                field: `equipment.${key}`,
                oldValue: oldEquipment[key] || false,
                newValue: newEquipment[key] || false,
              });
            }
          }

          if (equipmentChanges.length > 0) {
            changes.push({
              field: "equipment",
              oldValue: "Configuration actuelle",
              newValue: `${equipmentChanges.length} modification(s)`,
              details: equipmentChanges,
            });
          }
        }

        // Vérifier les règles
        if (pendingData.houseRules && listing.houseRules) {
          const oldRules = listing.houseRules as Record<string, boolean>;
          const newRules = pendingData.houseRules;

          const rulesChanges = [];
          const allRuleKeys = new Set([
            ...Object.keys(oldRules),
            ...Object.keys(newRules),
          ]);

          for (const key of allRuleKeys) {
            if (oldRules[key] !== newRules[key]) {
              rulesChanges.push({
                field: key,
                oldValue: oldRules[key] || false,
                newValue: newRules[key] || false,
              });
            }
          }

          if (rulesChanges.length > 0) {
            changes.push({
              field: "houseRules",
              oldValue: "Règles actuelles",
              newValue: `${rulesChanges.length} modification(s)`,
              details: rulesChanges,
            });
          }
        }

        // Vérifier les photos
        if (
          pendingData.photos &&
          Array.isArray(pendingData.photos) &&
          pendingData.photos.length > 0
        ) {
          const currentPhotoCount = listing.photos?.length || 0;
          const newPhotoCount = pendingData.photos.length;

          if (currentPhotoCount !== newPhotoCount) {
            changes.push({
              field: "photos",
              oldValue: `${currentPhotoCount} photo(s)`,
              newValue: `${newPhotoCount} photo(s)`,
            });
          }
        }

        previousVersionData = { changes };
      } catch (error) {
        console.error("Error parsing pending revision data:", error);
        previousVersionData = { changes: [] };
      }
    }

    const formattedListing = {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      type: listing.type,
      status: listing.status,
      hasPendingRevision,
      governorate: listing.governorate,
      delegation: listing.delegation,
      street: listing.street,
      latitude: listing.latitude,
      longitude: listing.longitude,
      pricePerNight: listing.pricePerNight,
      pricePerMonth: listing.pricePerMonth,
      cleaningFee: listing.cleaningFee,
      securityDeposit: listing.securityDeposit,
      rooms: listing.rooms,
      bathrooms: listing.bathrooms,
      surfaceArea: listing.surfaceArea,
      maxGuests: listing.maxGuests,
      floorNumber: listing.floorNumber,
      hasElevator: listing.hasElevator,
      hasBalcony: listing.hasBalcony,
      hasGarden: listing.hasGarden,
      hasGarage: listing.hasGarage,
      isFurnished: listing.isFurnished,
      petsAllowed: listing.petsAllowed,
      smokingAllowed: listing.smokingAllowed,
      equipment: listing.equipment || {},
      services: listing.services || {},
      houseRules: listing.houseRules || {},
      customRules: listing.customRules,
      photos: listing.photos,
      viewCount: listing.viewCount,
      bookingCount: listing.bookingCount,
      totalRevenue: 0,
      previousVersionData,
      owner: {
        id: listing.owner.id,
        firstName: listing.owner.firstName,
        lastName: listing.owner.lastName,
        email: listing.owner.email,
        phoneNumber: listing.owner.phoneNumber,
        profilePictureUrl: listing.owner.profilePictureUrl,
        isIdentityVerified: listing.owner.isIdentityVerified,
        createdAt: listing.owner.createdAt,
        stats: listing.owner.stats || { averageRating: 0, totalReviews: 0 },
      },
      upcomingBookings: (listing.bookings || []).map((booking) => ({
        id: booking.id,
        tenantName: `${booking.tenant.firstName} ${booking.tenant.lastName}`,
        tenantAvatar: booking.tenant.profilePictureUrl,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        nights: Math.ceil(
          (booking.checkOut.getTime() - booking.checkIn.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
        status: booking.status,
        totalPrice: booking.totalPrice,
      })),
      createdAt: listing.createdAt,
    };

    return NextResponse.json(formattedListing);
  } catch (error) {
    console.error("Error fetching listing details:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId },
      select: { role: true, id: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { action, status, rejectionReason, ...updateData } = body;

    // Récupérer l'annonce existante
    const existingListing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!existingListing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    let updatedListing;

    //  CAS 1: Changement de statut
    if (status) {
      updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          status,
          ...(status === "REJECTED" && {
            rejectedAt: new Date(),
            rejectedBy: admin.id,
          }),
          ...(status === "ACTIVE" && {
            publishedAt: new Date(),
            validatedAt: new Date(),
            validatedBy: admin.id,
          }),
        },
      });

      console.log(` ADMIN - Statut changé vers ${status}`);
    }
    //  CAS 2: Rejet avec motif
    else if (action === "reject") {
      updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: rejectionReason || "Non spécifié",
          rejectedAt: new Date(),
          rejectedBy: admin.id,
        },
      });

      console.log(` ADMIN - Annonce rejetée: ${rejectionReason}`);
    }
    //  CAS 3: Approbation
    else if (action === "approve") {
      updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          status: "ACTIVE",
          publishedAt: new Date(),
          validatedAt: new Date(),
          validatedBy: admin.id,
          rejectionReason: null,
          rejectedAt: null,
          rejectedBy: null,
        },
      });

      console.log(` ADMIN - Annonce approuvée`);
    }
    //  CAS 4: Modification directe des champs
    else if (Object.keys(updateData).length > 0) {
      // Champs autorisés pour l'admin
      const allowedFields = [
        "title",
        "description",
        "type",
        "pricePerNight",
        "pricePerMonth",
        "cleaningFee",
        "securityDeposit",
        "rooms",
        "bathrooms",
        "surfaceArea",
        "maxGuests",
        "floorNumber",
        "hasElevator",
        "hasBalcony",
        "hasGarden",
        "hasGarage",
        "isFurnished",
        "petsAllowed",
        "smokingAllowed",
        "governorate",
        "delegation",
        "street",
        "latitude",
        "longitude",
        "equipment",
        "services",
        "houseRules",
        "customRules",
        "rentalType",
      ];

      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      updatedListing = await prisma.listing.update({
        where: { id },
        data: { ...filteredData, updatedAt: new Date() },
      });

      console.log(
        ` ADMIN - Champs modifiés: ${Object.keys(filteredData).join(", ")}`,
      );
    }
    //  CAS 5: Forcer l'annulation d'une révision en attente
    else if (action === "clearRevision") {
      updatedListing = await prisma.listing.update({
        where: { id },
        data: {
          hasPendingRevision: false,
          pendingRevision: null,
        },
      });

      console.log(` ADMIN - Révision annulée`);
    } else {
      return NextResponse.json(
        { error: "Aucune action ou modification fournie" },
        { status: 400 },
      );
    }

    // Créer un historique de l'action admin
    await prisma.listingHistory.create({
      data: {
        listingId: id,
        actionType: "ADMIN_UPDATE",
        oldValue: { status: existingListing.status },
        newValue: { status: updatedListing.status || existingListing.status },
        changedBy: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: "Modification effectuée avec succès",
    });
  } catch (error) {
    console.error("Error updating listing:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la modification" },
      { status: 500 },
    );
  }
}
