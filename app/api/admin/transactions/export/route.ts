// app/api/admin/transactions/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const admin = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });

    if (admin?.role !== "ADMIN") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            listing: {
              select: {
                id: true,
                title: true,
              },
            },
            tenant: {
              select: {
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

    // Formater les données pour l'export
    const exportData = payments.map((payment) => ({
      "Transaction ID": `TXN-${payment.id.slice(-8).toUpperCase()}`,
      "Date": new Date(payment.createdAt).toLocaleString("fr-FR"),
      "Montant (TND)": payment.amount,
      "Propriété": payment.booking?.listing?.title || "N/A",
      "Statut": payment.status,
      "Provider": payment.provider,
      "Locataire": payment.booking?.tenant 
        ? `${payment.booking.tenant.firstName || ""} ${payment.booking.tenant.lastName || ""}`.trim()
        : "N/A",
      "Email": payment.booking?.tenant?.email || "N/A",
    }));

    if (format === "csv") {
      // Générer CSV
      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(",")
        ),
      ];
      const csvContent = csvRows.join("\n");
      
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename=transactions_${new Date().toISOString().split("T")[0]}.csv`,
        },
      });
    } else {
      // Générer PDF simple (HTML to PDF)
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Transactions Export</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #005cab; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #005cab; color: white; }
            tr:nth-child(even) { background-color: #f9f9ff; }
          </style>
        </head>
        <body>
          <h1>Nesthub - Transactions</h1>
          <p>Exporté le ${new Date().toLocaleString("fr-FR")}</p>
          <table>
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Montant (TND)</th>
                <th>Propriété</th>
                <th>Statut</th>
                <th>Provider</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(row => `
                <tr>
                  <td>${row["Transaction ID"]}</td>
                  <td>${row["Date"]}</td>
                  <td>${row["Montant (TND)"]}</td>
                  <td>${row["Propriété"]}</td>
                  <td>${row["Statut"]}</td>
                  <td>${row["Provider"]}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename=transactions_${new Date().toISOString().split("T")[0]}.html`,
        },
      });
    }
  } catch (error) {
    console.error("Error exporting transactions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}