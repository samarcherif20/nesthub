// app/api/admin/verifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth, isAuthError } from "@/lib/auth-admin";

export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const search = searchParams.get("search") || "";
    const statusFilter = searchParams.get("status") || "PENDING";

    // Construction du where clause
    const where: any = {};
    
    // Filtre par statut
    if (statusFilter !== "ALL") {
      where.status = statusFilter;
    }

    // Filtre par recherche (nom, email)
    if (search) {
      where.OR = [
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [requests, totalCount] = await Promise.all([
      prisma.verificationRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              role: true,
              createdAt: true,
              cinData: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.verificationRequest.count({ where }),
    ]);

    // Statistiques pour l'affichage (uniquement les en attente)
    const pendingCount = await prisma.verificationRequest.count({
      where: { status: "PENDING" },
    });

    const processedToday = await prisma.verificationRequest.count({
      where: {
        status: { in: ["VALIDATED", "REJECTED"] },
        reviewedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    });

    // Transformer la réponse
    const formattedRequests = requests.map((req) => ({
      ...req,
      cinData: req.user?.cinData,
    }));

    return NextResponse.json({
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        pendingCount,
        estimatedWaitTime: pendingCount * 5,
        processedToday,
      },
    });
  } catch (error) {
    console.error("Error fetching verifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}