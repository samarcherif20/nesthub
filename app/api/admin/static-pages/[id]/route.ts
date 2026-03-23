import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get single page
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const page = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    // Récupérer les infos de l'utilisateur qui a mis à jour
    let updatedByUser = null;
    if (page.updatedBy) {
      const user = await prisma.user.findUnique({
        where: { id: page.updatedBy },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      updatedByUser = user;
    }

    return NextResponse.json({ 
      page: {
        ...page,
        updatedByUser
      } 
    });
  } catch (error) {
    console.error("Error fetching static page:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// PATCH - Update page
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // Get the authenticated user from Clerk
    const { userId: clerkUserId } = getAuth(request);

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Find the user in your database
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { title, htmlContent, type, slug, status } = body;

    // Check if page exists
    const existingPage = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!existingPage) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    // If slug is being changed, check uniqueness
    if (slug && slug !== existingPage.slug) {
      const slugExists = await prisma.staticPage.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Ce slug est déjà utilisé" },
          { status: 400 },
        );
      }
    }

    // If type is being changed, check uniqueness
    if (type && type !== existingPage.type) {
      const typeExists = await prisma.staticPage.findUnique({
        where: { type },
      });
      if (typeExists) {
        return NextResponse.json(
          { error: "Ce type est déjà utilisé" },
          { status: 400 },
        );
      }
    }

    // ÉTAPE 1: Sauvegarder la version actuelle AVANT la mise à jour
    await prisma.staticPageVersion.create({
      data: {
        staticPageId: id,
        version: existingPage.version,
        htmlContent: JSON.stringify({
          content: existingPage.htmlContent,
          title: existingPage.title,
          type: existingPage.type,
          slug: existingPage.slug,
          status: existingPage.status,
        }),
        createdBy: adminUser.id,
      },
    });

    // ÉTAPE 2: Mettre à jour la page
    const updatedPage = await prisma.staticPage.update({
      where: { id },
      data: {
        title: title ?? existingPage.title,
        htmlContent: htmlContent ?? existingPage.htmlContent,
        type: type ?? existingPage.type,
        slug: slug ?? existingPage.slug,
        status: status ?? existingPage.status,
        version: existingPage.version + 1,
        updatedBy: adminUser.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        action: "UPDATE_STATIC_PAGE",
        actionType: "CONTENT_ACTION",
        targetType: "STATIC_PAGE",
        targetId: id,
        details: {
          version: existingPage.version + 1,
          message: "Page mise à jour",
        },
      },
    });

    return NextResponse.json({ success: true, page: updatedPage });
  } catch (error) {
    console.error("Error updating static page:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// DELETE - Delete page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId: clerkUserId } = getAuth(request);

    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!adminUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    const { id } = await params;

    const page = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!page) {
      return NextResponse.json({ error: "Page non trouvée" }, { status: 404 });
    }

    // Supprimer la page (les versions seront supprimées en cascade)
    await prisma.staticPage.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        action: "DELETE_STATIC_PAGE",
        actionType: "CONTENT_ACTION",
        targetType: "STATIC_PAGE",
        targetId: id,
        details: {
          type: page.type,
          title: page.title,
          slug: page.slug,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting static page:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}