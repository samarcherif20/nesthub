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

    const searchParams = req.nextUrl.searchParams;
    const specificUserId = searchParams.get("userId");
    const specificListingId = searchParams.get("listingId");

    //  SI on demande une conversation spécifique (bouton message)
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
            isIdentityVerified: true,
            role: true,
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            username: true,
            isIdentityVerified: true,
            role: true,
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

        //  Récupérer les stats du locataire (avis REÇUS par le locataire)
        const tenantStats = await prisma.userStats.findUnique({
          where: { userId: otherUser.id },
          select: {
            reliabilityScore: true,
            averageRating: true,
            totalBookings: true,
          },
        });

        //  Récupérer la note moyenne du LISTING (avis SUR la propriété)
        const listingReviews = await prisma.review.aggregate({
          where: {
            targetId: conv.listing.id,
            targetType: "LISTING",
            isPublished: true,
          },
          _avg: { rating: true },
          _count: { rating: true },
        });

        //  Récupérer l'offre en attente pour cette conversation (via infoRequest)
        let activeOffer = null;
        let isPaid = false;
        let contractUrl = null;

        if (conv.infoRequestId) {
          const offer = await prisma.offer.findFirst({
            where: {
              infoRequestId: conv.infoRequestId,
            },
            orderBy: { createdAt: "desc" },
          });
          activeOffer = offer;

          // Vérifier si le paiement a été effectué
          if (activeOffer) {
            const payment = await prisma.paymentTransaction.findFirst({
              where: { offerId: activeOffer.id, status: "SUCCESS" },
            });
            isPaid = !!payment;

            //  Récupérer le contrat si disponible
            if (activeOffer.status === "ACCEPTED") {
              const booking = await prisma.booking.findFirst({
                where: { offerId: activeOffer.id },
                include: { contract: true },
              });
              contractUrl = booking?.contract?.pdfUrl || null;
            }
          }
        }

        // Construire le nom complet
        const otherUsername = otherUser.username || "Utilisateur";

        // Calculer les JOURS pour la demande d'information de CETTE conversation uniquement
        let totalDays = 0;
        if (conv.infoRequest) {
          const checkIn = new Date(conv.infoRequest.checkIn);
          const checkOut = new Date(conv.infoRequest.checkOut);
          totalDays = Math.ceil(
            (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
          ); // +1 pour inclure le jour de fin
        }
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
            rating: listingReviews._avg.rating || 0,
            reviewCount: listingReviews._count.rating || 0,
            image: conv.listing.photos[0]?.url,
            checkIn: conv.infoRequest?.checkIn?.toISOString(),
            checkOut: conv.infoRequest?.checkOut?.toISOString(),
            guests: conv.infoRequest?.guests,
            infoRequestId: conv.infoRequestId, // ← Déjà présent ou à ajouter
          },
          otherUser: {
            id: otherUser.id,
            username: otherUser.role === "ADMIN" ? "Admin" : otherUsername,
            image: otherUser.profilePictureUrl,
            isOnline: false,
            isVerified: otherUser.isIdentityVerified || false,
            reliabilityScore: tenantStats?.reliabilityScore || 50,
            averageRating: tenantStats?.averageRating || 0,
            totalStays: totalDays,
            role: otherUser.role,
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
          offer: activeOffer
            ? {
                id: activeOffer.id,
                status: activeOffer.status,
                totalPrice: activeOffer.totalPrice,
                pricePerNight: activeOffer.pricePerNight, // ← AJOUTER CETTE LIGNE
                cleaningFee: activeOffer.cleaningFee, // ← AJOUTER CETTE LIGNE
                serviceFee: activeOffer.serviceFee, // ← AJOUTER CETTE LIGNE
                checkIn: activeOffer.checkIn.toISOString(), // ← AJOUTER CETTE LIGNE
                checkOut: activeOffer.checkOut.toISOString(), // ← AJOUTER CETTE LIGNE
                nights: activeOffer.nights, // ← AJOUTER CETTE LIGNE
                createdAt: activeOffer.createdAt.toISOString(),
                expiresAt: activeOffer.expiresAt?.toISOString(),
                isPaid: isPaid,
                contractUrl: contractUrl,
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
