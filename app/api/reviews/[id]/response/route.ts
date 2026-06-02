import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// ⚠️ IMPORTANT: Le paramètre s'appelle "id" car le dossier est [id]
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { response } = await req.json();

    if (!response || response.trim().length === 0) {
      return NextResponse.json({ error: "La réponse ne peut pas être vide" }, { status: 400 });
    }

    // 🔧 Solution 1: Attendre les params si c'est une Promise
    const resolvedParams = params instanceof Promise ? await params : params;
    const reviewId = resolvedParams.id;

    console.log("📝 reviewId reçu:", reviewId);

    if (!reviewId) {
      return NextResponse.json({ error: "ID de l'avis manquant" }, { status: 400 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer l'avis avec les relations nécessaires
    const review = await prisma.review.findFirst({
      where: { id: reviewId },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                ownerId: true
              }
            }
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur est la CIBLE de l'avis
    const isTarget = review.targetId === user.id;
    const isOwner = review.booking.listing.ownerId === user.id;
    const isAdmin = user.role === "ADMIN";

    if (!isTarget && !isOwner && !isAdmin) {
      console.log(`❌ Non autorisé:`);
      console.log(`   - user.id: ${user.id}`);
      console.log(`   - review.targetId: ${review.targetId}`);
      return NextResponse.json({ 
        error: "Vous n'êtes pas autorisé à répondre à cet avis" 
      }, { status: 403 });
    }

    console.log(`✅ Autorisation accordée pour répondre à l'avis ${reviewId}`);

    // Mettre à jour la réponse
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        response: response.trim(),
        responseAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      review: updatedReview,
      message: "Réponse publiée avec succès"
    });
  } catch (error) {
    console.error("Erreur lors de la réponse:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}