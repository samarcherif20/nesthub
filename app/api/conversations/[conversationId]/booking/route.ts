// app/api/conversations/[conversationId]/booking/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }  
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cette conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,  // ← Utiliser conversationId déstructuré
        OR: [
          { ownerId: user.id },
          { tenantId: user.id }
        ]
      },
      include: {
        booking: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            escrowStatus: true,
            checkInConfirmedAt: true,
            paymentStatus: true,
            reference: true,
            totalPrice: true,
          }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      booking: conversation.booking,
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}