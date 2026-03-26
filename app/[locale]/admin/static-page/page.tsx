"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAdminContent } from "./hooks/useAdminContent";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import { decodeJWT } from "@/lib/utils/jwt";
import RichTextEditor from "@/components/ui/editor";

import {
  MdEditNote, MdPublishedWithChanges, MdLock,
  MdDelete, MdSave, MdPublish, MdCancel, MdRestore,
  MdArrowBack, MdArrowForward,
} from "react-icons/md";
import { TbFileOff } from "react-icons/tb";
import { RiFileEditLine } from "react-icons/ri";

import { RiEditBoxLine, RiFileLockLine, RiFileShieldLine, RiFileInfoLine, RiCakeLine } from "react-icons/ri";
import { IoCloseCircleOutline } from "react-icons/io5";
import { FiUser, FiCalendar } from "react-icons/fi";
import { BsCheckCircleFill, BsClockHistory } from "react-icons/bs";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// ─── Types ───────────────────────────────────────────────────
interface StaticPage {
  id: string; 
  type: string; 
  title: string; 
  slug: string;
  htmlContent: string; 
  displayContent?: string; 
  status: string;
  updatedAt: string; 
  updatedBy: string | null;
  version: number;
  updatedByUser?: { 
    firstName: string | null; 
    lastName: string | null; 
    email?: string | null 
  } | null;
}

interface Version {
  id: string;
  action: string;
  createdAt: string;
  performedBy: string | null;
  details: any;
  title?: string;
  htmlContent?: string;
  type?: string;
  slug?: string;
  status?: string;
  version: number;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
}

// ─── Page type metadata ──────────────────────────────────────
const PAGE_META = {
  PRIVACY: { label: "Confidentialité", Icon: RiFileLockLine,    grad: "from-blue-500 to-indigo-500",    labelCls: "text-blue-500 dark:text-blue-400"    },
  TERMS:   { label: "CGU",             Icon: RiFileShieldLine,  grad: "from-indigo-500 to-violet-500",  labelCls: "text-indigo-500 dark:text-indigo-400" },
  COOKIES: { label: "Cookies",         Icon: RiCakeLine,        grad: "from-violet-500 to-purple-500",  labelCls: "text-violet-500 dark:text-violet-400" },
  ABOUT:   { label: "À propos",        Icon: RiFileInfoLine,    grad: "from-purple-500 to-indigo-500",  labelCls: "text-purple-500 dark:text-purple-400" },
  DEFAULT: { label: "Page",            Icon: RiEditBoxLine,     grad: "from-blue-400 to-indigo-500",    labelCls: "text-blue-400 dark:text-blue-400"    },
} as const;

type PageType = keyof typeof PAGE_META;
const getPageMeta = (t: string) => PAGE_META[t as PageType] || PAGE_META.DEFAULT;

// ─── Status config ────────────────────────────────────────────
const STATUS_CFG = {
  draft:     { label: "Brouillon", Icon: MdEditNote,            cls: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  restored:  { label: "Restaurée", Icon: MdRestore,             cls: "border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
  published: { label: "Publié",    Icon: MdPublishedWithChanges, cls: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
} as const;

type StatusType = keyof typeof STATUS_CFG;
const getSt = (s: string) => STATUS_CFG[s as StatusType] || STATUS_CFG.published;

// ─── Action config ────────────────────────────────────────────
const ACTION_CFG = {
  UPDATE_STATIC_PAGE: { label: "Mise à jour",  cls: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/20" },
  CREATE_STATIC_PAGE: { label: "Création",     cls: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20" },
  DELETE_STATIC_PAGE: { label: "Suppression",  cls: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/20" },
  RESTORE_VERSION:    { label: "Restauration", cls: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/20" },
} as const;

type ActionType = keyof typeof ACTION_CFG;
const getAct = (action: string) => ACTION_CFG[action as ActionType] || { 
  label: action, 
  cls: "text-slate-500 bg-slate-100" 
};

// ─── 3D shadow helpers ────────────────────────────────────────
const card3d    = "shadow-[0_4px_0_0_rgba(0,0,0,0.07),0_8px_20px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.35),0_8px_20px_-4px_rgba(0,0,0,0.45)] hover:shadow-[0_2px_0_0_rgba(0,0,0,0.05),0_4px_10px_-2px_rgba(0,0,0,0.08)] hover:translate-y-[2px] transition-all duration-150";
const card3dSel = "shadow-[0_3px_0_0_rgba(var(--primary-rgb),0.3),0_6px_20px_-4px_rgba(var(--primary-rgb),0.2)] translate-y-[1px]";
const block3d   = "shadow-[0_6px_0_0_rgba(0,0,0,0.07),0_12px_28px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.4),0_12px_28px_-6px_rgba(0,0,0,0.5)]";

export default function AdminContentPage() {
  const t = useTranslations("AdminContent");
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const {
    pages = [], loading, error: hookError,
    fetchPages, updatePage, deletePage, fetchVersions, restoreVersion,
  } = useAdminContent();

  const [selectedPage, setSelectedPage] = useState<StaticPage | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const [filterType, setFilterType] = useState("ALL");
  const [filteredPages, setFilteredPages] = useState<StaticPage[]>([]);
  const [editorContent, setEditorContent] = useState("");
  const [editorTitle, setEditorTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lastRestoredId, setLastRestoredId] = useState<string | null>(null);
  const [pageToDelete, setPageToDelete] = useState<string | null>(null);
  const [alertState, setAlertState] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const PREVIEW = 4;

  // ─── Helpers ─────────────────────────────────────────────────
  const showAlert = (type: "success" | "error", message: string) => setAlertState({ type, message });
  const closeAlert = () => setAlertState(null);

  const fDate = (s: string) => { 
    try { return format(parseISO(s), "dd MMM yyyy", { locale: fr }); } 
    catch { return "—"; } 
  };
  
  const fDT = (s: string) => { 
    try { return format(parseISO(s), "dd MMM yyyy HH:mm", { locale: fr }); } 
    catch { return "—"; } 
  };
  
  const fRel = (s: string) => { 
    try { return formatDistanceToNow(parseISO(s), { addSuffix: true, locale: fr }); } 
    catch { return "—"; } 
  };

  const fullName = (page: StaticPage | null) => {
    if (!page?.updatedBy) return "Admin";
    const u = page.updatedByUser;
    if (u?.firstName || u?.lastName) return `${u?.firstName || ""} ${u?.lastName || ""}`.trim();
    return page.updatedBy.substring(0, 8) + (page.updatedBy.length > 8 ? "…" : "");
  };

  const getVersionUserDisplay = (version: Version): string => {
    return version.createdBy || "Utilisateur inconnu";
  };

  // Nouvelle fonction pour formater les numéros de version
  const formatVersionNumber = (version: Version | null, isCurrent: boolean = false): string => {
    if (!version) return "";
    return `v${version.version}`;
  };

  const formatCurrentVersion = (): string => {
    if (!selectedPage) return "";
    return `v${selectedPage.version}`;
  };

  // ─── Memoized values ─────────────────────────────────────────
  const visibleVersions = useMemo(() => 
    showFullHistory ? versions : versions.slice(0, PREVIEW),
    [versions, showFullHistory, PREVIEW]
  );

  // ─── Effects ─────────────────────────────────────────────────
  // Admin check
  useEffect(() => {
    const check = async () => {
      if (!isUserLoaded || !clerkUser) { setIsAdmin(false); return; }
      try {
        const tok = await getToken({ template: "my-app-template" });
        if (!tok) { setIsAdmin(false); return; }
        setIsAdmin(decodeJWT(tok)?.role === "ADMIN");
      } catch { setIsAdmin(false); }
    };
    check();
  }, [isUserLoaded, clerkUser, getToken]);

  useEffect(() => { 
    if (isAdmin === false) router.push("/"); 
  }, [isAdmin, router]);

  // Filter pages by status
  useEffect(() => {
    if (!pages.length) { setFilteredPages([]); return; }
    setFilteredPages(filterType === "ALL" ? [...pages] : pages.filter(p => p.status === filterType));
  }, [pages, filterType]);

  // Load editor content when page selected
  useEffect(() => {
    if (selectedPage) {
      setEditorContent((selectedPage as any).displayContent || selectedPage.htmlContent || "");
      setEditorTitle(selectedPage.title || "");
    }
  }, [selectedPage]);

  // ─── Actions ─────────────────────────────────────────────────
  const closeEditor = () => {
    setSelectedPage(null); 
    setEditorContent(""); 
    setEditorTitle("");
    setShowVersions(false); 
    setShowFullHistory(false);
  };

  const loadVersions = async (id: string) => {
    const r = await fetchVersions(id);
    if (r.success) { 
      setVersions(r.versions || []); 
      setShowVersions(true); 
    }
  };

  const handleSavePage = async (publish = false) => {
    if (!selectedPage) return;
    setSaving(true);
    const result = await updatePage(selectedPage.id, {
      title: editorTitle,
      htmlContent: editorContent,
      status: publish ? "published" : "draft",
    });
    if (result.success) {
      showAlert("success", publish ? t("pagePublished") : t("draftSaved"));
      closeEditor();
    } else {
      showAlert("error", result.error || t("saveError"));
    }
    setSaving(false);
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    const result = await deletePage(pageToDelete);
    if (result.success) {
      setShowDeleteModal(false); 
      setPageToDelete(null);
      if (selectedPage?.id === pageToDelete) closeEditor();
      showAlert("success", t("pageDeleted"));
    } else {
      showAlert("error", result.error || t("deleteError"));
    }
  };

  const handleRestoreVersion = async (version: Version) => {
    if (!selectedPage) return;
    setRestoring(version.id);
    setEditorLoading(true);

    const result = await restoreVersion(selectedPage.id, version.id);
    if (result.success) {
      const restoredHtml = (result.page as any)?.displayContent || (result.page as any)?.htmlContent || "";
      const restoredTitle = (result.page as any)?.title || selectedPage.title;
      const restoredVersion = (result.page as any)?.version || version.version;
      
      setEditorContent(restoredHtml);
      setEditorTitle(restoredTitle);
      setLastRestoredId(version.id);
      
      setSelectedPage(prev => prev ? {
        ...prev, 
        title: restoredTitle, 
        htmlContent: restoredHtml,
        status: "restored", 
        updatedAt: new Date().toISOString(),
        version: restoredVersion,
      } : null);
      
      await loadVersions(selectedPage.id);
      await fetchPages();
      
      setShowVersions(false);
      setShowFullHistory(false);
      
      showAlert("success", t("versionRestored", { version: restoredVersion }));
    } else {
      showAlert("error", result.error || t("restoreError"));
    }
    setEditorLoading(false);
    setRestoring(null);
  };

  // ─── Guards ──────────────────────────────────────────────────
  if (!isUserLoaded || isAdmin === null)
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-10 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
          <MdLock className="text-6xl text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-red-600 mb-2">{t("unauthorized")}</h1>
          <p className="text-slate-500">{t("adminRequired")}</p>
        </div>
      </div>
    );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <>
      {/* Alert */}
      {alertState && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type={alertState.type} message={alertState.message} onClose={closeAlert} autoClose={4000} />
        </div>
      )}
      {hookError && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type="error" message={hookError} onClose={() => {}} />
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex flex-col h-full overflow-hidden p-6 gap-5">
        {/* Header */}
        <div className="flex-shrink-0">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t("title")}</h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>

        {/* Split view */}
        <div className="flex-1 flex gap-5 min-h-0">
          {/* LEFT: list + filter */}
          <div className={`w-72 flex-shrink-0 flex flex-col min-h-0 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 overflow-hidden ${block3d}`}>
            {/* Filter tabs */}
            <div className="flex-shrink-0 p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex gap-1">
                {[
                  { v: "ALL", l: t("allPages"), count: pages.length },
                  { v: "published", l: t("published"), count: pages.filter(p => p.status === "published").length },
                  { v: "draft", l: t("drafts"), count: pages.filter(p => p.status === "draft").length },
                ].map(({ v, l, count }) => (
                  <button 
                    key={v} 
                    onClick={() => setFilterType(v)}
                    className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      filterType === v
                        ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                        : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {l}
                    <span className={`text-[10px] font-bold px-1 py-0.5 rounded-full min-w-[18px] text-center ${
                      filterType === v
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 dark:text-indigo-400"
                        : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Page list */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
              ) : filteredPages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-3 text-slate-400">
                  <TbFileOff className="text-5xl opacity-30" />
                  <p className="text-sm">{t("noPagesFound")}</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {filteredPages.map((page) => {
                    const meta = getPageMeta(page.type);
                    const st = getSt(page.status);
                    const sel = selectedPage?.id === page.id;
                    const { Icon: PageIcon } = meta;
                    const { Icon: StIcon } = st;
                    
                    return (
                      <button
                        key={page.id}
                        onClick={() => { 
                          setSelectedPage(page); 
                          setShowVersions(false); 
                          setShowFullHistory(false); 
                        }}
                        className={`w-full text-left rounded-xl border p-3.5 transition-all duration-150 ${
                          sel
                            ? `border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-900/10 ${card3dSel}`
                            : `border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/40 ${card3d}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                            <PageIcon className="text-white text-base" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1.5 mb-1">
                              <span className={`font-semibold text-sm leading-tight truncate ${sel ? "text-indigo-600 dark:text-indigo-400" : "text-slate-700 dark:text-slate-200"}`}>
                                {page.title}
                              </span>
                              <span className={`flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${st.cls}`}>
                                <StIcon className="text-[9px]" />{st.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-semibold ${meta.labelCls}`}>{meta.label}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-[11px] text-slate-400">{fDate(page.updatedAt)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                          <FiUser className="text-[10px] text-slate-400" />
                          <span className="text-[11px] text-slate-400 truncate">{fullName(page)}</span>
                          <span className="ml-auto text-[10px] text-slate-400">{fRel(page.updatedAt)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: editor */}
          <div className={`flex-1 min-h-0 flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border transition-all duration-200 ${
            selectedPage
              ? `border-indigo-200 dark:border-indigo-800/60 ${block3d}`
              : `border-slate-200 dark:border-slate-700 ${block3d}`
          }`}>
            {selectedPage ? (
              <>
                {/* Title input */}
                <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={e => setEditorTitle(e.target.value)}
                    placeholder={t("pageTitlePlaceholder")}
                    className="w-full text-xl font-bold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>

                {/* Editor */}
                <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
                  {editorLoading && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3 text-indigo-600 dark:text-indigo-400">
                        <LoadingSpinner />
                        <span className="text-sm font-medium">{t("restoring")}</span>
                      </div>
                    </div>
                  )}
                  <RichTextEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    placeholder={t("editorPlaceholder")}
                  />
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 px-4 py-2.5 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-1 min-w-0">
                    {(() => {
                      const m = getPageMeta(selectedPage.type);
                      const { Icon: I } = m;
                      return (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r ${m.grad} text-white flex-shrink-0 shadow-sm`}>
                          <I className="text-xs" />{m.label}
                        </span>
                      );
                    })()}
                    <span className="text-slate-200 dark:text-slate-700">·</span>
                    <FiCalendar className="text-[10px] flex-shrink-0" />
                    <span title={fDT(selectedPage.updatedAt)}>{fDate(selectedPage.updatedAt)}</span>
                    <span className="text-slate-200 dark:text-slate-700">·</span>
                    <FiUser className="text-[10px] flex-shrink-0" />
                    <span className="truncate max-w-[80px]">{fullName(selectedPage)}</span>
                    <span className="text-slate-200 dark:text-slate-700 hidden md:inline">·</span>
                    <span className="hidden md:inline whitespace-nowrap">{fRel(selectedPage.updatedAt)}</span>
                    <span className="text-slate-200 dark:text-slate-700 hidden md:inline">·</span>
                    <span className="hidden md:inline font-mono text-indigo-500">{formatCurrentVersion()}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button 
                      onClick={() => loadVersions(selectedPage.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        showVersions
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-400"
                      }`}
                    >
                      <BsClockHistory className="text-xs" />{t("history")}
                    </button>

                    {(() => {
                      const s = getSt(selectedPage.status);
                      const { Icon: I } = s;
                      return (
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${s.cls}`}>
                          <I className="text-xs" />{s.label}
                        </span>
                      );
                    })()}

                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

                    <button 
                      onClick={closeEditor}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-500 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <MdCancel className="text-sm" />{t("cancel")}
                    </button>

                    <button 
                      onClick={() => handleSavePage(false)} 
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      <MdSave className="text-sm" />{saving ? "…" : t("draft")}
                    </button>

                    <button 
                      onClick={() => handleSavePage(true)} 
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary hover:bg-primary/90 text-white shadow-sm transition-all disabled:opacity-50"
                    >
                      <MdPublish className="text-sm" />{saving ? "…" : t("publish")}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-5 text-slate-400">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center shadow-inner">
                  <RiFileEditLine className="text-4xl text-indigo-400 dark:text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-slate-600 dark:text-slate-300">{t("selectPage")}</p>
                  <p className="text-sm text-slate-400 mt-1">{t("selectPageHint")}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Version history panel */}
      {showVersions && selectedPage && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-end z-50"
          onClick={() => setShowVersions(false)}
        >
          <div 
            className={`w-96 h-full bg-white dark:bg-slate-900 flex flex-col border-l border-slate-200 dark:border-slate-800 ${block3d}`}
            onClick={e => e.stopPropagation()}
          >
            {/* Panel header */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center shadow-sm">
                    <BsClockHistory className="text-white text-sm" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t("versionHistory")}</h3>
                </div>
                <button 
                  onClick={() => setShowVersions(false)}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <IoCloseCircleOutline className="text-xl text-slate-500" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 ml-10">
                {t("versionHistoryDesc")}
              </p>
            </div>

            {/* Current version */}
            <div className="flex-shrink-0 p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {t("currentVersion")}
                </span>
                <span className="ml-auto text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                  {formatCurrentVersion()}
                </span>
              </div>
              <div className="bg-indigo-50/60 dark:bg-indigo-900/10 rounded-xl p-3 border border-indigo-200/60 dark:border-indigo-800/60">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {selectedPage.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                      <FiCalendar className="text-[10px]" />
                      <span>{fDT(selectedPage.updatedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                      <FiUser className="text-[10px]" />
                      <span>{fullName(selectedPage)}</span>
                    </div>
                    {selectedPage.status === "restored" && (
                      <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <MdRestore className="text-xs" />{t("versionRestoredBadge")}
                      </span>
                    )}
                  </div>
                  <BsCheckCircleFill className="text-emerald-500 text-xl flex-shrink-0 mt-0.5" />
                </div>
              </div>
            </div>

            {/* Previous versions */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {t("previousVersions", { count: versions.length })}
              </p>

              {versions.length === 0 ? (
                <div className="text-center py-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-400">
                  <BsClockHistory className="text-3xl mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{t("noPreviousVersions")}</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {visibleVersions.map((version) => {
                    const isRestoringThis = restoring === version.id;
                    const act = getAct(version.action);
                    const isLast = lastRestoredId === version.id;
                    
                    return (
                      <div 
                        key={version.id} 
                        className={`p-3 rounded-xl border transition-all ${
                          isLast
                            ? "border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-900/10"
                            : isRestoringThis
                            ? "border-primary/40 bg-primary/5"
                            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-300 dark:hover:border-indigo-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">
                            {formatVersionNumber(version)}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${act.cls}`}>
                            {act.label}
                          </span>
                          {isLast && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                              <MdRestore className="text-[10px]" />{t("restored")}
                            </span>
                          )}
                          <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60 min-w-[8px]" />
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                          <FiCalendar className="text-[10px]" />
                          <span title={fDT(version.createdAt)}>{fRel(version.createdAt)}</span>
                          <span className="text-slate-300">·</span>
                          <FiUser className="text-[10px]" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {getVersionUserDisplay(version)}
                          </span>
                        </div>

                        {version.details?.previous && (
                          <div className="text-xs text-slate-500 mb-2 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 rounded-lg">
                            {version.details.previous.title && version.details.new?.title &&
                             version.details.previous.title !== version.details.new.title && (
                              <div className="line-clamp-1">
                                <span className="font-medium">{t("titleLabel")} :</span>{" "}
                                {version.details.previous.title} → {version.details.new.title}
                              </div>
                            )}
                            {version.details.previous.htmlContent && (
                              <div className="text-slate-400">
                                <span className="font-medium">{t("contentLabel")} :</span> {t("contentModified")}
                              </div>
                            )}
                          </div>
                        )}

                        <button 
                          onClick={() => handleRestoreVersion(version)}
                          disabled={!!isRestoringThis || editorLoading}
                          className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700/60 hover:bg-primary hover:text-white transition-all text-xs font-medium disabled:opacity-50 group text-slate-600 dark:text-slate-300"
                        >
                          {isRestoringThis ? (
                            <><LoadingSpinner />{t("restoring")}…</>
                          ) : (
                            <><MdRestore className="text-sm group-hover:rotate-12 transition-transform" />{t("restoreThisVersion")}</>
                          )}
                        </button>
                      </div>
                    );
                  })}

                  {versions.length > PREVIEW && (
                    <button 
                      onClick={() => setShowFullHistory(!showFullHistory)}
                      className="w-full py-2 text-xs font-medium text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showFullHistory ? (
                        <><MdArrowBack className="text-sm rotate-90" />{t("showLess")}</>
                      ) : (
                        <><MdArrowForward className="text-sm rotate-90" />{t("showAll", { count: versions.length - PREVIEW })}</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl p-6 w-96 border border-slate-200 dark:border-slate-700 ${block3d}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MdDelete className="text-red-500 text-xl" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("deletePage")}</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {t("deleteConfirmation")}
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                {t("cancel")}
              </button>
              <button 
                onClick={handleDeletePage}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}