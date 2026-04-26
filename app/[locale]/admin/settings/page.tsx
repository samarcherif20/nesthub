// app/[locale]/(dashboard)/admin/settings/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import {
  IoGlobeOutline,
  IoLockClosedOutline,
  IoCardOutline,
  IoDocumentTextOutline,
  IoCloudUploadOutline,
  IoCheckmarkCircleOutline,
  IoSaveOutline,
  IoTrashOutline,
  IoAddCircleOutline,
  IoChevronForwardOutline,
  IoCodeOutline,
  IoSettingsOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoBarChartOutline,
  IoReceiptOutline,
  IoHomeOutline,
  IoShieldCheckmarkOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoLogOutOutline,
  IoPeopleOutline,
  IoChatbubbleOutline,
  IoShareOutline,
} from "react-icons/io5";
import { MdOutlineGavel } from "react-icons/md";
import { BiColorFill } from "react-icons/bi";

// ─── Shared sidebar (matches all admin pages) ─────────────────────────────────
function AdminSidebar({ active }: { active: string }) {
  const navItems = [
    { label: "Dashboard", href: "/fr/admin", icon: <IoShareOutline /> },
    { label: "Transactions", href: "/fr/admin/transactions", icon: <IoReceiptOutline /> },
    { label: "Property Listings", href: "/fr/admin/properties", icon: <IoHomeOutline /> },
    { label: "Disputes", href: "/fr/admin/disputes", icon: <MdOutlineGavel /> },
    { label: "Moderation", href: "/fr/admin/moderation", icon: <IoChatbubbleOutline /> },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 px-4 gap-6 z-50 border-r border-slate-100 dark:border-slate-800">
      <div className="px-4">
        <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
          Nesthub Atlas
        </span>
        <p className="text-xs text-slate-500 font-medium mt-1">Management Suite</p>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              active === label
                ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-300 hover:translate-x-1"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-4 space-y-0.5">
        <Link
          href="/fr/admin/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm"
        >
          <IoSettingsOutline className="text-base" />
          Settings
        </Link>
        <Link
          href="/fr/logout"
          className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
        >
          <IoLogOutOutline className="text-base" />
          Logout
        </Link>
      </div>
    </aside>
  );
}

// ─── Toggle component ─────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${
        checked ? "bg-blue-600" : "bg-slate-200 dark:bg-slate-700"
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${
          checked ? "left-7" : "left-1"
        }`}
      />
    </button>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Settings {
  platformName: string;
  primaryColor: string;
  maintenanceMode: boolean;
  loginAttemptsLimit: number;
  sessionTimeout: 15 | 30 | 60;
  commissionRate: number;
  minPayoutThreshold: number;
  lastSavedAt?: string;
  lastSavedBy?: string;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const { getToken } = useAuth();
  const [settings, setSettings] = useState<Settings>({
    platformName: "Nesthub Atlas",
    primaryColor: "#005CAB",
    maintenanceMode: false,
    loginAttemptsLimit: 5,
    sessionTimeout: 30,
    commissionRate: 12.5,
    minPayoutThreshold: 500,
    lastSavedAt: "Today at 09:42 AM",
    lastSavedBy: "Admin",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDragging, setLogoDragging] = useState(false);

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
          setSettings((p) => ({ ...p, ...data }));
        }
      } catch {
        /* use defaults */
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authFetch]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((p) => ({ ...p, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await authFetch("/api/admin/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        const now = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
        setSettings((p) => ({
          ...p,
          lastSavedAt: `Aujourd'hui à ${now}`,
          lastSavedBy: "Admin",
        }));
        setHasChanges(false);
        setAlert({ type: "success", message: "Paramètres sauvegardés avec succès" });
      } else {
        setAlert({ type: "error", message: "Erreur lors de la sauvegarde" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur de connexion" });
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setHasChanges(false);
    setAlert({ type: "success", message: "Modifications annulées" });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLogoFile(e.target.files[0]);
      setHasChanges(true);
    }
  };

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-[#f9f9ff] dark:bg-slate-950 flex items-center justify-center">
        <LoadingSpinner fullScreen={false} variant="spinner" size="lg" color="primary" text="Chargement des paramètres..." speed="normal" />
      </div>
    );
  }

  const policyLinks = [
    { icon: <IoDocumentTextOutline />, label: "Terms of Service", href: "/fr/admin/settings/terms" },
    { icon: <IoLockClosedOutline />, label: "Privacy Policy", href: "/fr/admin/settings/privacy" },
    { icon: <IoCodeOutline />, label: "Cookie Settings", href: "/fr/admin/settings/cookies" },
  ];

  return (
    <div className="bg-[#f9f9ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen transition-colors">
      <AdminSidebar active="Settings" />

      {/* Main */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl sticky top-0 z-40 flex items-center justify-between w-full px-8 h-16 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100 dark:border-slate-800">
          <h1 className="text-xl font-bold tracking-tighter text-slate-900 dark:text-white">
            Global System Settings
          </h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all">
              <IoNotificationsOutline className="text-xl" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <IoHelpCircleOutline className="text-xl text-slate-500" />
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-sm font-medium">Administrator</span>
            </div>
          </div>
        </header>

        {/* Alert */}
        {alert && (
          <div className="fixed top-20 right-5 z-[60] w-full max-w-sm">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-10 pb-40">
          {/* Hero card */}
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#005cab] to-[#712ae2] p-10 md:p-12 text-white shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 leading-tight">
                System Core Configuration
              </h2>
              <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8">
                Manage the foundational parameters of Nesthub Atlas. Adjust security protocols, financial commissions, and legal metadata from this central command center.
              </p>
              <button className="bg-white text-[#005cab] px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">
                View Audit Logs
              </button>
            </div>
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none overflow-hidden">
              <IoSettingsOutline className="text-[20rem] absolute -right-20 -top-20" />
            </div>
          </section>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">

            {/* ── General Branding ── */}
            <div className="md:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] flex flex-col gap-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <IoGlobeOutline className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">General Branding</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Identity and public representation</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Platform Name
                  </label>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(e) => update("platformName", e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-xl p-2 pr-4">
                      <div
                        className="w-9 h-9 rounded-lg flex-shrink-0 cursor-pointer"
                        style={{ background: settings.primaryColor }}
                      >
                        <input
                          type="color"
                          value={settings.primaryColor}
                          onChange={(e) => update("primaryColor", e.target.value)}
                          className="w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                        {settings.primaryColor.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Favicon Status
                    </label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl h-[52px]">
                      <IoCheckmarkCircleOutline className="text-emerald-500 text-lg" />
                      <span className="text-sm font-medium">SVG Optimized</span>
                    </div>
                  </div>
                </div>

                {/* Logo upload */}
                <label
                  onDragOver={(e) => { e.preventDefault(); setLogoDragging(true); }}
                  onDragLeave={() => setLogoDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setLogoDragging(false);
                    if (e.dataTransfer.files[0]) {
                      setLogoFile(e.dataTransfer.files[0]);
                      setHasChanges(true);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                    logoDragging
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600"
                  }`}
                >
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  <IoCloudUploadOutline className={`text-4xl mb-2 transition-colors ${logoDragging ? "text-blue-500" : "text-slate-400 dark:text-slate-600"}`} />
                  {logoFile ? (
                    <p className="text-sm font-bold text-emerald-600">{logoFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload System Logo</p>
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-0.5">PNG, SVG or WEBP (Max 2MB)</p>
                    </>
                  )}
                </label>
              </div>
            </div>

            {/* ── Security ── */}
            <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-8 flex flex-col gap-5 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <IoShieldCheckmarkOutline className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Security</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Platform protection rules</p>
                </div>
              </div>

              {/* Maintenance mode */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl flex items-center justify-between shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-sm">Maintenance Mode</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Restrict all public access</p>
                </div>
                <Toggle
                  checked={settings.maintenanceMode}
                  onChange={(v) => update("maintenanceMode", v)}
                />
              </div>

              {/* Login attempts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Login Attempts Limit</span>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 text-[10px] font-bold rounded-lg">
                    High Sensitivity
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={settings.loginAttemptsLimit}
                    onChange={(e) => update("loginAttemptsLimit", parseInt(e.target.value))}
                    className="flex-1 accent-purple-600"
                  />
                  <span className="font-bold text-purple-600 dark:text-purple-400 text-sm whitespace-nowrap">
                    {settings.loginAttemptsLimit} Retries
                  </span>
                </div>
              </div>

              {/* Session timeout */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-3">
                <p className="font-bold text-slate-900 dark:text-white text-sm">Admin Session Timeout</p>
                <div className="grid grid-cols-3 gap-2">
                  {([15, 30, 60] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => update("sessionTimeout", t)}
                      className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                        settings.sessionTimeout === t
                          ? "bg-purple-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {t === 60 ? "1h" : `${t}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Financials ── */}
            <div className="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] flex flex-col gap-6 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <IoCardOutline className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Financials</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Monetization and payouts</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block tracking-widest">
                    Commission Rate
                  </label>
                  <div className="flex items-end gap-1">
                    <input
                      type="number"
                      value={settings.commissionRate}
                      onChange={(e) => update("commissionRate", parseFloat(e.target.value))}
                      step="0.5"
                      min="0"
                      max="50"
                      className="bg-transparent border-none p-0 text-3xl font-black text-slate-900 dark:text-white w-24 focus:ring-0 outline-none"
                    />
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-1">%</span>
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 dark:text-slate-600 leading-tight">
                    Applied to each completed property transaction.
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 block tracking-widest">
                    Min Payout Threshold
                  </label>
                  <div className="flex items-end gap-1">
                    <span className="text-xl font-bold text-teal-600 dark:text-teal-400 mb-1">TND</span>
                    <input
                      type="number"
                      value={settings.minPayoutThreshold}
                      onChange={(e) => update("minPayoutThreshold", parseInt(e.target.value))}
                      step="50"
                      min="0"
                      className="bg-transparent border-none p-0 text-3xl font-black text-slate-900 dark:text-white w-28 focus:ring-0 outline-none"
                    />
                  </div>
                  <p className="text-[10px] mt-2 text-slate-400 dark:text-slate-600 leading-tight">
                    Minimum balance required for automatic withdrawal.
                  </p>
                </div>
              </div>
            </div>

            {/* ── Legal Compliance ── */}
            <div className="md:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4 mb-7">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <IoLockClosedOutline className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Legal Compliance</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Static content and policy links</p>
                </div>
              </div>
              <div className="space-y-1.5">
                {policyLinks.map(({ icon, label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 dark:text-slate-400 text-base">{icon}</span>
                      <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{label}</span>
                    </div>
                    <IoChevronForwardOutline className="text-slate-400 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                  </Link>
                ))}
                <button className="flex items-center justify-between w-full p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group mt-2 border-t-4 border-blue-500/5">
                  <div className="flex items-center gap-3">
                    <IoAddCircleOutline className="text-blue-600 dark:text-blue-400 text-base" />
                    <span className="font-bold text-sm text-blue-600 dark:text-blue-400">Add New Policy Page</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Floating save footer */}
        <footer className="fixed bottom-6 left-64 right-0 z-40 px-8">
          <div className="max-w-6xl mx-auto bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Last saved: {settings.lastSavedAt} by {settings.lastSavedBy}
                {hasChanges && <span className="ml-2 text-amber-500 font-bold">· Unsaved changes</span>}
              </span>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={handleDiscard}
                disabled={!hasChanges}
                className="flex-1 sm:flex-none px-7 py-2.5 rounded-full font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="flex-1 sm:flex-none px-10 py-2.5 rounded-full font-bold text-sm text-white bg-gradient-to-r from-[#005cab] to-[#712ae2] shadow-lg hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <IoSaveOutline />
                )}
                Save Global Changes
              </button>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}