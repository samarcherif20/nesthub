import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request);

    console.log(" userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier dans la base de données si l'utilisateur est ADMIN
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true },
    });

    console.log(" Utilisateur trouvé:", user);

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Non autorisé - Admin seulement" },
        { status: 403 },
      );
    }

    const { count } = await request.json();

    // Créer la notification
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM_ALERT",
        title: `${count} demande(s) de vérification en attente`,
        content: `${count} demande(s) sont en attente depuis plus de 24h. Veuillez les traiter.`,
        channels: ["IN_APP"],
        data: {
          type: "PENDING_VERIFICATIONS_REMINDER",
          count: count,
          link: "/admin/verifications",
        },
        sentAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    console.log("Notification créée avec succès:", notification.id);

    return NextResponse.json({ success: true, notification });
  } catch (error) {
    console.error("Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
