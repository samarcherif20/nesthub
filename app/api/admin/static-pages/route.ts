import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// GET - List all static pages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";

    // Build where clause
    const where: Prisma.StaticPageWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { slug: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { type: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ];
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    const pages = await prisma.staticPage.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    // Récupérer tous les userIds uniques
    const userIds = [...new Set(pages.map(p => p.updatedBy).filter(Boolean))];
    
    // Récupérer les noms des utilisateurs
    let userMap: Record<string, { firstName: string | null; lastName: string | null }> = {};
    
    if (userIds.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: userIds }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        }
      });
      
      userMap = users.reduce((acc, user) => {
        acc[user.id] = {
          firstName: user.firstName,
          lastName: user.lastName
        };
        return acc;
      }, {} as Record<string, { firstName: string | null; lastName: string | null }>);
    }

    // Ajouter les noms aux pages
    const pagesWithUsers = pages.map(page => ({
      ...page,
      updatedByUser: page.updatedBy ? userMap[page.updatedBy] : null
    }));

    return NextResponse.json({
      pages: pagesWithUsers,
      stats: {
        total: pages.length,
        published: pages.filter(p => p.htmlContent && p.htmlContent.length > 0).length,
        drafts: pages.filter(p => !p.htmlContent || p.htmlContent.length === 0).length,
      }
    });
  } catch (error) {
    console.error("Error fetching static pages:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// POST - Create new static page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, slug, htmlContent, status } = body;

    // Validation
    if (!type || !title || !slug) {
      return NextResponse.json(
        { error: "Type, titre et slug sont requis" },
        { status: 400 },
      );
    }

    // Check if slug already exists
    const existingPage = await prisma.staticPage.findUnique({
      where: { slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: "Ce slug est déjà utilisé" },
        { status: 400 },
      );
    }

    // Check if type already exists
    const existingType = await prisma.staticPage.findUnique({
      where: { type },
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Ce type est déjà utilisé" },
        { status: 400 },
      );
    }

    const page = await prisma.staticPage.create({
      data: {
        type,
        title,
        slug,
        htmlContent: htmlContent || "",
        status: status || "draft",
        version: 1,
        updatedBy: "system", // À remplacer par l'ID réel plus tard
      },
    });

    return NextResponse.json({ success: true, page });
  } catch (error) {
    console.error("Error creating static page:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}