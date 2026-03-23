import { useState, useEffect } from "react";
import { htmlToStructured } from "@/lib/utils/html-to-structured";

interface StaticPage {
  id: string;
  type: string;
  title: string;
  slug: string;
  htmlContent: string;
  displayContent: string;
  status: string;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  updatedByUser?: {
    firstName: string | null;
    lastName: string | null;
    email?: string | null;
  } | null;
}

// DB → Éditeur TipTap
const extractHtmlFromDb = (raw: string): string => {
  if (!raw || raw.trim() === "") return "";
  if (raw.trim().startsWith("<")) return raw;
  try {
    const parsed = JSON.parse(raw);
    if (parsed.type === "html" && parsed.content) return parsed.content;
    if (parsed.sections && Array.isArray(parsed.sections))
      return buildHtmlFromStructured(parsed);
    if (parsed.content && typeof parsed.content === "string") {
      const inner = parsed.content.trim();
      if (inner.startsWith("<")) return inner;
      try {
        const n = JSON.parse(inner);
        if (n.sections) return buildHtmlFromStructured(n);
      } catch {}
      return inner;
    }
  } catch {
    return raw;
  }
  return raw;
};

// Structure par défaut PRIVACY — utilisée quand la DB n'a pas encore de format structuré
const DEFAULT_STRUCTURES: Record<string, any> = {
  PRIVACY: {
    description: "",
    sections: [
      {
        id: "collecte",
        title: "Collecte des données",
        description: "",
        items: [
          { label: "Identité", text: "" },
          { label: "Coordonnées", text: "" },
          { label: "Profil", text: "" },
          { label: "Documents", text: "" },
          { label: "Financières", text: "" },
          { label: "Comportementales", text: "" },
          { label: "Messagerie", text: "" },
        ],
      },
      {
        id: "utilisation",
        title: "Utilisation des données",
        description: "",
        items: [
          { title: "Gestion des comptes", text: "" },
          { title: "Vérification d'identité", text: "" },
          { title: "Système de confiance", text: "" },
          { title: "Personnalisation", text: "" },
          { title: "Amélioration du service", text: "" },
          { title: "Transactions", text: "" },
          { title: "Sécurité", text: "" },
          { title: "Support client", text: "" },
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        description: "",
        items: [
          {
            name: "Cookies essentiels",
            desc: "",
            badge: "Obligatoire",
            badgeColor: "green",
          },
          {
            name: "Cookies analytiques",
            desc: "",
            badge: "Optionnel",
            badgeColor: "slate",
          },
          {
            name: "Cookies de personnalisation",
            desc: "",
            badge: "Optionnel",
            badgeColor: "slate",
          },
        ],
      },
      {
        id: "droits",
        title: "Vos droits",
        description: "",
        items: [
          { title: "Droit d'accès", desc: "", icon: "eye" },
          { title: "Droit de rectification", desc: "", icon: "edit" },
          { title: "Droit à l'effacement", desc: "", icon: "trash" },
          { title: "Droit à la portabilité", desc: "", icon: "download" },
          { title: "Droit d'opposition", desc: "", icon: "pause" },
          { title: "Droit à la limitation", desc: "", icon: "key" },
        ],
      },
      {
        id: "securite",
        title: "Sécurité des données",
        description: "",
        items: [
          { title: "Chiffrement", desc: "" },
          { title: "Authentification", desc: "" },
          { title: "Documents", desc: "" },
          { title: "Audits", desc: "" },
          { title: "Messagerie", desc: "" },
          { title: "Paiements", desc: "" },
        ],
      },
      {
        id: "ia",
        title: "Intelligence Artificielle",
        warning: "",
        items: [
          {
            title: "Détection des fraudes",
            desc: "",
            badge: "Automatisé",
            badgeColor: "red",
          },
          {
            title: "Score de confiance",
            desc: "",
            badge: "Automatisé",
            badgeColor: "blue",
          },
          {
            title: "Vérification documents",
            desc: "",
            badge: "Automatisé",
            badgeColor: "blue",
          },
          {
            title: "Recommandations",
            desc: "",
            badge: "Optionnel",
            badgeColor: "slate",
          },
        ],
      },
    ],
    version: "1.0",
  },
};

// Éditeur TipTap → DB : toujours JSON structuré pour les pages connues
const convertHtmlForDb = (
  html: string,
  existingJsonRaw: string,
  pageType: string,
  title?: string,
): string => {
  const structuredTypes = ["PRIVACY", "TERMS", "CGU", "COOKIES"];
  if (structuredTypes.includes(pageType)) {
    // 1. Essayer de récupérer la structure existante depuis la DB
    let existing: any = null;
    try {
      const p = JSON.parse(existingJsonRaw);
      if (p.sections && Array.isArray(p.sections)) {
        existing = p; // format structuré direct ✅
      } else if (p.content && typeof p.content === "string") {
        try {
          const inner = JSON.parse(p.content);
          if (inner.sections) existing = inner;
        } catch {}
      }
    } catch {}

    // 2. Si pas de structure existante, utiliser le template par défaut
    // Cela préserve les badges, icons et métadonnées même après une ancienne sauvegarde HTML
    if (!existing && DEFAULT_STRUCTURES[pageType]) {
      existing = DEFAULT_STRUCTURES[pageType];
    }

    try {
      const structured = htmlToStructured(html, existing, title);
      return JSON.stringify(structured);
    } catch (e) {
      console.error("htmlToStructured failed:", e);
    }
  }
  return JSON.stringify({
    type: "html",
    content: html,
    updatedAt: new Date().toISOString(),
  });
};

const buildHtmlFromStructured = (data: any): string => {
  let html = "";
  if (data.description) html += `<p>${data.description}</p>`;
  (data.sections || []).forEach((s: any) => {
    if (s.title) html += `<h2>${s.title}</h2>`;
    if (s.description) html += `<p>${s.description}</p>`;
    if (s.warning) html += `<p><strong>${s.warning}</strong></p>`;
    if (s.items?.length) {
      html += "<ul>";
      s.items.forEach((item: any) => {
        const label = item.label || item.title || item.name || "";
        const text = item.text || item.desc || "";
        html += label
          ? `<li><strong>${label}:</strong> ${text}</li>`
          : `<li>${text}</li>`;
      });
      html += "</ul>";
    }
    if (s.email)
      html += `<p>Email: <a href="mailto:${s.email}">${s.email}</a></p>`;
  });
  return html;
};

export function useAdminContent() {
  const [pages, setPages] = useState<StaticPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = async (search?: string, type?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (type && type !== "ALL") params.append("type", type);
      const res = await fetch(`/api/admin/static-pages?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch pages");
      setPages(
        (data.pages || []).map((page: any) => ({
          ...page,
          displayContent: extractHtmlFromDb(page.htmlContent),
        })),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch pages");
      setPages([]);
    } finally {
      setLoading(false);
    }
  };

  const createPage = async (pageData: {
    type: string;
    title: string;
    slug: string;
    htmlContent?: string;
    status?: string;
  }) => {
    try {
      const res = await fetch("/api/admin/static-pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pageData,
          htmlContent: pageData.htmlContent
            ? convertHtmlForDb(
                pageData.htmlContent,
                "",
                pageData.type,
                pageData.title,
              )
            : "",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchPages();
        return { success: true, page: data.page };
      }
      return { success: false, error: data.error || "Failed to create page" };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const updatePage = async (
    id: string,
    data: { title?: string; htmlContent?: string; status?: string },
  ) => {
    try {
      const existingPage = pages.find((p) => p.id === id);
      const payload: any = { title: data.title, status: data.status };
      if (data.htmlContent !== undefined) {
        payload.htmlContent = convertHtmlForDb(
          data.htmlContent,
          existingPage?.htmlContent || "",
          existingPage?.type || "",
          data.title,
        );
      }
      const res = await fetch(`/api/admin/static-pages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();
      if (res.ok) {
        await fetchPages();
        return { success: true, page: responseData.page };
      }
      return {
        success: false,
        error: responseData.error || "Failed to update page",
      };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const deletePage = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/static-pages/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchPages();
        return { success: true };
      }
      const data = await res.json();
      return { success: false, error: data.error || "Failed to delete page" };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const fetchVersions = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/static-pages/${id}/versions`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch versions");
      return { success: true, versions: data.versions || [] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed",
        versions: [],
      };
    }
  };

  const restoreVersion = async (pageId: string, versionId: string) => {
    try {
      const res = await fetch(`/api/admin/static-pages/${pageId}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchPages();
        return { success: true, page: data.page };
      }
      return {
        success: false,
        error: data.error || "Failed to restore version",
      };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  return {
    pages,
    loading,
    error,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    fetchVersions,
    restoreVersion,
  };
}
