"use client";

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import {
  Shield,
  CreditCard,
  Plus,
  Monitor,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Laptop,
  Plane,
  Download,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  Loader2,
} from "lucide-react";

import {
  RiShieldCheckLine,
  RiLockPasswordLine,
  RiSmartphoneLine,
  RiGlobalLine,
  RiMoonLine,
  RiSunLine,
  RiPlaneLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiEyeOffLine,
  RiCheckLine,
  RiCloseLine,
  RiBankCardLine,
  RiBankLine,
  RiAddLine,
  RiSettings4Line,
  RiMapPinLine,
} from "react-icons/ri";
import { GoShieldCheck } from "react-icons/go";
import { TbDeviceDesktop } from "react-icons/tb";
import { useSettings } from "./hooks/useSettings";

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
        on ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"
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
  action,
}: {
  icon: React.ElementType;
  title: string;
  grad: string;
  action?: React.ReactNode;
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
      {action}
    </div>
  );
}

export default function SettingsPage() {
  const t = useTranslations("settings");
  const toastT = useTranslations("toast");

  const {
    loading,
    saving,
    profile,
    security,
    vacation,
    passwordForm,
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
    getStrengthLabel,
  } = useSettings();

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse shadow-lg">
            <RiSettings4Line className="text-white text-xl" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  const strength = getStrengthLabel();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await changePassword();
      toast.success(toastT("password_success"));
    } catch (error: any) {
      toast.error(error.message || toastT("password_error"));
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    try {
      await updateLanguage(locale);
      toast.success(toastT("language_success"));
    } catch (error: any) {
      toast.error(error.message || toastT("language_error"));
    }
  };

  const handleToggleVacationMode = async () => {
    try {
      await toggleVacationMode();
      toast.success(
        vacation.enabled
          ? toastT("vacation_disabled")
          : toastT("vacation_enabled"),
      );
    } catch (error: any) {
      toast.error(error.message || toastT("vacation_error"));
    }
  };

  const handleSaveVacationMessage = async () => {
    try {
      await saveVacationMessage();
      toast.success(toastT("vacation_saved"));
    } catch (error: any) {
      toast.error(error.message || toastT("vacation_save_error"));
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      toast.success(toastT("session_revoked"));
    } catch (error: any) {
      toast.error(error.message || toastT("session_error"));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-background-light dark:bg-background-dark">
      {/* ── PAGE HEADER ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-7">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("page_title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
            {t("page_description")}
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT COL: Password + Payment ─────────────────────── */}
          <div className="lg:col-span-8 space-y-7">
            {/* PASSWORD CARD - Security card removed, only password */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600" />
              <div className="p-7">
                <SectionHeader
                  icon={RiShieldCheckLine}
                  title={t("security_title")}
                  grad="from-indigo-500 to-violet-600"
                />

                {/* password only */}
                <div
                  className={`rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 overflow-hidden ${card3d}`}
                >
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                        <RiLockPasswordLine className="text-indigo-600 dark:text-indigo-400 text-lg" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 dark:text-white">
                          {t("password_label")}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t("password_description")}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setPasswordForm((p) => ({ ...p, open: !p.open }))
                      }
                      className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      {passwordForm.open
                        ? t("password_cancel")
                        : t("password_change")}
                    </button>
                  </div>

                  {passwordForm.open && (
                    <form
                      onSubmit={handleChangePassword}
                      className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-700 pt-4"
                    >
                      {/* current */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                          {t("password_current")}
                        </label>
                        <div className="relative">
                          <RiLockPasswordLine
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={14}
                          />
                          <input
                            type={
                              passwordForm.showCurrent ? "text" : "password"
                            }
                            value={passwordForm.currentPassword}
                            onChange={(e) =>
                              setPasswordForm((p) => ({
                                ...p,
                                currentPassword: e.target.value,
                              }))
                            }
                            required
                            className="w-full pl-8 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border rounded-xl outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 border-slate-200 dark:border-slate-700"
                            placeholder={t("password_current_placeholder")}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordForm((p) => ({
                                ...p,
                                showCurrent: !p.showCurrent,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {passwordForm.showCurrent ? (
                              <RiEyeOffLine size={15} />
                            ) : (
                              <RiEyeLine size={15} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* new password */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                          {t("password_new")}
                        </label>
                        <div className="relative">
                          <RiLockPasswordLine
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={14}
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
                            required
                            className="w-full pl-8 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border rounded-xl outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 border-slate-200 dark:border-slate-700"
                            placeholder={t("password_new_placeholder")}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordForm((p) => ({
                                ...p,
                                showNew: !p.showNew,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {passwordForm.showNew ? (
                              <RiEyeOffLine size={15} />
                            ) : (
                              <RiEyeLine size={15} />
                            )}
                          </button>
                        </div>
                        {passwordForm.newPassword && (
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${(passwordForm.strength / 5) * 100}%`,
                                    backgroundColor: strength.color,
                                  }}
                                />
                              </div>
                              <span
                                className="text-[10px] font-bold"
                                style={{ color: strength.color }}
                              >
                                {strength.text}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* confirm */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                          {t("password_confirm")}
                        </label>
                        <div className="relative">
                          <RiLockPasswordLine
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            size={14}
                          />
                          <input
                            type={
                              passwordForm.showConfirm ? "text" : "password"
                            }
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm((p) => ({
                                ...p,
                                confirmPassword: e.target.value,
                              }))
                            }
                            required
                            className={`w-full pl-8 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border rounded-xl outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 ${
                              passwordForm.confirmPassword && !passwordsMatch
                                ? "border-red-400"
                                : passwordForm.confirmPassword && passwordsMatch
                                  ? "border-emerald-400"
                                  : "border-slate-200 dark:border-slate-700"
                            }`}
                            placeholder={t("password_confirm_placeholder")}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setPasswordForm((p) => ({
                                ...p,
                                showConfirm: !p.showConfirm,
                              }))
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            {passwordForm.showConfirm ? (
                              <RiEyeOffLine size={15} />
                            ) : (
                              <RiEyeLine size={15} />
                            )}
                          </button>
                        </div>
                        {passwordForm.confirmPassword && !passwordsMatch && (
                          <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                            <RiCloseLine size={13} /> {t("password_mismatch")}
                          </p>
                        )}
                      </div>

                      {/* tips */}
                      <div className="bg-indigo-50 dark:bg-indigo-900/15 rounded-xl p-3 border border-indigo-100 dark:border-indigo-800/40">
                        <p className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 mb-1.5 uppercase tracking-wider">
                          {t("security_tips_title")}
                        </p>
                        <ul className="text-[10px] text-indigo-600 dark:text-indigo-300 space-y-0.5">
                          {[
                            t("security_tips_chars"),
                            t("security_tips_case"),
                            t("security_tips_symbols"),
                          ].map((tip) => (
                            <li key={tip} className="flex items-center gap-1.5">
                              <RiCheckLine size={10} />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="submit"
                        disabled={!isPasswordValid || passwordForm.isSubmitting}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                          isPasswordValid && !passwordForm.isSubmitting
                            ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40 active:scale-95"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                        }`}
                      >
                        {passwordForm.isSubmitting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : passwordForm.success ? (
                          <>
                            <GoShieldCheck size={14} /> {t("password_updated")}
                          </>
                        ) : (
                          <>
                            <RiShieldCheckLine size={14} />{" "}
                            {t("password_update")}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* SESSIONS */}
                {security.sessions.length > 0 && (
                  <div className="mt-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                      {t("sessions_title")} — {security.sessions.length}
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
                            className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 hover:-translate-y-0.5 transition-all ${card3d}`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                  s.isCurrent
                                    ? "bg-indigo-100 dark:bg-indigo-900/30"
                                    : "bg-slate-100 dark:bg-slate-800"
                                }`}
                              >
                                <DevIcon
                                  className={`text-xl ${s.isCurrent ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {s.device || t("device_unknown")}
                                  </p>
                                  {s.isCurrent && (
                                    <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800/40">
                                      {t("current_badge")}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <RiMapPinLine
                                    size={10}
                                    className="text-slate-400"
                                  />
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                    {s.location || t("location_unknown")} ·{" "}
                                    {s.ip || t("ip_unknown")}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {!s.isCurrent && (
                              <button
                                onClick={() => handleRevokeSession(s.id)}
                                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors border border-rose-200 dark:border-rose-800/40"
                              >
                                {t("revoke_button")}
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

            {/* PAYMENT CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500" />
              <div className="p-7">
                <SectionHeader
                  icon={RiBankCardLine}
                  title={t("payment_title")}
                  grad="from-purple-500 to-pink-500"
                  action={
                    <button
                      onClick={() => toast.info(toastT("coming_soon"))}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-full text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                    >
                      <RiAddLine size={14} /> {t("payment_add")}
                    </button>
                  }
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* existing card */}
                  <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-xl overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-8">
                        <RiBankCardLine className="text-3xl opacity-80" />
                        <span className="text-xs uppercase tracking-wider font-bold opacity-70">
                          {t("payment_visa")}
                        </span>
                      </div>
                      <p className="text-lg font-mono tracking-widest mb-3">
                        •••• •••• •••• 4242
                      </p>
                      <div className="flex justify-between items-end">
                        <p className="text-xs opacity-60">
                          {t("payment_expires")} 09/26
                        </p>
                        <span className="text-[10px] font-bold bg-white/15 px-2.5 py-1 rounded-full uppercase tracking-wider">
                          {t("payment_primary")}
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-50 rounded-t-2xl" />
                  </div>

                  {/* add bank */}
                  <button
                    onClick={() => toast.info(toastT("coming_soon"))}
                    className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center p-6 text-slate-400 dark:text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-all group cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-all">
                      <RiBankLine className="text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors" />
                    </div>
                    <p className="text-sm font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {t("payment_bank_transfer")}
                    </p>
                    <p className="text-xs mt-0.5">{t("payment_configure")}</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COL ────────────────────────────────────────── */}
          <aside className="lg:col-span-4 space-y-6">
            {/* PREFERENCES */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-400 to-blue-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shadow-sm">
                    <RiGlobalLine className="text-white text-sm" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("preferences_title")}
                  </h3>
                </div>

                <div className="space-y-5">
                  {/* language */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                      {t("language_label")}
                    </label>
                    <select
                      value={profile.preferredLocale}
                      onChange={(e) => handleUpdateLanguage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm px-3 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all"
                    >
                      <option value="fr">{t("language_fr")}</option>
                      <option value="en">{t("language_en")}</option>
                      <option value="ar">{t("language_ar")}</option>
                    </select>
                  </div>

                  {/* theme */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                      {t("theme_label")}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          val: "light",
                          icon: RiSunLine,
                          label: t("theme_light"),
                        },
                        {
                          val: "dark",
                          icon: RiMoonLine,
                          label: t("theme_dark"),
                        },
                        { val: "system", icon: Laptop, label: t("theme_auto") },
                      ].map(({ val, icon: Icon, label }) => (
                        <button
                          key={val}
                          onClick={() => setTheme(val)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                            theme === val
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                              : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-sm">
                      <RiPlaneLine className="text-white text-sm" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {t("vacation_title")}
                    </h3>
                  </div>
                  <Toggle
                    on={vacation.enabled}
                    onToggle={handleToggleVacationMode}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {t("vacation_description")}
                </p>
                <div
                  className={`transition-opacity ${vacation.enabled ? "opacity-100" : "opacity-50 pointer-events-none"}`}
                >
                  <textarea
                    value={vacation.message}
                    onChange={(e) =>
                      setVacation((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    onBlur={handleSaveVacationMessage}
                    disabled={!vacation.enabled || saving}
                    rows={3}
                    placeholder={t("vacation_placeholder")}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs p-3 resize-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* DATA PRIVACY */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm">
                    <RiDownloadLine className="text-white text-sm" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {t("privacy_title")}
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  {t("privacy_description")}
                </p>

                <div className="grid grid-cols-2 gap-2 mb-6">
                  {["CSV", "JSON"].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => toast.info(toastT("coming_soon"))}
                      className="py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RiDownloadLine size={12} /> {fmt}
                    </button>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => toast.info(toastT("coming_soon"))}
                    className="w-full text-left group p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <p className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      <RiDeleteBinLine size={15} />{" "}
                      {t("privacy_delete_account")}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                      {t("privacy_delete_warning")}
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
