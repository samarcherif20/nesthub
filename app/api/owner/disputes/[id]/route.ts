import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = getAuth(request);
    const { id } = await params;

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const dispute = await prisma.dispute.findFirst({
      where: {
        id,
        openedBy: user.id,
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                type: true,
                governorate: true,
                delegation: true,
                street: true,
                photos: {
                  where: { isMain: true },
                  take: 1,
                },
              },
            },
            tenant: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
                email: true,
                phoneNumber: true,
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
                username: true,
                firstName: true,
                lastName: true,
                role: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: "Litige non trouvé" }, { status: 404 });
    }

    // Récupérer les preuves (évidences)
    const evidence = dispute.evidence as any[] || [];

    return NextResponse.json({
      success: true,
      dispute: {
        id: dispute.id,
        reference: dispute.id.slice(0, 8).toUpperCase(),
        type: dispute.type,
        description: dispute.description,
        status: dispute.status,
        priority: dispute.priority,
        amount: dispute.refundAmount,
        resolution: dispute.resolution,
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        resolvedAt: dispute.resolvedAt,
        booking: {
          id: dispute.booking.id,
          reference: dispute.booking.reference,
          checkIn: dispute.booking.checkIn,
          checkOut: dispute.booking.checkOut,
          totalPrice: dispute.booking.totalPrice,
          listing: {
            id: dispute.booking.listing.id,
            title: dispute.booking.listing.title,
            type: dispute.booking.listing.type,
            governorate: dispute.booking.listing.governorate,
            delegation: dispute.booking.listing.delegation,
            street: dispute.booking.listing.street,
            image: dispute.booking.listing.photos[0]?.url || null,
          },
          tenant: {
            id: dispute.booking.tenant.id,
            username: dispute.booking.tenant.username,
            name: dispute.booking.tenant.firstName 
              ? `${dispute.booking.tenant.firstName} ${dispute.booking.tenant.lastName || ""}`.trim()
              : dispute.booking.tenant.username || "Locataire",
            avatar: dispute.booking.tenant.profilePictureUrl,
            email: dispute.booking.tenant.email,
            phone: dispute.booking.tenant.phoneNumber,
          },
        },
        messages: dispute.messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          isInternal: msg.isInternal,
          sender: {
            id: msg.sender.id,
            name: msg.sender.firstName 
              ? `${msg.sender.firstName} ${msg.sender.lastName || ""}`.trim()
              : msg.sender.username || "Utilisateur",
            role: msg.sender.role,
            isAdmin: msg.sender.role === "ADMIN",
            avatar: msg.sender.profilePictureUrl,
          },
        })),
        evidence: evidence,
      },
    });
  } catch (error) {
    console.error("[GET /api/owner/disputes/[id]] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}