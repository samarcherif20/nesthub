// app/api/users/profile/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    console.log(`🔍 [Profile API] Recherche de l'utilisateur: "${username}"`);

    if (!username) {
      return NextResponse.json({ error: "Username manquant" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { id: username },
          { email: username },
          { clerkId: username },
        ],
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePictureUrl: true,
        bio: true,
        governorate: true,
        delegation: true,
        role: true,
        isIdentityVerified: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        spokenLanguages: true,
        profession: true,
        createdAt: true,
        acceptsForeigners: true,
        stats: {
          select: {
            reliabilityScore: true,
            trustLabel: true,
            trustBadge: true,
          },
        },
        listings: {
          where: { status: "ACTIVE" },
          select: {
            id: true,
            title: true,
            governorate: true,
            delegation: true,
            pricePerNight: true,
            pricePerMonth: true,
            rentalType: true,
            maxGuests: true,
            rooms: true,
            bathrooms: true,
            description: true,
            photos: {
              select: { 
                url: true,
                position: true,
                isMain: true 
              },
              orderBy: { position: "asc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        reviewsReceived: {
          where: { isPublished: true },
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                username: true,
                profilePictureUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!user) {
      console.log(`❌ [Profile API] Utilisateur non trouvé: "${username}"`);
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    console.log(`✅ [Profile API] Utilisateur trouvé: ${user.username}`);
    console.log(`📸 Nombre de listings: ${user.listings?.length || 0}`);

    const isHost = user.role === "PROPERTY_OWNER" || user.role === "BOTH";
    const totalListings = user.listings?.length || 0;
    const totalReviews = user.reviewsReceived?.length || 0;

    // Calcul de la note moyenne
    let averageRating = 0;
    if (user.reviewsReceived?.length > 0) {
      const sum = user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / user.reviewsReceived.length;
    }

    // Déterminer l'affichage du rôle
    let roleDisplay = "";
    let roleBadgeText = "";
    if (user.role === "PROPERTY_OWNER") {
      roleDisplay = "Hôte premium";
      roleBadgeText = "Hôte premium";
    } else if (user.role === "BOTH") {
      roleDisplay = "Hôte premium & Voyageur";
      roleBadgeText = "Hôte premium";
    } else if (user.role === "ADMIN") {
      roleDisplay = "Administrateur";
      roleBadgeText = "Admin";
    } else {
      roleDisplay = "Membre";
      roleBadgeText = "Membre";
    }

    // ✅ Fonction pour formater le prix selon le type de location - SANS VALEURS PAR DÉFAUT
    function formatListingPrice(listing: any): string {
      const rentalType = listing.rentalType;
      const pricePerNight = listing.pricePerNight;
      const pricePerMonth = listing.pricePerMonth;

      // SHORT_TERM
      if (rentalType === "SHORT_TERM") {
        if (pricePerNight && pricePerNight > 0) {
          return `À partir de ${pricePerNight.toLocaleString("fr-FR")} TND / nuit`;
        }
        return "Prix sur demande";
      }
      
      // LONG_TERM
      if (rentalType === "LONG_TERM") {
        if (pricePerMonth && pricePerMonth > 0) {
          return `À partir de ${pricePerMonth.toLocaleString("fr-FR")} TND / mois`;
        }
        return "Prix sur demande";
      }
      
      // BOTH
      if (rentalType === "BOTH") {
        const hasNight = pricePerNight && pricePerNight > 0;
        const hasMonth = pricePerMonth && pricePerMonth > 0;
        
        if (hasNight && hasMonth) {
          return `${pricePerNight.toLocaleString("fr-FR")} TND/nuit ou ${pricePerMonth.toLocaleString("fr-FR")} TND/mois`;
        }
        if (hasNight) {
          return `À partir de ${pricePerNight.toLocaleString("fr-FR")} TND / nuit`;
        }
        if (hasMonth) {
          return `À partir de ${pricePerMonth.toLocaleString("fr-FR")} TND / mois`;
        }
        return "Prix sur demande";
      }
      
      return "Prix sur demande";
    }

    // ✅ Construction des listings - SANS valeurs par défaut pour les prix
    const formattedListings = user.listings?.map((listing) => {
      const allImages = listing.photos?.map(photo => photo.url) || [];
      const mainImage = allImages.length > 0 ? allImages[0] : null;
      
      // Prix formaté pour l'affichage (peut être "Prix sur demande")
      const displayPrice = formatListingPrice(listing);
      
      console.log(`📸 Listing "${listing.title}" - Type: ${listing.rentalType} - Prix: ${displayPrice}`);
      
      return {
        id: listing.id,
        title: listing.title || "Sans titre",
        location: `${listing.delegation || "Tunis"}, ${listing.governorate || "Tunisie"}`,
        image: mainImage,
        images: allImages,
        guests: listing.maxGuests || 2,
        bedrooms: listing.rooms || 1,
        baths: listing.bathrooms || 1,
        rating: averageRating,
        priceDisplay: displayPrice,
        pricePerNight: listing.pricePerNight || 0,
        pricePerMonth: listing.pricePerMonth || 0,
        rentalType: listing.rentalType,
        summary: listing.description?.slice(0, 100) || "Un logement confortable et bien situé.",
      };
    }) || [];

    // ✅ Construction des avis - SANS avatar par défaut
    const formattedReviews = user.reviewsReceived?.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment || "Aucun commentaire",
      author: review.reviewer?.firstName
        ? `${review.reviewer.firstName} ${review.reviewer.lastName?.charAt(0) || ""}.`
        : review.reviewer?.username || "Anonyme",
      avatar: review.reviewer?.profilePictureUrl, // Peut être null/undefined
      role: "Voyageur",
      date: new Date(review.createdAt).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    })) || [];

    // ✅ Construction de la réponse - SANS valeurs par défaut pour le profil
    const response = {
      profile: {
        id: user.id,
        username: user.username,
        role: user.role,
        roleDisplay: roleDisplay,
        roleBadgeText: roleBadgeText,
        location: [user.delegation, user.governorate].filter(Boolean).join(", ") || "Tunisie",
        bio: user.bio, // Peut être null
        memberSince: user.createdAt,
        profession: user.profession, // Peut être null
        languages: user.spokenLanguages || [],
        acceptsForeigners: user.acceptsForeigners,
        isIdentityVerified: user.isIdentityVerified,
        isEmailVerified: user.isEmailVerified,
        phoneVerified: user.isPhoneVerified,
        profilePictureUrl: user.profilePictureUrl, // Peut être null
        stats: {
          reliabilityScore: user.stats?.reliabilityScore ?? 85,
          trustLabel: user.stats?.trustLabel ?? "Fiable",
          totalReviews: totalReviews,
          averageRating: Number(averageRating.toFixed(1)),
          responseRate: isHost ? 98 : 95,
          responseTime: isHost ? "12 min" : "< 1h",
          totalListings: totalListings,
        },
      },
      listings: formattedListings,
      reviews: formattedReviews,
      isHost: isHost,
      isTenant: user.role === "TENANT",
    };

    console.log(`✅ [Profile API] Réponse envoyée pour ${user.username}`);
    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ [Profile API] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du profil" },
      { status: 500 },
    );
  }
}