// app/api/admin/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";
    const dateRange = searchParams.get("dateRange") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "6");
    const skip = (page - 1) * limit;

    const where: any = {};

    // 🔥 FILTRE PAR DATE AJOUTÉ 🔥
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      let startDate: Date;
      
      switch (dateRange) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        default:
          startDate = new Date(0);
      }
      
      where.updatedAt = { gte: startDate };
    }

    if (status === "active") {
      where.status = "OPEN";
    } else if (status === "flagged") {
      where.isBlocked = true;
    } else if (status === "closed") {
      where.status = {
        in: [
          "CLOSED_BY_TENANT",
          "CLOSED_BY_OWNER",
          "EXPIRED",
          "CLOSED_BY_ADMIN",
        ],
      };
    }

    // 🔥 RECHERCHE AMÉLIORÉE 🔥
    if (search) {
      where.OR = [
        // Recherche dans le titre de l'annonce
        { listing: { title: { contains: search, mode: "insensitive" } } },
        // Recherche dans la localisation (gouvernorat + délégation)
        { listing: { governorate: { contains: search, mode: "insensitive" } } },
        { listing: { delegation: { contains: search, mode: "insensitive" } } },
        // Recherche dans le propriétaire
        {
          owner: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
        // Recherche dans le locataire
        {
          tenant: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [conversations, totalCount] = await Promise.all([
      prisma.conversation.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              governorate: true,
              delegation: true,
              photos: {
                where: { isMain: true },
                take: 1,
                select: { url: true },
              },
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePictureUrl: true,
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { content: true, createdAt: true, senderId: true },
          },
          reports: {
            where: { status: "PENDING" },
            select: { id: true, reason: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.conversation.count({ where }),
    ]);

    const formattedConversations = conversations.map((conv) => {
      const lastMessage = conv.messages[0];
      const hasReports = conv.reports.length > 0;
      const conversationStatus = conv.isBlocked
        ? "FLAGGED"
        : conv.status === "OPEN"
          ? "ACTIVE"
          : "CLOSED";

      const listingImage =
        conv.listing.photos && conv.listing.photos.length > 0
          ? conv.listing.photos[0].url
          : undefined;

      const ownerFirstName = conv.owner.firstName || "";
      const ownerLastName = conv.owner.lastName || "";
      const tenantFirstName = conv.tenant.firstName || "";
      const tenantLastName = conv.tenant.lastName || "";

      return {
        id: conv.id,
        participants: {
          owner: {
            id: conv.owner.id,
            firstName: ownerFirstName,
            lastName: ownerLastName,
            fullName:
              `${ownerFirstName} ${ownerLastName}`.trim() || "Propriétaire",
            avatar: conv.owner.profilePictureUrl,
          },
          tenant: {
            id: conv.tenant.id,
            firstName: tenantFirstName,
            lastName: tenantLastName,
            fullName:
              `${tenantFirstName} ${tenantLastName}`.trim() || "Locataire",
            avatar: conv.tenant.profilePictureUrl,
          },
        },
        listing: {
          id: conv.listing.id,
          title: conv.listing.title || "Sans titre",
          governorate: conv.listing.governorate || "",
          delegation: conv.listing.delegation || "",
          location:
            `${conv.listing.governorate || ""} ${conv.listing.delegation || ""}`.trim() ||
            "Localisation non spécifiée",
          image: listingImage,
        },
        lastMessage: lastMessage?.content || "Aucun message",
        lastMessageDate: lastMessage?.createdAt || conv.createdAt,
        status: conversationStatus,
        hasReports,
        reportCount: conv.reports.length,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json({
      conversations: formattedConversations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, id: true, firstName: true, lastName: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { conversationId, action, reason } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId est requis" },
        { status: 400 },
      );
    }

    let updateData: any = {};

    switch (action) {
      case "FLAG":
        updateData = { isBlocked: true };
        break;
      case "UNFLAG":
        updateData = { isBlocked: false };
        break;
      case "CLOSE":
        updateData = { status: "CLOSED_BY_ADMIN" };
        break;
      case "REOPEN":
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
      include: { owner: true, tenant: true, listing: true },
    });

    // 🔥 MESSAGE SYSTÈME DANS LA CONVERSATION 🔥
    const actionMessages: Record<string, string> = {
      FLAG: "⚠️ Cette conversation a été signalée par un modérateur.",
      UNFLAG:
        "✅ Le signalement de cette conversation a été levé par un modérateur.",
      CLOSE: "🔒 Cette conversation a été fermée par un modérateur.",
      REOPEN: "🔓 Cette conversation a été réouverte par un modérateur.",
    };

    if (actionMessages[action]) {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          receiverId: conversation.ownerId,
          content: actionMessages[action],
          isSystem: true,
          type: "text",
        },
      });
    }

    if (action === "FLAG" && reason) {
      await prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          receiverId: conversation.ownerId,
          content: `⚠️ Raison: ${reason}`,
          isSystem: true,
          type: "text",
        },
      });
    }

    // 🔥 NOTIFICATIONS IN-APP POUR LES DEUX UTILISATEURS 🔥
    const notificationTitles: Record<string, string> = {
      FLAG: "Conversation signalée",
      UNFLAG: "Signalement levé",
      CLOSE: "Conversation fermée",
      REOPEN: "Conversation réouverte",
    };

    const notificationContents: Record<string, string> = {
      FLAG: `Un modérateur a signalé la conversation concernant "${conversation.listing.title}".`,
      UNFLAG: `Un modérateur a levé le signalement de la conversation concernant "${conversation.listing.title}".`,
      CLOSE: `Un modérateur a fermé la conversation concernant "${conversation.listing.title}".`,
      REOPEN: `Un modérateur a réouvert la conversation concernant "${conversation.listing.title}".`,
    };

    if (notificationTitles[action]) {
      // Notification pour le propriétaire
      await prisma.notification.create({
        data: {
          userId: conversation.ownerId,
          type: "SYSTEM_ALERT",
          title: notificationTitles[action],
          content: notificationContents[action],
          channels: ["IN_APP"],
          data: { conversationId, listingId: conversation.listingId, action },
        },
      });

      // Notification pour le locataire
      await prisma.notification.create({
        data: {
          userId: conversation.tenantId,
          type: "SYSTEM_ALERT",
          title: notificationTitles[action],
          content: notificationContents[action],
          channels: ["IN_APP"],
          data: { conversationId, listingId: conversation.listingId, action },
        },
      });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}