// app/api/listings/my/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(request);

    if (!clerkId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer les paramètres
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "ALL";
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const search = searchParams.get("search") || "";

    // Construction du WHERE
    let where: any = {
      ownerId: user.id,
    };

    // Mapper les statuts
    let statusFilter = null;
    switch (statusParam) {
      case "ALL":
        statusFilter = null;
        break;
      case "ACTIVE":
        statusFilter = "ACTIVE";
        break;
      case "INACTIVE":
        statusFilter = "INACTIVE";
        break;
      case "DRAFT":
        statusFilter = "DRAFT";
        break;
      case "ARCHIVED":
        statusFilter = "ARCHIVED";
        break;
      case "PENDING":
      case "PENDING_REVIEW":
        statusFilter = "PENDING_REVIEW";
        break;
      default:
        statusFilter = null;
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    // Filtre par recherche
    if (search && search !== "") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * pageSize;

    const [listings, totalCount] = await Promise.all([
      prisma.listing.findMany({
        where,
        select: {
          id: true,
          title: true,
          type: true,
          governorate: true,
          status: true,
          photos: {
            where: { isMain: true },
            take: 1,
            select: { url: true, isMain: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.listing.count({ where }),
    ]);

    console.log(
      `📊 ${listings.length} annonces trouvées pour l'utilisateur ${user.id}`,
    );

    return NextResponse.json({
      listings,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("[GET /api/listings/my] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
