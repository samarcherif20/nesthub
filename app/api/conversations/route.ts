import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les conversations de l'utilisateur
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur depuis la DB
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ ownerId: user.id }, { tenantId: user.id }],
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            pricePerNight: true,
            cleaningFee: true,
            maxGuests: true,
            rooms: true,           // ✅ rooms (pas bedrooms)
            governorate: true,     // ✅ pour construire la location
            delegation: true,      // ✅ pour construire la location
            // rating n'existe pas dans Listing, on va utiliser une valeur par défaut
            photos: {
              take: 1,
              where: { isMain: true },
              select: { url: true },
            },
          },
        },
        infoRequest: {
          select: {
            id: true,
            checkIn: true,
            checkOut: true,
            guests: true,
            status: true,
            expiresAt: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            username: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            username: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Ajouter le compteur de messages non lus et formater les données
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            receiverId: user.id,
            isRead: false,
          },
        });

        const otherUser = conv.ownerId === user.id ? conv.tenant : conv.owner;
        const lastMessage = conv.messages[0];

        // Construire le nom complet
        const otherUserName =
          otherUser.firstName && otherUser.lastName
            ? `${otherUser.firstName} ${otherUser.lastName}`
            : otherUser.username || "Utilisateur";

        // Construire la location à partir de governorate et delegation
        const location = [conv.listing.governorate, conv.listing.delegation]
          .filter(Boolean)
          .join(", ") || "Emplacement non spécifié";

        return {
          id: conv.id,
          listing: {
            id: conv.listing.id,
            title: conv.listing.title,
            pricePerNight: conv.listing.pricePerNight,
            cleaningFee: conv.listing.cleaningFee,
            maxGuests: conv.listing.maxGuests,
            bedrooms: conv.listing.rooms,  // ✅ on map rooms → bedrooms pour le frontend
            location: location,
            rating: 4.5,  // ✅ valeur par défaut (à remplacer par une vraie moyenne plus tard)
            image: conv.listing.photos[0]?.url,
          },
          otherUser: {
            id: otherUser.id,
            name: otherUserName,
            image: otherUser.profilePictureUrl,
            isOnline: false,
            isVerified: false,
          },
          infoRequest: conv.infoRequest ? {
            id: conv.infoRequest.id,
            checkIn: conv.infoRequest.checkIn.toISOString(),
            checkOut: conv.infoRequest.checkOut.toISOString(),
            guests: conv.infoRequest.guests,
            status: conv.infoRequest.status,
            expiresAt: conv.infoRequest.expiresAt?.toISOString(),
          } : null,
          lastMessage: lastMessage?.content || null,
          lastMessageAt: conv.lastMessageAt,
          unreadCount,
        };
      }),
    );

    return NextResponse.json(conversationsWithUnread);
  } catch (error) {
    console.error("Erreur GET conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle conversation
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { listingId, ownerId, tenantId, infoRequestId, initialMessage } =
      await req.json();

    if (!listingId || !ownerId || !tenantId) {
      return NextResponse.json(
        { error: "Données manquantes" },
        { status: 400 },
      );
    }

    // Vérifier que l'utilisateur est bien le locataire ou le propriétaire
    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Vérifier si la conversation existe déjà
    let conversation = await prisma.conversation.findFirst({
      where: {
        listingId,
        ownerId,
        tenantId,
      },
    });

    // Créer la conversation si elle n'existe pas
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          listingId,
          ownerId,
          tenantId,
          infoRequestId,
          status: "OPEN",
          lastMessageAt: new Date(),
        },
      });
    }

    // Ajouter le message initial si fourni
    if (initialMessage && initialMessage.trim()) {
      const receiverId = currentUser.id === ownerId ? tenantId : ownerId;

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: currentUser.id,
          receiverId,
          content: initialMessage,
          isRead: false,
          isSystem: false,
        },
      });

      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: initialMessage.substring(0, 100),
          lastMessageAt: new Date(),
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error("Erreur POST conversation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}