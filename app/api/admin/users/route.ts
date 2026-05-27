import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth, isAuthError } from "@/lib/auth-admin";
import { Prisma, UserRole, AccountStatus } from "@prisma/client";

// Types
interface UserFilters {
  search: string;
  role: string;
  status: string;
  verificationStatus: string;
  dateFrom: string;
  dateTo: string;
  minReliability: string;
  maxFraud: string;
}

interface ActionBody {
  targetUserId: string;
  action:
    | "SUSPEND"
    | "BAN"
    | "ACTIVATE"
    | "REJECT_VERIFICATION"
    | "VALIDATE_VERIFICATION";
  motif?: string;
  duration?: number;
}

interface CinExtractedData {
  cinNumber?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  [key: string]: unknown;
}

// GET - Liste des utilisateurs
export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const searchParams = request.nextUrl.searchParams;

    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const skip = (page - 1) * limit;

    // Filtres
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role");
    const statusFilter = searchParams.get("status");
    const verificationStatus = searchParams.get("verificationStatus");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const minReliability = searchParams.get("minReliability");
    const maxFraud = searchParams.get("maxFraud");

    // Construction WHERE
    const where: Prisma.UserWhereInput = {};
    let hasAdvancedSearch = false;

    if (search) {
      // Mapping des termes français vers les valeurs de la base de données
      const mapSearchTerm = (
        term: string,
      ): { field: string; value: string } | null => {
        const normalizedTerm = term.toLowerCase().trim();

        // Mapping des statuts (français → valeur DB)
        const statusMap: Record<string, string> = {
          actif: "ACTIVE",
          actifs: "ACTIVE",
          active: "ACTIVE",
          suspendu: "TEMPORARILY_SUSPENDED",
          suspendus: "TEMPORARILY_SUSPENDED",
          suspendue: "TEMPORARILY_SUSPENDED",
          banni: "PERMANENTLY_BANNED",
          bannis: "PERMANENTLY_BANNED",
          bannie: "PERMANENTLY_BANNED",
          "en attente": "PENDING_VALIDATION",
          attente: "PENDING_VALIDATION",
          verrouillé: "SECURITY_LOCKED",
          verrouillés: "SECURITY_LOCKED",
          bloqué: "MANUALLY_BLOCKED",
          bloqués: "MANUALLY_BLOCKED",
          rejeté: "REJECTED",
          rejetés: "REJECTED",
          inactif: "INACTIVE",
          inactifs: "INACTIVE",
        };

        // Mapping des rôles (français → valeur DB)
        const roleMap: Record<string, string> = {
          admin: "ADMIN",
          administrateur: "ADMIN",
          propriétaire: "PROPERTY_OWNER",
          prop: "PROPERTY_OWNER",
          locataire: "TENANT",
          tenant: "TENANT",
          "les deux": "BOTH",
          both: "BOTH",
          "co-hôte": "CO_HOST",
          cohôte: "CO_HOST",
        };

        if (statusMap[normalizedTerm]) {
          return { field: "status", value: statusMap[normalizedTerm] };
        }

        if (roleMap[normalizedTerm]) {
          return { field: "role", value: roleMap[normalizedTerm] };
        }

        return null;
      };

      const searchTerms = search.split(/\s+/);

      const statusConditions: any[] = [];
      const roleConditions: any[] = [];
      const textConditions: any[] = [];

      for (const term of searchTerms) {
        const mapped = mapSearchTerm(term);
        if (mapped && mapped.field === "status") {
          statusConditions.push({ status: mapped.value });
        } else if (mapped && mapped.field === "role") {
          roleConditions.push({ role: mapped.value });
        } else if (term.length > 0) {
          textConditions.push(
            { email: { contains: term, mode: Prisma.QueryMode.insensitive } },
            {
              firstName: { contains: term, mode: Prisma.QueryMode.insensitive },
            },
            {
              lastName: { contains: term, mode: Prisma.QueryMode.insensitive },
            },
            {
              username: { contains: term, mode: Prisma.QueryMode.insensitive },
            },
            { phoneNumber: { contains: term } },
            { cinNumber: { contains: term } },
          );
        }
      }

      // Construction de la clause WHERE combinée
      const andConditions: any[] = [];

      if (statusConditions.length > 0) {
        andConditions.push({ AND: statusConditions });
      }

      if (roleConditions.length > 0) {
        andConditions.push({ AND: roleConditions });
      }

      if (textConditions.length > 0) {
        andConditions.push({ OR: textConditions });
      }

      // Déterminer si c'est une recherche avancée
      for (const term of searchTerms) {
        if (mapSearchTerm(term) !== null) {
          hasAdvancedSearch = true;
          break;
        }
      }

      if (andConditions.length > 0) {
        where.AND = andConditions;
      }
    }

    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter as UserRole;
    }

    if (statusFilter && statusFilter !== "ALL") {
      if (statusFilter === "INACTIVE") {
        where.lastLogin = {
          lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        };
        where.status = "ACTIVE";
      } else if (statusFilter === "LOCKED") {
        where.OR = [
          { status: "SECURITY_LOCKED" },
          { status: "MANUALLY_BLOCKED" },
        ];
      } else {
        where.status = statusFilter as AccountStatus;
      }
    }

    if (verificationStatus && verificationStatus !== "ALL") {
      if (verificationStatus === "VERIFIED") {
        where.isIdentityVerified = true;
      } else if (verificationStatus === "PENDING") {
        where.verificationRequests = {
          some: { status: "PENDING" },
        };
      } else if (verificationStatus === "REJECTED") {
        where.verificationRequests = {
          some: { status: "REJECTED" },
        };
      } else if (verificationStatus === "NON_VERIFIE") {
        where.isIdentityVerified = false;
        where.verificationRequests = {
          none: { status: { in: ["PENDING", "REJECTED"] } },
        };
      }
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (minReliability || maxFraud) {
      where.stats = {};
      if (minReliability) {
        where.stats.reliabilityScore = { gte: parseInt(minReliability) };
      }
      if (maxFraud) {
        where.stats.fraudScore = { lte: parseInt(maxFraud) };
      }
    }

    // Récupérer les paramètres de tri depuis l'URL
    const sortField = searchParams.get("sort") || "createdAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    let orderBy: any = {};
    
    switch (sortField) {
      case "firstName":
        orderBy = { firstName: sortOrder };
        break;
      case "reliabilityScore":
        orderBy = { stats: { reliabilityScore: sortOrder } };
        break;
      case "fraudScore":
        orderBy = { stats: { fraudScore: sortOrder } };
        break;
      case "createdAt":
      default:
        orderBy = { createdAt: sortOrder };
        break;
    }

    // Récupérer les utilisateurs
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          clerkId: true,
          email: true,
          username: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          profilePictureUrl: true,
          role: true,
          status: true,
          escalationLevel: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isIdentityVerified: true,
          cinNumber: true,
          createdAt: true,
          lastLogin: true,
          verifiedAt: true,
          suspendedUntil: true,
          failedLoginAttempts: true,
          stats: {
            select: {
              reliabilityScore: true,
              fraudScore: true,
            },
          },
          verificationRequests: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              rejectionMotif: true,
            },
            orderBy: { submittedAt: "desc" },
            take: 1,
          },
          _count: {
            select: {
              verificationRequests: true,
              userActions: true,
              loginHistory: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Fonction pour déterminer le statut de vérification
    const getVerificationStatus = (user: any) => {
      if (user.isIdentityVerified) return "VERIFIED";
      if (user.verificationRequests?.[0]?.status === "PENDING")
        return "PENDING";
      if (user.verificationRequests?.[0]?.status === "REJECTED")
        return "REJECTED";
      return "NON_VERIFIE";
    };

    // Transformation des données
    const transformedUsers = users.map((user) => ({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      profilePictureUrl: user.profilePictureUrl,
      role: user.role,
      status: user.status,
      escalationLevel: user.escalationLevel ?? 0,
      verificationStatus: getVerificationStatus(user),
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isIdentityVerified: user.isIdentityVerified,
      cinNumber: user.cinNumber,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      verifiedAt: user.verifiedAt,
      suspendedUntil: user.suspendedUntil,
      failedLoginAttempts: user.failedLoginAttempts ?? 0,
      verificationRequests: user.verificationRequests,
      _count: user._count,
      reliabilityScore: user.stats?.reliabilityScore ?? 50,
      fraudScore: user.stats?.fraudScore ?? 0,
    }));

    // ===========================================
    // STATISTIQUES CORRIGÉES AVEC TOUS LES STATUTS
    // ===========================================
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      newUsers30d,
      verifiedUsers,
      pendingRequests,
      activeUsers,
      pendingValidationUsers,
      suspendedUsers,
      bannedUsers,
      securityLockedUsers,
      manuallyBlockedUsers,
      rejectedUsers,
      inactiveUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.user.count({ where: { isIdentityVerified: true } }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "PENDING_VALIDATION" } }),
      prisma.user.count({ where: { status: "TEMPORARILY_SUSPENDED" } }),
      prisma.user.count({ where: { status: "PERMANENTLY_BANNED" } }),
      prisma.user.count({ where: { status: "SECURITY_LOCKED" } }),
      prisma.user.count({ where: { status: "MANUALLY_BLOCKED" } }),
      prisma.user.count({ where: { status: "REJECTED" } }),
      prisma.user.count({
        where: {
          status: "ACTIVE",
          lastLogin: { lt: thirtyDaysAgo },
        },
      }),
    ]);

    const totalLocked = securityLockedUsers + manuallyBlockedUsers;
    const totalSuspended =
      suspendedUsers + bannedUsers + totalLocked + rejectedUsers;

    return NextResponse.json({
      users: transformedUsers,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        totalUsers: totalCount,
        newUsers30d,
        activeUsers,
        pendingValidationUsers,
        pendingUsers: pendingRequests,
        suspendedUsers,
        bannedUsers,
        lockedUsers: totalLocked,
        rejectedUsers,
        inactiveUsers,
        verifiedIdentity:
          totalCount > 0 ? Math.round((verifiedUsers / totalCount) * 100) : 0,
        pendingApprovals: pendingRequests,
        averageReliability: 75,
      },
      hasAdvancedSearch,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}

// PATCH - Actions sur utilisateur
export async function PATCH(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = (await request.json()) as ActionBody;
    const { targetUserId, action, motif, duration } = body;

    // Validation
    if (!targetUserId || !action) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    if (
      (action === "SUSPEND" ||
        action === "BAN" ||
        action === "REJECT_VERIFICATION") &&
      !motif
    ) {
      return NextResponse.json(
        { error: "Le motif est obligatoire pour cette action" },
        { status: 400 },
      );
    }

    let suspendedUntil: Date | null = null;
    let actionType = "";
    let previousStatus: AccountStatus | undefined;

    // Récupérer l'utilisateur pour connaître son statut actuel
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    previousStatus = user.status;

    switch (action) {
      case "SUSPEND":
        suspendedUntil = duration
          ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000)
          : null;

        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            status: "TEMPORARILY_SUSPENDED",
            suspendedUntil,
          },
        });
        actionType = "SUSPEND_USER";
        break;

      case "BAN":
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            status: "PERMANENTLY_BANNED",
            suspendedUntil: null,
          },
        });
        actionType = "BAN_USER";
        break;

      case "ACTIVATE":
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            status: "ACTIVE",
            suspendedUntil: null,
          },
        });
        actionType = "ACTIVATE_USER";
        break;

      case "REJECT_VERIFICATION":
        const lastRequest = await prisma.verificationRequest.findFirst({
          where: {
            userId: targetUserId,
            status: "PENDING",
          },
          orderBy: { submittedAt: "desc" },
        });

        if (lastRequest) {
          await prisma.verificationRequest.update({
            where: { id: lastRequest.id },
            data: {
              status: "REJECTED",
              rejectionMotif: motif,
              reviewedBy: auth.userId,
              reviewedAt: new Date(),
            },
          });
        }
        actionType = "REJECT_VERIFICATION";
        break;

      case "VALIDATE_VERIFICATION":
        const pendingRequest = await prisma.verificationRequest.findFirst({
          where: {
            userId: targetUserId,
            status: "PENDING",
          },
          orderBy: { submittedAt: "desc" },
        });

        if (pendingRequest) {
          const extractedData =
            pendingRequest.extractedData as CinExtractedData | null;
          const cinNumber = extractedData?.cinNumber;

          await prisma.$transaction([
            prisma.verificationRequest.update({
              where: { id: pendingRequest.id },
              data: {
                status: "VALIDATED",
                reviewedBy: auth.userId,
                reviewedAt: new Date(),
              },
            }),
            prisma.user.update({
              where: { id: targetUserId },
              data: {
                isIdentityVerified: true,
                verifiedAt: new Date(),
                cinNumber: cinNumber,
                cinData: pendingRequest.extractedData as Prisma.JsonValue,
              },
            }),
          ]);
        }
        actionType = "VALIDATE_VERIFICATION";
        break;

      default:
        return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    // Enregistrer l'action
    await prisma.userAction.create({
      data: {
        userId: targetUserId,
        actionType,
        performedBy: auth.userId,
        previousStatus,
        newStatus:
          action === "SUSPEND"
            ? "TEMPORARILY_SUSPENDED"
            : action === "BAN"
              ? "PERMANENTLY_BANNED"
              : action === "ACTIVATE"
                ? "ACTIVE"
                : undefined,
        motif: motif || null,
        duration: duration || null,
        suspendedUntil,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: auth.userId,
        action: actionType,
        actionType: "USER_ACTION",
        targetType: "USER",
        targetId: targetUserId,
        details: {
          previousStatus,
          newStatus:
            action === "SUSPEND"
              ? "TEMPORARILY_SUSPENDED"
              : action === "BAN"
                ? "PERMANENTLY_BANNED"
                : action === "ACTIVATE"
                  ? "ACTIVE"
                  : undefined,
          duration,
          suspendedUntil: suspendedUntil?.toISOString(),
        } as Prisma.JsonValue,
        motif: motif || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Action ${action} effectuée avec succès`,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 },
    );
  }
}
