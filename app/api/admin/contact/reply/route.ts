// app/api/admin/contact/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactEmailService } from "@/lib/services/contact-email.service";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est admin
    const { userId } = getAuth(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, email: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await req.json();
    const { contactId, replyMessage } = body;

    if (!contactId || !replyMessage) {
      return NextResponse.json(
        { error: "ID du message et réponse requis" },
        { status: 400 },
      );
    }

    // Récupérer le message original
    const contact = await prisma.contactMessage.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Message non trouvé" },
        { status: 404 },
      );
    }

    // 1. Envoyer l'email avec le service contact
    await contactEmailService.sendReply(
      contact.email,
      contact.fullName,
      replyMessage,
      contact.message,
    );

    // 2. Mettre à jour le message dans la base
    await prisma.contactMessage.update({
      where: { id: contactId },
      data: {
        status: "REPLIED",
        repliedBy: admin.id,
        reply: replyMessage,
        repliedAt: new Date(),
      },
    });

    // 3. NOTIFICATION IN-APP POUR L'UTILISATEUR CONNECTÉ (SI EXISTE)
    if (contact.userId) {
      await prisma.notification.create({
        data: {
          userId: contact.userId,
          type: "SYSTEM_ALERT",
          title: " Réponse à votre message",
          content: `L'équipe support vous a répondu. Vérifiez votre boîte email.`,
          channels: ["IN_APP"],
          data: {
            contactId: contact.id,
            repliedAt: new Date().toISOString(),
          },
        },
      });
    }

    // 4. Créer une notification pour l'admin (confirmation)
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "SYSTEM_ALERT",
        title: " Réponse envoyée",
        content: `Vous avez répondu à ${contact.fullName} (${contact.email})`,
        channels: ["IN_APP"],
        data: {
          contactId: contact.id,
          emailSent: true,
          // messageId: emailResult.messageId,  ← SUPPRIME (plus nécessaire)
        },
      },
    });

    // 5. Logger l'action dans l'audit
    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "REPLY_TO_CONTACT",
        actionType: "CONTACT",
        targetType: "CONTACT_MESSAGE",
        targetId: contact.id,
        details: {
          visitorEmail: contact.email,
          visitorName: contact.fullName,
          replyLength: replyMessage.length,
          isConnectedUser: !!contact.userId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Réponse envoyée par email",
      emailSent: true,
      notificationSent: !!contact.userId,
    });
  } catch (error) {
    console.error("Erreur lors de la réponse:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la réponse" },
      { status: 500 },
    );
  }
}
