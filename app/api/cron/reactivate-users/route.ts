// app/api/cron/reactivate-users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error(" Cron: Authentification échouée");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(" [CRON] Début réactivation utilisateurs");
    const now = new Date();

    const usersToReactivate = await prisma.user.findMany({
      where: {
        status: "TEMPORARILY_SUSPENDED",
        suspendedUntil: { lt: now },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        suspendedUntil: true,
      },
    });

    console.log(` ${usersToReactivate.length} utilisateur(s) à réactiver`);

    if (usersToReactivate.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    await prisma.user.updateMany({
      where: { id: { in: usersToReactivate.map((u) => u.id) } },
      data: { status: "ACTIVE", suspendedUntil: null, updatedAt: now },
    });

    for (const user of usersToReactivate) {
      await prisma.userAction.create({
        data: {
          userId: user.id,
          actionType: "AUTO_REACTIVATE",
          performedBy: "SYSTEM",
          previousStatus: "TEMPORARILY_SUSPENDED",
          newStatus: "ACTIVE",
          motif: "Fin automatique de la suspension",
          createdAt: now,
        },
      });
    }

    console.log(` ${usersToReactivate.length} utilisateurs réactivés`);
    return NextResponse.json({
      success: true,
      count: usersToReactivate.length,
    });
  } catch (error) {
    console.error(" Erreur cron:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
