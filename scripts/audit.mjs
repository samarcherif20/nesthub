import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAuditLogs() {
  try {
    const logs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    console.log("📋 Derniers logs d'audit:");
    console.log("=".repeat(80));
    
    if (logs.length === 0) {
      console.log("❌ Aucun log trouvé dans la table audit_logs");
    } else {
      console.log(`✅ ${logs.length} logs trouvés\n`);
    }
    
    logs.forEach((log, index) => {
      console.log(`
[${index + 1}] 
ID: ${log.id}
Admin: ${log.admin?.firstName || "?"} ${log.admin?.lastName || "?"} (${log.admin?.email || "?"})
Action: ${log.action}
Type: ${log.actionType}
Cible: ${log.targetType} / ${log.targetId}
IP: ${log.ipAddress || "-"}
Date: ${log.createdAt}
Détails: ${JSON.stringify(log.details, null, 2)}
${"-".repeat(80)}`);
    });
    
    // Compter le total
    const total = await prisma.auditLog.count();
    console.log(`\n📊 Total des logs dans la table: ${total}`);
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAuditLogs();