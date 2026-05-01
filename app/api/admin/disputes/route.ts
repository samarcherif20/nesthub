// app/api/admin/disputes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN,IN_REVIEW";
    const search = searchParams.get("search") || "";

    const where: any = {
      status: { in: status.split(",") as any },
    };

    if (search) {
      where.OR = [
        {
          booking: {
            listing: { title: { contains: search, mode: "insensitive" } },
          },
        },
        {
          booking: {
            tenant: { firstName: { contains: search, mode: "insensitive" } },
          },
        },
        {
          booking: {
            owner: { firstName: { contains: search, mode: "insensitive" } },
          },
        },
      ];
    }

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                governorate: true,
                delegation: true,
              },
            },
            tenant: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        openedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
          },
        },
        messages: {
          // ✅ AJOUTÉ : récupère les messages
          include: {
            sender: {
              select: {
                firstName: true,
                lastName: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Statistiques avec comptage par statut
    const allDisputes = await prisma.dispute.findMany({
      select: { status: true },
    });

    const openCount = allDisputes.filter((d) => d.status === "OPEN").length;
    const inReviewCount = allDisputes.filter(
      (d) => d.status === "IN_REVIEW",
    ).length;
    const resolvedCount = allDisputes.filter(
      (d) => d.status === "RESOLVED",
    ).length;

    const totalRefund = await prisma.dispute.aggregate({
      where: { status: "RESOLVED" },
      _sum: { refundAmount: true },
    });

    // ✅ FORMATAGE COMPLET avec TOUTES les données
    const formattedDisputes = disputes.map((dispute) => ({
      id: dispute.id,
      reference: dispute.id.slice(-8),
      description: dispute.description || "", // ✅ AJOUTÉ
      evidence: (dispute.evidence as string[]) || [], // ✅ AJOUTÉ (les preuves !)
      resolution: dispute.resolution || null, // ✅ AJOUTÉ
      reporter: {
        id: dispute.openedByUser?.id,
        firstName: dispute.openedByUser?.firstName,
        lastName: dispute.openedByUser?.lastName,
        image: dispute.openedByUser?.profilePictureUrl,
      },
      type: dispute.type,
      status: dispute.status,
      severity:
        dispute.priority === "HIGH"
          ? "HIGH"
          : dispute.priority === "MEDIUM"
            ? "MEDIUM"
            : "LOW",
      createdAt: dispute.createdAt,
      listing: dispute.booking?.listing
        ? {
            id: dispute.booking.listing.id,
            title: dispute.booking.listing.title,
            location: `${dispute.booking.listing.governorate}, ${dispute.booking.listing.delegation}`,
            governorate: dispute.booking.listing.governorate,
            delegation: dispute.booking.listing.delegation,
          }
        : null,
      booking: dispute.booking
        ? {
            // ✅ AJOUTÉ (détails du séjour)
            id: dispute.booking.id,
            checkIn: dispute.booking.checkIn,
            checkOut: dispute.booking.checkOut,
            totalPrice: dispute.booking.totalPrice,
            nights: Math.ceil(
              (new Date(dispute.booking.checkOut).getTime() -
                new Date(dispute.booking.checkIn).getTime()) /
                (1000 * 3600 * 24),
            ),
          }
        : null,
      refundAmount: dispute.refundAmount,
      resolvedAmount: dispute.resolvedAmount,
      messages: dispute.messages.map((msg) => ({
        // ✅ AJOUTÉ (messages)
        id: msg.id,
        senderId: msg.senderId,
        senderName:
          `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim(),
        senderRole:
          msg.sender.role === "ADMIN"
            ? "ADMIN"
            : msg.sender.role === "PROPERTY_OWNER"
              ? "OWNER"
              : "TENANT",
        content: msg.content,
        attachments: msg.attachments,
        createdAt: msg.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      disputes: formattedDisputes,
      stats: {
        total: allDisputes.length,
        totalRefund: totalRefund._sum.resolvedAmount || 0,
        open: openCount,
        inReview: inReviewCount,
        resolved: resolvedCount,
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
