import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
    const body = await request.json();
    const { versionId } = body;

    if (!versionId) {
      return NextResponse.json(
        { error: "ID de version requis" },
        { status: 400 },
      );
    }

    // Récupérer la version à restaurer
    const versionToRestore = await prisma.staticPageVersion.findUnique({
      where: { id: versionId },
    });

    if (!versionToRestore) {
      return NextResponse.json(
        { error: "Version non trouvée" },
        { status: 404 },
      );
    }

    // Vérifier que la version correspond à la bonne page
    if (versionToRestore.staticPageId !== id) {
      return NextResponse.json(
        { error: "La version ne correspond pas à cette page" },
        { status: 400 },
      );
    }

    // Récupérer la page actuelle
    const currentPage = await prisma.staticPage.findUnique({
      where: { id },
    });

    if (!currentPage) {
      return NextResponse.json(
        { error: "Page non trouvée" },
        { status: 404 },
      );
    }

    // Parser les données de la version à restaurer
    let restoredData = {
      content: versionToRestore.htmlContent,
      title: currentPage.title,
      type: currentPage.type,
      slug: currentPage.slug,
      status: currentPage.status,
    };

    try {
      const parsed = JSON.parse(versionToRestore.htmlContent);
      if (parsed.content !== undefined) {
        restoredData = {
          content: parsed.content,
          title: parsed.title || currentPage.title,
          type: parsed.type || currentPage.type,
          slug: parsed.slug || currentPage.slug,
          status: parsed.status || currentPage.status,
        };
      }
    } catch {
      // Si ce n'est pas du JSON, on garde le contenu brut
      restoredData.content = versionToRestore.htmlContent;
    }

    // ÉTAPE 1: Sauvegarder l'état actuel comme nouvelle version AVANT restauration
    await prisma.staticPageVersion.create({
      data: {
        staticPageId: id,
        version: currentPage.version,
        htmlContent: JSON.stringify({
          content: currentPage.htmlContent,
          title: currentPage.title,
          type: currentPage.type,
          slug: currentPage.slug,
          status: currentPage.status,
        }),
        createdBy: adminUser.id,
      },
    });

    // ÉTAPE 2: Restaurer la version ancienne
    const restoredPage = await prisma.staticPage.update({
      where: { id },
      data: {
        title: restoredData.title,
        htmlContent: restoredData.content,
        type: restoredData.type,
        slug: restoredData.slug,
        status: restoredData.status,
        version: currentPage.version + 1,
        updatedBy: adminUser.id,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: adminUser.id,
        action: "RESTORE_VERSION",
        actionType: "CONTENT_ACTION",
        targetType: "STATIC_PAGE",
        targetId: id,
        details: {
          restoredFromVersion: versionToRestore.version,
          newVersion: currentPage.version + 1,
          message: "Version restaurée",
        },
      },
    });

    return NextResponse.json({
      success: true,
      page: restoredPage,
      message: "Version restaurée avec succès",
    });
  } catch (error) {
    console.error("Error restoring version:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}