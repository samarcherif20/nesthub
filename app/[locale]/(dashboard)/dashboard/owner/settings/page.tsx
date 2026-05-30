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
  CalendarIcon,
  X,
} from "lucide-react";

import { RiSmartphoneLine } from "react-icons/ri";
import { TbDeviceDesktop } from "react-icons/tb";
import { useSettings } from "./hooks/useSettings";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// ── shadow tokens ─────────────────────────────────────────────────────────────
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(0,0,0,0.09)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.25),0_8px_16px_-4px_rgba(0,0,0,0.30)]";

// Interface pour le toast
interface ToastState {
  type: "success" | "error";
  message: string;
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
        on
          ? "bg-indigo-600 dark:bg-indigo-500"
          : "bg-slate-300 dark:bg-slate-600"
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
  const t = useTranslations("Settings");
  const { resolvedTheme } = useTheme();

  // Toast state comme dans ProfilePage
  const [toast, setToast] = React.useState<ToastState | null>(null);

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
    setVacation,
    vacationError,
} = useSettings(setToast); 

  // Fonction showToast comme dans ProfilePage
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [editingQuietHours, setEditingQuietHours] = useState(false);
  const [tempQuietHours, setTempQuietHours] = useState({
    start: "22:00",
    end: "07:00",
  });

  // États pour les messages d'erreur/succès spécifiques
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [languageStatus, setLanguageStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [vacationStatus, setVacationStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [exportStatus, setExportStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [deactivateStatus, setDeactivateStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [quietHoursStatus, setQuietHoursStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const getStrengthLabelWithWidth = () => {
    const strength = passwordForm.strength;
    if (strength === 1)
      return {
        text: t("password.strength.veryWeak"),
        color: "#ef4444",
        width: "20%",
      };
    if (strength === 2)
      return {
        text: t("password.strength.weak"),
        color: "#f97316",
        width: "40%",
      };
    if (strength === 3)
      return {
        text: t("password.strength.medium"),
        color: "#eab308",
        width: "60%",
      };
    if (strength === 4)
      return {
        text: t("password.strength.strong"),
        color: "#22c55e",
        width: "80%",
      };
    if (strength === 5)
      return {
        text: t("password.strength.veryStrong"),
        color: "#10b981",
        width: "100%",
      };
    return {
      text: t("password.strength.veryWeak"),
      color: "#ef4444",
      width: "20%",
    };
  };

  const strengthInfo = getStrengthLabelWithWidth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError(t("password.errors.currentRequired"));
      return;
    }

    if (!passwordForm.newPassword) {
      setPasswordError(t("password.errors.newRequired"));
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("password.errors.notMatch"));
      return;
    }

    if (!isPasswordValid) {
      setPasswordError(t("password.errors.tooWeak"));
      return;
    }

    try {
      await changePassword();
      setPasswordError(null);
      showToast("success", t("password.success"));
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      const errorMsg = error.message || t("password.errors.incorrect");
      setPasswordError(errorMsg);
      showToast("error", errorMsg);
      setPasswordForm((prev) => ({ ...prev, currentPassword: "" }));
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    setLanguageStatus(null);
    try {
      await updateLanguage(locale);
      setLanguageStatus({
        type: "success",
        message: t("language.success"),
      });
      showToast("success", t("language.success"));
    } catch (error: any) {
      const errorMsg = error.message || t("language.error");
      setLanguageStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleToggleVacationMode = async () => {
    setVacationStatus(null);
    try {
      await toggleVacationMode();
      const message = vacation.enabled
        ? t("vacation.disabled")
        : t("vacation.enabled");
      setVacationStatus({ type: "success", message });
      showToast("success", message);
    } catch (error: any) {
      const errorMsg = error.message || t("vacation.error");
      setVacationStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleSaveVacationMessage = async () => {
    setVacationStatus(null);
    try {
      await saveVacationMessage();
      setVacationStatus({
        type: "success",
        message: t("vacation.messageSaved"),
      });
      showToast("success", t("vacation.messageSaved"));
    } catch (error: any) {
      const errorMsg = error.message || t("vacation.saveError");
      setVacationStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    setSessionStatus(null);
    try {
      await revokeSession(sessionId);
      setSessionStatus({
        type: "success",
        message: t("sessions.revoked"),
      });
      showToast("success", t("sessions.revoked"));
    } catch (error: any) {
      const errorMsg = error.message || t("sessions.revokeError");
      setSessionStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleDeactivateAccount = async () => {
    setDeactivateStatus(null);
    setShowDeactivateConfirm(false);
    try {
      await deactivateAccount();
      setDeactivateStatus({
        type: "success",
        message: t("privacy.deactivateSuccess"),
      });
      showToast("success", t("privacy.deactivateSuccess"));
    } catch (error: any) {
      const errorMsg = error.message || t("privacy.deactivateError");
      setDeactivateStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleSaveQuietHours = async () => {
    setQuietHoursStatus(null);
    try {
      await updateQuietHours(tempQuietHours.start, tempQuietHours.end);
      setEditingQuietHours(false);
      setQuietHoursStatus({
        type: "success",
        message: t("notifications.quietHoursSaved"),
      });
      showToast("success", t("notifications.quietHoursSaved"));
    } catch (error: any) {
      const errorMsg = error.message || t("notifications.quietHoursError");
      setQuietHoursStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    setExportStatus(null);
    try {
      await exportUserData(format);
      setExportStatus({
        type: "success",
        message: t("privacy.exportSuccess", { format: format.toUpperCase() }),
      });
      showToast(
        "success",
        t("privacy.exportSuccess", { format: format.toUpperCase() }),
      );
    } catch (error: any) {
      const errorMsg = error.message || t("privacy.exportError");
      setExportStatus({ type: "error", message: errorMsg });
      showToast("error", errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50/20 dark:bg-slate-900/0 z-50">
        <LoadingSpinner
          variant="spinner"
          size="lg"
          color="primary"
          text={t("loading")}
          speed="normal"
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20 dark:bg-slate-900/0">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 hover:opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900/0 border-b border-slate-100 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-7">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            {t("page.description")}
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-8 space-y-7">
            {/* SECURITY CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600" />
              <div className="p-7">
                <SectionHeader
                  icon={Shield}
                  title={t("security.title")}
                  grad="from-indigo-500 to-violet-600"
                />

                <form onSubmit={handleChangePassword} className="space-y-6">
                  {passwordError && (
                    <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
                      <XCircle
                        size={16}
                        className="text-red-500 flex-shrink-0"
                      />
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {passwordError}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                      {t("security.currentPassword")}
                    </label>
                    <div className="relative">
                      <Lock
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type={passwordForm.showCurrent ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm((p) => ({
                            ...p,
                            currentPassword: e.target.value,
                          }))
                        }
                        required
                        className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPasswordForm((p) => ({
                            ...p,
                            showCurrent: !p.showCurrent,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {passwordForm.showCurrent ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        {t("security.newPassword")}
                      </label>
                      <div className="relative">
                        <Lock
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={passwordForm.showNew ? "text" : "password"}
                          value={passwordForm.newPassword}
                          onChange={(e) => {
                            setPasswordForm((p) => ({
                              ...p,
                              newPassword: e.target.value,
                            }));
                            updatePasswordStrength(e.target.value);
                          }}
                          className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setPasswordForm((p) => ({
                              ...p,
                              showNew: !p.showNew,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                        >
                          {passwordForm.showNew ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                        {t("security.confirmPassword")}
                      </label>
                      <div className="relative">
                        <Lock
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type={passwordForm.showConfirm ? "text" : "password"}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm((p) => ({
                              ...p,
                              confirmPassword: e.target.value,
                            }))
                          }
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
                          onClick={() =>
                            setPasswordForm((p) => ({
                              ...p,
                              showConfirm: !p.showConfirm,
                            }))
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                        >
                          {passwordForm.showConfirm ? (
                            <EyeOff size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && !passwordsMatch && (
                        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} />{" "}
                          {t("security.passwordsDoNotMatch")}
                        </p>
                      )}
                      {passwordForm.confirmPassword && passwordsMatch && (
                        <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                          <CheckCircle size={10} />{" "}
                          {t("security.passwordsMatch")}
                        </p>
                      )}
                    </div>
                  </div>

                  {passwordForm.newPassword && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: strengthInfo.width,
                              backgroundColor: strengthInfo.color,
                            }}
                          />
                        </div>
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: strengthInfo.color }}
                        >
                          {strengthInfo.text}
                        </span>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3 border border-slate-100 dark:border-slate-700">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                          {t("security.passwordSecurity")}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${passwordCriteria.length ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                            >
                              {passwordCriteria.length && (
                                <CheckCircle size={8} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] ${passwordCriteria.length ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {t("security.criteria.length")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.uppercase ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                            >
                              {passwordCriteria.uppercase && (
                                <CheckCircle size={8} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] ${passwordCriteria.uppercase ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {t("security.criteria.case")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.number ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                            >
                              {passwordCriteria.number && (
                                <CheckCircle size={8} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] ${passwordCriteria.number ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {t("security.criteria.number")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3.5 h-3.5 rounded-full ${passwordCriteria.special ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"}`}
                            >
                              {passwordCriteria.special && (
                                <CheckCircle size={8} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-[10px] ${passwordCriteria.special ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {t("security.criteria.special")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      !passwordForm.currentPassword ||
                      !isPasswordValid ||
                      passwordForm.isSubmitting
                    }
                    className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      passwordForm.currentPassword &&
                      isPasswordValid &&
                      !passwordForm.isSubmitting
                        ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm active:scale-95"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    {passwordForm.isSubmitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Shield size={14} /> {t("security.updateButton")}
                      </>
                    )}
                  </button>
                </form>

                {security.sessions.length > 0 && (
                  <div className="mt-8">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                      {t("sessions.title")} — {security.sessions.length}
                    </p>
                    <div className="space-y-2.5">
                      {security.sessions.map((s: any) => {
                        const isMobile =
                          s.device?.includes("iOS") ||
                          s.device?.includes("App");
                        const DevIcon = isMobile
                          ? RiSmartphoneLine
                          : TbDeviceDesktop;
                        return (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 ${card3d}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.isCurrent ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-slate-100 dark:bg-slate-800"}`}
                              >
                                <DevIcon
                                  className={`text-xl ${s.isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {s.device || t("sessions.unknownDevice")}
                                  </p>
                                  {s.isCurrent && (
                                    <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                                      {t("sessions.current")}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <MapPin
                                    size={10}
                                    className="text-slate-400"
                                  />
                                  <span className="text-[10px] text-slate-400">
                                    {s.location ||
                                      t("sessions.unknownLocation")}{" "}
                                    · {s.ip || t("sessions.unknownIp")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!s.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(s.id)}
                                className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200"
                              >
                                {t("sessions.revoke")}
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
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
              <div className="p-7">
                <SectionHeader
                  icon={Bell}
                  title={t("notifications.title")}
                  grad="from-emerald-500 to-cyan-500"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {notificationCategories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center`}
                        >
                          {React.cloneElement(cat.icon as React.ReactElement, {
                            className: cat.iconColor,
                          })}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {t(`notifications.categories.${cat.id}.name`)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {t(`notifications.categories.${cat.id}.desc`)}
                          </p>
                        </div>
                      </div>
                      <Toggle
                        on={cat.enabled}
                        onToggle={() => toggleNotificationCategory(cat.id)}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <MoonIcon
                          size={18}
                          className="text-indigo-600 dark:text-indigo-400"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {t("notifications.quietHours")}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {t("notifications.quietHoursDescription", {
                            start: quietHours.start,
                            end: quietHours.end,
                          })}
                        </p>
                      </div>
                    </div>
                    {!editingQuietHours ? (
                      <button
                        onClick={() => {
                          setTempQuietHours(quietHours);
                          setEditingQuietHours(true);
                        }}
                        className="px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        {t("actions.modify")}
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={tempQuietHours.start}
                          onChange={(e) =>
                            setTempQuietHours((prev) => ({
                              ...prev,
                              start: e.target.value,
                            }))
                          }
                          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                        />
                        <span className="text-slate-400">→</span>
                        <input
                          type="time"
                          value={tempQuietHours.end}
                          onChange={(e) =>
                            setTempQuietHours((prev) => ({
                              ...prev,
                              end: e.target.value,
                            }))
                          }
                          className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800"
                        />
                        <button
                          onClick={handleSaveQuietHours}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg text-xs font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all"
                        >
                          {t("actions.save")}
                        </button>
                        <button
                          onClick={() => setEditingQuietHours(false)}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                        >
                          {t("actions.cancel")}
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
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center">
                    <Globe size={14} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("preferences.title")}
                  </h3>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                      {t("preferences.language")}
                    </label>
                    <select
                      value={profile.preferredLocale}
                      onChange={(e) => handleUpdateLanguage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2.5"
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                      <option value="de">Deutsch</option>
                      <option value="it">Italiano</option>
                      <option value="es">Español</option>
                    </select>
                    {languageStatus && (
                      <p
                        className={`text-[10px] mt-1 flex items-center gap-1 ${languageStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {languageStatus.type === "success" ? (
                          <CheckCircle size={10} />
                        ) : (
                          <AlertCircle size={10} />
                        )}
                        {languageStatus.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 block">
                      {t("preferences.theme")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          val: "light",
                          icon: Sun,
                          label: t("preferences.themeLight"),
                        },
                        {
                          val: "dark",
                          icon: Moon,
                          label: t("preferences.themeDark"),
                        },
                        {
                          val: "system",
                          icon: Laptop,
                          label: t("preferences.themeSystem"),
                        },
                      ].map(({ val, icon: Icon, label }) => (
                        <button
                          key={val}
                          onClick={() => setTheme(val)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all ${theme === val ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"}`}
                        >
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
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-violet-400 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                      <Plane size={14} className="text-white" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {t("vacation.title")}
                    </h3>
                  </div>
                  <Toggle
                    on={vacation.enabled}
                    onToggle={handleToggleVacationMode}
                  />
                </div>
                <p className="text-xs text-slate-500 mb-4">
                  {t("vacation.description")}
                </p>
                <div className="transition-all duration-300">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        {t("vacation.startDate")}
                      </label>
                      <div className="relative">
                        <CalendarIcon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={vacation.startDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            setVacation((prev) => ({
                              ...prev,
                              startDate: e.target.value,
                            }))
                          }
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                        {t("vacation.endDate")}
                      </label>
                      <div className="relative">
                        <CalendarIcon
                          size={14}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="date"
                          value={vacation.endDate}
                          min={
                            vacation.startDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setVacation((prev) => ({
                              ...prev,
                              endDate: e.target.value,
                            }))
                          }
                          className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={vacation.message}
                    onChange={(e) =>
                      setVacation((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    onBlur={handleSaveVacationMessage}
                    rows={3}
                    placeholder={t("vacation.messagePlaceholder")}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs p-3 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />

                  {vacation.enabled && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                      <CheckCircle size={10} />
                      {t("vacation.active")}
                    </p>
                  )}
                </div>

                {vacationStatus && (
                  <p
                    className={`text-[10px] mt-2 flex items-center gap-1 ${vacationStatus.type === "success" ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {vacationStatus.type === "success" ? (
                      <CheckCircle size={10} />
                    ) : (
                      <AlertCircle size={10} />
                    )}
                    {vacationStatus.message}
                  </p>
                )}
              </div>
            </div>

            {/* DATA PRIVACY */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <Download size={14} className="text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("privacy.title")}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 mb-4">
                  {t("privacy.description")}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  <button
                    onClick={() => handleExportData("csv")}
                    disabled={isExporting}
                    className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}{" "}
                    {t("privacy.exportCsv")}
                  </button>
                  <button
                    onClick={() => handleExportData("json")}
                    disabled={isExporting}
                    className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-100 transition-all disabled:opacity-50"
                  >
                    {isExporting ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Download size={12} />
                    )}{" "}
                    {t("privacy.exportJson")}
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  {!showDeactivateConfirm ? (
                    <button
                      onClick={() => setShowDeactivateConfirm(true)}
                      className="w-full text-left group p-3 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <p className="text-sm font-bold text-rose-600 flex items-center gap-2">
                        <Power size={15} /> {t("privacy.deactivate")}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {t("privacy.deactivateDescription")}
                      </p>
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200">
                      <p className="text-xs font-semibold text-red-700 mb-3">
                        {t("privacy.confirmDeactivate")}
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleDeactivateAccount}
                          disabled={isDeactivating}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all"
                        >
                          {isDeactivating ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Power size={12} />
                          )}{" "}
                          {t("privacy.confirm")}
                        </button>
                        <button
                          onClick={() => setShowDeactivateConfirm(false)}
                          className="flex-1 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-300 transition-all"
                        >
                          {t("privacy.cancel")}
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
