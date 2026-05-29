import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/withAuth";
import { UserRole } from "@prisma/client";

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
    const includePending = searchParams.get("includePending") === "true";

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    //  Récupérer l'annonce pour vérifier les pending revisions
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: {
        hasPendingRevision: true,
        pendingRevision: true,
        pendingRevisionSubmittedAt: true,
      },
    });

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
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    //  Formater l'historique avec détection admin et pending revisions
    const formattedHistory = history.map((entry) => {
      // Détecter si l'utilisateur est un ADMIN
      const isAdmin = entry.changedByUser.role === UserRole.ADMIN;

      // Formater le nom en fonction du rôle
      let displayName = "";
      if (isAdmin) {
        displayName = "Administrateur";
      } else if (
        entry.changedByUser.firstName &&
        entry.changedByUser.lastName
      ) {
        displayName = `${entry.changedByUser.firstName} ${entry.changedByUser.lastName}`;
      } else if (entry.changedByUser.firstName) {
        displayName = entry.changedByUser.firstName;
      } else if (entry.changedByUser.email) {
        displayName = entry.changedByUser.email.split("@")[0];
      } else {
        displayName = "Utilisateur";
      }

      return {
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
          role: entry.changedByUser.role,
          displayName,
          isAdmin,
        },
      };
    });

    //  Ajouter les pending revisions comme entrées d'historique virtuelles
    let allHistory = [...formattedHistory];

    if (
      includePending &&
      listing?.hasPendingRevision &&
      listing.pendingRevision
    ) {
      const pendingRevision = listing.pendingRevision as any;
      const submittedAt = listing.pendingRevisionSubmittedAt;

      // Créer une entrée virtuelle pour la révision en attente avec le bon typage
      const pendingEntry = {
        id: `pending-${Date.now()}`,
        actionType: "PENDING_REVISION",
        fieldName: null,
        oldValue: null,
        newValue: pendingRevision,
        createdAt: submittedAt?.toISOString() || new Date().toISOString(),
        changedByUser: {
          id: "system",
          firstName: null,
          lastName: null,
          profilePictureUrl: null,
          email: "system@nesthub.com",
          role: UserRole.ADMIN,
          displayName: "En attente de validation",
          isAdmin: false,
        },
        isPendingRevision: true,
      };

      allHistory = [pendingEntry, ...allHistory];
    }

    return NextResponse.json({
      history: allHistory,
      total: allHistory.length,
      hasPendingRevision: listing?.hasPendingRevision || false,
    });
  },
  {
    requireListingAccess: true,
    requiredPermission: "view",
  },
);
