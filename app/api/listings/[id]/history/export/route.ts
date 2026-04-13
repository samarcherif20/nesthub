import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/api/withAuth";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Helper functions (inchangées)
function formatValue(value: any, fieldName?: string): string {
  if (value === null || value === undefined) return "—";

  if (fieldName === "status") {
    const statusMap: Record<string, string> = {
      ACTIVE: "Publiée",
      INACTIVE: "Masquée",
      DRAFT: "Brouillon",
      ARCHIVED: "Archivée",
    };
    if (typeof value === "object" && value.status)
      return statusMap[value.status] || value.status;
    if (typeof value === "string") return statusMap[value] || value;
  }

  if (fieldName === "pricePerNight" || fieldName === "pricePerMonth") {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (!isNaN(num)) return `${num.toLocaleString("fr-FR")} TND`;
  }

  if (fieldName === "equipment" && typeof value === "object") {
    const equipmentMap: Record<string, string> = {
      wifi: "Wi-Fi",
      ac: "Climatisation",
      heating: "Chauffage",
      kitchen: "Cuisine équipée",
      parking: "Parking",
      pool: "Piscine",
      gym: "Salle de sport",
      washer: "Lave-linge",
      tv: "Télévision",
      balcony: "Balcon",
      dishwasher: "Lave-vaisselle",
      dryer: "Sèche-linge",
    };
    const active = Object.entries(value)
      .filter(([, v]) => v === true)
      .map(([k]) => equipmentMap[k] || k);
    return active.length ? active.join(", ") : "Aucun équipement";
  }

  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toLocaleString("fr-FR");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getActionTypeLabel(actionType: string): string {
  const labels: Record<string, string> = {
    PRICE_UPDATE: "Modification de prix",
    STATUS_CHANGE: "Changement de statut",
    PHOTO_UPDATE: "Mise à jour des photos",
    EQUIPMENT_UPDATE: "Modification des équipements",
    UPDATE: "Modification générale",
    CREATE: "Création",
  };
  return labels[actionType] || actionType;
}

function getFieldLabel(fieldName: string | null): string {
  const labels: Record<string, string> = {
    title: "Titre",
    description: "Description",
    pricePerNight: "Prix par nuit",
    pricePerMonth: "Prix par mois",
    status: "Statut",
    equipment: "Équipements",
    photos: "Photos",
    rooms: "Chambres",
    bathrooms: "Salles de bain",
    maxGuests: "Capacité max",
    surfaceArea: "Surface",
    hasElevator: "Ascenseur",
    rentalType: "Type de location",
    securityDeposit: "Caution",
    cleaningFee: "Frais de ménage",
    governorate: "Gouvernorat",
    delegation: "Délégation",
    street: "Rue",
  };
  return labels[fieldName || ""] || fieldName || "Valeur";
}

function extractEquipmentList(value: any): string[] {
  if (!value) return [];
  if (typeof value === "object") {
    return Object.entries(value)
      .filter(([, v]) => v === true)
      .map(([k]) => k);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Object.entries(parsed)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
    } catch {
      return [];
    }
  }
  return [];
}

function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateTimelineHTML(history: any[]): string {
  const grouped: Record<string, any[]> = {};

  history.forEach((entry) => {
    const dateKey = format(new Date(entry.createdAt), "EEEE d MMMM yyyy", {
      locale: fr,
    });
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(entry);
  });

  let html = "";

  for (const [date, entries] of Object.entries(grouped)) {
    html += `<div class="timeline-item">`;
    html += `<div class="timeline-date">${escapeHtml(date)}</div>`;

    entries.forEach((entry) => {
      const isPrice =
        entry.fieldName === "pricePerNight" ||
        entry.fieldName === "pricePerMonth";
      const isEquipment = entry.fieldName === "equipment";
      const userName = entry.changedByUser.firstName
        ? `${entry.changedByUser.firstName} ${entry.changedByUser.lastName || ""}`
        : entry.changedByUser.email.split("@")[0];

      html += `<div class="entry">`;
      html += `<div class="entry-header">`;
      html += `<div class="user-info">`;
      html += `<div class="user-name">${escapeHtml(userName)}</div>`;
      html += `<div class="user-role">Propriétaire</div>`;
      html += `</div>`;
      html += `<div class="action-badge">${escapeHtml(getActionTypeLabel(entry.actionType))}</div>`;
      html += `</div>`;

      html += `<div class="time">${format(new Date(entry.createdAt), "HH:mm", { locale: fr })}</div>`;
      html += `<div class="entry-title">${escapeHtml(getFieldLabel(entry.fieldName))}</div>`;

      if (entry.oldValue !== null || entry.newValue !== null) {
        html += `<div class="changes">`;

        if (entry.oldValue !== null) {
          html += `<div class="old-value">`;
          html += `<div class="value-label">ANCIENNE VALEUR</div>`;
          html += `<div class="value-content">${escapeHtml(formatValue(entry.oldValue, entry.fieldName))}</div>`;
          html += `</div>`;
        }

        if (entry.newValue !== null) {
          html += `<div class="new-value">`;
          html += `<div class="value-label">NOUVELLE VALEUR</div>`;
          html += `<div class="value-content">${escapeHtml(formatValue(entry.newValue, entry.fieldName))}</div>`;
          html += `</div>`;
        }

        html += `</div>`;
      }

      if (isPrice && entry.oldValue && entry.newValue) {
        const oldPrice = parseFloat(entry.oldValue);
        const newPrice = parseFloat(entry.newValue);
        const diff = newPrice - oldPrice;
        const pct = Math.abs(Math.round((diff / oldPrice) * 100));
        const diffText =
          diff > 0
            ? `+${diff.toLocaleString("fr-FR")} TND (${pct}%)`
            : `${diff.toLocaleString("fr-FR")} TND (${pct}%)`;
        html += `<div style="margin-top: 10px; font-size: 12px; color: ${diff > 0 ? "#22c55e" : "#ef4444"}">${escapeHtml(diffText)}</div>`;
      }

      if (isEquipment && entry.oldValue && entry.newValue) {
        const oldList = extractEquipmentList(entry.oldValue);
        const newList = extractEquipmentList(entry.newValue);
        const added = newList.filter((eq) => !oldList.includes(eq));
        const removed = oldList.filter((eq) => !newList.includes(eq));

        if (added.length > 0) {
          html += `<div style="margin-top: 10px; font-size: 12px; color: #22c55e">✓ Ajouté : ${escapeHtml(added.join(", "))}</div>`;
        }
        if (removed.length > 0) {
          html += `<div style="margin-top: 5px; font-size: 12px; color: #ef4444">✗ Retiré : ${escapeHtml(removed.join(", "))}</div>`;
        }
      }

      html += `</div>`;
    });

    html += `</div>`;
  }

  return html;
}

// ✅ EXPORT AVEC withAuth
export const GET = withAuth(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const user = (req as any).user;
    const { id } = await params;
    const searchParams = req.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "30");
    const filterType = searchParams.get("actionType") || "";

    // Get listing and verify access (déjà fait par withAuth)
    const listing = await prisma.listing.findFirst({
      where: { id },
      select: { title: true, ownerId: true },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Annonce non trouvée" },
        { status: 404 },
      );
    }

    // Get history
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const where: any = {
      listingId: id,
      createdAt: { gte: startDate },
    };

    if (filterType && filterType !== "ALL" && filterType !== "") {
      where.actionType = filterType;
    }

    const history = await prisma.listingHistory.findMany({
      where,
      include: {
        changedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate HTML content
    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Historique - ${escapeHtml(listing.title)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; margin: 40px; color: #333; background: white; }
          .header { margin-bottom: 30px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
          h1 { color: #1e293b; font-size: 24px; margin: 0 0 10px 0; }
          .subtitle { color: #64748b; font-size: 14px; }
          .filter-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 14px; border: 1px solid #e2e8f0; }
          .timeline-item { margin-bottom: 30px; page-break-inside: avoid; }
          .timeline-date { font-weight: bold; font-size: 16px; color: #475569; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #cbd5e1; }
          .entry { margin-bottom: 25px; margin-left: 20px; padding-left: 20px; border-left: 2px solid #cbd5e1; }
          .entry-header { display: flex; justify-content: space-between; margin-bottom: 15px; align-items: center; flex-wrap: wrap; gap: 10px; }
          .user-info { display: flex; align-items: center; gap: 10px; }
          .user-name { font-weight: bold; color: #1e293b; }
          .user-role { font-size: 11px; color: #6366f1; text-transform: uppercase; }
          .action-badge { background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: bold; display: inline-block; }
          .entry-title { font-size: 16px; font-weight: bold; color: #1e293b; margin: 15px 0; }
          .changes { display: flex; gap: 20px; margin-top: 15px; flex-wrap: wrap; }
          .old-value { flex: 1; background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 3px solid #ef4444; min-width: 200px; }
          .new-value { flex: 1; background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 3px solid #22c55e; min-width: 200px; }
          .value-label { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b; margin-bottom: 8px; }
          .value-content { font-size: 13px; word-break: break-word; }
          .time { font-size: 12px; color: #94a3b8; margin-bottom: 5px; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
          @media print { body { margin: 20px; } .entry { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Historique des modifications</h1>
          <div class="subtitle">${escapeHtml(listing.title)}</div>
        </div>
        
        <div class="filter-info">
          <strong>Période:</strong> ${days === 9999 ? "Tout" : `${days} jours`}
          ${filterType ? `<br><strong>Type:</strong> ${escapeHtml(getActionTypeLabel(filterType))}` : ""}
          <br><strong>Date d'export:</strong> ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: fr })}
          <br><strong>Nombre de modifications:</strong> ${history.length}
        </div>
        
        ${generateTimelineHTML(history)}
        
        <div class="footer">
          Document généré automatiquement - Application de gestion de locations
        </div>
      </body>
      </html>`;

    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `attachment; filename="historique-${listing.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.html"`,
      },
    });
  },
  {
    requireListingAccess: true,
    requiredPermission: "view",
    // ✅ Pas besoin de getListingId - withAuth récupère l'id depuis context.params
  },
);
