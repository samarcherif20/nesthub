import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/withAuth";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const user = (request as any).user;
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const actionType = searchParams.get("actionType");
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = { listingId: id, createdAt: { gte: startDate } };
    if (actionType && actionType !== "ALL" && actionType !== "")
      where.actionType = actionType;

    const history = await prisma.listingHistory.findMany({
      where,
      include: {
        changedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePictureUrl: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedHistory = history.map((entry) => ({
      id: entry.id,
      actionType: entry.actionType,
      fieldName: entry.fieldName,
      oldValue: entry.oldValue,
      newValue: entry.newValue,
      createdAt: entry.createdAt.toISOString(),
      changedByUser: {
        id: entry.changedByUser.id,
        firstName: entry.changedByUser.firstName,
        lastName: entry.changedByUser.lastName,
        profilePictureUrl: entry.changedByUser.profilePictureUrl,
        email: entry.changedByUser.email,
      },
    }));

    return NextResponse.json({
      history: formattedHistory,
      total: history.length,
    });
  },
  {
    requireListingAccess: true,
    requiredPermission: "view",
    // ✅ getListingId supprimé
  },
);
