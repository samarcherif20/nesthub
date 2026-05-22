import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer TOUS les litiges où l'utilisateur est impliqué (comme propriétaire)
    const disputes = await prisma.dispute.findMany({
      where: {
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
              },
            },
            tenant: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
            owner: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
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
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Formater les données
    const formattedDisputes = disputes.map((dispute) => ({
      id: dispute.id,
      reference: dispute.id.slice(0, 8).toUpperCase(),
      type: dispute.type,
      description: dispute.description,
      status: dispute.status,
      priority: dispute.priority,
      amount: dispute.refundAmount,
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
        },
        tenant: {
          id: dispute.booking.tenant.id,
          username: dispute.booking.tenant.username,
          name: dispute.booking.tenant.firstName
            ? `${dispute.booking.tenant.firstName} ${dispute.booking.tenant.lastName || ""}`.trim()
            : dispute.booking.tenant.username || "Locataire",
          avatar: dispute.booking.tenant.profilePictureUrl,
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
        },
      })),
    }));

    // Statistiques
    const stats = {
      active: disputes.filter((d) => d.status === "OPEN").length,
      pendingEvidence: disputes.filter(
        (d) => d.status === "OPEN" && d.priority === "HIGH",
      ).length,
      resolvedMonth: disputes.filter(
        (d) =>
          d.status === "RESOLVED" &&
          d.resolvedAt &&
          new Date(d.resolvedAt).getMonth() === new Date().getMonth(),
      ).length,
      total: disputes.length,
    };

    return NextResponse.json({
      success: true,
      disputes: formattedDisputes,
      stats,
    });
  } catch (error) {
    console.error("[GET /api/owner/disputes] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
