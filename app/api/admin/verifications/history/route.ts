import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where:  { clerkId: userId },
      select: { id: true, role: true },
    });

    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page         = parseInt(searchParams.get("page")  || "1");
    const limit        = parseInt(searchParams.get("limit") || "10");
    const statusFilter = searchParams.get("status") || "ALL";   // "ALL" | "VALIDATED" | "REJECTED"
    const search       = searchParams.get("search") || "";
    const skip         = (page - 1) * limit;

    // ── build the where clause ──────────────────────────────────────────
    // History page only shows already-processed requests (not PENDING).
    // When a specific filter is chosen we narrow further.
    const statusWhere =
      statusFilter === "VALIDATED" ? { status: "VALIDATED" }
      : statusFilter === "REJECTED" ? { status: "REJECTED" }
      : { status: { in: ["VALIDATED", "REJECTED"] } };   // ALL

    const searchWhere = search
      ? {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName:  { contains: search, mode: "insensitive" as const } },
              { email:     { contains: search, mode: "insensitive" as const } },
            ],
          },
        }
      : {};

    const where = { ...statusWhere, ...searchWhere };

    // ── run queries in parallel ─────────────────────────────────────────
    const [requests, totalCount, validatedCount, rejectedCount] =
      await Promise.all([
        prisma.verificationRequest.findMany({
          where,
          include: {
            user: {
              select: {
                id:                true,
                firstName:         true,
                lastName:          true,
                email:             true,
                profilePictureUrl: true,
              },
            },
            validatedBy: {
              select: {
                id:        true,
                firstName: true,
                lastName:  true,
                email:     true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: limit,
        }),
        // total matching the active filter (for pagination)
        prisma.verificationRequest.count({ where }),
        // global counts (unaffected by filter — always returned for the badges)
        prisma.verificationRequest.count({
          where: {
            status: "VALIDATED",
            ...searchWhere,
          },
        }),
        prisma.verificationRequest.count({
          where: {
            status: "REJECTED",
            ...searchWhere,
          },
        }),
      ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      // global stats — the page uses these for filter pill badges & stat cards
      stats: {
        totalCount:     validatedCount + rejectedCount,
        validatedCount,
        rejectedCount,
      },
    });
  } catch (error) {
    console.error("Error fetching verification history:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}