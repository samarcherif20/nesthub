import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server"; // ← AJOUTER

export async function POST(req: NextRequest) {
  try {
    // ← AJOUTER : Récupérer l'utilisateur connecté
    const { userId } = getAuth(req);

    const body = await req.json();
    let { fullName, email, phone, message } = body;

    // Validation
    if (!fullName || !email || !message) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 },
      );
    }

    // ← AJOUTER : Si utilisateur connecté, récupérer ses infos
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (dbUser) {
        // Utiliser les infos de l'utilisateur connecté
        fullName = `${dbUser.firstName} ${dbUser.lastName}`.trim();
        email = dbUser.email!;
      }
    }

    // Sauvegarde en base de données (avec userId si connecté)
    const contact = await prisma.contactMessage.create({
      data: {
        fullName,
        email,
        phone: phone || null,
        userId: dbUser?.id || null, // ← AJOUTER : Lien avec l'utilisateur
        message,
      },
    });

    // Créer une notification pour les admins
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
            isConnected: !!dbUser, // ← AJOUTER : Indiquer si c'est un utilisateur connecté
            message: message.substring(0, 200),
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
