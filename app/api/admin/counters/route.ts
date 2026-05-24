// app/api/admin/counters/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Ajustez le chemin selon votre projet

export async function GET() {
  try {
    const [
      pendingVerifications,
      pendingReports,
      activeDisputes,
      unreadNotifications,
      pendingInvitations,
      pendingListings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
    ] = await Promise.all([
      // Vérifications en attente
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      
      // Signalements en attente (modération)
      prisma.userReport.count({ where: { status: "PENDING" } }),
      
      // Litiges actifs
      prisma.dispute.count({ where: { status: "OPEN" } }),
      
      // Notifications non lues (à adapter selon votre modèle)
      prisma.notification.count({ where: { isRead: false } }),
      
      // Invitations en attente
      prisma.adminInvitation.count({ 
        where: { 
          acceptedAt: null, 
          revokedAt: null, 
          expiresAt: { gt: new Date() } 
        } 
      }),
      
      // Propriétés en attente de validation
      prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
      
      // Réservations en attente
      prisma.booking.count({ where: { status: "PENDING" } }),
      
      // Réservations confirmées
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      
      // Réservations terminées
      prisma.booking.count({ where: { status: "COMPLETED" } }),
    ]);

    return NextResponse.json({
      pendingVerifications,
      pendingReports,
      activeDisputes,
      unreadNotifications,
      pendingInvitations,
      pendingListings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
    });
  } catch (error) {
    console.error("Error fetching counters:", error);
    
    // Retourner des valeurs par défaut en cas d'erreur
    return NextResponse.json({
      pendingVerifications: 0,
      pendingReports: 0,
      activeDisputes: 0,
      unreadNotifications: 0,
      pendingInvitations: 0,
      pendingListings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      completedBookings: 0,
    });
  }
}