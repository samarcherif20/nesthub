import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { moderateMessage } from "@/lib/ai-moderation";
import { del } from "@vercel/blob";

// GET - Récupérer les messages d'une conversation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ ownerId: user.id }, { tenantId: user.id }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Marquer les messages non lus comme lus
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    if (conversation.ownerId === user.id) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCountOwner: 0 },
      });
    } else {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { unreadCountTenant: 0 },
      });
    }

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.senderId,
      senderName:
        `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim() ||
        "Utilisateur",
      senderImage: msg.sender.profilePictureUrl,
      createdAt: msg.createdAt.toISOString(),
      isBlocked: msg.isBlocked,
      isRead: msg.isRead,
      isSystem: msg.isSystem || false,
      type: msg.type || "text",
      voiceUrl: msg.voiceUrl,
      duration: msg.duration,
    }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("[GET /api/conversations/messages] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors du chargement des messages" },
      { status: 500 },
    );
  }
}
// POST - Envoyer un message (version corrigée avec vérification du statut)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { content } = await req.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Le message ne peut pas être vide" },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ ownerId: user.id }, { tenantId: user.id }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    // 🔥 ============================================
    // 🔥 VÉRIFICATION CRUCIALE : STATUT DE LA CONVERSATION
    // 🔥 ============================================

    // 1. Vérifier si la conversation est bloquée par un modérateur
    if (conversation.isBlocked) {
      return NextResponse.json(
        {
          error:
            "Cette conversation a été bloquée par un modérateur. Vous ne pouvez plus envoyer de messages.",
          code: "CONVERSATION_BLOCKED",
        },
        { status: 403 },
      );
    }

    // 2. Vérifier si la conversation est fermée (seul OPEN permet d'envoyer)
    if (conversation.status !== "OPEN") {
      let errorMessage =
        "Cette conversation est fermée. Vous ne pouvez plus envoyer de messages.";

      if (conversation.status === "CLOSED_BY_ADMIN") {
        errorMessage =
          "Cette conversation a été fermée par un modérateur. Vous ne pouvez plus envoyer de messages.";
      } else if (conversation.status === "CLOSED_BY_OWNER") {
        errorMessage =
          "Le propriétaire a fermé cette conversation. Vous ne pouvez plus envoyer de messages.";
      } else if (conversation.status === "CLOSED_BY_TENANT") {
        errorMessage =
          "Le locataire a fermé cette conversation. Vous ne pouvez plus envoyer de messages.";
      } else if (conversation.status === "EXPIRED") {
        errorMessage =
          "Cette conversation a expiré. Vous ne pouvez plus envoyer de messages.";
      }

      return NextResponse.json(
        {
          error: errorMessage,
          code: "CONVERSATION_CLOSED",
          status: conversation.status,
        },
        { status: 403 },
      );
    }

    // 3. Vérifier si l'utilisateur n'a pas bloqué l'autre
    const blockExists = await prisma.block.findFirst({
      where: {
        OR: [
          {
            blockerId: user.id,
            blockedId:
              conversation.ownerId === user.id
                ? conversation.tenantId
                : conversation.ownerId,
          },
          {
            blockerId:
              conversation.ownerId === user.id
                ? conversation.tenantId
                : conversation.ownerId,
            blockedId: user.id,
          },
        ],
      },
    });

    if (blockExists) {
      return NextResponse.json(
        {
          error: "Vous ne pouvez plus envoyer de messages à cet utilisateur.",
          code: "USER_BLOCKED",
        },
        { status: 403 },
      );
    }

    // ============================================
    // FIN DES VÉRIFICATIONS - CONTINUER L'ENVOI
    // ============================================

    const receiverId =
      conversation.ownerId === user.id
        ? conversation.tenantId
        : conversation.ownerId;

    let isBlocked = false;
    let blockedReason = null;
    let finalContent = content;

    // ... reste de ton code de modération et d'envoi ...
    try {
      const moderation = await moderateMessage(content);
      if (moderation.isBlocked) {
        isBlocked = true;
        blockedReason = moderation.reason;
        finalContent = `[Message bloqué - ${moderation.reason}]`;
      }
    } catch (error) {
      // fallback regex
      const phoneRegex =
        /(\+216)?[ \-\s]?[259][0-9]{7,8}|[0-9]{2}[-\s]?[0-9]{3}[-\s]?[0-9]{3}/;
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const ibanRegex = /TN\d{20}/;
      const urlRegex = /(https?:\/\/[^\s]+)/g;

      if (phoneRegex.test(content)) {
        isBlocked = true;
        blockedReason = "Numéro de téléphone détecté";
        finalContent =
          "[Message bloqué - Ne partagez pas vos coordonnées personnelles]";
      } else if (emailRegex.test(content)) {
        isBlocked = true;
        blockedReason = "Adresse email détectée";
        finalContent =
          "[Message bloqué - Ne partagez pas vos coordonnées personnelles]";
      } else if (ibanRegex.test(content)) {
        isBlocked = true;
        blockedReason = "IBAN détecté";
        finalContent =
          "[Message bloqué - Ne partagez pas vos informations bancaires]";
      } else if (urlRegex.test(content)) {
        isBlocked = true;
        blockedReason = "Lien URL détecté";
        finalContent =
          "[Message bloqué - Les liens externes ne sont pas autorisés]";
      }
    }

    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: user.id,
        receiverId,
        content: finalContent,
        isBlocked,
        blockedReason,
        isSystem: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: finalContent.substring(0, 100),
        lastMessageAt: new Date(),
        ...(conversation.ownerId === user.id
          ? { unreadCountTenant: { increment: 1 } }
          : { unreadCountOwner: { increment: 1 } }),
      },
    });

    const senderName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : "Quelqu'un";

    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: "NEW_MESSAGE",
        title: "Nouveau message",
        content: `${senderName} vous a envoyé un message.`,
        data: {
          conversationId,
          messageId: message.id,
        },
        channels: ["IN_APP", "EMAIL"],
      },
    });

    return NextResponse.json({
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName:
        `${message.sender.firstName || ""} ${message.sender.lastName || ""}`.trim(),
      senderImage: message.sender.profilePictureUrl,
      createdAt: message.createdAt.toISOString(),
      isBlocked: message.isBlocked,
      isRead: message.isRead,
      isSystem: false,
      type: "text",
    });
  } catch (error) {
    console.error("[POST /api/conversations/messages] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de l'envoi du message" },
      { status: 500 },
    );
  }
}

// DELETE - Supprimer un message spécifique OU tous les messages d'une conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const deleteAll = searchParams.get("deleteAll") === "true";

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ ownerId: user.id }, { tenantId: user.id }],
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    const receiverId =
      conversation.ownerId === user.id
        ? conversation.tenantId
        : conversation.ownerId;

    // ============================================
    // CAS 1: SUPPRIMER TOUS LES MESSAGES DE LA CONVERSATION
    // ============================================
    if (deleteAll) {
      console.log(
        `🗑️ Suppression de tous les messages de la conversation ${conversationId}`,
      );

      // 1. Récupérer tous les messages vocaux pour supprimer les blobs
      const voiceMessages = await prisma.message.findMany({
        where: {
          conversationId,
          type: "voice",
          voiceUrl: { not: null },
        },
        select: { voiceUrl: true },
      });

      // 2. Supprimer les fichiers audio de Vercel Blob
      for (const msg of voiceMessages) {
        if (msg.voiceUrl) {
          try {
            const url = new URL(msg.voiceUrl);
            const pathname = url.pathname;
            await del(pathname);
            console.log("🗑️ Audio supprimé:", pathname);
          } catch (err) {
            console.log("⚠️ Impossible de supprimer l'audio:", err);
          }
        }
      }

      // 3. Supprimer tous les messages de la base de données
      const deleted = await prisma.message.deleteMany({
        where: { conversationId },
      });

      console.log(`✅ ${deleted.count} messages supprimés de la DB`);

      // 4. Ajouter un message système indiquant l'effacement
      const systemMessage = await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          receiverId,
          content: "🗑️ L'historique des messages a été effacé",
          isSystem: true,
          isBlocked: false,
        },
      });

      // 5. Mettre à jour la conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: "🗑️ L'historique des messages a été effacé",
          lastMessageAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        deletedCount: deleted.count,
        systemMessageId: systemMessage.id,
        message: `${deleted.count} messages supprimés`,
      });
    }

    // ============================================
    // CAS 2: SUPPRIMER UN SEUL MESSAGE SPÉCIFIQUE
    // ============================================
    if (!messageId) {
      return NextResponse.json(
        { error: "Paramètre requis: messageId ou deleteAll=true" },
        { status: 400 },
      );
    }

    console.log(
      `🗑️ Suppression du message ${messageId} dans la conversation ${conversationId}`,
    );

    // Vérifier que le message existe et appartient à l'utilisateur
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        conversationId,
        senderId: user.id, // L'utilisateur ne peut supprimer que ses propres messages
      },
    });

    if (!message) {
      return NextResponse.json(
        {
          error:
            "Message non trouvé ou vous n'êtes pas autorisé à le supprimer",
        },
        { status: 404 },
      );
    }

    // Si c'est un message vocal, supprimer le fichier audio
    if (message.type === "voice" && message.voiceUrl) {
      try {
        const url = new URL(message.voiceUrl);
        const pathname = url.pathname;
        await del(pathname);
        console.log("🗑️ Audio supprimé:", pathname);
      } catch (err) {
        console.log("⚠️ Impossible de supprimer l'audio:", err);
      }
    }

    // Supprimer le message
    await prisma.message.delete({
      where: { id: messageId },
    });

    console.log(`✅ Message ${messageId} supprimé`);

    // Récupérer le dernier message pour mettre à jour la conversation
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
    });

    // Mettre à jour la conversation
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: lastMessage?.content || null,
        lastMessageAt: lastMessage?.createdAt || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      deletedMessageId: messageId,
      message: "Message supprimé avec succès",
    });
  } catch (error) {
    console.error("[DELETE /api/conversations/messages] Erreur:", error);
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la suppression" },
      { status: 500 },
    );
  }
}
