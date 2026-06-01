import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer tous les favoris de l'utilisateur connecté
export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        favorites: {
          include: {
            listing: {
              include: {
                photos: {
                  take: 1,
                  orderBy: { position: "asc" }
                },
                owner: {
                  select: {
                    isIdentityVerified: true
                  }
                },
                // ✅ CORRECTION 1: review → reviews (pluriel)
                bookings: {
                  where: {
                    reviews: {  // ← reviews (pluriel)
                      some: {}  // Au moins un avis
                    }
                  },
                  include: {
                    reviews: {  // ← reviews (pluriel)
                      take: 1,
                      select: {
                        rating: true,
                        comment: true,
                        targetType: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const favorites = user.favorites.map((fav) => {
      const listing = fav.listing;
      
      // ✅ CORRECTION 2: Utiliser reviews (pluriel) au lieu de review
      const reviews = listing.bookings
        .filter(b => b.reviews && b.reviews.length > 0)
        .flatMap(b => b.reviews);  // ← flatMap pour aplatir le tableau
      
      let averageRating = null;
      let reviewCount = 0;
      
      if (reviews.length > 0) {
        reviewCount = reviews.length;
        const sum = reviews.reduce((acc, review) => acc + (review?.rating || 0), 0);
        averageRating = parseFloat((sum / reviewCount).toFixed(1));
      }
      
      return {
        id: listing.id,
        title: listing.title,
        location: `${listing.governorate || ""}, ${listing.delegation || ""}`,
        pricePerNight: listing.pricePerNight,
        price: listing.pricePerNight,
        rating: averageRating,
        reviewCount: reviewCount,
        image: listing.photos[0]?.url || null,
        type: listing.type,
        isVerified: listing.owner?.isIdentityVerified || false,
        bedrooms: listing.rooms,
        bathrooms: listing.bathrooms,
        maxGuests: listing.maxGuests,
        trustScore: listing.trustScore,
        amenities: listing.equipment,
        createdAt: fav.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      favorites,
      count: favorites.length,
    });
  } catch (error) {
    console.error("Erreur GET /api/users/favorites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Ajouter un favori
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { listingId } = await req.json();

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Logement non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si le favori existe déjà
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId,
        },
      },
    });

    let favorite;
    let message;

    if (existingFavorite) {
      // Si déjà existant, on ne fait rien ou on le supprime (toggle)
      // Ici on choisit de le garder
      favorite = existingFavorite;
      message = "Déjà dans les favoris";
    } else {
      favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          listingId: listingId,
        },
      });

      await prisma.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { increment: 1 } },
      });
      message = "Ajouté aux favoris";
    }

    return NextResponse.json({
      success: true,
      favorite,
      message,
    });
  } catch (error) {
    console.error("Erreur POST /api/users/favorites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un favori
export async function DELETE(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json(
        { error: "listingId requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si le favori existe avant de le supprimer
    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId,
        },
      },
    });

    if (favorite) {
      await prisma.favorite.delete({
        where: {
          userId_listingId: {
            userId: user.id,
            listingId: listingId,
          },
        },
      });

      await prisma.listing.update({
        where: { id: listingId },
        data: { favoriteCount: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Retiré des favoris",
    });
  } catch (error) {
    console.error("Erreur DELETE /api/users/favorites:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}