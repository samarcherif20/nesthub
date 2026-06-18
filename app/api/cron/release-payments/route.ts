// app/api/cron/release-payments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const maxDuration = 300;

// Récupérer l'ID de l'admin (à faire une fois)
async function getAdminUserId() {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true },
  });
  return admin?.id || null;
}

export async function POST(req: NextRequest) {
  try {
    //  Vérification d'authentification (comme reactivate-users)
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error(" Cron: Authentification échouée pour release-payments");
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log(" [CRON] Vérification des paiements à libérer...");

    const now = new Date();
    const adminId = await getAdminUserId();

    // Trouver les réservations à libérer (séquestre terminé)
    const bookings = await prisma.booking.findMany({
      where: {
        escrowStatus: "HELD",
        escrowReleaseScheduledAt: { lte: now },
        checkInConfirmedAt: { not: null },
        stripePaymentIntentId: { not: null },
      },
      include: {
        listing: { include: { owner: true } },
        tenant: true,
      },
    });

    console.log(` ${bookings.length} paiement(s) à libérer trouvé(s)`);

    let processed = 0;
    let pendingManual = 0;

    for (const booking of bookings) {
      try {
        console.log(` [RELEASE] Traitement booking ${booking.id}...`);

        // Marquer comme "À virer manuellement"
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            escrowStatus: "READY_FOR_MANUAL_PAYOUT",
            paymentStatus: "READY_FOR_PAYOUT",
            escrowReleasedAt: new Date(),
            note: `À virer manuellement vers le RIB du propriétaire`,
          },
        });

        pendingManual++;

        // NOTIFICATION ADMIN (si trouvé)
        if (adminId) {
          await prisma.notification.create({
            data: {
              userId: adminId,
              type: "PAYOUT_REQUIRED",
              title: " Virement manuel requis",
              content: `${booking.totalPrice.toLocaleString("fr-FR")} TND à virer à ${booking.listing.owner.firstName} ${booking.listing.owner.lastName} (RIB: ${booking.listing.owner.rib || "Non fourni"}) pour la réservation #${booking.reference}`,
              data: {
                bookingId: booking.id,
                amount: booking.totalPrice,
                ownerName: `${booking.listing.owner.firstName} ${booking.listing.owner.lastName}`,
                ownerRib: booking.listing.owner.rib,
                reference: booking.reference,
              },
            },
          });
        }

        //  NOTIFICATION au propriétaire
        await prisma.notification.create({
          data: {
            userId: booking.ownerId!,
            type: "PAYMENT_READY",
            title: " Paiement prêt",
            content: `Le paiement de ${booking.totalPrice.toLocaleString("fr-FR")} TND pour la réservation #${booking.reference} est prêt. Notre équipe va procéder au virement sous 48h.`,
            data: { bookingId: booking.id, amount: booking.totalPrice },
          },
        });

        //  NOTIFICATION au locataire
        await prisma.notification.create({
          data: {
            userId: booking.tenantId,
            type: "SYSTEM_ALERT",
            title: " Paiement libéré",
            content: `Le paiement pour votre séjour chez ${booking.listing.title} a été libéré au propriétaire. Merci pour votre confiance !`,
            data: { bookingId: booking.id },
          },
        });

        processed++;
        console.log(
          ` [RELEASE] Marqué pour virement manuel - ${booking.reference}`,
        );
      } catch (error) {
        console.error(` [RELEASE] Erreur pour booking ${booking.id}:`, error);
      }
    }

    console.log(
      ` [CRON] Terminé - Traités: ${processed}, En attente virement manuel: ${pendingManual}`,
    );

    return NextResponse.json({
      success: true,
      processed,
      pendingManual,
      message: `${processed} paiement(s) prêt(s) pour virement manuel`,
    });
  } catch (error) {
    console.error(" Erreur cron release-payments:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
