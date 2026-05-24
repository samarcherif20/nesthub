// app/api/admin/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // ✅ Utiliser getAuth(req) comme dans l'API invitations
    const { userId } = getAuth(req);
    
    if (!userId) {
      console.log("❌ [API SEARCH] Non authentifié");
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // ✅ Vérifier le rôle dans la base de données (comme dans l'API invitations)
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true, id: true, email: true, firstName: true, lastName: true }
    });
    
    if (!admin || admin.role !== "ADMIN") {
      console.log("❌ [API SEARCH] Accès refusé - rôle:", admin?.role);
      return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });
    }

    console.log("✅ [API SEARCH] Accès autorisé pour admin:", admin.email);

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    console.log(`🔍 [API SEARCH] Recherche pour: "${query}"`);

    // ✅ Recherche dans TOUTES les tables selon votre Prisma
    const [users, listings, bookings, payments, verificationRequests, disputes, userReports] = await Promise.all([
      // 1. UTILISATEURS
      prisma.user.findMany({
        where: {
          OR: [
            { email: { contains: query, mode: "insensitive" } },
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { username: { contains: query, mode: "insensitive" } },
            { phoneNumber: { contains: query } },
            { cinNumber: { contains: query } },
          ],
        },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          username: true,
          role: true,
          status: true,
          riskScore: true,
          profilePictureUrl: true,
          isIdentityVerified: true,
          createdAt: true,
          stats: {
            select: {
              trustLabel: true,
              trustBadge: true,
            },
          },
        },
      }),

      // 2. PROPRIÉTÉS (LISTINGS)
      prisma.listing.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { governorate: { contains: query, mode: "insensitive" } },
            { delegation: { contains: query, mode: "insensitive" } },
            { street: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),

      // 3. RÉSERVATIONS
      prisma.booking.findMany({
        where: {
          OR: [
            { reference: { contains: query, mode: "insensitive" } },
            { tenant: { firstName: { contains: query, mode: "insensitive" } } },
            { tenant: { lastName: { contains: query, mode: "insensitive" } } },
            { tenant: { email: { contains: query, mode: "insensitive" } } },
            { listing: { title: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: 5,
        include: {
          tenant: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),

      // 4. PAIEMENTS
      prisma.payment.findMany({
        where: {
          OR: [
            { providerTransactionId: { contains: query, mode: "insensitive" } },
            { booking: { reference: { contains: query, mode: "insensitive" } } },
            { id: { contains: query } },
          ],
        },
        take: 5,
        include: {
          booking: {
            select: {
              reference: true,
              tenant: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),

      // 5. DEMANDES DE VÉRIFICATION
      prisma.verificationRequest.findMany({
        where: {
          OR: [
            { user: { email: { contains: query, mode: "insensitive" } } },
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { user: { lastName: { contains: query, mode: "insensitive" } } },
            { id: { contains: query } },
          ],
        },
        take: 5,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),

      // 6. LITIGES
      prisma.dispute.findMany({
        where: {
          OR: [
            { booking: { reference: { contains: query, mode: "insensitive" } } },
            { description: { contains: query, mode: "insensitive" } },
            { type: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
        include: {
          booking: {
            select: {
              reference: true,
            },
          },
          openedByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),

      // 7. SIGNALEMENTS (UserReport)
      prisma.userReport.findMany({
        where: {
          OR: [
            { reason: { contains: query, mode: "insensitive" } },
            { reporter: { email: { contains: query, mode: "insensitive" } } },
            { reportedUser: { email: { contains: query, mode: "insensitive" } } },
          ],
        },
        take: 5,
        include: {
          reporter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
    ]);

    // ✅ Formater les résultats
    const results = [
      // Utilisateurs
      ...users.map((user) => ({
        type: "user",
        id: user.id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        riskScore: user.riskScore,
        trustLabel: user.stats?.trustLabel,
        isVerified: user.isIdentityVerified,
        avatar: user.profilePictureUrl,
        href: `/admin/users/${user.id}`,
        badgeColor: user.role === "ADMIN"
          ? "bg-purple-100 text-purple-700"
          : user.role === "PROPERTY_OWNER"
            ? "bg-blue-100 text-blue-700"
            : user.role === "BOTH"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700",
        badgeText: user.role === "PROPERTY_OWNER" ? "Propriétaire" : user.role,
      })),

      // Propriétés
      ...listings.map((listing) => ({
        type: "property",
        id: listing.id,
        name: listing.title,
        location: `${listing.governorate}, ${listing.delegation}`,
        owner: `${listing.owner.firstName || ""} ${listing.owner.lastName || ""}`.trim() || listing.owner.email,
        status: listing.status,
        href: `/admin/properties/${listing.id}`,
        badgeColor: listing.status === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : listing.status === "PENDING_REVIEW"
            ? "bg-amber-100 text-amber-700"
            : listing.status === "SUSPENDED"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700",
      })),

      // Réservations
      ...bookings.map((booking) => ({
        type: "booking",
        id: booking.id,
        reference: booking.reference,
        name: `Réservation #${booking.reference}`,
        tenant: `${booking.tenant.firstName || ""} ${booking.tenant.lastName || ""}`.trim() || booking.tenant.email,
        property: booking.listing.title,
        dates: `${new Date(booking.checkIn).toLocaleDateString("fr")} → ${new Date(booking.checkOut).toLocaleDateString("fr")}`,
        status: booking.status,
        amount: `${booking.totalPrice} TND`,
        href: `/admin/bookings/${booking.id}`,
        badgeColor: booking.status === "CONFIRMED"
          ? "bg-green-100 text-green-700"
          : booking.status === "PENDING"
            ? "bg-amber-100 text-amber-700"
            : booking.status === "CANCELLED"
              ? "bg-red-100 text-red-700"
              : booking.status === "COMPLETED"
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-700",
      })),

      // Paiements
      ...payments.map((payment) => ({
        type: "transaction",
        id: payment.id,
        name: `Transaction ${payment.providerTransactionId?.slice(-8) || payment.id.slice(-8)}`,
        amount: `${payment.amount} ${payment.currency}`,
        status: payment.status,
        type: payment.type,
        bookingRef: payment.booking?.reference,
        href: `/admin/transactions/${payment.id}`,
        badgeColor: payment.status === "PAID"
          ? "bg-green-100 text-green-700"
          : payment.status === "PENDING"
            ? "bg-amber-100 text-amber-700"
            : payment.status === "REFUNDED"
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700",
      })),

      // Vérifications
      ...verificationRequests.map((vr) => ({
        type: "verification",
        id: vr.id,
        name: `Vérification ${vr.user.firstName || ""} ${vr.user.lastName || ""}`.trim() || vr.user.email,
        user: vr.user.email,
        status: vr.status,
        submittedAt: vr.submittedAt,
        href: `/admin/verifications/${vr.id}`,
        badgeColor: "bg-amber-100 text-amber-700",
        badgeText: "En attente",
      })),

      // Litiges
      ...disputes.map((dispute) => ({
        type: "dispute",
        id: dispute.id,
        name: `Litige #${dispute.id.slice(-8)}`,
        bookingRef: dispute.booking?.reference,
        type_dispute: dispute.type,
        priority: dispute.priority,
        status: dispute.status,
        openedBy: `${dispute.openedByUser.firstName || ""} ${dispute.openedByUser.lastName || ""}`.trim() || dispute.openedByUser.email,
        href: `/admin/disputes/${dispute.id}`,
        badgeColor: dispute.priority === "HIGH"
          ? "bg-red-100 text-red-700"
          : dispute.priority === "MEDIUM"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700",
      })),

      // Signalements UserReport
      ...userReports.map((report) => ({
        type: "report",
        id: report.id,
        name: `Signalement #${report.id.slice(-8)}`,
        reporter: `${report.reporter.firstName || ""} ${report.reporter.lastName || ""}`.trim() || report.reporter.email,
        reported: `${report.reportedUser.firstName || ""} ${report.reportedUser.lastName || ""}`.trim() || report.reportedUser.email,
        reason: report.reason,
        priority: report.priority,
        href: `/admin/moderation/${report.id}`,
        badgeColor: report.priority === "HIGH"
          ? "bg-red-100 text-red-700"
          : report.priority === "MEDIUM"
            ? "bg-amber-100 text-amber-700"
            : "bg-blue-100 text-blue-700",
      })),
    ];

    console.log(`✅ [API SEARCH] ${results.length} résultats trouvés`);
    return NextResponse.json(results);
    
  } catch (error) {
    console.error("❌ [API SEARCH] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}