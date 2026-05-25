import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, message } = body;

    // Validation
    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 },
      );
    }

    // Sauvegarde en base de données
    const contact = await prisma.contactMessage.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        message,
      },
    });

    // Créer une notification pour les admins
    // Récupérer tous les admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    // Créer une notification pour chaque admin
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SYSTEM_ALERT",
          title: " Nouveau message de contact",
          content: `${fullName} (${email}) vous a envoyé un message.`,
          channels: ["IN_APP"],
          data: {
            contactId: contact.id,
            fullName,
            email,
            phone,
            message: message.substring(0, 200), // Aperçu
          },
        })),
      });
    }

    return NextResponse.json(
      { success: true, message: "Message envoyé avec succès" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'envoi du message" },
      { status: 500 },
    );
  }
}
