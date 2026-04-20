import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { userId: clerkId } = getAuth(req);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ✅ ATTENDRE params avec await
    const { conversationId } = await params;
    const { reason } = await req.json();

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier que la conversation existe
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        owner: { select: { id: true } },
        tenant: { select: { id: true } },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    // Déterminer l'utilisateur signalé
    const reportedUserId =
      conversation.ownerId === user.id
        ? conversation.tenantId
        : conversation.ownerId;

    // Créer le rapport
    const report = await prisma.report.create({
      data: {
        conversationId,
        reporterId: user.id,
        reportedUserId: reportedUserId,
        reason: reason || "Comportement inapproprié",
        status: "PENDING",
      },
    });

    // Ajouter un message système
    await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId: reportedUserId,
        content:
          "⚠️ Cette conversation a été signalée à l'équipe de modération",
        isSystem: true,
        isBlocked: false,
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: "Conversation signalée avec succès",
    });
  } catch (error) {
    console.error("[conversations/report] POST Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
