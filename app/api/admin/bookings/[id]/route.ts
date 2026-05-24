// app/api/admin/bookings/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// Helper pour vérifier si l'utilisateur est admin
async function isAdminUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    return user?.role === "ADMIN";
  } catch (error) {
    console.error("Erreur vérification admin:", error);
    return false;
  }
}

// GET - Récupérer les détails d'une réservation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé - Droits administrateur requis" }, { status: 403 });
    }

    const { id } = await params;

    // Récupération de la réservation avec toutes les relations
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            photos: {
              where: { isMain: true },
              take: 1,
              select: { url: true },
            },
          },
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profilePictureUrl: true,
            isIdentityVerified: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paidAt: true,
            provider: true,
            providerTransactionId: true,
          },
        },
        conversation: {
          select: {
            id: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
        dispute: {
          select: {
            id: true,
            status: true,
            priority: true,
            createdAt: true,
          },
        },
        messages: {
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            content: true,
            createdAt: true,
            isRead: true,
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Récupérer les notes admin liées à cette réservation via la conversation ou directement
    const adminNotes = await prisma.adminNote.findMany({
      where: {
        conversationId: booking.conversation?.id,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Construction du timeline (journal d'audit)
    const timeline = [];

    // Ajout de la création de la réservation
    timeline.push({
      id: "creation",
      action: "Réservation créée",
      description: `La réservation a été créée par ${booking.tenant.firstName} ${booking.tenant.lastName}`,
      createdAt: booking.createdAt,
      actor: `${booking.tenant.firstName} ${booking.tenant.lastName}`,
    });

    // Ajout de la confirmation si elle existe
    if (booking.confirmedAt) {
      timeline.push({
        id: "confirmation",
        action: "Réservation confirmée",
        description: `La réservation a été confirmée par l'administrateur`,
        createdAt: booking.confirmedAt,
        actor: "Administrateur",
      });
    }

    // Ajout de l'annulation si elle existe
    if (booking.cancelledAt) {
      timeline.push({
        id: "cancellation",
        action: "Réservation annulée",
        description: `La réservation a été annulée${booking.cancellationReason ? ` pour la raison: ${booking.cancellationReason}` : ""}`,
        createdAt: booking.cancelledAt,
        actor: "Système",
      });
    }

    // Ajout du paiement si effectué
    const paidPayment = booking.payments.find(p => p.status === "PAID");
    if (paidPayment?.paidAt) {
      timeline.push({
        id: "payment",
        action: "Paiement effectué",
        description: `Paiement de ${formatPrice(paidPayment.amount)} effectué avec succès via ${paidPayment.provider}`,
        createdAt: paidPayment.paidAt,
        actor: booking.tenant.firstName,
      });
    }

    // Ajout d'un avis si existant
    if (booking.review) {
      timeline.push({
        id: "review",
        action: "Avis laissé",
        description: `${booking.tenant.firstName} a laissé un avis de ${booking.review.rating}/5 étoiles`,
        createdAt: booking.review.createdAt,
        actor: booking.tenant.firstName,
      });
    }

    // Ajout d'un litige si existant
    if (booking.dispute) {
      timeline.push({
        id: "dispute",
        action: "Litige ouvert",
        description: `Un litige a été ouvert (Priorité: ${booking.dispute.priority})`,
        createdAt: booking.dispute.createdAt,
        actor: "Système",
      });
    }

    // Trier le timeline par date décroissante
    timeline.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calcul du nombre de nuits
    const checkInDate = new Date(booking.checkIn);
    const checkOutDate = new Date(booking.checkOut);
    const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    // Formatage des notes
    const formattedNotes = adminNotes.map(note => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      adminName: `${note.author.firstName} ${note.author.lastName}`,
    }));

    // Construction de la réponse
    const response = {
      id: booking.id,
      reference: booking.reference,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      guests: booking.guests,
      totalNights: totalNights,
      totalPrice: booking.totalPrice,
      cleaningFee: booking.cleaningFee || 0,
      serviceFee: booking.serviceFee || 0,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
      listing: {
        id: booking.listing.id,
        title: booking.listing.title,
        governorate: booking.listing.governorate,
        delegation: booking.listing.delegation,
        street: booking.listing.street,
        pricePerNight: booking.listing.pricePerNight,
        images: booking.listing.photos,
      },
      tenant: {
        id: booking.tenant.id,
        firstName: booking.tenant.firstName,
        lastName: booking.tenant.lastName,
        email: booking.tenant.email,
        phoneNumber: booking.tenant.phoneNumber,
        profilePictureUrl: booking.tenant.profilePictureUrl,
        isIdentityVerified: booking.tenant.isIdentityVerified,
      },
      owner: {
        id: booking.owner.id,
        firstName: booking.owner.firstName,
        lastName: booking.owner.lastName,
        email: booking.owner.email,
        phoneNumber: booking.owner.phoneNumber,
        profilePictureUrl: booking.owner.profilePictureUrl,
        isIdentityVerified: booking.owner.isIdentityVerified,
      },
      payments: booking.payments,
      conversationId: booking.conversation?.id,
      review: booking.review,
      dispute: booking.dispute,
      recentMessages: booking.messages,
      timeline: timeline,
      notes: formattedNotes,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Admin Booking Detail API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Ajouter une note admin sur une réservation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Le contenu de la note est requis" }, { status: 400 });
    }

    // Récupérer la réservation pour obtenir la conversationId
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { conversationId: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Réservation non trouvée" }, { status: 404 });
    }

    // Récupérer l'utilisateur admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, firstName: true, lastName: true },
    });

    if (!admin) {
      return NextResponse.json({ error: "Admin non trouvé" }, { status: 404 });
    }

    // Créer la note admin liée à la conversation de la réservation
    const note = await prisma.adminNote.create({
      data: {
        content: content.trim(),
        authorId: admin.id,
        targetUserId: booking.tenantId, // La note concerne le voyageur
        conversationId: booking.conversationId,
        isPrivate: true,
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      note: {
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        adminName: `${note.author.firstName} ${note.author.lastName}`,
      }
    });
  } catch (error) {
    console.error("[Admin Booking Note API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une réservation (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const isAdmin = await isAdminUser(clerkUserId);
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, status, dates } = body;

    let updateData: any = {};

    if (action === "update-dates" && dates) {
      const { checkIn, checkOut } = dates;
      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const totalNights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));
      
      updateData = {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalNights,
      };
    } else if (action === "refund") {
      updateData.paymentStatus = "REFUNDED";
    } else if (action === "cancel") {
      updateData.status = "CANCELLED";
      updateData.cancelledAt = new Date();
    } else if (action === "confirm") {
      updateData.status = "CONFIRMED";
      updateData.confirmedAt = new Date();
    } else if (status) {
      updateData.status = status;
    } else {
      return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("[Admin Booking Update API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Fonction utilitaire pour formater les prix
function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "TND",
    minimumFractionDigits: 2,
  }).format(price);
}