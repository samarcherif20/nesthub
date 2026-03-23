// app/api/cron/reactivate-users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  console.log("🚀 [CRON] Route appelée");
  
  try {
    // 🔐 Vérification simple sans dépendre du proxy
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    
    console.log("🔑 Token reçu:", token ? "Présent" : "Absent");
    console.log("🔑 CRON_SECRET existe:", !!process.env.CRON_SECRET);
    console.log("🔑 CRON_SECRET length:", process.env.CRON_SECRET?.length);
    console.log("🔑 Token length:", token?.length);
    console.log("🔑 Match:", token === process.env.CRON_SECRET);
    
    if (!process.env.CRON_SECRET) {
      console.error("❌ CRON_SECRET non défini dans les variables d'environnement");
      return NextResponse.json({ 
        error: "Configuration serveur incorrecte",
        message: "CRON_SECRET manquant"
      }, { status: 500 });
    }
    
    if (token !== process.env.CRON_SECRET) {
      console.log("❌ Token invalide");
      return NextResponse.json({ 
        error: "Non authentifié",
        message: "Token invalide ou manquant"
      }, { status: 401 });
    }

    console.log("✅ Authentification réussie");
    
    const now = new Date();
    console.log(`🚀 [CRON] Début réactivation - ${now.toISOString()}`);
    
    // Récupérer tous les utilisateurs suspendus expirés
    const usersToReactivate = await prisma.user.findMany({
      where: {
        status: "TEMPORARILY_SUSPENDED",
        suspendedUntil: {
          lt: now
        }
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        suspendedUntil: true
      }
    });

    console.log(`📊 ${usersToReactivate.length} utilisateurs à réactiver`);

    if (usersToReactivate.length === 0) {
      return NextResponse.json({ 
        success: true, 
        count: 0,
        message: "Aucun utilisateur à réactiver"
      });
    }

    // Réactiver en masse
    await prisma.user.updateMany({
      where: {
        id: { in: usersToReactivate.map(u => u.id) }
      },
      data: {
        status: "ACTIVE",
        suspendedUntil: null,
        updatedAt: now
      }
    });

    // Logger chaque réactivation
    for (const user of usersToReactivate) {
      await prisma.userAction.create({
        data: {
          userId: user.id,
          actionType: "AUTO_REACTIVATE",
          performedBy: "SYSTEM",
          previousStatus: "TEMPORARILY_SUSPENDED",
          newStatus: "ACTIVE",
          motif: "Fin automatique de la suspension",
          createdAt: now
        }
      });

      await prisma.auditLog.create({
        data: {
          adminId: "SYSTEM",
          action: "AUTO_REACTIVATE",
          actionType: "SYSTEM",
          targetType: "USER",
          targetId: user.id,
          details: {
            previousStatus: "TEMPORARILY_SUSPENDED",
            newStatus: "ACTIVE",
            suspendedUntil: user.suspendedUntil,
            reactivatedAt: now
          }
        }
      });
    }

    console.log(`✅ [CRON] ${usersToReactivate.length} utilisateurs réactivés`);
    
    return NextResponse.json({ 
      success: true, 
      count: usersToReactivate.length,
      timestamp: now.toISOString()
    });

  } catch (error) {
    console.error("❌ [CRON] Erreur détaillée:", error);
    
    // Message d'erreur plus détaillé
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
    const errorStack = error instanceof Error ? error.stack : null;
    
    console.error("Message:", errorMessage);
    if (errorStack) console.error("Stack:", errorStack);
    
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}