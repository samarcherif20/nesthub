// app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    console.log(` [Admin API] Recherche de l'utilisateur: ${id}`);

    // Récupérer l'utilisateur avec TOUTES les relations
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        stats: true,
        listings: {
          where: { status: "ACTIVE" },
          include: {
            photos: {
              where: { isMain: true },
              take: 1,
            },
            stats: true,
          },
          orderBy: { createdAt: "desc" },
          take: 6,
        },
        tenantBookings: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            listing: {
              select: { title: true, governorate: true },
            },
          },
        },
        reviewsReceived: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
        loginHistory: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        verificationRequests: {
          where: { status: { in: ["VALIDATED", "REJECTED", "PENDING"] } },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 },
      );
    }

    // Récupérer les disputes via la table Dispute
    const disputes = await prisma.dispute.findMany({
      where: {
        OR: [
          { openedBy: user.id },
          { assignedTo: user.id },
          { booking: { tenantId: user.id } },
          { booking: { ownerId: user.id } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // Formater les disputes pour la réponse
    const formattedDisputes = disputes.map((dispute) => ({
      id: dispute.id,
      number: `DSP-${dispute.id.slice(-8).toUpperCase()}`,
      title: dispute.type || "Dispute",
      type: dispute.type,
      status: dispute.status,
      priority: dispute.priority,
      createdAt: dispute.createdAt.toISOString(),
    }));

    // Récupérer les sessions actives depuis Clerk
    let activeSessions: any[] = [];
    let sessionCount = 0;
    try {
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(user.clerkId);

      if (clerkUser) {
        const sessionsResponse = await clerk.sessions.getSessionList({
          userId: clerkUser.id,
        });

        let sessions: any[] = [];
        if (Array.isArray(sessionsResponse)) {
          sessions = sessionsResponse;
        } else if (sessionsResponse?.data) {
          sessions = sessionsResponse.data;
        }

        sessionCount = sessions.filter(
          (s: any) => s.status === "active",
        ).length;

        activeSessions = sessions.slice(0, 5).map((session: any) => {
          const activity = session.latestActivity || {};
          let device = "Unknown Device";
          if (activity.browserName) {
            device = activity.browserName;
            if (activity.browserVersion) {
              device += ` ${activity.browserVersion}`;
            }
          }
          if (activity.deviceType && activity.deviceType !== "Unknown") {
            device = `${activity.deviceType} - ${device}`;
          }

          let location = "Unknown Location";
          if (activity.city && activity.country) {
            location = `${activity.city}, ${activity.country}`;
          } else if (activity.city) {
            location = activity.city;
          } else if (activity.country) {
            location = activity.country;
          }

          return {
            id: session.id,
            type: "Active Session",
            device: device,
            ipAddress: activity.ipAddress || "IP unknown",
            location: location,
            timestamp: session.lastActiveAt,
            status: "active",
          };
        });
      }
    } catch (clerkError) {
      console.log(
        "[Admin API] Impossible de récupérer les sessions Clerk:",
        clerkError,
      );
    }

    // Récupérer les URLs depuis les bonnes sources
    const latestVerification = user.verificationRequests?.[0];
    const extractedFromVerif = (latestVerification?.extractedData as any) || {};
    const userCinData = (user.cinData as any) || {};

    // Fusion: les données de user.cinData écrasent celles de la vérification
    const cinData = {
      ...extractedFromVerif,
      ...userCinData,
    };

    console.log(
      " [API LOG 1] cinData APRÈS FUSION:",
      JSON.stringify(cinData, null, 2),
    );

    // PRIORITÉ: Utiliser rectoUrl/versoUrl de cinData d'abord
    const rectoUrl =
      cinData?.rectoUrl ||
      cinData?.frontImageUrl ||
      latestVerification?.documentFrontUrl ||
      null;
    const versoUrl =
      cinData?.versoUrl ||
      cinData?.backImageUrl ||
      latestVerification?.documentBackUrl ||
      null;
    const passportUrl = cinData?.passportUrl || null;

    // Déterminer le type de document
    const documentType =
      cinData?.documentType || (passportUrl ? "PASSPORT" : "CIN");

    console.log(" [API LOG 2] rectoUrl:", rectoUrl);
    console.log(" [API LOG 2] versoUrl:", versoUrl);
    console.log(" [API LOG 2] passportUrl:", passportUrl);
    console.log(" [API LOG 2] documentType:", documentType);

    //  Pour l'image à afficher
    const displayImageUrl =
      documentType === "PASSPORT" ? passportUrl : rectoUrl;

    // Calculer les statistiques depuis la base
    const totalListings = user.listings?.length || 0;
    const totalBookings = user.tenantBookings?.length || 0;
    const totalReviews = user.reviewsReceived?.length || 0;

    let averageRating = 0;
    if (user.stats?.averageRating) {
      averageRating = user.stats.averageRating;
    } else if (user.reviewsReceived?.length > 0) {
      const sum = user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0);
      averageRating = sum / user.reviewsReceived.length;
    }

    const trustScore = user.stats?.reliabilityScore || 85;

    // Calcul du rang global (basé sur le trustScore)
    const globalRank =
      (await prisma.user.count({
        where: {
          stats: {
            reliabilityScore: { gt: trustScore },
          },
        },
      })) + 1;

    // Calcul des volumes financiers depuis les réservations
    const completedBookings =
      user.tenantBookings?.filter((b) => b.status === "COMPLETED") || [];
    const totalVolume = completedBookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0,
    );
    const activeBalance = completedBookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const pendingPayout = completedBookings
      .filter((b) => b.paymentStatus === "PENDING")
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalCommission = totalVolume * 0.15;

    // Activités combinées: Sessions actives + LoginHistory + Bookings + Reviews
    const allActivities: any[] = [];

    activeSessions.forEach((session) => {
      allActivities.push({
        id: session.id,
        type: "Active Session",
        device: session.device,
        ipAddress: session.ipAddress,
        location: session.location,
        timestamp: session.timestamp,
        status: "active",
      });
    });

    (user.loginHistory || []).forEach((login) => {
      allActivities.push({
        id: login.id,
        type: login.success ? "Login Successful" : "Failed Login Attempt",
        device: login.device || "Unknown",
        ipAddress: login.ipAddress || "Unknown IP",
        location: login.location || "Unknown Location",
        timestamp: login.createdAt.toISOString(),
        status: login.success ? "success" : "failed",
      });
    });

    (user.tenantBookings || []).forEach((booking) => {
      allActivities.push({
        id: booking.id,
        type: `Booking ${booking.status === "COMPLETED" ? "Completed" : booking.status === "PENDING" ? "Pending" : "Created"}`,
        device: "System",
        ipAddress: "-",
        location: booking.listing?.governorate || "Tunisia",
        timestamp: booking.createdAt.toISOString(),
        status: booking.status === "COMPLETED" ? "success" : "pending",
      });
    });

    (user.reviewsReceived || []).forEach((review) => {
      allActivities.push({
        id: review.id,
        type: `New Review (${review.rating}★)`,
        device: "System",
        ipAddress: "-",
        location: "-",
        timestamp: review.createdAt.toISOString(),
        status: "success",
      });
    });

    allActivities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const recentActivity = allActivities.slice(0, 10);

    if (recentActivity.length === 0) {
      recentActivity.push({
        id: "account_creation",
        type: "Account Created",
        device: "System",
        ipAddress: "-",
        location: user.governorate || "Tunisia",
        timestamp: user.createdAt.toISOString(),
        status: "success",
      });
    }

    // Formater les listings
    const formattedListings = (user.listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      location:
        `${listing.delegation || ""}, ${listing.governorate || ""}`.replace(
          /^, /,
          "",
        ),
      pricePerNight: listing.pricePerNight || 0,
      status: listing.status,
      rating: listing.stats?.averageRating || 4.5,
      reviewCount: listing.bookingCount || 0,
      image: listing.photos?.[0]?.url || "",
    }));

    const response = {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      email: user.email,
      phoneNumber: user.phoneNumber,
      profilePictureUrl: user.profilePictureUrl,
      governorate: user.governorate,
      delegation: user.delegation,
      role: user.role,
      isIdentityVerified: user.isIdentityVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      status: user.status,
      createdAt: user.createdAt,
      activeSessionsCount: sessionCount,
      verificationRequestId: latestVerification?.id || null,

      cinData: {
        cinNumber: cinData?.cinNumber || user.cinNumber,
        firstName: cinData?.firstName,
        lastName: cinData?.lastName,
        dateOfBirth: cinData?.dateOfBirth,
        documentType: documentType,
        passportNumber: cinData?.passportNumber,
        country: cinData?.country,
        rectoUrl: rectoUrl,
        versoUrl: versoUrl,
        frontImageUrl: rectoUrl,
        backImageUrl: versoUrl,
        passportUrl: passportUrl,
      },
      stats: {
        trustScore: trustScore,
        globalRank: globalRank,
        totalVolume: totalVolume,
        activeBalance: activeBalance,
        pendingPayout: pendingPayout,
        totalCommission: totalCommission,
        totalListings: totalListings,
        totalBookings: totalBookings,
        totalReviews: totalReviews,
        averageRating: averageRating.toFixed(1),
        responseRate: trustScore,
      },
      listings: formattedListings,
      recentActivity: recentActivity,
      disputes: formattedDisputes,
    };

    console.log(
      " [API LOG 3] response.cinData envoyé:",
      JSON.stringify(response.cinData, null, 2),
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Admin API] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Mettre à jour un utilisateur
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "suspend") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "TEMPORARILY_SUSPENDED",
          suspendedUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await prisma.userAction.create({
        data: {
          userId: id,
          actionType: "SUSPEND",
          performedBy: "admin",
          reason: "Suspension manuelle",
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    if (action === "activate") {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          status: "ACTIVE",
          suspendedUntil: null,
        },
      });

      await prisma.userAction.create({
        data: {
          userId: id,
          actionType: "ACTIVATE",
          performedBy: "admin",
          reason: "Activation manuelle",
        },
      });

      return NextResponse.json({ success: true, user: updatedUser });
    }

    return NextResponse.json({ error: "Action non reconnue" }, { status: 400 });
  } catch (error) {
    console.error("[Admin API PATCH] Erreur:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
