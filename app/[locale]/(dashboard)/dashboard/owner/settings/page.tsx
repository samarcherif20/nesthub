"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Shield,
  Monitor,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Laptop,
  Plane,
  Download,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
  AlertCircle,
  Power,
  Bell,
  Moon as MoonIcon,
  Lock,
  MapPin,
  Calendar,
  CreditCard,
  MessageSquare,
  Star,
  Home,
  Gift,
  XCircle,
} from "lucide-react";

import { RiSmartphoneLine } from "react-icons/ri";
import { TbDeviceDesktop } from "react-icons/tb";
import { useSettings } from "./hooks/useSettings";
import Alert from "@/components/ui/Alert";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ── shadow tokens ─────────────────────────────────────────────────────────────
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(0,0,0,0.09)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.25),0_8px_16px_-4px_rgba(0,0,0,0.30)]";

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
        on ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-300 dark:bg-slate-600"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${
          on ? "right-1" : "left-1"
        }`}
      />
    </button>
  );
}

// ── Section header ──────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  title,
  grad,
}: {
  icon: React.ElementType;
  title: string;
  grad: string;
}) {
  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}
        >
          <Icon className="text-white text-xl" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { resolvedTheme } = useTheme();

  const {
    loading,
    profile,
    security,
    vacation,
    passwordForm,
    passwordCriteria,
    theme,
    setTheme,
    updateLanguage,
    changePassword,
    toggleVacationMode,
    saveVacationMessage,
    revokeSession,
    setPasswordForm,
    updatePasswordStrength,
    passwordsMatch,
    isPasswordValid,
    exportUserData,
    isExporting,
    deactivateAccount,
    isDeactivating,
    notificationCategories,
    quietHours,
    toggleNotificationCategory,
    updateQuietHours,
  } = useSettings();

  const [alert, setAlert] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [editingQuietHours, setEditingQuietHours] = useState(false);
  const [tempQuietHours, setTempQuietHours] = useState({ start: "22:00", end: "07:00" });

  // États pour les messages d'erreur/succès spécifiques
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [languageStatus, setLanguageStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [vacationStatus, setVacationStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [exportStatus, setExportStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [deactivateStatus, setDeactivateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [quietHoursStatus, setQuietHoursStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showAlert = (type: "success" | "error" | "info", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const getStrengthLabelWithWidth = () => {
    const strength = passwordForm.strength;
    if (strength === 1) return { text: "Très faible", color: "#ef4444", width: "20%" };
    if (strength === 2) return { text: "Faible", color: "#f97316", width: "40%" };
    if (strength === 3) return { text: "Moyen", color: "#eab308", width: "60%" };
    if (strength === 4) return { text: "Fort", color: "#22c55e", width: "80%" };
    if (strength === 5) return { text: "Très fort", color: "#10b981", width: "100%" };
    return { text: "Très faible", color: "#ef4444", width: "20%" };
  };

  const strengthInfo = getStrengthLabelWithWidth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    // Validations côté frontend
    if (!passwordForm.currentPassword) {
      setPasswordError("Veuillez entrer votre mot de passe actuel");
      return;
    }
    
    if (!passwordForm.newPassword) {
      setPasswordError("Veuillez entrer un nouveau mot de passe");
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    
    if (!isPasswordValid) {
      setPasswordError("Le nouveau mot de passe n'est pas assez fort");
      return;
    }
    
    try {
      await changePassword();
      setPasswordError(null);
      showAlert("success", "Mot de passe mis à jour avec succès !");
      // Réinitialiser le formulaire après succès
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      const errorMsg = error.message || "Mot de passe actuel incorrect";
      setPasswordError(errorMsg);
      showAlert("error", errorMsg);
      // Vider le champ du mot de passe actuel
      setPasswordForm((prev) => ({ ...prev, currentPassword: "" }));
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    setLanguageStatus(null);
    try {
      await updateLanguage(locale);
      setLanguageStatus({ type: "success", message: "Langue mise à jour avec succès" });
      showAlert("success", "Langue mise à jour avec succès");
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors du changement de langue";
      setLanguageStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleToggleVacationMode = async () => {
    setVacationStatus(null);
    try {
      await toggleVacationMode();
      const message = vacation.enabled ? "Mode vacances désactivé" : "Mode vacances activé";
      setVacationStatus({ type: "success", message });
      showAlert("success", message);
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors du changement";
      setVacationStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleSaveVacationMessage = async () => {
    setVacationStatus(null);
    try {
      await saveVacationMessage();
      setVacationStatus({ type: "success", message: "Message de vacances sauvegardé" });
      showAlert("success", "Message de vacances sauvegardé");
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de la sauvegarde";
      setVacationStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessionStatus(null);
    try {
      await revokeSession(sessionId);
      setSessionStatus({ type: "success", message: "Session révoquée avec succès" });
      showAlert("success", "Session révoquée avec succès");
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de la révocation";
      setSessionStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeactivateStatus(null);
    setShowDeactivateConfirm(false);
    try {
      await deactivateAccount();
      setDeactivateStatus({ type: "success", message: "Votre compte a été désactivé avec succès" });
      showAlert("success", "Votre compte a été désactivé avec succès");
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de la désactivation";
      setDeactivateStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleSaveQuietHours = async () => {
    setQuietHoursStatus(null);
    try {
      await updateQuietHours(tempQuietHours.start, tempQuietHours.end);
      setEditingQuietHours(false);
      setQuietHoursStatus({ type: "success", message: "Heures calmes mises à jour" });
      showAlert("success", "Heures calmes mises à jour");
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de la mise à jour";
      setQuietHoursStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    setExportStatus(null);
    try {
      await exportUserData(format);
      setExportStatus({ type: "success", message: `Données exportées en ${format.toUpperCase()}` });
      showAlert("success", `Données exportées en ${format.toUpperCase()}`);
    } catch (error: any) {
      const errorMsg = error.message || "Erreur lors de l'exportation";
      setExportStatus({ type: "error", message: errorMsg });
      showAlert("error", errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50/20 dark:bg-slate-900/0 z-50">
        <LoadingSpinner variant="spinner" size="lg" color="primary" text="Chargement des paramètres..." speed="normal" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20 dark:bg-slate-900/0">
      {alert && (
        <div className="fixed top-20 right-6 z-50 max-w-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} autoClose={5000} />
        </div>
      )}

      <div className="bg-white dark:bg-slate-900/0 border-b border-slate-100 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-7">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Paramètres</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            Gérez vos préférences de compte et vos paramètres de sécurité
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-7">
            {/* SECURITY CARD */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}>
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600" />
              <div className="p-7">
                <SectionHeader icon={Shield} title="Sécurité" grad="from-indigo-500 to-violet-600" />

                <form onSubmit={handleChangePassword} className="space-y-6">
                  {/* Message d'erreur mot de passe */}
                  {passwordError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                      <XCircle size={16} className="text-red-500 flex-shrink-0" />
                      <p className="text-xs text-red-600 dark:text-red-400">{passwordError}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Mot de passe actuel</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type={passwordForm.showCurrent ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))}
                        required
                        className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setPasswordForm((p) => ({ ...p, showCurrent: !p.showCurrent }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {passwordForm.showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Nouveau mot de passe</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={passwordForm.showNew ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((p) => ({ ...p, newPassword: e.target.value }));
                            updatePasswordStrength(e.target.value);
                          }}
                          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordForm((p) => ({ ...p, showNew: !p.showNew }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                        >
                          {passwordForm.showNew ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">Confirmation</label>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={passwordForm.showConfirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                          className={`w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            passwordForm.confirmPassword && !passwordsMatch
                              ? "border-red-400 dark:border-red-500"
                              : passwordForm.confirmPassword && passwordsMatch
                                ? "border-emerald-400 dark:border-emerald-500"
                                : "border-slate-200 dark:border-slate-700"
                          }`}
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setPasswordForm((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                        >
                          {passwordForm.showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && !passwordsMatch && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> Les mots de passe ne correspondent pas
                        </p>
                      )}
                      {passwordForm.confirmPassword && passwordsMatch && (
                        <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle size={10} /> Les mots de passe correspondent
                        </p>
                      )}
                    </div>
                  </div>

                  {passwordForm.newPassword && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: strengthInfo.width, backgroundColor: strengthInfo.color }} />
                        </div>
                        <span className="text-[10px] font-bold" style={{ color: strengthInfo.color }}>{strengthInfo.text}</span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Sécurité du mot de passe</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordCriteria.length ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                              {passwordCriteria.length && <CheckCircle size={8} className="text-white" />}
                            </div>
                            <span className={`text-[10px] ${passwordCriteria.length ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>Au moins 8 caractères</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.uppercase ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                              {passwordCriteria.uppercase && <CheckCircle size={8} className="text-white" />}
                            </div>
                            <span className={`text-[10px] ${passwordCriteria.uppercase ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>Majuscule et minuscule</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.number ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                              {passwordCriteria.number && <CheckCircle size={8} className="text-white" />}
                            </div>
                            <span className={`text-[10px] ${passwordCriteria.number ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>Au moins un chiffre</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.special ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}>
                              {passwordCriteria.special && <CheckCircle size={8} className="text-white" />}
                            </div>
                            <span className={`text-[10px] ${passwordCriteria.special ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>Caractère spécial recommandé</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!passwordForm.currentPassword || !isPasswordValid || passwordForm.isSubmitting}
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      passwordForm.currentPassword && isPasswordValid && !passwordForm.isSubmitting
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm active:scale-95"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {passwordForm.isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <><Shield size={14} /> Mettre à jour le mot de passe</>}
                  </button>
                </form>

                {security.sessions.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">Sessions actives — {security.sessions.length}</p>
                    <div className="space-y-2.5">
                      {security.sessions.map((s: any) => {
                        const isMobile = s.device?.includes("iOS") || s.device?.includes("App");
                        const DevIcon = isMobile ? RiSmartphoneLine : TbDeviceDesktop;
                        return (
                          <div key={s.id} className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 ${card3d}`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.isCurrent ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-slate-100 dark:bg-slate-800"}`}>
                                <DevIcon className={`text-xl ${s.isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{s.device || "Appareil inconnu"}</p>
                                  {s.isCurrent && <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">Actuelle</span>}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <MapPin size={10} className="text-slate-400" />
                                  <span className="text-[10px] text-slate-400">{s.location || "Localisation inconnue"} · {s.ip || "IP inconnue"}</span>
                                </div>
                              </div>
                            </div>
                            {!s.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(s.id)}
                                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                              >
                                Révoquer
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* NOTIFICATIONS CARD */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}>
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-7">
                <SectionHeader icon={Bell} title="Notifications" grad="from-emerald-500 to-cyan-500" />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Réservations</p>
                        <p className="text-[10px] text-slate-500">Demandes, confirmations</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "bookings")?.enabled ?? true} onToggle={() => toggleNotificationCategory("bookings")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                        <CreditCard size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Paiements</p>
                        <p className="text-[10px] text-slate-500">Reçus, remboursements</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "payments")?.enabled ?? true} onToggle={() => toggleNotificationCategory("payments")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <MessageSquare size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Messages</p>
                        <p className="text-[10px] text-slate-500">Nouveaux messages</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "messages")?.enabled ?? true} onToggle={() => toggleNotificationCategory("messages")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                        <Star size={18} className="text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Avis</p>
                        <p className="text-[10px] text-slate-500">Nouveaux avis</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "reviews")?.enabled ?? true} onToggle={() => toggleNotificationCategory("reviews")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                        <Home size={18} className="text-teal-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Annonces</p>
                        <p className="text-[10px] text-slate-500">Activation, suspension</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "listings")?.enabled ?? true} onToggle={() => toggleNotificationCategory("listings")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                        <Bell size={18} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Alertes</p>
                        <p className="text-[10px] text-slate-500">Nouvelles correspondances</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "alerts")?.enabled ?? true} onToggle={() => toggleNotificationCategory("alerts")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <Shield size={18} className="text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Litiges</p>
                        <p className="text-[10px] text-slate-500">Ouverts et résolus</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "disputes")?.enabled ?? true} onToggle={() => toggleNotificationCategory("disputes")} />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                        <Gift size={18} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">Offres</p>
                        <p className="text-[10px] text-slate-500">Reçues et acceptées</p>
                      </div>
                    </div>
                    <Toggle on={notificationCategories.find(c => c.id === "offers")?.enabled ?? true} onToggle={() => toggleNotificationCategory("offers")} />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <MoonIcon size={18} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">Heures calmes</p>
                        <p className="text-[10px] text-slate-500">Aucune notification de <strong>{quietHours.start}</strong> à <strong>{quietHours.end}</strong></p>
                      </div>
                    </div>
                    {!editingQuietHours ? (
                      <button
                        onClick={() => { setTempQuietHours(quietHours); setEditingQuietHours(true); }}
                        className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        Modifier
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={tempQuietHours.start}
                          onChange={(e) => setTempQuietHours(prev => ({ ...prev, start: e.target.value }))}
                          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                        />
                        <span className="text-slate-400">→</span>
                        <input
                          type="time"
                          value={tempQuietHours.end}
                          onChange={(e) => setTempQuietHours(prev => ({ ...prev, end: e.target.value }))}
                          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                        />
                        <button
                          onClick={handleSaveQuietHours}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={() => setEditingQuietHours(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <aside className="lg:col-span-4 space-y-6">
            {/* PREFERENCES */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}>
              <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                    <Globe size={14} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Préférences</h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Langue</label>
                    <select value={profile.preferredLocale} onChange={(e) => handleUpdateLanguage(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2.5">
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="es">Español</option>
                    </select>
                    {languageStatus && (
                      <p className={`text-[10px] mt-1 flex items-center gap-1 ${languageStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                        {languageStatus.type === "success" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                        {languageStatus.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">Thème</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "light", icon: Sun, label: "Clair" },
                        { val: "dark", icon: Moon, label: "Sombre" },
                        { val: "system", icon: Laptop, label: "Système" },
                      ].map(({ val, icon: Icon, label }) => (
                        <button key={val} onClick={() => setTheme(val)} className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all ${theme === val ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"}`}>
                          <Icon size={16} />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* VACATION MODE */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}>
              <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <Plane size={14} className="text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Mode vacances</h3>
                  </div>
                  <Toggle on={vacation.enabled} onToggle={handleToggleVacationMode} />
                </div>
                <p className="text-xs text-slate-500 mb-4">Activez ce mode pour suspendre temporairement vos annonces.</p>
                <div className={`transition-opacity ${vacation.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}>
                  <textarea
                    value={vacation.message}
                    onChange={(e) => setVacation(prev => ({ ...prev, message: e.target.value }))}
                    onBlur={handleSaveVacationMessage}
                    rows={3}
                    placeholder="Message d'absence..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs p-3 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                {vacationStatus && (
                  <p className={`text-[10px] mt-2 flex items-center gap-1 ${vacationStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                    {vacationStatus.type === "success" ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {vacationStatus.message}
                  </p>
                )}
              </div>
            </div>

            {/* DATA PRIVACY */}
            <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}>
              <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <Download size={14} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Données et vie privée</h3>
                </div>

                <p className="text-xs text-slate-500 mb-4">Exportez ou supprimez vos données personnelles.</p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    onClick={() => handleExportData("csv")}
                    disabled={isExporting}
                    className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} CSV
                  </button>
                  <button
                    onClick={() => handleExportData("json")}
                    disabled={isExporting}
                    className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    {isExporting ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} JSON
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!showDeactivateConfirm ? (
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="w-full text-left group p-3 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <p className="text-sm font-bold text-rose-600 flex items-center gap-2"><Power size={15} /> Désactiver mon compte</p>
                      <p className="text-[10px] text-slate-400 mt-1">Vous pourrez réactiver votre compte plus tard.</p>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200">
                      <p className="text-xs font-semibold text-red-700 mb-3">Êtes-vous sûr de vouloir désactiver votre compte ?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeactivateAccount}
                          disabled={isDeactivating}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          {isDeactivating ? <Loader2 size={12} className="animate-spin" /> : <Power size={12} />} Confirmer
                        </button>
                        <button
                          onClick={() => setShowDeactivateConfirm(false)}
                          className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-all"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}