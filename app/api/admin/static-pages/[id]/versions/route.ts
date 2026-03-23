import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET - Get version history for a page
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

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

    // Récupérer les versions depuis StaticPageVersion
    const versions = await prisma.staticPageVersion.findMany({
      where: {
        staticPageId: id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Formatage des données pour l'interface
    const formattedVersions = versions.map(version => {
      // Parser le htmlContent qui contient les métadonnées
      let metadata = {
        content: version.htmlContent,
        title: currentPage.title,
        type: currentPage.type,
        slug: currentPage.slug,
        status: currentPage.status,
      };

      try {
        // Essayer de parser si c'est du JSON
        const parsed = JSON.parse(version.htmlContent);
        if (parsed.content !== undefined) {
          metadata = {
            content: parsed.content,
            title: parsed.title || currentPage.title,
            type: parsed.type || currentPage.type,
            slug: parsed.slug || currentPage.slug,
            status: parsed.status || currentPage.status,
          };
        }
      } catch {
        // Si ce n'est pas du JSON, on garde le contenu brut
        metadata.content = version.htmlContent;
      }

      return {
        id: version.id,
        title: metadata.title,
        htmlContent: metadata.content,
        type: metadata.type,
        slug: metadata.slug,
        status: metadata.status,
        version: version.version,
        createdAt: version.createdAt,
        createdBy: version.createdByUser ? 
          `${version.createdByUser.firstName || ''} ${version.createdByUser.lastName || ''}`.trim() || version.createdByUser.email :
          'Utilisateur inconnu',
      };
    });

    // Récupérer les infos de l'utilisateur qui a mis à jour la page actuelle
    let currentUpdatedByUser = null;
    if (currentPage.updatedBy) {
      const user = await prisma.user.findUnique({
        where: { id: currentPage.updatedBy },
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      });
      currentUpdatedByUser = user;
    }

    return NextResponse.json({
      current: {
        id: currentPage.id,
        title: currentPage.title,
        htmlContent: currentPage.htmlContent,
        type: currentPage.type,
        slug: currentPage.slug,
        status: currentPage.status,
        version: currentPage.version,
        updatedAt: currentPage.updatedAt,
        updatedBy: currentPage.updatedBy,
        updatedByUser: currentUpdatedByUser ? 
          `${currentUpdatedByUser.firstName || ''} ${currentUpdatedByUser.lastName || ''}`.trim() || currentUpdatedByUser.email :
          'Utilisateur inconnu',
      },
      versions: formattedVersions,
    });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}