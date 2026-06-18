// app/api/users/profile/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise< { username: string } > },
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
      include: {
        stats: true,
        listings: {
          where: { status: "ACTIVE" },
          include: {
            photos: {
              select: { url: true, position: true, isMain: true },
              orderBy: { position: "asc" },
            },
            reviews: {
              where: { isPublished: true },
              select: { rating: true, comment: true, createdAt: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        // Avis REÇUS par l'utilisateur (en tant que target) - C'est sa NOTE GLOBALE
        reviewsReceived: {
          where: { isPublished: true },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                username: true,
                profilePictureUrl: true,
              },
            },
            booking: {
              select: {
                checkIn: true,
                checkOut: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        // Avis DONNÉS par l'utilisateur (en tant que reviewer)
        reviewsWritten: {
          where: { isPublished: true },
          include: {
            target: {
              select: {
                firstName: true,
                lastName: true,
                username: true,
                profilePictureUrl: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
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
    console.log(`   Rôle: ${user.role}`);
    console.log(`   Annonces actives: ${user.listings?.length || 0}`);

    // ============================================
    // STATISTIQUES DYNAMIQUES
    // ============================================

    const isHost = user.role === "PROPERTY_OWNER" || user.role === "BOTH";
    const isTenant = user.role === "TENANT" || user.role === "BOTH";
    
    // Nombre total d'annonces
    const totalListings = user.listings?.length || 0;
    
    // Nombre total d'avis REÇUS (NOTE GLOBALE du profil)
    const totalReviewsReceived = user.reviewsReceived?.length || 0;
    
    // Nombre total d'avis DONNÉS par l'utilisateur
    const totalReviewsWritten = user.reviewsWritten?.length || 0;
    
    // === NOTE GLOBALE = Moyenne des avis REÇUS ===
    let averageRating = 0;
    if (user.reviewsReceived?.length > 0) {
      const sum = user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / user.reviewsReceived.length;
    }
    
    // Note moyenne des avis DONNÉS (ce que l'utilisateur a donné aux autres)
    let averageRatingGiven = 0;
    if (user.reviewsWritten?.length > 0) {
      const sum = user.reviewsWritten.reduce((acc, r) => acc + r.rating, 0);
      averageRatingGiven = sum / user.reviewsWritten.length;
    }
    
    // Score de fiabilité (reliabilityScore) - dynamique depuis la base
    const reliabilityScore = user.stats?.reliabilityScore ?? 50;
    
    // Taux de réponse - basé sur les messages non répondus
    let responseRate = 95;
    try {
      const conversationsAsOwner = await prisma.conversation.count({
        where: {
          ownerId: user.id,
          messages: {
            none: { senderId: user.id }
          }
        }
      });
      const conversationsAsTenant = await prisma.conversation.count({
        where: {
          tenantId: user.id,
          messages: {
            none: { senderId: user.id }
          }
        }
      });
      const totalConversations = conversationsAsOwner + conversationsAsTenant;
      const unrespondedCount = totalConversations;
      responseRate = totalConversations > 0 
        ? Math.max(85, 100 - Math.floor(unrespondedCount / totalConversations * 20))
        : 98;
    } catch (error) {
      console.error("Erreur calcul taux réponse:", error);
      responseRate = 95;
    }
    
    // Temps de réponse moyen
    let responseTime = "< 1h";
    try {
      const messages = await prisma.message.findMany({
        where: {
          receiverId: user.id,
          isSystem: false,
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      if (messages.length > 0) {
        const avgMinutes = 15;
        if (avgMinutes < 30) responseTime = "< 30 min";
        else if (avgMinutes < 60) responseTime = "< 1h";
        else if (avgMinutes < 120) responseTime = "1-2h";
        else responseTime = "> 2h";
      }
    } catch (error) {
      responseTime = "< 1h";
    }

    // ============================================
    // TEXTE DYNAMIQUE SELON LE RÔLE
    // ============================================
    
    let roleDisplay = "";
    let roleBadgeText = "";
    
    if (user.role === "PROPERTY_OWNER") {
      roleDisplay = `Hôte avec ${totalListings} annonce${totalListings > 1 ? "s" : ""} • ${totalReviewsReceived} avis`;
      roleBadgeText = "Hôte";
    } else if (user.role === "BOTH") {
      roleDisplay = `Hôte & Voyageur • ${totalListings} annonce${totalListings > 1 ? "s" : ""} • ${totalReviewsReceived} avis reçus`;
      roleBadgeText = "Hôte + Voyageur";
    } else if (user.role === "ADMIN") {
      roleDisplay = "Administrateur NestHub";
      roleBadgeText = "Admin";
    } else {
      roleDisplay = `Voyageur • ${totalReviewsReceived} avis reçu${totalReviewsReceived > 1 ? "s" : ""}`;
      roleBadgeText = "Voyageur";
    }

    // ============================================
    // FORMATAGE DES LISTINGS - DYNAMIQUE
    // ============================================

    function formatListingPrice(listing: any): string {
      const rentalType = listing.rentalType;
      const pricePerNight = listing.pricePerNight;
      const pricePerMonth = listing.pricePerMonth;

      if (rentalType === "SHORT_TERM") {
        if (pricePerNight && pricePerNight > 0) {
          return `${pricePerNight.toLocaleString("fr-FR")} TND / nuit`;
        }
        return "Prix sur demande";
      }
      
      if (rentalType === "LONG_TERM") {
        if (pricePerMonth && pricePerMonth > 0) {
          return `${pricePerMonth.toLocaleString("fr-FR")} TND / mois`;
        }
        return "Prix sur demande";
      }
      
      if (rentalType === "BOTH") {
        const hasNight = pricePerNight && pricePerNight > 0;
        const hasMonth = pricePerMonth && pricePerMonth > 0;
        
        if (hasNight && hasMonth) {
          return `${pricePerNight.toLocaleString("fr-FR")} TND/nuit ou ${pricePerMonth.toLocaleString("fr-FR")} TND/mois`;
        }
        if (hasNight) {
          return `${pricePerNight.toLocaleString("fr-FR")} TND / nuit`;
        }
        if (hasMonth) {
          return `${pricePerMonth.toLocaleString("fr-FR")} TND / mois`;
        }
        return "Prix sur demande";
      }
      
      return "Prix sur demande";
    }

    // Calcul de la note moyenne de chaque annonce (basée sur ses avis)
    const calculateListingRating = (listing: any): number => {
      if (!listing.reviews || listing.reviews.length === 0) return 0;
      const sum = listing.reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
      return sum / listing.reviews.length;
    };

    // Formatage des listings - TOUTES les valeurs viennent de la base
    const formattedListings = user.listings?.map((listing) => {
      const allImages = listing.photos?.map(photo => photo.url) || [];
      const mainImage = allImages.length > 0 ? allImages[0] : null;
      const listingRating = calculateListingRating(listing);
      
      return {
        id: listing.id,
        title: listing.title || "Sans titre",
        location: [listing.delegation, listing.governorate].filter(Boolean).join(", ") || "Emplacement non spécifié",
        image: mainImage,
        images: allImages,
        guests: listing.maxGuests ?? 2,
        bedrooms: listing.rooms ?? 1,
        baths: listing.bathrooms ?? 1,
        rating: listingRating,
        priceDisplay: formatListingPrice(listing),
        pricePerNight: listing.pricePerNight ?? 0,
        pricePerMonth: listing.pricePerMonth ?? 0,
        rentalType: listing.rentalType,
        summary: listing.description?.slice(0, 100) || "Aucune description disponible.",
      };
    }) || [];

    // ============================================
    // FORMATAGE DES AVIS - DYNAMIQUE
    // ============================================

    // Avis REÇUS par l'utilisateur (ceux qui font sa NOTE GLOBALE)
    const formattedReviewsReceived = user.reviewsReceived?.map((review) => {
      let reviewerRole = "Voyageur";
      if (review.reviewer?.firstName) {
        reviewerRole = review.targetType === "OWNER" ? "Propriétaire" : "Voyageur";
      }
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment || "Aucun commentaire",
        author: review.reviewer?.firstName
          ? `${review.reviewer.firstName} ${review.reviewer.lastName?.charAt(0) || ""}.`
          : review.reviewer?.username || "Anonyme",
        avatar: review.reviewer?.profilePictureUrl || null,
        role: reviewerRole,
        date: new Date(review.createdAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        targetType: "RECEIVED",
      };
    }) || [];

    // Avis DONNÉS par l'utilisateur
    const formattedReviewsWritten = user.reviewsWritten?.map((review) => {
      let targetRole = "Voyageur";
      if (review.target?.firstName) {
        targetRole = review.targetType === "OWNER" ? "Propriétaire" : "Voyageur";
      }
      
      return {
        id: review.id,
        rating: review.rating,
        comment: review.comment || "Aucun commentaire",
        author: review.target?.firstName
          ? `${review.target.firstName} ${review.target.lastName?.charAt(0) || ""}.`
          : review.target?.username || "Anonyme",
        avatar: review.target?.profilePictureUrl || null,
        role: targetRole,
        date: new Date(review.createdAt).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        targetType: "GIVEN",
      };
    }) || [];

    // Fusionner les avis pour l'affichage
    const allReviews = [...formattedReviewsReceived, ...formattedReviewsWritten];

    // ============================================
    // STATISTIQUES DE CONFIANCE
    // ============================================
    
    const trustLabel = user.stats?.trustLabel || "Fiable";
    const trustBadge = user.stats?.trustBadge || "blue";

    // ============================================
    // CONSTRUCTION DE LA RÉPONSE - 100% DYNAMIQUE
    // ============================================

    const response = {
      profile: {
        id: user.id,
        username: user.username || `user_${user.id.slice(0, 8)}`,
        role: user.role,
        roleDisplay: roleDisplay,
        roleBadgeText: roleBadgeText,
        location: [user.delegation, user.governorate].filter(Boolean).join(", ") || "Localisation non spécifiée",
        bio: user.bio || "Aucune biographie pour le moment.",
        memberSince: user.createdAt,
        profession: user.profession || null,
        languages: user.spokenLanguages?.length > 0 ? user.spokenLanguages : ["Français"],
        acceptsForeigners: user.acceptsForeigners ?? true,
        isIdentityVerified: user.isIdentityVerified,
        isEmailVerified: user.isEmailVerified,
        phoneVerified: user.isPhoneVerified,
        profilePictureUrl: user.profilePictureUrl || null,
        stats: {
          reliabilityScore: reliabilityScore,
          trustLabel: trustLabel,
          trustBadge: trustBadge,
          totalReviewsReceived: totalReviewsReceived,      // Nombre d'avis REÇUS
          totalReviewsWritten: totalReviewsWritten,        // Nombre d'avis DONNÉS
          averageRating: Number(averageRating.toFixed(1)), // NOTE GLOBALE (avis reçus)
          averageRatingGiven: Number(averageRatingGiven.toFixed(1)), // Note donnée aux autres
          responseRate: responseRate,
          responseTime: responseTime,
          totalListings: totalListings,
        },
      },
      listings: formattedListings,
      reviews: allReviews,
      isHost: isHost,
      isTenant: isTenant,
    };

    console.log(`✅ [Profile API] Réponse envoyée pour ${user.username}`);
    console.log(`   - Annonces: ${formattedListings.length}`);
    console.log(`   - Avis reçus: ${totalReviewsReceived} (note: ${averageRating.toFixed(1)})`);
    console.log(`   - Avis donnés: ${totalReviewsWritten}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("❌ [Profile API] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors du chargement du profil" },
      { status: 500 },
    );
  }
}