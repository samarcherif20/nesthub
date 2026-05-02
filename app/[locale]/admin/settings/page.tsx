// app/[locale]/admin/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import {
  IoSearchOutline,
  IoAddCircleOutline,
  IoCloseOutline,
  IoWarningOutline,
  IoSaveOutline,
  IoWalletOutline,
  IoShieldOutline,
  IoCallOutline,
  IoMailOutline,
  IoHomeOutline,
  IoBusinessOutline,
  IoLocationOutline,
  IoGlobeOutline,
  IoTrendingUpOutline,
  IoCheckmarkCircleOutline,
} from "react-icons/io5";
import { MdOutlineCategory, MdOutlineSecurity, MdOutlineSupportAgent } from "react-icons/md";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface Category {
  id: string;
  name: string;
  enabled: boolean;
}

interface CommissionSettings {
  standard: number;
  premium: number;
}

interface SearchSettings {
  defaultRadius: number;
  displayPriority: string;
  popularDestinations: string[];
}

interface ModerationSettings {
  autoHideThreshold: number;
  blacklistedKeywords: string[];
}

interface SupportSettings {
  helpCenterUrl: string;
  emergencyNumber: string;
  emailRouting: string;
}

export default function AdminSettingsPage() {
  const t = useTranslations("Settings");
  const { getToken } = useAuth();
  
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Appartements", enabled: true },
    { id: "2", name: "Villas", enabled: true },
    { id: "3", name: "Maisons de Plage", enabled: false },
    { id: "4", name: "Studios", enabled: true },
  ]);
  
  const [commission, setCommission] = useState<CommissionSettings>({
    standard: 12,
    premium: 18,
  });
  
  const [searchSettings, setSearchSettings] = useState<SearchSettings>({
    defaultRadius: 25,
    displayPriority: "newest",
    popularDestinations: ["Tunis", "Hammamet", "Sousse"],
  });
  
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>({
    autoHideThreshold: 5,
    blacklistedKeywords: ["arnaque", "argent facile", "faux"],
  });
  
  const [supportSettings, setSupportSettings] = useState<SupportSettings>({
    helpCenterUrl: "https://help.nesthub.tn",
    emergencyNumber: "+216 71 000 000",
    emailRouting: "support-global@nesthub.tn",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newKeyword, setNewKeyword] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const res = await authFetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.categories) setCategories(data.categories);
          if (data.commission) setCommission(data.commission);
          if (data.searchSettings) setSearchSettings(data.searchSettings);
          if (data.moderationSettings) setModerationSettings(data.moderationSettings);
          if (data.supportSettings) setSupportSettings(data.supportSettings);
        }
      } catch {
        // use defaults
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify({
          categories,
          commission,
          searchSettings,
          moderationSettings,
          supportSettings,
        }),
      });
      if (res.ok) {
        setHasChanges(false);
        setAlert({ type: "success", message: t("saveSuccess") });
      } else {
        setAlert({ type: "error", message: t("saveError") });
      }
    } catch {
      setAlert({ type: "error", message: t("connectionError") });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCategories([
      { id: "1", name: "Appartements", enabled: true },
      { id: "2", name: "Villas", enabled: true },
      { id: "3", name: "Maisons de Plage", enabled: false },
      { id: "4", name: "Studios", enabled: true },
    ]);
    setCommission({ standard: 12, premium: 18 });
    setSearchSettings({
      defaultRadius: 25,
      displayPriority: "newest",
      popularDestinations: ["Tunis", "Hammamet", "Sousse"],
    });
    setModerationSettings({
      autoHideThreshold: 5,
      blacklistedKeywords: ["arnaque", "argent facile", "faux"],
    });
    setSupportSettings({
      helpCenterUrl: "https://help.nesthub.tn",
      emergencyNumber: "+216 71 000 000",
      emailRouting: "support-global@nesthub.tn",
    });
    setHasChanges(false);
    setAlert({ type: "success", message: t("resetSuccess") });
  };

  const toggleCategory = (id: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === id ? { ...cat, enabled: !cat.enabled } : cat
    ));
    setHasChanges(true);
  };

  const addDestination = () => {
    if (newDestination.trim() && !searchSettings.popularDestinations.includes(newDestination.trim())) {
      setSearchSettings(prev => ({
        ...prev,
        popularDestinations: [...prev.popularDestinations, newDestination.trim()]
      }));
      setNewDestination("");
      setHasChanges(true);
    }
  };

  const removeDestination = (destination: string) => {
    setSearchSettings(prev => ({
      ...prev,
      popularDestinations: prev.popularDestinations.filter(d => d !== destination)
    }));
    setHasChanges(true);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !moderationSettings.blacklistedKeywords.includes(newKeyword.trim())) {
      setModerationSettings(prev => ({
        ...prev,
        blacklistedKeywords: [...prev.blacklistedKeywords, newKeyword.trim()]
      }));
      setNewKeyword("");
      setHasChanges(true);
    }
  };

  const removeKeyword = (keyword: string) => {
    setModerationSettings(prev => ({
      ...prev,
      blacklistedKeywords: prev.blacklistedKeywords.filter(k => k !== keyword)
    }));
    setHasChanges(true);
  };

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        enabled: true,
      };
      setCategories(prev => [...prev, newCategory]);
      setNewCategoryName("");
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {alert && (
        <div className="fixed top-20 right-8 z-50">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("description")}
          </p>
        </div>
        <div className="flex gap-3">
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-3 flex items-center gap-3 ${card3d}`}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm flex-shrink-0">
              <IoCheckmarkCircleOutline className="text-white text-base" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                {t("activeSettings")}
              </p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {categories.filter(c => c.enabled).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
          <div className="relative max-w-md">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-700"
            />
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Gestion des Catégories */}
        <div className={`md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
          <div className="p-5 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <MdOutlineCategory className="text-white text-base" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("categories")}</h3>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder={t("newCategory")}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500 text-slate-900 dark:text-slate-100"
                />
                <button
                  onClick={addCategory}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-all"
                >
                  {t("addCategory")}
                </button>
              </div>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-indigo-50/20 dark:bg-indigo-900/10 rounded-xl">
                <div className="flex items-center gap-3">
                  <IoHomeOutline className="text-indigo-500 text-base" />
                  <span className="font-medium text-slate-800 dark:text-slate-200">{category.name}</span>
                </div>
                <div className="flex items-center gap-6">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={category.enabled}
                      onChange={() => toggleCategory(category.id)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paramètres de Commission */}
        <div className={`md:col-span-5 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-5 text-white ${card3d}`}>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shadow-sm">
              <IoWalletOutline className="text-white text-base" />
            </div>
            <h3 className="text-lg font-bold">{t("commissionSettings")}</h3>
          </div>
          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2 block">
                {t("standardCommission")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={commission.standard}
                  onChange={(e) => {
                    setCommission(prev => ({ ...prev, standard: parseFloat(e.target.value) }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-white/10 border-none rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80">%</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-2 block">
                {t("premiumCommission")}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={commission.premium}
                  onChange={(e) => {
                    setCommission(prev => ({ ...prev, premium: parseFloat(e.target.value) }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-white/10 border-none rounded-xl px-4 py-3 text-lg font-bold outline-none focus:ring-2 focus:ring-white/20 text-white"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuration de la Recherche */}
        <div className={`md:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
          <div className="p-5 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-base" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("searchConfiguration")}</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    {t("defaultSearchRadius")}
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={searchSettings.defaultRadius}
                    onChange={(e) => {
                      setSearchSettings(prev => ({ ...prev, defaultRadius: parseInt(e.target.value) }));
                      setHasChanges(true);
                    }}
                    className="w-full accent-indigo-600"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-400 mt-2">
                    <span>5km</span>
                    <span>{searchSettings.defaultRadius}km</span>
                    <span>50km</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    {t("displayPriority")}
                  </label>
                  <select
                    value={searchSettings.displayPriority}
                    onChange={(e) => {
                      setSearchSettings(prev => ({ ...prev, displayPriority: e.target.value }));
                      setHasChanges(true);
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 text-slate-700 dark:text-slate-300"
                  >
                    <option value="newest">{t("newestFirst")}</option>
                    <option value="topRated">{t("topRatedFirst")}</option>
                    <option value="highCommission">{t("highCommissionFirst")}</option>
                  </select>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block">
                  {t("popularDestinations")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {searchSettings.popularDestinations.map((dest) => (
                    <span key={dest} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                      <IoLocationOutline className="text-xs" />
                      {dest}
                      <button onClick={() => removeDestination(dest)} className="hover:text-red-500 transition-colors">
                        <IoCloseOutline className="text-sm" />
                      </button>
                    </span>
                  ))}
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newDestination}
                      onChange={(e) => setNewDestination(e.target.value)}
                      placeholder={t("addDestination")}
                      className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-full text-xs outline-none focus:border-indigo-500"
                    />
                    <button onClick={addDestination} className="text-indigo-600 hover:text-indigo-700">
                      <IoAddCircleOutline className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Règles de Modération */}
        <div className={`md:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
          <div className="p-5 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-400 to-rose-500 flex items-center justify-center shadow-sm">
                <IoShieldOutline className="text-white text-base" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("moderationRules")}</h3>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="p-4 bg-indigo-50/20 dark:bg-indigo-900/10 rounded-xl flex items-start gap-4">
              <IoWarningOutline className="text-amber-600 text-xl mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{t("autoHideSuspicious")}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("autoHideDescription")}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={moderationSettings.autoHideThreshold}
                  onChange={(e) => {
                    setModerationSettings(prev => ({ ...prev, autoHideThreshold: parseInt(e.target.value) }));
                    setHasChanges(true);
                  }}
                  className="w-16 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg text-sm text-center"
                />
                <span className="text-xs text-slate-500">{t("reports")}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                {t("blacklistedKeywords")}
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {moderationSettings.blacklistedKeywords.map((keyword) => (
                  <span key={keyword} className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                    <IoCloseOutline className="text-xs" />
                    {keyword}
                    <button onClick={() => removeKeyword(keyword)} className="hover:text-red-700">
                      <IoCloseOutline className="text-sm" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder={t("addKeyword")}
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
                />
                <button onClick={addKeyword} className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold">
                  {t("add")}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Services de Support */}
        <div className={`md:col-span-12 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
          <div className="p-5 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20 dark:from-indigo-900/10 dark:to-violet-900/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                <MdOutlineSupportAgent className="text-white text-base" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("supportServices")}</h3>
            </div>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-indigo-50/20 dark:bg-indigo-900/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <IoGlobeOutline className="text-white text-sm" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{t("helpCenter")}</h4>
                </div>
                <input
                  type="text"
                  value={supportSettings.helpCenterUrl}
                  onChange={(e) => {
                    setSupportSettings(prev => ({ ...prev, helpCenterUrl: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-600 dark:text-slate-400"
                />
                <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline">{t("testLink")}</button>
              </div>
              <div className="bg-indigo-50/20 dark:bg-indigo-900/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <IoCallOutline className="text-white text-sm" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{t("emergencyNumber")}</h4>
                </div>
                <input
                  type="text"
                  value={supportSettings.emergencyNumber}
                  onChange={(e) => {
                    setSupportSettings(prev => ({ ...prev, emergencyNumber: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-200"
                />
                <p className="text-[9px] text-slate-400">{t("emergencyHint")}</p>
              </div>
              <div className="bg-indigo-50/20 dark:bg-indigo-900/10 p-4 rounded-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <IoMailOutline className="text-white text-sm" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">{t("emailRouting")}</h4>
                </div>
                <select
                  value={supportSettings.emailRouting}
                  onChange={(e) => {
                    setSupportSettings(prev => ({ ...prev, emailRouting: e.target.value }));
                    setHasChanges(true);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-lg px-3 py-2 text-sm"
                >
                  <option>support-global@nesthub.tn</option>
                  <option>priority@nesthub.tn</option>
                  <option>technical@nesthub.tn</option>
                </select>
                <button className="w-full bg-gradient-to-r from-indigo-500 to-violet-600 text-white py-2 rounded-lg text-xs font-bold hover:opacity-90 transition-all">
                  {t("manageAliases")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Footer */}
      <div className="flex justify-end items-center gap-4 pt-4">
        <button
          onClick={handleReset}
          className="px-5 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-all text-sm"
        >
          {t("reset")}
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="bg-gradient-to-r from-indigo-500 to-violet-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm"
        >
          {saving ? <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <IoSaveOutline />}
          {t("saveChanges")}
        </button>
      </div>
    </div>
  );
}