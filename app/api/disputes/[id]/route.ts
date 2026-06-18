// app/api/disputes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouve" }, { status: 404 });
    }

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            listing: {
              include: {
                photos: {
                  where: { isMain: true },
                  take: 1,
                  select: { url: true }
                }
              }
            },
            tenant: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true, 
                username: true,
                profilePictureUrl: true
              } 
            },
            owner: { 
              select: { 
                id: true, 
                firstName: true, 
                lastName: true, 
                username: true,
                profilePictureUrl: true
              } 
            }
          }
        },
        groupConversation: {
          select: { id: true }
        }
      }
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouve" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a le droit de voir ce litige
    const isOwner = dispute.booking.ownerId === user.id;
    const isTenant = dispute.booking.tenantId === user.id;
    const isOpener = dispute.openedBy === user.id;

    if (!isOwner && !isTenant && !isOpener) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    // Formater la réponse avec gestion des nulls
    const formattedDispute = {
      id: dispute.id,
      reference: dispute.id.slice(-8).toUpperCase(),
      status: dispute.status,
      type: dispute.type,
      description: dispute.description,
      priority: dispute.priority,
      resolution: dispute.resolution,
      createdAt: dispute.createdAt,
      updatedAt: dispute.updatedAt,
      groupConversationId: dispute.groupConversation?.id,
      booking: {
        id: dispute.booking.id,
        reference: dispute.booking.reference,
        checkIn: dispute.booking.checkIn,
        checkOut: dispute.booking.checkOut,
        listing: {
          id: dispute.booking.listing.id,
          title: dispute.booking.listing.title,
          governorate: dispute.booking.listing.governorate,
          delegation: dispute.booking.listing.delegation,
          images: dispute.booking.listing.photos?.map(p => p.url) || []
        },
        tenant: {
          id: dispute.booking.tenant.id,
          firstName: dispute.booking.tenant.firstName,
          lastName: dispute.booking.tenant.lastName,
          username: dispute.booking.tenant.username,
          profilePictureUrl: dispute.booking.tenant.profilePictureUrl
        },
        owner: dispute.booking.owner ? {
          id: dispute.booking.owner.id,
          firstName: dispute.booking.owner.firstName,
          lastName: dispute.booking.owner.lastName,
          username: dispute.booking.owner.username,
          profilePictureUrl: dispute.booking.owner.profilePictureUrl
        } : null
      }
    };

    return NextResponse.json(formattedDispute);
  } catch (error) {
    console.error("Erreur recuperation litige:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}