// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que l'utilisateur est admin
    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * pageSize;

    // Construire le where pour les paiements
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    // Récupérer les paiements avec leurs réservations
    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              listing: {
                select: {
                  id: true,
                  title: true,
                  photos: {
                    where: { isMain: true },
                    take: 1,
                    select: { url: true },
                  },
                },
              },
              tenant: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.payment.count({ where }),
    ]);

    // Formater les transactions
    const transactions = payments.map((payment) => ({
      id: payment.id,
      reference: `TXN-${payment.id.slice(-8).toUpperCase()}`,
      date: payment.createdAt,
      amount: payment.amount,
      property: {
        id: payment.booking?.listing?.id,
        title: payment.booking?.listing?.title || "N/A",
        image: payment.booking?.listing?.photos[0]?.url,
      },
      status: payment.status === "PAID" ? "SUCCESS" : 
              payment.status === "REFUNDED" ? "REFUNDED" : 
              payment.status === "FAILED" ? "FAILED" : "PENDING",
      provider: payment.provider,
      tenantName: payment.booking?.tenant 
        ? `${payment.booking.tenant.firstName || ""} ${payment.booking.tenant.lastName || ""}`.trim()
        : undefined,
    }));

    // Calculer les KPIs
    const allPayments = await prisma.payment.findMany({
      where: { status: { in: ["PAID", "SUCCESS", "REFUNDED"] } },
    });

    const totalVolume = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalCommissions = totalVolume * 0.05; // 5% de commission
    const pendingPayouts = await prisma.payment.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    });
    const pendingCount = await prisma.payment.count({ where: { status: "PENDING" } });

    const kpis = {
      totalVolume,
      totalCommissions,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      pendingCount,
      volumeGrowth: 12, // À calculer avec la logique métier
      commissionsGrowth: 8.4,
    };

    return NextResponse.json({
      transactions,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
      kpis,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}