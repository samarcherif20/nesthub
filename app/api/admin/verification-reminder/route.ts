import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NotificationChannel } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { message } = await req.json();

    // Récupérer l'utilisateur qui demande la vérification
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        profilePictureUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Vérifier si l'utilisateur a déjà envoyé un rappel récemment (optionnel)
    const recentReminder = await prisma.userAction.findFirst({
      where: {
        userId: user.id,
        actionType: "VERIFICATION_REMINDER_SENT",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // 24h
      },
    });

    if (recentReminder) {
      return NextResponse.json(
        { error: "Un rappel a déjà été envoyé dans les dernières 24 heures" },
        { status: 429 }
      );
    }

    // Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    if (admins.length === 0) {
      return NextResponse.json(
        { error: "Aucun administrateur trouvé" },
        { status: 404 }
      );
    }

    // Créer une notification pour chaque admin
    const notifications = admins.map((admin) => ({
      userId: admin.id,
      type: "SYSTEM_ALERT",
      title: " Rappel de vérification d'identité",
      content: `L'utilisateur ${user.firstName} ${user.lastName} (${user.email}) demande une vérification de son identité. ${message ? `Message: ${message}` : ""}`,
      channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
      data: {
        type: "VERIFICATION_REMINDER",
        userId: user.id,
        userEmail: user.email,
        userName: `${user.firstName} ${user.lastName}`,
        userPhone: user.phoneNumber,
        userAvatar: user.profilePictureUrl,
        reminderMessage: message || null,
      },
      isRead: false,
      sentAt: new Date(),
      createdAt: new Date(),
    }));

    // Créer les notifications
    await prisma.notification.createMany({
      data: notifications,
    });

    // Enregistrer l'action de l'utilisateur (rappel envoyé)
    await prisma.userAction.create({
      data: {
        userId: user.id,
        actionType: "VERIFICATION_REMINDER_SENT",
        performedBy: user.id,
        motif: message || "Demande de vérification d'identité",
        content: JSON.stringify({
          message: message || null,
          adminsNotified: admins.length,
          timestamp: new Date().toISOString(),
        }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        adminId: user.id,
        action: "VERIFICATION_REMINDER_SENT",
        actionType: "USER_ACTION",
        targetType: "USER",
        targetId: user.id,
        details: {
          adminsNotified: admins.length,
          message: message || null,
        },
        motif: message || "Demande de vérification d'identité",
      },
    });

    console.log(` RAPPEL ADMIN: ${notifications.length} notification(s) envoyée(s) pour l'utilisateur ${user.email}`);

    return NextResponse.json({
      success: true,
      message: "Rappel envoyé aux administrateurs",
      notificationsSent: notifications.length,
      adminsNotified: admins.length,
    });
  } catch (error) {
    console.error("Error sending verification reminder:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}