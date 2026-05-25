// app/api/admin/contact/reply/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailBrevo } from "@/lib/brevo";
import { getAuth } from "@clerk/nextjs/server"; // ou ton système d'auth

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
        { status: 400 }
      );
    }

    // Récupérer le message original
    const contact = await prisma.contactMessage.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json({ error: "Message non trouvé" }, { status: 404 });
    }

    // 1. Envoyer l'email via Brevo au visiteur
    const emailResult = await sendEmailBrevo({
      to: { email: contact.email, name: contact.fullName },
      subject: `Réponse à votre demande : ${contact.fullName}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; }
            .message-box { background: white; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; margin-top: 20px; }
            .button { background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Réponse de notre service client</h2>
          </div>
          <div class="content">
            <p>Bonjour <strong>${contact.fullName}</strong>,</p>
            <p>Nous avons bien reçu votre message et nous vous remercions de nous avoir contactés.</p>
            <p>Voici notre réponse :</p>
            <div class="message-box">
              ${replyMessage.replace(/\n/g, "<br/>")}
            </div>
            <p>Si vous avez d'autres questions, n'hésitez pas à répondre directement à cet email.</p>
            <hr />
            <p style="font-size: 14px; color: #666;">
              <strong>Rappel de votre message initial :</strong><br/>
              "${contact.message.substring(0, 200)}${contact.message.length > 200 ? "..." : ""}"
            </p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} VotrePlateforme - Tous droits réservés</p>
            <p style="font-size: 11px;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
          </div>
        </body>
        </html>
      `,
      replyTo: process.env.BREVO_SENDER_EMAIL,
    });

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

    // 3. Créer une notification pour l'admin (confirmation)
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "SYSTEM_ALERT",
        title: "✅ Réponse envoyée",
        content: `Vous avez répondu à ${contact.fullName} (${contact.email})`,
        channels: ["IN_APP"],
        data: {
          contactId: contact.id,
          emailSent: true,
          messageId: emailResult.messageId,
        },
      },
    });

    // 4. Logger l'action (optionnel)
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
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Réponse envoyée par email au visiteur",
      emailSent: true,
    });
  } catch (error) {
    console.error("Erreur lors de la réponse:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi de la réponse" },
      { status: 500 }
    );
  }
}