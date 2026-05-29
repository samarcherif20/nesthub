// app/api/admin/transactions/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// GET - Pour les exports avec query params
export async function GET(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (status && status !== "ALL") {
      where.status =
        status === "SUCCESS"
          ? "PAID"
          : status === "REFUNDED"
            ? "REFUNDED"
            : status === "PENDING"
              ? "PENDING"
              : "FAILED";
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

    // Filtrer par recherche
    let filteredPayments = payments;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPayments = payments.filter(
        (payment) =>
          payment.id.toLowerCase().includes(searchLower) ||
          payment.booking?.listing?.title
            ?.toLowerCase()
            .includes(searchLower) ||
          payment.booking?.tenant?.firstName
            ?.toLowerCase()
            .includes(searchLower) ||
          payment.booking?.tenant?.lastName
            ?.toLowerCase()
            .includes(searchLower) ||
          payment.booking?.tenant?.email?.toLowerCase().includes(searchLower),
      );
    }

    if (filteredPayments.length === 0) {
      return NextResponse.json(
        { error: "Aucune transaction à exporter" },
        { status: 400 },
      );
    }

    const exportTransactions = filteredPayments.map((payment) => ({
      ID: payment.id.slice(-8),
      Date: new Date(payment.createdAt).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      "Montant (TND)": payment.amount,
      "Commission (TND)": payment.amount * 0.1,
      "Net (TND)": payment.amount * 0.9,
      Propriété: payment.booking?.listing?.title || "N/A",
      Statut:
        payment.status === "PAID"
          ? "SUCCESS"
          : payment.status === "REFUNDED"
            ? "REFUNDED"
            : payment.status === "PENDING"
              ? "PENDING"
              : "FAILED",
      Provider: payment.provider,
      Locataire: payment.booking?.tenant
        ? `${payment.booking.tenant.firstName || ""} ${payment.booking.tenant.lastName || ""}`.trim()
        : "N/A",
      Email: payment.booking?.tenant?.email || "N/A",
    }));

    if (format === "pdf") {
      return await generatePDF(exportTransactions);
    } else {
      return await generateCSV(exportTransactions);
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      {
        error:
          "Erreur lors de l'export: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}

// Génération CSV - EXACTEMENT comme dans listing export
async function generateCSV(transactions: any[]) {
  const headers = Object.keys(transactions[0]);

  // BOM pour UTF-8
  const bom = "\uFEFF";

  const csvRows = [
    headers.join(";"),
    ...transactions.map((transaction) =>
      headers
        .map((header) => {
          let value = transaction[header];
          if (value === null || value === undefined) value = "";
          if (
            typeof value === "string" &&
            (value.includes(";") || value.includes('"') || value.includes("\n"))
          ) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return String(value);
        })
        .join(";"),
    ),
  ];

  const csv = bom + csvRows.join("\n");
  const date = new Date().toISOString().split("T")[0];

  const filename = `transactions_${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// Génération PDF - EXACTEMENT comme dans listing export
async function generatePDF(transactions: any[]) {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const columns = [
      { header: "ID", key: "ID", width: 50 },
      { header: "Date", key: "Date", width: 100 },
      { header: "Montant", key: "Montant (TND)", width: 70 },
      { header: "Commission", key: "Commission (TND)", width: 70 },
      { header: "Propriété", key: "Propriété", width: 130 },
      { header: "Statut", key: "Statut", width: 70 },
      { header: "Provider", key: "Provider", width: 60 },
      { header: "Locataire", key: "Locataire", width: 100 },
    ];

    const pageWidth = 842;
    const pageHeight = 595;
    const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
    const startX = (pageWidth - tableWidth) / 2;

    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - 50;
    let rowCount = 0;
    const rowsPerPage = 25;

    const drawHeader = () => {
      let x = startX;

      for (const col of columns) {
        currentPage.drawText(col.header, {
          x,
          y,
          size: 10,
          font: timesRomanBold,
          color: rgb(0, 0, 0),
        });
        x += col.width;
      }

      currentPage.drawLine({
        start: { x: startX, y: y - 5 },
        end: { x: startX + tableWidth, y: y - 5 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      y -= 25;
      rowCount++;
    };

    const addNewPage = () => {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - 50;
      rowCount = 0;
      drawHeader();
    };

    drawHeader();

    for (const transaction of transactions) {
      if (rowCount >= rowsPerPage) {
        addNewPage();
      }

      let x = startX;

      for (const col of columns) {
        let value = transaction[col.key] || "";

        if (typeof value === "string" && value.length > 25) {
          value = value.substring(0, 23) + "...";
        }

        currentPage.drawText(String(value), {
          x,
          y,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.2, 0.2, 0.2),
        });

        x += col.width;
      }

      y -= 20;
      rowCount++;
    }

    const pageCount = pdfDoc.getPageCount();
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width } = page.getSize();

      page.drawText(
        `Page ${i + 1} / ${pageCount} - ${new Date().toLocaleDateString("fr-FR")}`,
        {
          x: width - 150,
          y: 20,
          size: 8,
          font: timesRomanFont,
          color: rgb(0.5, 0.5, 0.5),
        },
      );
    }

    const pdfBytes = await pdfDoc.save();
    const date = new Date().toISOString().split("T")[0];

    const filename = `transactions_${date}.pdf`;

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    throw new Error("Erreur lors de la génération du PDF");
  }
}
