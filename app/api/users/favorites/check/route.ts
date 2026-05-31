import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Vérifier si un listing est dans les favoris de l'utilisateur
export async function GET(req: NextRequest) {
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

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: user.id,
          listingId: listingId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      isFavorite: !!favorite,
    });
  } catch (error) {
    console.error("Erreur GET /api/users/favorites/check:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}