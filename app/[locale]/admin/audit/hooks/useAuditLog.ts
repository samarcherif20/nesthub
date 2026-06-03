"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface AuditLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  adminAvatar: string | null;
  action: string;
  actionType: string;
  targetType: string;
  targetId: string;
  details: any;
  motif: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export function useAuditLog() {
  const t = useTranslations("AuditLog");
  const tCommon = useTranslations("Common");
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [availableAdmins, setAvailableAdmins] = useState<{ id: string; name: string; avatar: string | null }[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [filterAdmin, setFilterAdmin] = useState<string>("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalCount: 0, totalPages: 1 });
  const [stats, setStats] = useState({ totalEvents: 0, securityFlags: 0, activeAdmins: 0, trend: "+12%" });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const isFirstRender = useRef(true);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        adminId: filterAdmin,
        action: filterAction,
        targetType: filterTarget,
        dateRange: dateRange,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setAvailableAdmins(data.availableAdmins || []);
        setAvailableActions(data.availableActions || []);
        setPagination({
          page: data.page || page,
          limit: data.limit || 10,
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 1,
        });
        setStats(data.stats || { totalEvents: 0, securityFlags: 0, activeAdmins: 0, trend: "+12%" });
      } else {
        toast.error(tCommon("error.loading"));
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.loading"));
    } finally {
      setLoading(false);
    }
  }, [getToken, filterAdmin, filterAction, filterTarget, dateRange, searchTerm, tCommon]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchLogs(1);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchLogs(1), 500);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [filterAdmin, filterAction, filterTarget, dateRange, searchTerm, fetchLogs]);

  const openDetailModal = (log: AuditLogEntry) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLog(null);
  };

  const handlePageChange = (page: number) => fetchLogs(page);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        export: "true",
        adminId: filterAdmin,
        action: filterAction,
        targetType: filterTarget,
        dateRange: dateRange,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allLogs = data.logs || [];
        
        const headers = [
          "Date",
          "Administrateur",
          "Email",
          "Action",
          "Type cible",
          "ID cible",
          "Détails",
          "Motif",
          "IP"
        ];
        
        const rows = allLogs.map((log: any) => [
          new Date(log.createdAt).toLocaleString(),
          log.adminName,
          log.adminEmail,
          log.action,
          log.targetType,
          log.targetId,
          (log.details ? JSON.stringify(log.details).substring(0, 500) : ""),
          log.motif || "",
          log.ipAddress || "-"
        ]);
        
        const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit_log_${new Date().toISOString().slice(0, 19)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(t("toasts.exportSuccess"));
      } else {
        toast.error(tCommon("error.general"));
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.general"));
    } finally {
      setExporting(false);
    }
  };

  // ✅ PDF avec pleine largeur
  const exportPDF = async () => {
    setExporting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        export: "true",
        adminId: filterAdmin,
        action: filterAction,
        targetType: filterTarget,
        dateRange: dateRange,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/audit?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const allLogs = data.logs || [];
        
        // PDF en orientation paysage avec marges minimales
        const doc = new jsPDF({ 
          orientation: "landscape", 
          unit: "mm", 
          format: "a4",
          putOnlyUsedFonts: true,
          compress: true
        });
        
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // En-tête
        doc.setFontSize(16);
        doc.setTextColor(33, 33, 33);
        doc.text(t("title"), 10, 15);
        
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`${t("description")} - ${new Date().toLocaleString()}`, 10, 25);
        
        // Ligne de séparation
        doc.setDrawColor(200, 200, 200);
        doc.line(10, 30, pageWidth - 10, 30);
        
        // Calculer les largeurs de colonnes pour pleine largeur
        const colWidths = [
          pageWidth * 0.18,  // Date
          pageWidth * 0.15,  // Admin
          pageWidth * 0.12,  // Action
          pageWidth * 0.12,  // Type cible
          pageWidth * 0.12,  // ID cible
          pageWidth * 0.12,  // IP
        ];
        
        autoTable(doc, {
          startY: 38,
          head: [[
            t("export.headers.date"),
            t("export.headers.administrator"),
            t("export.headers.action"),
            t("export.headers.targetType"),
            t("export.headers.targetId"),
            t("export.headers.ipAddress")
          ]],
          body: allLogs.map((log: any) => [
            new Date(log.createdAt).toLocaleString(),
            log.adminName,
            log.action,
            log.targetType,
            log.targetId?.slice(-8) || "-",
            log.ipAddress || "-"
          ]),
          theme: "striped",
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 9,
            halign: "center",
          },
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: colWidths[0], halign: "left" },
            1: { cellWidth: colWidths[1], halign: "left" },
            2: { cellWidth: colWidths[2], halign: "left" },
            3: { cellWidth: colWidths[3], halign: "center" },
            4: { cellWidth: colWidths[4], halign: "center" },
            5: { cellWidth: colWidths[5], halign: "center" },
          },
          margin: { left: 10, right: 10, top: 38, bottom: 20 },
          tableWidth: pageWidth - 20,
          horizontalPageBreak: true,
          pageBreak: "auto",
          styles: {
            overflow: "linebreak",
            cellWidth: "auto",
          },
          didDrawPage: (data) => {
            // Numéro de page
            const pageCount = doc.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
              `Page ${pageCount}`,
              pageWidth - 20,
              doc.internal.pageSize.getHeight() - 10
            );
            
            // Date d'export en bas
            doc.text(
              `Exporté le ${new Date().toLocaleString()}`,
              10,
              doc.internal.pageSize.getHeight() - 10
            );
          },
        });
        
        doc.save(`audit_log_${new Date().toISOString().slice(0, 19)}.pdf`);
        toast.success(t("toasts.pdfExportSuccess"));
      } else {
        toast.error(tCommon("error.general"));
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.general"));
    } finally {
      setExporting(false);
    }
  };

  return {
    loading,
    logs,
    pagination,
    stats,
    availableAdmins,
    availableActions,
    filterAdmin,
    setFilterAdmin,
    filterAction,
    setFilterAction,
    filterTarget,
    setFilterTarget,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    selectedLog,
    showDetailModal,
    openDetailModal,
    closeDetailModal,
    handlePageChange,
    exportCSV,
    exportPDF,
    exporting,
    t,
  };
}