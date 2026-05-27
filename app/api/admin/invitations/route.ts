// app/api/admin/invitations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { invitationEmailService } from "@/lib/services/invitation-email.service";
import { randomUUID } from "crypto";

// POST /api/admin/invitations — Creer et envoyer une invitation
export async function POST(req: NextRequest) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("Non authentifie");
      return NextResponse.json({ errorCode: "UNAUTHENTICATED" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { firstName: true, lastName: true, email: true, role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      console.log("Acces refuse - role:", admin?.role);
      return NextResponse.json({ errorCode: "ACCESS_DENIED" }, { status: 403 });
    }

    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      console.log("Email invalide:", email);
      return NextResponse.json({ errorCode: "INVALID_EMAIL" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log("Invitation pour:", normalizedEmail);

    const existingAcceptedInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        acceptedAt: { not: null },
      },
    });

    if (existingAcceptedInvitation) {
      console.log("Utilisateur a deja accepte une invitation:", normalizedEmail);
      return NextResponse.json(
        { errorCode: "ALREADY_ACCEPTED_INVITATION" },
        { status: 409 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { role: true, email: true },
    });

    if (existingUser && existingUser.role === "ADMIN") {
      console.log("Utilisateur deja admin:", normalizedEmail);
      return NextResponse.json(
        { errorCode: "USER_ALREADY_ADMIN" },
        { status: 409 },
      );
    }

    const existingActiveInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingActiveInvitation) {
      console.log("Invitation active existante pour:", normalizedEmail);
      return NextResponse.json(
        {
          errorCode: "ACTIVE_INVITATION_EXISTS",
          invitation: {
            id: existingActiveInvitation.id,
            expiresAt: existingActiveInvitation.expiresAt,
          },
        },
        { status: 409 },
      );
    }

    const existingRevokedInvitation = await prisma.adminInvitation.findFirst({
      where: {
        email: normalizedEmail,
        revokedAt: { not: null },
      },
    });

    let invitation;
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    console.log("Token cree:", token);
    console.log("Expire le:", expiresAt);

    if (existingRevokedInvitation) {
      console.log(
        "Invitation revoquee trouvee, mise a jour:",
        existingRevokedInvitation.id,
      );
      invitation = await prisma.adminInvitation.update({
        where: { id: existingRevokedInvitation.id },
        data: {
          token,
          expiresAt,
          revokedAt: null,
          acceptedAt: null,
        },
      });
      console.log("Invitation revoquee mise a jour, ID:", invitation.id);
    } else {
      await prisma.adminInvitation.deleteMany({
        where: {
          email: normalizedEmail,
          expiresAt: { lt: new Date() },
          acceptedAt: null,
          revokedAt: null,
        },
      });
      console.log("Anciennes invitations expirees supprimees");

      invitation = await prisma.adminInvitation.create({
        data: {
          email: normalizedEmail,
          token,
          invitedBy: userId,
          expiresAt,
          role: "ADMIN",
        },
      });
      console.log("Nouvelle invitation creee en DB, ID:", invitation.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteLink = `${baseUrl}/${req.nextUrl.locale || "fr"}/accept-invite?token=${token}&type=admin`;
    console.log("Lien d'invitation:", inviteLink);

    const adminName =
      `${admin.firstName || ""} ${admin.lastName || ""}`.trim() ||
      "Un administrateur";

    try {
      await invitationEmailService.sendInvitation({
        toEmail: normalizedEmail,
        invitedByName: adminName,
        invitedByEmail: admin.email,
        inviteLink,
        expiresAt,
      });
      console.log("Email envoye avec succes a:", normalizedEmail);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      return NextResponse.json(
        {
          success: false,
          errorCode: "EMAIL_SEND_FAILED",
          invitation: { id: invitation.id, email: invitation.email, expiresAt },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt,
      },
    });
  } catch (error: any) {
    console.error("[POST /api/admin/invitations] Erreur detaillee:", error);

    if (error.code === "P2002") {
      return NextResponse.json(
        { errorCode: "UNIQUE_CONSTRAINT_ERROR" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { errorCode: "SERVER_ERROR", message: error.message },
      { status: 500 },
    );
  }
}

// GET /api/admin/invitations — Liste des invitations avec pagination et filtres
export async function GET(req: NextRequest) {
  console.log("GET /api/admin/invitations - Debut");

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      console.log("Non authentifie");
      return NextResponse.json({ errorCode: "UNAUTHENTICATED" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (!admin || admin.role !== "ADMIN") {
      console.log("Acces refuse - role:", admin?.role);
      return NextResponse.json({ errorCode: "ACCESS_DENIED" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const statusFilter = searchParams.get("status");
    const searchFilter = searchParams.get("search");

    const skip = (page - 1) * limit;

    const allInvitations = await prisma.adminInvitation.findMany();
    const now = new Date();

    const pendingCount = allInvitations.filter((i) => {
      return !i.revokedAt && !i.acceptedAt && i.expiresAt > now;
    }).length;
    const expiredCount = allInvitations.filter((i) => {
      return !i.revokedAt && !i.acceptedAt && i.expiresAt < now;
    }).length;
    const acceptedCount = allInvitations.filter(
      (i) => i.acceptedAt !== null,
    ).length;
    const revokedCount = allInvitations.filter(
      (i) => i.revokedAt !== null,
    ).length;

    let whereCondition: any = {};

    if (statusFilter && statusFilter !== "all") {
      if (statusFilter === "pending") {
        whereCondition = {
          ...whereCondition,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { gt: now },
        };
      } else if (statusFilter === "expired") {
        whereCondition = {
          ...whereCondition,
          acceptedAt: null,
          revokedAt: null,
          expiresAt: { lt: now },
        };
      } else if (statusFilter === "accepted") {
        whereCondition = { ...whereCondition, acceptedAt: { not: null } };
      } else if (statusFilter === "revoked") {
        whereCondition = { ...whereCondition, revokedAt: { not: null } };
      }
    }

    if (searchFilter && searchFilter.trim()) {
      whereCondition = {
        ...whereCondition,
        email: {
          contains: searchFilter.toLowerCase().trim(),
          mode: "insensitive",
        },
      };
    }

    const total = await prisma.adminInvitation.count({ where: whereCondition });
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const invitations = await prisma.adminInvitation.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const inviterIds = [...new Set(invitations.map((i) => i.invitedBy))];
    const inviters = await prisma.user.findMany({
      where: { clerkId: { in: inviterIds } },
      select: { clerkId: true, firstName: true, lastName: true, email: true },
    });

    const inviterMap = Object.fromEntries(inviters.map((u) => [u.clerkId, u]));

    const enriched = invitations.map((inv) => {
      let status = "pending";
      if (inv.revokedAt) {
        status = "revoked";
      } else if (inv.acceptedAt) {
        status = "accepted";
      } else if (now > inv.expiresAt) {
        status = "expired";
      }

      return {
        id: inv.id,
        email: inv.email,
        role: inv.role,
        invitedBy: inv.invitedBy,
        token: inv.token,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
        acceptedAt: inv.acceptedAt?.toISOString() || null,
        status,
        invitedByUser: inviterMap[inv.invitedBy] || null,
        isExpired: status === "expired",
        isAccepted: status === "accepted",
        isRevoked: status === "revoked",
        daysRemaining:
          status === "pending"
            ? Math.ceil(
                (inv.expiresAt.getTime() - now.getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : 0,
      };
    });

    return NextResponse.json({
      invitations: enriched,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      stats: {
        active: pendingCount,
        expired: expiredCount,
        accepted: acceptedCount,
        revoked: revokedCount,
        total: allInvitations.length,
      },
    });
  } catch (error: any) {
    console.error("[GET /api/admin/invitations] Erreur:", error);
    return NextResponse.json(
      { errorCode: "SERVER_ERROR", message: error.message },
      { status: 500 },
    );
  }
}