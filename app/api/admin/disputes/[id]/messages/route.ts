// app/api/admin/disputes/[id]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { userId } = await auth();
    const { id } = await params;
    const { content, recipient } = await request.json();

    if (!userId || !content) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, firstName: true, lastName: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            tenant: true,
            owner: true,
            listing: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Déterminer qui est le demandeur et le défendeur
    const isPlaintiffOwner = dispute.openedBy === dispute.booking?.owner?.id;
    const plaintiff = isPlaintiffOwner
      ? dispute.booking?.owner
      : dispute.booking?.tenant;
    const defendant = isPlaintiffOwner
      ? dispute.booking?.tenant
      : dispute.booking?.owner;
    const listing = dispute.booking?.listing;

    let groupConversation = null;
    let messageRecord = null;

    if (recipient === "BOTH") {
      // ✅ RÉCUPÉRER OU CRÉER LA CONVERSATION DE GROUPE
      groupConversation = await prisma.groupConversation.findFirst({
        where: {
          disputeId: dispute.id,
          status: "ACTIVE",
        },
      });

      if (!groupConversation) {
        // Créer le groupe avec les 3 participants
        groupConversation = await prisma.groupConversation.create({
          data: {
            name: `Litige: ${listing?.title}`,
            listingId: listing.id,
            disputeId: dispute.id,
            status: "ACTIVE",
            lastMessage: content,
            lastMessageAt: new Date(),
            participants: {
              create: [
                { userId: admin.id, unreadCount: 0 },
                { userId: plaintiff.id, unreadCount: 1 },
                { userId: defendant.id, unreadCount: 1 },
              ],
            },
          },
          include: {
            participants: true,
          },
        });
      } else {
        // Mettre à jour le dernier message du groupe
        groupConversation = await prisma.groupConversation.update({
          where: { id: groupConversation.id },
          data: {
            lastMessage: content,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
          include: {
            participants: true,
          },
        });

        // Incrémenter les compteurs de non lus pour les autres participants
        await prisma.groupConversationParticipant.updateMany({
          where: {
            groupId: groupConversation.id,
            userId: { not: admin.id },
          },
          data: {
            unreadCount: { increment: 1 },
          },
        });
      }

      // ✅ CRÉER LE MESSAGE DANS LE GROUPE
      messageRecord = await prisma.groupConversationMessage.create({
        data: {
          groupId: groupConversation.id,
          senderId: admin.id,
          content: content,
          readBy: [admin.id],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // ✅ NOTIFICATIONS POUR LES DEUX PARTIES
      for (const party of [plaintiff, defendant]) {
        if (party?.id) {
          await prisma.notification.create({
            data: {
              userId: party.id,
              type: "DISPUTE_MESSAGE",
              title: "💬 Nouveau message dans le groupe",
              content: `Un administrateur a répondu au litige concernant "${listing?.title}".`,
              channels: ["IN_APP", "EMAIL"],
              data: {
                disputeId: dispute.id,
                groupConversationId: groupConversation.id,
                messageId: messageRecord.id,
              },
            },
          });
        }
      }
    } else {
      // ✅ Messages PRIVÉS (conversation 1-1 avec l'admin)
      const targetUser =
        recipient === "OWNER"
          ? dispute.booking?.owner
          : dispute.booking?.tenant;

      if (targetUser?.id) {
        // Trouver ou créer une conversation privée
        let privateConversation = await prisma.conversation.findFirst({
          where: {
            OR: [
              { ownerId: admin.id, tenantId: targetUser.id },
              { ownerId: targetUser.id, tenantId: admin.id },
            ],
          },
        });

        if (!privateConversation) {
          privateConversation = await prisma.conversation.create({
            data: {
              listingId: listing.id,
              ownerId: admin.id,
              tenantId: targetUser.id,
              status: "OPEN",
              lastMessage: content,
              lastMessageAt: new Date(),
            },
          });
        } else {
          await prisma.conversation.update({
            where: { id: privateConversation.id },
            data: {
              lastMessage: content,
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }

        // Créer le message privé
        messageRecord = await prisma.message.create({
          data: {
            conversationId: privateConversation.id,
            senderId: admin.id,
            receiverId: targetUser.id,
            content: content,
            type: "text",
          },
        });

        // Mettre à jour le compteur de non lus
        const unreadField =
          targetUser.role === "PROPERTY_OWNER"
            ? "unreadCountOwner"
            : "unreadCountTenant";
        await prisma.conversation.update({
          where: { id: privateConversation.id },
          data: {
            [unreadField]: { increment: 1 },
          },
        });

        // Notification privée
        await prisma.notification.create({
          data: {
            userId: targetUser.id,
            type: "DISPUTE_MESSAGE",
            title: "💬 Message privé concernant votre litige",
            content: `Un administrateur vous a envoyé un message privé concernant "${listing?.title}".`,
            channels: ["IN_APP", "EMAIL"],
            data: {
              disputeId: dispute.id,
              conversationId: privateConversation.id,
              isPrivate: true,
            },
          },
        });
      }
    }

    // ✅ CRÉER AUSSI LE MESSAGE DANS LE LITIGE (pour l'historique admin)
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId: id,
        senderId: admin.id,
        content: content,
        attachments: [],
        isInternal: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            role: true,
          },
        },
      },
    });

    const formattedMessage = {
      id: disputeMessage.id,
      senderId: disputeMessage.senderId,
      senderName:
        `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || "Admin",
      senderRole: "ADMIN" as const,
      content: disputeMessage.content,
      attachments: disputeMessage.attachments,
      createdAt: disputeMessage.createdAt.toISOString(),
      recipientRole:
        recipient === "BOTH"
          ? "BOTH"
          : recipient === "OWNER"
            ? "OWNER"
            : "TENANT",
      groupId: groupConversation?.id || null,
      isGroup: recipient === "BOTH",
    };

    return NextResponse.json(formattedMessage, { status: 201 });
  } catch (error) {
    console.error("Erreur envoi message admin:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
