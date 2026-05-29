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
    // AJOUTE CES LIGNES APRÈS `const user = await prisma.user.findUnique(...)`

    const searchParams = req.nextUrl.searchParams;
    const specificUserId = searchParams.get("userId");
    const specificListingId = searchParams.get("listingId");

    // 🔥 SI on demande une conversation spécifique (bouton message)
    if (specificUserId && specificListingId) {
      // Vérifier que le listing existe
      const listing = await prisma.listing.findUnique({
        where: { id: specificListingId },
        select: { ownerId: true },
      });

      if (!listing) {
        return NextResponse.json(
          { error: "Annonce non trouvée" },
          { status: 404 },
        );
      }

      const ownerId = listing.ownerId;
      const tenantId = specificUserId;

      // Chercher une conversation existante
      let conversation = await prisma.conversation.findFirst({
        where: {
          listingId: specificListingId,
          ownerId: ownerId,
          tenantId: tenantId,
        },
      });

      // Si elle n'existe pas, la créer
      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            listingId: specificListingId,
            ownerId: ownerId,
            tenantId: tenantId,
            status: "OPEN",
            lastMessageAt: new Date(),
          },
        });
      }

      return NextResponse.json({ conversationId: conversation.id });
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
            rooms: true,
            governorate: true,
            delegation: true,
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

    //  Récupérer les offres pour chaque conversation séparément
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

        //  Récupérer l'offre en attente pour cette conversation (via infoRequest)
        let activeOffer = null;
        if (conv.infoRequestId) {
          const offer = await prisma.offer.findFirst({
            where: {
              infoRequestId: conv.infoRequestId,
              //status: "PENDING",
            },
            orderBy: { createdAt: "desc" },
          });
          activeOffer = offer;
        }

        // Construire le nom complet
        const otherUsername = otherUser.username || "Utilisateur";

        // Construire la location à partir de governorate et delegation
        const location =
          [conv.listing.governorate, conv.listing.delegation]
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
            bedrooms: conv.listing.rooms,
            location: location,
            rating: 4.5,
            image: conv.listing.photos[0]?.url,
          },
          otherUser: {
            id: otherUser.id,
            username: otherUsername,
            image: otherUser.profilePictureUrl,
            isOnline: false,
            isVerified: false,
          },
          infoRequest: conv.infoRequest
            ? {
                id: conv.infoRequest.id,
                checkIn: conv.infoRequest.checkIn.toISOString(),
                checkOut: conv.infoRequest.checkOut.toISOString(),
                guests: conv.infoRequest.guests,
                status: conv.infoRequest.status,
                expiresAt: conv.infoRequest.expiresAt?.toISOString(),
              }
            : null,
          //  AJOUT : Inclure l'offre dans la réponse
          offer: activeOffer
            ? {
                id: activeOffer.id,
                status: activeOffer.status,
                totalPrice: activeOffer.totalPrice,
                createdAt: activeOffer.createdAt.toISOString(),
                expiresAt: activeOffer.expiresAt?.toISOString(),
              }
            : null,
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
