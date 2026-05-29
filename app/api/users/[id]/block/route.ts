// app/api/users/[id]/block/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

//  GET - Vérifier le statut de blocage
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: targetUserId } = await params;

    // Récupérer l'utilisateur courant
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, firstName: true, lastName: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Vérifier si l'utilisateur courant a bloqué la cible
    const hasBlockedUser = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUser.id,
          blockedId: targetUserId
        }
      }
    });

    // Vérifier si la cible a bloqué l'utilisateur courant
    const isBlockedByUser = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: targetUserId,
          blockedId: currentUser.id
        }
      }
    });

    // Récupérer le nom de la cible
    const target = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { firstName: true, lastName: true }
    });

    const targetName = target 
      ? `${target.firstName || ""} ${target.lastName || ""}`.trim()
      : "cet utilisateur";

    return NextResponse.json({
      hasBlockedUser: !!hasBlockedUser,
      isBlockedByUser: !!isBlockedByUser,
      targetName
    });
  } catch (error) {
    console.error("Error in block GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

//  POST - Bloquer ou débloquer un utilisateur
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: blockedUserId } = await params;

    // Récupérer l'utilisateur courant
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (currentUser.id === blockedUserId) {
      return NextResponse.json({ error: "Cannot block yourself" }, { status: 400 });
    }

    // Vérifier si déjà bloqué
    const existingBlock = await prisma.block.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId: currentUser.id,
          blockedId: blockedUserId
        }
      }
    });

    if (existingBlock) {
      //  DÉBLOQUER
      await prisma.block.delete({
        where: {
          blockerId_blockedId: {
            blockerId: currentUser.id,
            blockedId: blockedUserId
          }
        }
      });
      
      //  NE PAS débloquer la conversation (laisser isBlocked pour la modération seulement)
      // La conversation reste active, seul le blocage utilisateur est supprimé
      
      return NextResponse.json({ success: true, action: "unblocked" });
    } else {
      //  BLOQUER
      await prisma.block.create({
        data: {
          blockerId: currentUser.id,
          blockedId: blockedUserId
        }
      });
    
      //  NE PAS bloquer la conversation (isBlocked est réservé à la modération)
      // Le blocage utilisateur est géré séparément via la table Block
      
      return NextResponse.json({ success: true, action: "blocked" });
    }
  } catch (error) {
    console.error("Error in block POST API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}