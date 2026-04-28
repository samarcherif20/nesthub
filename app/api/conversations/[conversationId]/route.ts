// app/api/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ conversationId: string }>;
}

// GET - Récupérer les détails d'une conversation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { conversationId } = await params;

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            stats: {
              select: {
                reliabilityScore: true,
              },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            stats: {
              select: {
                reliabilityScore: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
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
        },
        reports: {
          where: { status: "PENDING" },
          select: { id: true, reason: true, createdAt: true },
        },
        adminNotes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que l'utilisateur fait partie de la conversation ou est admin
    if (
      conversation.ownerId !== currentUser.id &&
      conversation.tenantId !== currentUser.id &&
      currentUser.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const formattedMessages = conversation.messages.map((message) => ({
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      senderId: message.senderId,
      senderName:
        message.sender.firstName && message.sender.lastName
          ? `${message.sender.firstName} ${message.sender.lastName}`
          : message.sender.email || "Utilisateur",
      senderAvatar: message.sender.profilePictureUrl,
      isRead: message.isRead,
      isSystem: message.isSystem,
    }));

    const formattedNotes = conversation.adminNotes.map((note) => {
      let adminDisplayName = "Admin";

      if (note.author.firstName && note.author.lastName) {
        adminDisplayName = `${note.author.firstName} ${note.author.lastName}`;
      } else if (note.author.firstName) {
        adminDisplayName = note.author.firstName;
      } else if (note.author.lastName) {
        adminDisplayName = note.author.lastName;
      } else if (note.author.email) {
        adminDisplayName = note.author.email.split("@")[0].replace(/\+.*$/, "");
      }

      return {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        adminName: adminDisplayName,
      };
    });
    const ownerReliability = conversation.owner.stats?.reliabilityScore || 50;
    const tenantReliability = conversation.tenant.stats?.reliabilityScore || 50;

    const response = {
      id: conversation.id,
      listing: {
        id: conversation.listing.id,
        title: conversation.listing.title,
        reference: `#${conversation.id.slice(-6)}`,
      },
      participants: {
        owner: {
          id: conversation.owner.id,
          firstName: conversation.owner.firstName || "",
          lastName: conversation.owner.lastName || "",
          fullName:
            `${conversation.owner.firstName || ""} ${conversation.owner.lastName || ""}`.trim() ||
            conversation.owner.email,
          avatar: conversation.owner.profilePictureUrl,
          role: "OWNER",
          reliabilityScore: ownerReliability,
        },
        tenant: {
          id: conversation.tenant.id,
          firstName: conversation.tenant.firstName || "",
          lastName: conversation.tenant.lastName || "",
          fullName:
            `${conversation.tenant.firstName || ""} ${conversation.tenant.lastName || ""}`.trim() ||
            conversation.tenant.email,
          avatar: conversation.tenant.profilePictureUrl,
          role: "TENANT",
          reliabilityScore: tenantReliability,
        },
      },
      messages: formattedMessages,
      notes: formattedNotes,
      status: conversation.status,
      isBlocked: conversation.isBlocked,
      reportCount: conversation.reports.length,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour le statut d'une conversation
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { conversationId } = await params;
    const body = await request.json();
    const { action } = body;

    let updateData: any = {};

    switch (action) {
      case "MARK_READ":
        await prisma.message.updateMany({
          where: {
            conversationId: conversationId,
            receiverId: currentUser.id,
            isRead: false,
          },
          data: { isRead: true, readAt: new Date() },
        });
        return NextResponse.json({ success: true });

      case "FLAG":
        if (currentUser.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Accès non autorisé" },
            { status: 403 },
          );
        }
        updateData = { isBlocked: true };
        break;

      case "UNFLAG":
        if (currentUser.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Accès non autorisé" },
            { status: 403 },
          );
        }
        updateData = { isBlocked: false };
        break;

      case "CLOSE":
        if (currentUser.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Accès non autorisé" },
            { status: 403 },
          );
        }
        updateData = { status: "CLOSED_BY_ADMIN" };
        break;

      case "REOPEN":
        if (currentUser.role !== "ADMIN") {
          return NextResponse.json(
            { error: "Accès non autorisé" },
            { status: 403 },
          );
        }
        updateData = { status: "OPEN", isBlocked: false };
        break;

      default:
        return NextResponse.json(
          { error: "Action non reconnue" },
          { status: 400 },
        );
    }

    const conversation = await prisma.conversation.update({
      where: { id: conversationId },
      data: updateData,
    });

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
