// app/api/admin/users/actions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminAuth, isAuthError } from "@/lib/auth-admin";
import { Prisma } from "@prisma/client";

// Types pour les actions
interface ActionBody {
  userId: string;
  action:
    | "SUSPEND"
    | "BAN"
    | "ACTIVATE"
    | "LOCK"
    | "UNLOCK"
    | "ESCALATE"
    | "NOTE"
    | "WARNING";
  duration?: number; // Pour SUSPEND
  reason?: string; // Raison courte
  motif?: string; // Motif détaillé
  level?: number; // Pour ESCALATE (1,2,3)
  content?: string; // Pour NOTE
  notify?: boolean; // Pour notifications
}

// GET - Historique des actions
export async function GET(request: NextRequest) {
  try {
    const auth = getAdminAuth(request);

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const userId = searchParams.get("userId");
    const actionType = searchParams.get("actionType");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (actionType && actionType !== "ALL") {
      where.actionType = actionType;
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: "insensitive" } },
        { motif: { contains: search, mode: "insensitive" } },
        { content: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const totalCount = await prisma.userAction.count({ where });

    const actions = await prisma.userAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      actions,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching actions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Effectuer une action
export async function POST(request: NextRequest) {
  try {
    console.log("[1] DEBUT POST ACTION");

    const auth = getAdminAuth(request);
    console.log("[2] Auth reçu:", auth);

    if (isAuthError(auth)) {
      console.log("[3] Auth error:", auth.error);
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    console.log("[4] Auth OK - Admin Clerk ID:", auth.userId);

    const body = (await request.json()) as ActionBody;
    console.log("[5] Body reçu:", JSON.stringify(body, null, 2));

    const { userId, action, duration, reason, motif, level, content, notify } =
      body;

    if (!userId || !action) {
      console.log("[6] Paramètres manquants:", { userId, action });
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 },
      );
    }

    console.log("[7] Recherche admin avec clerkId:", auth.userId);
    const adminUser = await prisma.user.findUnique({
      where: { clerkId: auth.userId },
    });

    console.log("[8] Admin dans DB:", adminUser ? "Trouve" : "Non trouve");
    if (adminUser) {
      console.log("   - UUID:", adminUser.id);
      console.log("   - Email:", adminUser.email);
      console.log("   - Role:", adminUser.role);
    }

    if (!adminUser) {
      console.log("[9] Admin non trouve en base");
      return NextResponse.json({ error: "Admin non trouve" }, { status: 404 });
    }

    console.log("[10] Recherche utilisateur cible avec id:", userId);
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("[11] Utilisateur cible:", user ? "Trouve" : "Non trouve");
    if (user) {
      console.log("   - Email:", user.email);
      console.log("   - Statut actuel:", user.status);
    }

    if (!user) {
      console.log("[12] Utilisateur non trouve:", userId);
      return NextResponse.json(
        { error: "Utilisateur non trouve" },
        { status: 404 },
      );
    }

    console.log("[13] Utilisateur cible trouve:", user.email);

    let newStatus = user.status;
    let suspendedUntil = null;
    let actionType = "";
    let escalationLevel = null;

    console.log("[14] Action à appliquer:", action);

    switch (action) {
      case "SUSPEND":
        console.log("[15] CAS SUSPEND");
        if (!duration || !reason) {
          return NextResponse.json(
            { error: "Duree et raison requises pour la suspension" },
            { status: 400 },
          );
        }

        suspendedUntil = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
        newStatus = "TEMPORARILY_SUSPENDED";
        actionType = "SUSPEND_USER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
            suspendedUntil,
          },
        });

        await prisma.notification.create({
          data: {
            userId: userId,
            type: "SYSTEM_ALERT",
            title: "Compte suspendu",
            content: `Votre compte a ete suspendu temporairement. Raison: ${reason}`,
            channels: ["IN_APP"],
            isRead: false,
            data: {
              type: "SUSPENSION",
              reason: reason,
              motif: motif,
              duration: duration,
            },
          },
        });

        console.log("[16] Utilisateur suspendu - Nouveau statut:", newStatus);
        break;

      case "BAN":
        console.log("[15] CAS BAN");
        if (!reason) {
          return NextResponse.json(
            { error: "Raison requise pour le bannissement" },
            { status: 400 },
          );
        }

        newStatus = "PERMANENTLY_BANNED";
        actionType = "BAN_USER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
            suspendedUntil: null,
          },
        });

        await prisma.notification.create({
          data: {
            userId: userId,
            type: "SYSTEM_ALERT",
            title: "Compte banni",
            content: `Votre compte a ete definitivement banni. Raison: ${reason}`,
            channels: ["IN_APP"],
            isRead: false,
            data: {
              type: "BAN",
              reason: reason,
              motif: motif,
            },
          },
        });

        console.log("[16] Utilisateur banni");
        break;

      case "ACTIVATE":
        console.log("[15] CAS ACTIVATE");
        newStatus = "ACTIVE";
        actionType = "ACTIVATE_USER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
            suspendedUntil: null,
          },
        });
        console.log("[16] Utilisateur active");
        break;

      case "LOCK":
        console.log("[15] CAS LOCK");
        if (!reason) {
          return NextResponse.json(
            { error: "Raison requise pour le blocage" },
            { status: 400 },
          );
        }

        newStatus = "MANUALLY_BLOCKED";
        actionType = "LOCK_USER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
          },
        });
        console.log("[16] Utilisateur bloque");
        break;

      case "UNLOCK":
        console.log("[15] CAS UNLOCK");
        newStatus = "ACTIVE";
        actionType = "UNLOCK_USER";

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
            failedLoginAttempts: 0,
          },
        });
        console.log("[16] Utilisateur debloque");
        break;

      case "ESCALATE":
        console.log("[15] CAS ESCALATE");
        if (!level || !reason) {
          return NextResponse.json(
            { error: "Niveau et raison requis pour l escalade" },
            { status: 400 },
          );
        }

        escalationLevel = level;
        actionType = "ESCALATE_USER";

        let notificationTitle = "";
        let notificationContent = "";

        if (level === 1) {
          notificationTitle = "Avertissement recu";
          notificationContent = `Vous avez recu un avertissement de l equipe NESTHUB. Raison: ${reason.replace(/<[^>]*>/g, "")}`;
          newStatus = user.status;
        } else if (level === 2) {
          suspendedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          newStatus = "TEMPORARILY_SUSPENDED";
          notificationTitle = "Compte suspendu";
          notificationContent = `Votre compte a ete suspendu temporairement. Raison: ${reason.replace(/<[^>]*>/g, "")}`;
        } else if (level === 3) {
          newStatus = "PERMANENTLY_BANNED";
          notificationTitle = "Compte banni";
          notificationContent = `Votre compte a ete definitivement banni. Raison: ${reason.replace(/<[^>]*>/g, "")}`;
        }

        await prisma.user.update({
          where: { id: userId },
          data: {
            status: newStatus,
            suspendedUntil: level === 2 ? suspendedUntil : null,
            escalationLevel: level,
            escalationReason: reason,
            escalatedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: userId,
            type: "SYSTEM_ALERT",
            title: notificationTitle,
            content: notificationContent,
            channels: ["IN_APP"],
            isRead: false,
            data: {
              type:
                level === 1 ? "WARNING" : level === 2 ? "SUSPENSION" : "BAN",
              reason: reason,
              level: level,
            },
          },
        });

        console.log(
          "[16] Escalade appliquee et notification creee - Niveau:",
          level,
        );
        break;

      case "NOTE":
        console.log("[15] CAS NOTE");
        if (!content) {
          return NextResponse.json(
            { error: "Contenu requis pour la note" },
            { status: 400 },
          );
        }

        actionType = "ADD_NOTE";

        await prisma.adminNote.create({
          data: {
            targetUserId: userId,
            authorId: adminUser.id,
            content: content,
            isPrivate: true,
          },
        });
        console.log("[16] Note ajoutee");
        break;

      case "WARNING":
        console.log("[15] CAS WARNING");
        if (!reason) {
          return NextResponse.json(
            { error: "Raison requise pour l avertissement" },
            { status: 400 },
          );
        }

        actionType = "WARNING";
        newStatus = user.status;

        await prisma.user.update({
          where: { id: userId },
          data: {
            escalationLevel: 1,
            escalationReason: reason,
            escalatedAt: new Date(),
          },
        });

        await prisma.notification.create({
          data: {
            userId: userId,
            type: "SYSTEM_ALERT",
            title: "Avertissement recu",
            content: `Vous avez recu un avertissement de l equipe NESTHUB. Raison: ${reason}`,
            channels: ["IN_APP"],
            isRead: false,
            data: {
              type: "WARNING",
              reason: reason,
              motif: motif,
              escalatedAt: new Date().toISOString(),
            },
          },
        });
        console.log("[16] Avertissement configure");
        break;

      default:
        console.log("[15] Action invalide:", action);
        return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    console.log("[17] Tentative creation UserAction avec:");
    console.log("   - userId:", userId);
    console.log("   - actionType:", actionType);
    console.log("   - performedBy (UUID admin):", adminUser.id);
    console.log("   - reason:", reason || null);
    console.log("   - motif:", motif || null);
    console.log("   - previousStatus:", user.status);
    console.log(
      "   - newStatus:",
      newStatus !== user.status ? newStatus : null,
    );

    try {
      const userAction = await prisma.userAction.create({
        data: {
          userId,
          actionType,
          performedBy: adminUser.id,
          reason: reason || null,
          motif: motif || null,
          duration: duration || null,
          level: escalationLevel,
          content: content || null,
          previousStatus: user.status,
          newStatus: newStatus !== user.status ? newStatus : null,
          suspendedUntil,
        },
      });

      console.log("[18] USERACTION CREEE AVEC SUCCES");
      console.log("   - ID:", userAction.id);
      console.log("   - Creee a:", userAction.createdAt);

      const totalActions = await prisma.userAction.count();
      console.log("[19] Total actions en base apres creation:", totalActions);
    } catch (createError: any) {
      console.error("[18] ERREUR CREATION USERACTION:");
      console.error("   - Message:", createError.message);
      console.error("   - Stack:", createError.stack);
      return NextResponse.json(
        { error: "Erreur creation action: " + createError.message },
        { status: 500 },
      );
    }

    try {
      await prisma.auditLog.create({
        data: {
          adminId: adminUser.id,
          action: actionType,
          actionType: "USER_ACTION",
          targetType: "USER",
          targetId: userId,
          details: {
            duration,
            level: escalationLevel,
            reason,
            motif,
          } as any,
          motif: motif || reason || null,
        },
      });
      console.log("[20] Audit log cree");
    } catch (auditError) {
      console.error("[20] ERREUR audit log:", auditError);
    }

    if (notify) {
      console.log("[21] Notification a envoyer pour", user.email);
    }

    console.log("[22] FIN POST ACTION - Succes complet");
    return NextResponse.json({
      success: true,
      message: `Action ${action} effectuee avec succes`,
    });
  } catch (error: any) {
    console.error("[CATASTROPHE] ERREUR NON GEREE:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne: " + error.message },
      { status: 500 },
    );
  }
}
