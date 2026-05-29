import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json";

    // Récupérer l'utilisateur depuis la base de données avec les relations correctes
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        listings: {
          include: {
            photos: true,
            bookings: true,
          },
        },
        tenantBookings: {
          include: {
            listing: true,
          },
        },
        ownerBookings: {
          include: {
            listing: true,
          },
        },
        reviewsWritten: true,
        reviewsReceived: true,
        notifications: true,
        favorites: {
          include: {
            listing: true,
          },
        },
        stats: true, 
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Structure des données à exporter
    const exportData = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        profession: user.profession,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        isPhoneVerified: user.isPhoneVerified,
        isIdentityVerified: user.isIdentityVerified,
        preferredLocale: user.preferredLocale,
        vacationMode: user.vacationMode,
        vacationMessage: user.vacationMessage,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
      stats: user.stats
        ? {
            reliabilityScore: user.stats.reliabilityScore,
            fraudScore: user.stats.fraudScore,
            totalBookings: user.stats.totalBookings,
            totalListings: user.stats.totalListings,
            totalReviews: user.stats.totalReviews,
            averageRating: user.stats.averageRating,
            totalSpent: user.stats.totalSpent,
            totalEarned: user.stats.totalEarned,
            loginCount: user.stats.loginCount,
            reportCount: user.stats.reportCount,
            disputeCount: user.stats.disputeCount,
            cancellationCount: user.stats.cancellationCount,
          }
        : null,
      listings: user.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        type: listing.type,
        description: listing.description,
        status: listing.status,
        governorate: listing.governorate,
        delegation: listing.delegation,
        street: listing.street,
        rooms: listing.rooms,
        bathrooms: listing.bathrooms,
        maxGuests: listing.maxGuests,
        surfaceArea: listing.surfaceArea,
        pricePerNight: listing.pricePerNight,
        pricePerMonth: listing.pricePerMonth,
        securityDeposit: listing.securityDeposit,
        cleaningFee: listing.cleaningFee,
        rentalType: listing.rentalType,
        viewCount: listing.viewCount,
        bookingCount: listing.bookingCount,
        favoriteCount: listing.favoriteCount,
        createdAt: listing.createdAt,
        publishedAt: listing.publishedAt,
        photosCount: listing.photos.length,
      })),
      bookingsAsTenant: user.tenantBookings.map((booking) => ({
        id: booking.id,
        reference: booking.reference,
        listingTitle: booking.listing.title,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalNights: booking.totalNights,
        totalPrice: booking.totalPrice,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      })),
      bookingsAsOwner: user.ownerBookings.map((booking) => ({
        id: booking.id,
        reference: booking.reference,
        listingTitle: booking.listing.title,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        guests: booking.guests,
        totalNights: booking.totalNights,
        totalPrice: booking.totalPrice,
        ownerPayout: booking.ownerPayout,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        createdAt: booking.createdAt,
      })),
      reviews: {
        given: user.reviewsWritten.map((review) => ({
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
        received: user.reviewsReceived.map((review) => ({
          rating: review.rating,
          comment: review.comment,
          createdAt: review.createdAt,
        })),
      },
      favorites: user.favorites.map((fav) => ({
        listingTitle: fav.listing.title,
        createdAt: fav.createdAt,
      })),
      exportDate: new Date().toISOString(),
    };

    // Exporter en fonction du format demandé
    if (format === "csv") {
      const csvData = convertToCSV(exportData);

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="nesthub_export_${user.id}_${Date.now()}.csv"`,
        },
      });
    } else {
      // Format JSON par défaut
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="nesthub_export_${user.id}_${Date.now()}.json"`,
        },
      });
    }
  } catch (error) {
    console.error("[GET /api/users/export] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'exportation" },
      { status: 500 },
    );
  }
}

// Fonction utilitaire pour convertir les données en CSV
function convertToCSV(data: any): string {
  const rows: string[][] = [];

  // En-têtes
  rows.push(["Section", "Champ", "Valeur"]);
  rows.push([], ["INFORMATIONS PERSONNELLES"], []);

  // Données utilisateur
  rows.push(["UTILISATEUR", "ID", data.user.id]);
  rows.push(["UTILISATEUR", "Email", data.user.email]);
  rows.push(["UTILISATEUR", "Nom d'utilisateur", data.user.username || ""]);
  rows.push(["UTILISATEUR", "Prénom", data.user.firstName || ""]);
  rows.push(["UTILISATEUR", "Nom", data.user.lastName || ""]);
  rows.push(["UTILISATEUR", "Téléphone", data.user.phoneNumber || ""]);
  rows.push(["UTILISATEUR", "Rôle", data.user.role]);
  rows.push(["UTILISATEUR", "Profession", data.user.profession || ""]);
  rows.push(["UTILISATEUR", "Statut", data.user.status]);
  rows.push([
    "UTILISATEUR",
    "Email vérifié",
    data.user.isEmailVerified ? "Oui" : "Non",
  ]);
  rows.push([
    "UTILISATEUR",
    "Téléphone vérifié",
    data.user.isPhoneVerified ? "Oui" : "Non",
  ]);
  rows.push([
    "UTILISATEUR",
    "Identité vérifiée",
    data.user.isIdentityVerified ? "Oui" : "Non",
  ]);
  rows.push(["UTILISATEUR", "Langue préférée", data.user.preferredLocale]);
  rows.push(["UTILISATEUR", "Date d'inscription", data.user.createdAt]);
  rows.push(["UTILISATEUR", "Dernière connexion", data.user.lastLogin || ""]);

  // Statistiques
  if (data.stats) {
    rows.push([], ["STATISTIQUES"], []);
    rows.push([
      "STATS",
      "Score de fiabilité",
      data.stats.reliabilityScore || 0,
    ]);
    rows.push(["STATS", "Score de fraude", data.stats.fraudScore || 0]);
    rows.push(["STATS", "Total réservations", data.stats.totalBookings || 0]);
    rows.push(["STATS", "Total annonces", data.stats.totalListings || 0]);
    rows.push(["STATS", "Total avis", data.stats.totalReviews || 0]);
    rows.push(["STATS", "Note moyenne", data.stats.averageRating || 0]);
    rows.push(["STATS", "Total dépensé", data.stats.totalSpent || 0]);
    rows.push(["STATS", "Total gagné", data.stats.totalEarned || 0]);
    rows.push(["STATS", "Nombre de connexions", data.stats.loginCount || 0]);
    rows.push(["STATS", "Signalements", data.stats.reportCount || 0]);
    rows.push(["STATS", "Litiges", data.stats.disputeCount || 0]);
    rows.push(["STATS", "Annulations", data.stats.cancellationCount || 0]);
  }

  // Annonces
  if (data.listings.length > 0) {
    rows.push([], ["ANNONCES"], []);
    rows.push([
      "ANNONCE",
      "Titre",
      "Type",
      "Prix/nuit",
      "Prix/mois",
      "Gouvernorat",
      "Délégation",
      "Statut",
      "Vues",
      "Réservations",
      "Créé le",
    ]);
    data.listings.forEach((listing: any) => {
      rows.push([
        "ANNONCE",
        listing.title,
        listing.type,
        listing.pricePerNight || "",
        listing.pricePerMonth || "",
        listing.governorate,
        listing.delegation,
        listing.status,
        listing.viewCount.toString(),
        listing.bookingCount.toString(),
        new Date(listing.createdAt).toLocaleDateString(),
      ]);
    });
  }

  // Réservations comme locataire
  if (data.bookingsAsTenant.length > 0) {
    rows.push([], ["RÉSERVATIONS (LOCATAIRE)"], []);
    rows.push([
      "RÉSERVATION",
      "Logement",
      "Dates",
      "Nuits",
      "Montant",
      "Statut",
      "Date",
    ]);
    data.bookingsAsTenant.forEach((booking: any) => {
      rows.push([
        "RÉSERVATION",
        booking.listingTitle,
        `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`,
        booking.totalNights.toString(),
        `${booking.totalPrice} TND`,
        booking.status,
        new Date(booking.createdAt).toLocaleDateString(),
      ]);
    });
  }

  // Avis donnés
  if (data.reviews.given.length > 0) {
    rows.push([], ["AVIS DONNÉS"], []);
    rows.push(["AVIS", "Note", "Commentaire", "Date"]);
    data.reviews.given.forEach((review: any) => {
      rows.push([
        "AVIS",
        review.rating.toString(),
        review.comment || "",
        new Date(review.createdAt).toLocaleDateString(),
      ]);
    });
  }

  // Avis reçus
  if (data.reviews.received.length > 0) {
    rows.push([], ["AVIS REÇUS"], []);
    rows.push(["AVIS", "Note", "Commentaire", "Date"]);
    data.reviews.received.forEach((review: any) => {
      rows.push([
        "AVIS",
        review.rating.toString(),
        review.comment || "",
        new Date(review.createdAt).toLocaleDateString(),
      ]);
    });
  }

  // Favoris
  if (data.favorites.length > 0) {
    rows.push([], ["FAVORIS"], []);
    rows.push(["FAVORI", "Annonce", "Date"]);
    data.favorites.forEach((fav: any) => {
      rows.push([
        "FAVORI",
        fav.listingTitle,
        new Date(fav.createdAt).toLocaleDateString(),
      ]);
    });
  }

  rows.push([], ["DATE D'EXPORTATION", data.exportDate], []);

  return rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
}
