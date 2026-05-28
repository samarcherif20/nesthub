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

    const admin = await prisma.user.findUnique({ 
      where: { clerkId: userId },
      select: { role: true }
    });
    
    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN,IN_REVIEW";
    const search = searchParams.get("search") || "";

    const statusArray = status.split(",");
    const where: any = {
      status: { in: statusArray },
    };

    if (search) {
      where.OR = [
        { booking: { listing: { title: { contains: search, mode: "insensitive" } } } },
        { booking: { tenant: { firstName: { contains: search, mode: "insensitive" } } } },
        { booking: { tenant: { lastName: { contains: search, mode: "insensitive" } } } },
        { booking: { owner: { firstName: { contains: search, mode: "insensitive" } } } },
        { booking: { owner: { lastName: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [disputes, statsCounts] = await Promise.all([
      prisma.dispute.findMany({
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
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  profilePictureUrl: true,
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dispute.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    const statsMap: Record<string, number> = {};
    statsCounts.forEach((stat) => {
      statsMap[stat.status] = stat._count;
    });

    const openCount = statsMap["OPEN"] || 0;
    const inReviewCount = statsMap["IN_REVIEW"] || 0;
    const resolvedCount = statsMap["RESOLVED"] || 0;
    const rejectedCount = statsMap["REJECTED"] || 0;

    const formattedDisputes = disputes.map((dispute) => {
      const isReporterOwner = dispute.openedBy === dispute.booking?.owner?.id;
      const reporter = isReporterOwner ? dispute.booking?.owner : dispute.booking?.tenant;
      const respondent = !isReporterOwner ? dispute.booking?.owner : dispute.booking?.tenant;

      return {
        id: dispute.id,
        reference: dispute.id.slice(-8),
        description: dispute.description || "",
        evidence: (dispute.evidence as string[]) || [],
        resolution: dispute.resolution || null,
        reporter: {
          id: reporter?.id,
          firstName: reporter?.firstName,
          lastName: reporter?.lastName,
          image: reporter?.profilePictureUrl,
        },
        respondent: {
          id: respondent?.id,
          firstName: respondent?.firstName,
          lastName: respondent?.lastName,
          image: respondent?.profilePictureUrl,
        },
        type: dispute.type,
        status: dispute.status,
        severity: dispute.priority === "HIGH" ? "HIGH" : dispute.priority === "MEDIUM" ? "MEDIUM" : "LOW",
        createdAt: dispute.createdAt,
        listing: dispute.booking?.listing ? {
          id: dispute.booking.listing.id,
          title: dispute.booking.listing.title,
          location: `${dispute.booking.listing.governorate || ""}, ${dispute.booking.listing.delegation || ""}`,
          governorate: dispute.booking.listing.governorate,
          delegation: dispute.booking.listing.delegation,
        } : null,
        booking: dispute.booking ? {
          id: dispute.booking.id,
          checkIn: dispute.booking.checkIn,
          checkOut: dispute.booking.checkOut,
          totalPrice: dispute.booking.totalPrice,
          nights: Math.ceil(
            (new Date(dispute.booking.checkOut).getTime() - new Date(dispute.booking.checkIn).getTime()) / (1000 * 3600 * 24)
          ),
        } : null,
        messages: dispute.messages.map((msg) => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: `${msg.sender.firstName || ""} ${msg.sender.lastName || ""}`.trim(),
          senderRole: msg.sender.role === "ADMIN" ? "ADMIN" : msg.sender.role === "PROPERTY_OWNER" ? "OWNER" : "TENANT",
          content: msg.content,
          attachments: msg.attachments,
          createdAt: msg.createdAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({
      disputes: formattedDisputes,
      stats: {
        total: openCount + inReviewCount + resolvedCount + rejectedCount,
        open: openCount,
        inReview: inReviewCount,
        resolved: resolvedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}