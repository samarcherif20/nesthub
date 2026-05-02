// app/api/admin/listings/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface ExportFilters {
  search?: string;
  status?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  governorate?: string;
}

interface ExportBody {
  filters?: ExportFilters;
  selectedListings?: string[];
}

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
    const type = searchParams.get("type");
    const search = searchParams.get("search");

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (type && type !== "ALL") {
      where.type = type;
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Aucune propriété à exporter" },
        { status: 400 },
      );
    }

    const exportListings = listings.map((listing) => ({
      ID: listing.id.slice(-8),
      Titre: listing.title || "",
      Type: listing.type || "",
      Statut: listing.status || "",
      "Prix nuit": listing.pricePerNight?.toString() || "",
      "Prix mois": listing.pricePerMonth?.toString() || "",
      Gouvernorat: listing.governorate || "",
      Délégation: listing.delegation || "",
      Chambres: listing.rooms?.toString() || "",
      "Salles bain": listing.bathrooms?.toString() || "",
      Surface: listing.surfaceArea?.toString() || "",
      Propriétaire:
        `${listing.owner?.email || ""} `.trim() ||
        "N/A",
      "Email propriétaire": listing.owner?.email || "",
      "Téléphone propriétaire": listing.owner?.phoneNumber || "",
      "Date création": new Date(listing.createdAt).toLocaleDateString("fr-FR"),
      Vues: listing.viewCount?.toString() || "0",
    }));

    if (format === "pdf") {
      return await generatePDF(exportListings);
    } else {
      return await generateCSV(exportListings);
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

// POST - Pour les exports sélectionnés
export async function POST(request: NextRequest) {
  try {
    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.role;

    if (role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "csv";

    const body = await request.json();
    const { filters, selectedListings } = body as ExportBody;

    const where: any = {};

    if (selectedListings && selectedListings.length > 0) {
      where.id = { in: selectedListings };
    } else if (filters) {
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }
      if (filters.status && filters.status !== "ALL") {
        where.status = filters.status;
      }
      if (filters.type && filters.type !== "ALL") {
        where.type = filters.type;
      }
      if (filters.governorate) {
        where.governorate = {
          contains: filters.governorate,
          mode: "insensitive",
        };
      }

      if (filters.minPrice || filters.maxPrice) {
        const min = filters.minPrice ? parseFloat(filters.minPrice) : 0;
        const max = filters.maxPrice ? parseFloat(filters.maxPrice) : 999999;
        where.AND = [
          {
            OR: [
              { pricePerNight: { gte: min, lte: max } },
              { pricePerMonth: { gte: min, lte: max } },
            ],
          },
        ];
      }
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        owner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (listings.length === 0) {
      return NextResponse.json(
        { error: "Aucune propriété à exporter" },
        { status: 400 },
      );
    }

    const exportListings = listings.map((listing) => ({
      ID: listing.id.slice(-8),
      Titre: listing.title || "",
      Type: listing.type || "",
      Statut: listing.status || "",
      "Prix nuit": listing.pricePerNight?.toString() || "",
      "Prix mois": listing.pricePerMonth?.toString() || "",
      Gouvernorat: listing.governorate || "",
      Délégation: listing.delegation || "",
      Chambres: listing.rooms?.toString() || "",
      "Salles bain": listing.bathrooms?.toString() || "",
      Surface: listing.surfaceArea?.toString() || "",
      Propriétaire:
        `${listing.owner?.email || ""} `.trim() ||
        "N/A",
      "Email propriétaire": listing.owner?.email || "",
      "Téléphone propriétaire": listing.owner?.phoneNumber || "",
      "Date création": new Date(listing.createdAt).toLocaleDateString("fr-FR"),
      Vues: listing.viewCount?.toString() || "0",
    }));

    if (format === "pdf") {
      return await generatePDF(exportListings);
    } else {
      return await generateCSV(exportListings);
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

// Génération CSV
async function generateCSV(listings: any[]) {
  const headers = Object.keys(listings[0]);

  // BOM pour UTF-8
  const bom = "\uFEFF";

  const csvRows = [
    headers.join(";"),
    ...listings.map((listing) =>
      headers
        .map((header) => {
          let value = listing[header];
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

  // Nom de fichier sans underscores en trop
  const filename = `proprietes_${date}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

// Génération PDF
async function generatePDF(listings: any[]) {
  try {
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const columns = [
      { header: "ID", key: "ID", width: 50 },
      { header: "Titre", key: "Titre", width: 130 },
      { header: "Type", key: "Type", width: 70 },
      { header: "Statut", key: "Statut", width: 80 },
      { header: "Prix nuit", key: "Prix nuit", width: 70 },
      { header: "Gouvernorat", key: "Gouvernorat", width: 80 },
      { header: "Propriétaire", key: "Propriétaire", width: 100 },
      { header: "Date création", key: "Date création", width: 80 },
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

    for (const listing of listings) {
      if (rowCount >= rowsPerPage) {
        addNewPage();
      }

      let x = startX;

      for (const col of columns) {
        let value = listing[col.key] || "";

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

    // Nom de fichier PDF correct
    const filename = `proprietes_${date}.pdf`;

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
