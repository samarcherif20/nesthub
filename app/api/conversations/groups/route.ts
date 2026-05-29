// app/api/conversations/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Récupérer les groupes (conversations de litige)
    const groups = await prisma.groupConversation.findMany({
      where: {
        participants: {
          some: { userId: currentUser.id }
        },
        status: "ACTIVE"
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            governorate: true,
            delegation: true,
            photos: {
              take: 1,
              where: { isMain: true },
              select: { url: true }
            }
          }
        },
        dispute: {
          select: {
            id: true,
            status: true,
            type: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                profilePictureUrl: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      }
    });

    // Calculer les messages non lus pour chaque groupe
    const groupsWithUnread = await Promise.all(
      groups.map(async (group) => {
        // Compter les messages non lus pour cet utilisateur dans ce groupe
        // (à adapter selon ta logique de lecture des messages de groupe)
        const unreadCount = await prisma.groupConversationMessage.count({
          where: {
            groupId: group.id,
            readBy: { not: { array_contains: [currentUser.id] } },
            senderId: { not: currentUser.id }
          }
        });

        return {
          id: group.id,
          name: group.name || `Litige: ${group.listing?.title || "Propriété"}`,
          listing: group.listing ? {
            id: group.listing.id,
            title: group.listing.title,
            image: group.listing.photos[0]?.url,
            location: [group.listing.governorate, group.listing.delegation].filter(Boolean).join(", ")
          } : null,
          participants: group.participants.map(p => ({
            id: p.user.id,
            username: p.user.username || `User_${p.user.id.slice(0, 8)}`,
            image: p.user.profilePictureUrl,
            role: p.user.id === currentUser.id ? "YOU" : "OTHER"
          })),
          dispute: group.dispute ? {
            id: group.dispute.id,
            status: group.dispute.status,
            type: group.dispute.type
          } : null,
          lastMessage: group.messages[0]?.content || "Aucun message",
          unreadCount,
          status: group.status
        };
      })
    );

    return NextResponse.json(groupsWithUnread);
  } catch (error) {
    console.error("Error fetching group conversations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}