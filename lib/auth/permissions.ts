// lib/auth/permissions.ts
import { prisma } from "@/lib/prisma";

export interface UserPermissions {
  userId: string;
  role: "OWNER" | "CO_HOST" | "ADMIN";
  canEditListing: (listingId: string) => Promise<boolean>;
  canViewListing: (listingId: string) => Promise<boolean>;
  canManageBookings: (listingId: string) => Promise<boolean>;
  canViewRevenue: (listingId: string) => Promise<boolean>;
  canManageTeam: (listingId: string) => Promise<boolean>;
}

export async function getUserPermissions(
  clerkId: string,
): Promise<UserPermissions | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true, role: true },
    });

    if (!user) return null;

    //  ADMIN doit avoir le rôle "ADMIN", pas "OWNER"
    if (user.role === "ADMIN") {
      return {
        userId: user.id,
        role: "ADMIN",
        canEditListing: async () => true,
        canViewListing: async () => true,
        canManageBookings: async () => true,
        canViewRevenue: async () => true,
        canManageTeam: async () => true,
      };
    }

    // Propriétaire
    if (user.role === "PROPERTY_OWNER" || user.role === "BOTH") {
      return {
        userId: user.id,
        role: "OWNER",
        canEditListing: async () => true,
        canViewListing: async () => true,
        canManageBookings: async () => true,
        canViewRevenue: async () => true,
        canManageTeam: async () => true,
      };
    }

    // Co-hôte - récupérer les permissions depuis team_members
    const teamMemberships = await prisma.teamMember.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      select: {
        listingId: true,
        canEdit: true,
        canManageBookings: true,
        canViewRevenue: true,
        canManageTeam: true,
      },
    });

    // Si l'utilisateur n'est ni propriétaire ni co-hôte, retourner null
    if (teamMemberships.length === 0) {
      return null;
    }

    const permissionsMap = new Map(
      teamMemberships.map((m) => [
        m.listingId,
        {
          canEdit: m.canEdit,
          canManageBookings: m.canManageBookings,
          canViewRevenue: m.canViewRevenue,
          canManageTeam: m.canManageTeam,
        },
      ]),
    );

    return {
      userId: user.id,
      role: "CO_HOST",
      canEditListing: async (listingId: string) =>
        permissionsMap.get(listingId)?.canEdit || false,
      canViewListing: async (listingId: string) =>
        permissionsMap.has(listingId),
      canManageBookings: async (listingId: string) =>
        permissionsMap.get(listingId)?.canManageBookings || false,
      canViewRevenue: async (listingId: string) =>
        permissionsMap.get(listingId)?.canViewRevenue || false,
      canManageTeam: async (listingId: string) =>
        permissionsMap.get(listingId)?.canManageTeam || false,
    };
  } catch (error) {
    console.error("[getUserPermissions] Error:", error);
    return null;
  }
}

export async function checkListingAccess(
  clerkId: string,
  listingId: string,
  requiredPermission:
    | "view"
    | "edit"
    | "manageBookings"
    | "viewRevenue"
    | "manageTeam" = "view",
): Promise<{
  allowed: boolean;
  error?: string;
  userPermissions?: UserPermissions;
}> {
  try {
    const permissions = await getUserPermissions(clerkId);

    if (!permissions) {
      return {
        allowed: false,
        error: "Utilisateur non trouvé ou non autorisé",
      };
    }

    // ADMIN a toujours accès à tout
    if (permissions.role === "ADMIN") {
      return { allowed: true, userPermissions: permissions };
    }

    // Propriétaire - vérifier que c'est bien son annonce
    if (permissions.role === "OWNER") {
      const listing = await prisma.listing.findFirst({
        where: { id: listingId, ownerId: permissions.userId },
        select: { id: true },
      });
      if (!listing) {
        return { allowed: false, error: "Annonce non trouvée" };
      }
      return { allowed: true, userPermissions: permissions };
    }

    // Co-hôte - vérifier la permission spécifique
    switch (requiredPermission) {
      case "view":
        if (await permissions.canViewListing(listingId)) {
          return { allowed: true, userPermissions: permissions };
        }
        return {
          allowed: false,
          error: "Vous n'avez pas accès à cette annonce",
        };

      case "edit":
        if (await permissions.canEditListing(listingId)) {
          return { allowed: true, userPermissions: permissions };
        }
        return {
          allowed: false,
          error: "Permission refusée pour modifier cette annonce",
        };

      case "manageBookings":
        if (await permissions.canManageBookings(listingId)) {
          return { allowed: true, userPermissions: permissions };
        }
        return {
          allowed: false,
          error: "Permission refusée pour gérer les réservations",
        };

      case "viewRevenue":
        if (await permissions.canViewRevenue(listingId)) {
          return { allowed: true, userPermissions: permissions };
        }
        return {
          allowed: false,
          error: "Permission refusée pour voir les revenus",
        };

      case "manageTeam":
        if (await permissions.canManageTeam(listingId)) {
          return { allowed: true, userPermissions: permissions };
        }
        return {
          allowed: false,
          error: "Permission refusée pour gérer l'équipe",
        };

      default:
        return { allowed: false, error: "Permission non reconnue" };
    }
  } catch (error) {
    console.error("[checkListingAccess] Error:", error);
    return {
      allowed: false,
      error: "Erreur lors de la vérification des permissions",
    };
  }
}