import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ✅ ATTENDRE params avec await
    const { id: blockedUserId } = await params;

    // Récupérer l'utilisateur qui bloque
    const blocker = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!blocker) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier si le blocage existe déjà
    const existingBlock = await prisma.block.findFirst({
      where: {
        blockerId: blocker.id,
        blockedId: blockedUserId,
      },
    });

    if (existingBlock) {
      return NextResponse.json(
        { error: "Utilisateur déjà bloqué" },
        { status: 400 },
      );
    }

    // Créer le blocage
    const block = await prisma.block.create({
      data: {
        blockerId: blocker.id,
        blockedId: blockedUserId,
      },
    });

    // Bloquer les conversations entre les deux utilisateurs
    await prisma.conversation.updateMany({
      where: {
        OR: [
          { ownerId: blocker.id, tenantId: blockedUserId },
          { ownerId: blockedUserId, tenantId: blocker.id },
        ],
      },
      data: { isBlocked: true },
    });

    return NextResponse.json({
      success: true,
      blockId: block.id,
      message: "Utilisateur bloqué avec succès",
    });
  } catch (error) {
    console.error("[users/block] POST Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Débloquer un utilisateur
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id: blockedUserId } = await params;

    const blocker = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!blocker) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Supprimer le blocage
    await prisma.block.deleteMany({
      where: {
        blockerId: blocker.id,
        blockedId: blockedUserId,
      },
    });

    // Débloquer les conversations
    await prisma.conversation.updateMany({
      where: {
        OR: [
          { ownerId: blocker.id, tenantId: blockedUserId },
          { ownerId: blockedUserId, tenantId: blocker.id },
        ],
      },
      data: { isBlocked: false },
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur débloqué avec succès",
    });
  } catch (error) {
    console.error("[users/block] DELETE Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
