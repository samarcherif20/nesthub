// lib/api/withAuth.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { getUserPermissions, checkListingAccess } from "@/lib/auth/permissions";

type Handler = (req: NextRequest, context: any) => Promise<NextResponse>;

interface AuthOptions {
  requiredRole?: "OWNER" | "ADMIN";
  requireListingAccess?: boolean;
  requiredPermission?:
    | "view"
    | "edit"
    | "manageBookings"
    | "viewRevenue"
    | "manageTeam";
  getListingId?: (req: NextRequest, context: any) => string | null;
}

export function withAuth(handler: Handler, options: AuthOptions = {}) {
  return async function (req: NextRequest, context: any) {
    try {
      const { userId: clerkId } = getAuth(req);

      if (!clerkId) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }

      const permissions = await getUserPermissions(clerkId);
      if (!permissions) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 },
        );
      }

      if (
        options.requiredRole &&
        options.requiredRole === "OWNER" &&
        permissions.role !== "OWNER"
      ) {
        return NextResponse.json(
          { error: "Accès réservé aux propriétaires" },
          { status: 403 },
        );
      }

      if (options.requireListingAccess) {
        let listingId: string | null = null;

        // ✅ CORRIGÉ - Récupérer l'id de manière asynchrone
        if (options.getListingId) {
          listingId = options.getListingId(req, context);
        } else if (context.params) {
          // ✅ context.params est une Promise, il faut l'attendre
          const params = await context.params;
          listingId = params?.id || null;
        }

        if (!listingId) {
          listingId = new URL(req.url).searchParams.get("listingId");
        }

        if (!listingId) {
          return NextResponse.json(
            { error: "ID de l'annonce requis" },
            { status: 400 },
          );
        }

        const access = await checkListingAccess(
          clerkId,
          listingId,
          options.requiredPermission || "view",
        );
        if (!access.allowed) {
          return NextResponse.json({ error: access.error }, { status: 403 });
        }
      }

      (req as any).user = {
        id: permissions.userId,
        clerkId,
        role: permissions.role,
      };
      (req as any).permissions = permissions;

      return handler(req, context);
    } catch (error) {
      console.error("[withAuth] Error:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
  };
}
