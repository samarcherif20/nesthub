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
                bookings: {
                  where: {
                    review: {
                      isNot: null
                    }
                  },
                  include: {
                    review: true
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
      
      // Calculer la note moyenne à partir des reviews des bookings
      const reviews = listing.bookings
        .filter(b => b.review !== null)
        .map(b => b.review);
      
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

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        listingId: listingId,
      },
    });

    await prisma.listing.update({
      where: { id: listingId },
      data: { favoriteCount: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      favorite,
      message: "Ajouté aux favoris",
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