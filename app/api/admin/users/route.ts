import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth, isAuthError, AdminAuth } from "@/lib/auth-admin";
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

    // Construction de la clause WHERE
    const where: Prisma.UserWhereInput = {};

    // Recherche multicritères
    if (search) {
      where.OR = [
        { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { username: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { phoneNumber: { contains: search } },
        { cinNumber: { contains: search } },
      ];
    }

    // Filtre par rôle
    if (roleFilter && roleFilter !== "ALL") {
      where.role = roleFilter as UserRole;
    }

    // Filtre par statut
    if (statusFilter && statusFilter !== "ALL") {
      where.status = statusFilter as AccountStatus;
    }

    // Filtre par statut de vérification
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
      }
    }

    // Filtre par date
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    // Filtre par score
    if (minReliability || maxFraud) {
      where.stats = {};
      if (minReliability) {
        where.stats.reliabilityScore = { gte: parseInt(minReliability) };
      }
      if (maxFraud) {
        where.stats.fraudScore = { lte: parseInt(maxFraud) };
      }
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
          isEmailVerified: true,
          isPhoneVerified: true,
          isIdentityVerified: true,
          cinNumber: true,
          createdAt: true,
          lastLogin: true,
          verifiedAt: true,
          suspendedUntil: true,
          escalationLevel: true, // ✅ AJOUTEZ CECI !

          stats: {
            select: {
              reliabilityScore: true,
              fraudScore: true,
            },
          },
          verificationRequests: {
            where: { status: "PENDING" },
            take: 1,
            select: { id: true, status: true, submittedAt: true },
          },
          _count: {
            select: {
              verificationRequests: true,
              userActions: true,
              loginHistory: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

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
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isIdentityVerified: user.isIdentityVerified,
      cinNumber: user.cinNumber,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      verifiedAt: user.verifiedAt,
      suspendedUntil: user.suspendedUntil,
      escalationLevel: user.escalationLevel,
      verificationRequests: user.verificationRequests,
      _count: user._count,
      reliabilityScore: user.stats?.reliabilityScore ?? 50,
      fraudScore: user.stats?.fraudScore ?? 0,
    }));

    // Statistiques
    const [
      newUsers30d,
      verifiedUsers,
      pendingRequests,
      suspendedUsers,
      bannedUsers,
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
      prisma.user.count({ where: { isIdentityVerified: true } }),
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { status: "TEMPORARILY_SUSPENDED" } }),
      prisma.user.count({ where: { status: "PERMANENTLY_BANNED" } }),
    ]);

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
        activeUsers: totalCount - (suspendedUsers + bannedUsers),
        pendingUsers: pendingRequests,
        suspendedUsers,
        bannedUsers,
        verifiedIdentity:
          totalCount > 0 ? Math.round((verifiedUsers / totalCount) * 100) : 0,
        pendingApprovals: pendingRequests,
        averageReliability: 75,
      },
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
        details:
          duration || suspendedUntil
            ? ({
                duration,
                suspendedUntil: suspendedUntil?.toISOString(),
              } as Prisma.JsonValue)
            : Prisma.JsonNull,
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
