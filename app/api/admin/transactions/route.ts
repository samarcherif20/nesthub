// app/api/admin/transactions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    // 1. Récupérer les paiements de la base de données d'abord
    const dbPayments = await prisma.payment.findMany({
      where: {
        ...(startDate &&
          endDate && {
            createdAt: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }),
      },
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
                photos: {
                  take: 1,
                  where: { isMain: true },
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
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transformer les paiements DB en transactions
    const dbTransactions = dbPayments.map((payment) => {
      const tenantName = payment.booking?.tenant
        ? `${payment.booking.tenant.firstName || ""} ${payment.booking.tenant.lastName || ""}`.trim()
        : undefined;

      const ownerName = payment.booking?.owner
        ? `${payment.booking.owner.firstName || ""} ${payment.booking.owner.lastName || ""}`.trim()
        : undefined;

      return {
        id: payment.id,
        reference: payment.id.slice(-8).toUpperCase(),
        date: payment.createdAt.toISOString(),
        amount: payment.amount,
        commission: payment.amount * 0.1,
        netAmount: payment.amount * 0.9,
        property: {
          id: payment.booking?.listing?.id,
          title: payment.booking?.listing?.title || "N/A",
          image: payment.booking?.listing?.photos?.[0]?.url,
        },
        status:
          payment.status === "PAID"
            ? "SUCCESS"
            : payment.status === "REFUNDED"
              ? "REFUNDED"
              : payment.status === "PENDING"
                ? "PENDING"
                : "FAILED",
        provider: payment.provider,
        tenantName: tenantName,
        ownerName: ownerName,
        tenantEmail: payment.booking?.tenant?.email,
        type: "PAYMENT" as const,
        paymentIntentId: payment.providerTransactionId,
        bookingId: payment.bookingId,
      };
    });

    // 2. Récupérer les transactions Stripe
    let stripeCharges: Stripe.Charge[] = [];
    try {
      const charges = await stripe.charges.list({
        limit: 100,
        ...(startDate &&
          endDate && {
            created: {
              gte: new Date(startDate).getTime() / 1000,
              lte: new Date(endDate).getTime() / 1000,
            },
          }),
        expand: ["data.balance_transaction", "data.payment_intent"],
      });
      stripeCharges = charges.data;
    } catch (error) {
      console.error("Stripe fetch error:", error);
    }

    // Enrichir les transactions Stripe avec les données de la BD
    const stripeTransactions = stripeCharges.map((charge) => {
      const metadata = charge.metadata || {};
      const bookingId = metadata.booking_id;

      // Chercher le paiement correspondant dans la base de données
      const matchingPayment = dbPayments.find(
        (p) => p.providerTransactionId === charge.id || p.id === bookingId,
      );

      let txStatus: "SUCCESS" | "PENDING" | "REFUNDED" | "FAILED" = "PENDING";
      if (charge.status === "succeeded") {
        txStatus = "SUCCESS";
      } else if (charge.status === "failed") {
        txStatus = "FAILED";
      } else if (charge.refunded) {
        txStatus = "REFUNDED";
      }

      // Utiliser les données de la BD si disponibles
      const property = matchingPayment?.booking?.listing
        ? {
            id: matchingPayment.booking.listing.id,
            title: matchingPayment.booking.listing.title,
            image: matchingPayment.booking.listing.photos?.[0]?.url,
          }
        : {
            id: metadata.listing_id || "",
            title:
              metadata.listing_title ||
              metadata.property_title ||
              "Réservation",
            image: "",
          };

      const tenantName = matchingPayment?.booking?.tenant
        ? `${matchingPayment.booking.tenant.firstName || ""} ${matchingPayment.booking.tenant.lastName || ""}`.trim()
        : metadata.customer_name ||
          metadata.tenant_name ||
          charge.billing_details?.name ||
          "";

      return {
        id: charge.id,
        reference: charge.id.slice(-8).toUpperCase(),
        date: new Date(charge.created * 1000).toISOString(),
        amount: charge.amount / 100,
        commission: (charge.amount / 100) * 0.1,
        netAmount: (charge.amount / 100) * 0.9,
        property: property,
        status: txStatus,
        provider: "STRIPE",
        tenantName: tenantName,
        tenantEmail: charge.billing_details?.email || metadata.customer_email,
        type: "PAYMENT" as const,
        paymentIntentId:
          typeof charge.payment_intent === "string"
            ? charge.payment_intent
            : charge.payment_intent?.id,
        description: charge.description || `Réservation: ${property.title}`,
        receiptUrl: charge.receipt_url,
        bookingId: bookingId,
      };
    });

    // 3. Récupérer les remboursements Stripe
    let stripeRefunds: Stripe.Refund[] = [];
    try {
      const refunds = await stripe.refunds.list({
        limit: 100,
        ...(startDate &&
          endDate && {
            created: {
              gte: new Date(startDate).getTime() / 1000,
              lte: new Date(endDate).getTime() / 1000,
            },
          }),
      });
      stripeRefunds = refunds.data;
    } catch (error) {
      console.error("Stripe refunds fetch error:", error);
    }

    // Enrichir les remboursements avec les données de la BD
    const refundTransactions = stripeRefunds.map((refund) => {
      const originalCharge = stripeCharges.find((c) => c.id === refund.charge);
      const metadata = originalCharge?.metadata || {};
      const bookingId = metadata.booking_id;
      const matchingPayment = dbPayments.find(
        (p) => p.providerTransactionId === refund.charge || p.id === bookingId,
      );

      const property = matchingPayment?.booking?.listing
        ? {
            id: matchingPayment.booking.listing.id,
            title: matchingPayment.booking.listing.title,
            image: matchingPayment.booking.listing.photos?.[0]?.url,
          }
        : {
            id: metadata.listing_id || "",
            title: metadata.listing_title || "Remboursement",
            image: "",
          };

      const tenantName = matchingPayment?.booking?.tenant
        ? `${matchingPayment.booking.tenant.firstName || ""} ${matchingPayment.booking.tenant.lastName || ""}`.trim()
        : metadata.customer_name || "";

      return {
        id: refund.id,
        reference: refund.id.slice(-8).toUpperCase(),
        date: new Date(refund.created * 1000).toISOString(),
        amount: -(refund.amount / 100),
        commission: 0,
        netAmount: -(refund.amount / 100),
        property: property,
        status: "REFUNDED" as const,
        provider: "STRIPE",
        tenantName: tenantName,
        type: "REFUND" as const,
        refundId: refund.id,
        refundReason: refund.reason,
        bookingId: bookingId,
      };
    });

    // Combiner toutes les transactions (éviter les doublons)
    const allDbIds = new Set(dbTransactions.map((t) => t.id));
    const uniqueStripeTransactions = stripeTransactions.filter(
      (t) => !allDbIds.has(t.id),
    );
    const uniqueRefundTransactions = refundTransactions.filter(
      (t) => !allDbIds.has(t.id),
    );

    let allTransactions = [
      ...dbTransactions,
      ...uniqueStripeTransactions,
      ...uniqueRefundTransactions,
    ];

    // Filtrer par recherche
    if (search) {
      allTransactions = allTransactions.filter(
        (tx) =>
          tx.reference.toLowerCase().includes(search.toLowerCase()) ||
          tx.property.title.toLowerCase().includes(search.toLowerCase()) ||
          tx.tenantName?.toLowerCase().includes(search.toLowerCase()) ||
          tx.tenantEmail?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (status && status !== "ALL") {
      allTransactions = allTransactions.filter((tx) => tx.status === status);
    }

    if (type && type !== "ALL") {
      allTransactions = allTransactions.filter((tx) => tx.type === type);
    }

    // Trier par date
    allTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Calculer les KPIs
    const successfulPayments = allTransactions.filter(
      (tx) => tx.status === "SUCCESS" && tx.type === "PAYMENT",
    );
    const refunds = allTransactions.filter(
      (tx) => tx.type === "REFUND" || tx.status === "REFUNDED",
    );
    const pending = allTransactions.filter((tx) => tx.status === "PENDING");

    const totalVolume = successfulPayments.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );
    const totalCommissions = successfulPayments.reduce(
      (sum, tx) => sum + tx.commission,
      0,
    );
    const totalRefunds = refunds.reduce(
      (sum, tx) => sum + Math.abs(tx.amount),
      0,
    );
    const pendingPayouts = pending.reduce((sum, tx) => sum + tx.netAmount, 0);

    const kpis = {
      totalVolume,
      totalCommissions,
      pendingPayouts,
      pendingCount: pending.length,
      volumeGrowth: 12.5,
      commissionsGrowth: 8.4,
      totalRefunds,
      refundsCount: refunds.length,
      successRate:
        allTransactions.length > 0
          ? (successfulPayments.length / allTransactions.length) * 100
          : 100,
      totalTransactions: allTransactions.length,
      successfulCount: successfulPayments.length,
    };

    // Pagination
    const start = (page - 1) * pageSize;
    const paginatedTransactions = allTransactions.slice(
      start,
      start + pageSize,
    );

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      kpis,
      pagination: {
        currentPage: page,
        pageSize,
        totalCount: allTransactions.length,
        totalPages: Math.ceil(allTransactions.length / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des transactions" },
      { status: 500 },
    );
  }
}
