"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Camera,
  X,
  Plus,
  CheckCircle,
  Save,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Shield,
  Eye,
  EyeOff,
  Lock,
  Monitor,
  MapPin,
  Globe,
  Moon,
  Sun,
  Laptop,
  Bell,
  Moon as MoonIcon,
  Download,
  Power,
  Clock,
} from "lucide-react";
import {
  RiUserLine,
  RiCameraLine,
  RiCloseLine,
  RiEditLine,
  RiSaveLine,
  RiShieldCheckLine,
  RiIdCardLine,
} from "react-icons/ri";
import { MdOutlineVerified } from "react-icons/md";
import { TbLanguage } from "react-icons/tb";
import { TbDeviceDesktop } from "react-icons/tb";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTenantProfile } from "./hooks/useTenantProfile";
import { useTenantSettings } from "./hooks/useTenantSettings";
import IdentityPage from "@/components/ui/modals/IdentityModal";
import { useCINStatus } from "../../(dashboard)/dashboard/owner/profile/hooks/useCINStatus";
import { IoChevronForward } from "react-icons/io5";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.25),0_8px_16px_-4px_rgba(0,0,0,0.30)]";
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(0,0,0,0.09)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45)]";

function VerifiedBadge() {
  const t = useTranslations("Profile");
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
      <MdOutlineVerified size={10} /> {t("verified")}
    </span>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0 ${
        on ? "bg-sky-600 dark:bg-sky-500" : "bg-slate-300 dark:bg-slate-600"
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

export default function TenantProfilePage() {
  const t = useTranslations("Profile");
  const tCommon = useTranslations("Common");

  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editingQuietHours, setEditingQuietHours] = useState(false);
  const [tempQuietHours, setTempQuietHours] = useState({
    start: "22:00",
    end: "07:00",
  });
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number | null>(
    null,
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Profile hook
  const {
    loading: profileLoading,
    saving,
    isEditing,
    firstName,
    lastName,
    username,
    email,
    phone,
    bio,
    languages,
    profilePictureUrl,
    emailVerified,
    phoneVerified,
    bioLength,
    bioMaxLength,
    uploadingPicture,
    showLanguageInput,
    newLanguage,
    fileInputRef,
    commonLanguages,
    usernameError,
    isCheckingUsername,
    usernameTouched,
    setFirstName,
    setLastName,
    setUsername,
    setUsernameTouched,
    setBio,
    setLanguages,
    setShowLanguageInput,
    setNewLanguage,
    addLanguage,
    removeLanguage,
    handleProfilePictureChange,
    removeProfilePicture,
    handleSave,
    handleEdit,
    handleCancel,
  } = useTenantProfile();

  // Settings hook
  const {
    loading: settingsLoading,
    security,
    passwordForm,
    passwordCriteria,
    theme,
    setTheme,
    updateLanguage,
    changePassword,
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
    preferredLocale,
  } = useTenantSettings();

  // CIN hook
  const {
    cinStatus,
    showCINModal,
    setShowCINModal,
    handleCINSubmission,
    currentUserId,
  } = useCINStatus();

  const loading = profileLoading || settingsLoading;

  const getStrengthLabelWithWidth = () => {
    const strength = passwordForm.strength;
    if (strength === 1)
      return {
        text: t("passwordStrength.veryWeak"),
        color: "#ef4444",
        width: "20%",
      };
    if (strength === 2)
      return {
        text: t("passwordStrength.weak"),
        color: "#f97316",
        width: "40%",
      };
    if (strength === 3)
      return {
        text: t("passwordStrength.medium"),
        color: "#eab308",
        width: "60%",
      };
    if (strength === 4)
      return {
        text: t("passwordStrength.strong"),
        color: "#22c55e",
        width: "80%",
      };
    if (strength === 5)
      return {
        text: t("passwordStrength.veryStrong"),
        color: "#10b981",
        width: "100%",
      };
    return {
      text: t("passwordStrength.veryWeak"),
      color: "#ef4444",
      width: "20%",
    };
  };

  const strengthInfo = getStrengthLabelWithWidth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      const msg = t("password.currentRequired");
      setPasswordError(msg);
      showToast("error", msg);
      return;
    }
    if (!passwordForm.newPassword) {
      const msg = t("password.newRequired");
      setPasswordError(msg);
      showToast("error", msg);
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      const msg = t("password.mismatch");
      setPasswordError(msg);
      showToast("error", msg);
      return;
    }
    if (!isPasswordValid) {
      const msg = t("password.weak");
      setPasswordError(msg);
      showToast("error", msg);
      return;
    }

    try {
      await changePassword();
      setPasswordError(null);
      setIsEditingPassword(false);
      showToast("success", t("password.updated"));
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      const errorMsg = error.message || t("password.updateError");
      setPasswordError(errorMsg);
      showToast("error", errorMsg);
      setPasswordForm((prev) => ({ ...prev, currentPassword: "" }));
    }
  };

  const cancelPasswordEdit = () => {
    setIsEditingPassword(false);
    setPasswordError(null);
    setPasswordForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handleSaveQuietHours = async () => {
    try {
      await updateQuietHours(tempQuietHours.start, tempQuietHours.end);
      setEditingQuietHours(false);
      showToast("success", t("quietHours.updated"));
    } catch (error: any) {
      showToast("error", error.message || t("quietHours.updateError"));
    }
  };

  const handleProfileSave = async () => {
    try {
      await handleSave();
      showToast("success", t("profile.updated"));
    } catch (error: any) {
      showToast("error", error.message || t("profile.updateError"));
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      showToast("success", t("sessions.revoked"));
    } catch (error: any) {
      showToast("error", error.message || t("sessions.revokeError"));
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    try {
      await exportUserData(format);
      showToast(
        "success",
        t("export.success", { format: format.toUpperCase() }),
      );
    } catch (error: any) {
      showToast("error", error.message || t("export.error"));
    }
  };

  const handleDeactivateAccount = async () => {
    setShowDeactivateConfirm(false);
    try {
      await deactivateAccount();
      showToast("success", t("deactivate.success"));
    } catch (error: any) {
      showToast("error", error.message || t("deactivate.error"));
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    try {
      await updateLanguage(locale);
      showToast("success", t("language.updated"));
    } catch (error: any) {
      showToast("error", error.message || t("language.updateError"));
    }
  };

  const sendVerificationReminder = async () => {
    setSendingReminder(true);
    try {
      const res = await fetch("/api/admin/verification-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t("verification.reminderMessage") }),
      });
      if (res.ok) {
        setReminderSent(true);
        showToast("success", t("verification.reminderSent"));
      }
    } catch (error) {
      showToast("error", tCommon("error.general"));
    } finally {
      setSendingReminder(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <LoadingSpinner
          variant="spinner"
          size="lg"
          color="primary"
          text={tCommon("loading")}
          speed="normal"
        />
      </div>
    );
  }

  const inputBase = (disabled: boolean) =>
    `w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-base transition-all font-medium text-slate-900 dark:text-white outline-none ${
      disabled
        ? "opacity-60 cursor-default"
        : "focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400"
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
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
      <TenantHeader />

      {/* SWITCHER */}
      <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-6">
        <div className="flex justify-center">
          <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 rounded-2xl p-1 w-full max-w-2xl">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "profile"
                  ? "bg-purple-200/20 dark:bg-purple-500/20 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-500/30"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <RiUserLine size={16} />
              {t("tabs.personalInfo")}
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === "security"
                  ? "bg-purple-200/20 dark:bg-purple-500/20 text-blue-700 dark:text-sky-400 shadow-sm border border-blue-500/30"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              <RiShieldCheckLine size={16} />
              {t("tabs.security")}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-8 w-full">
        {/* TAB PROFIL */}
        {activeTab === "profile" && (
          <>
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600" />
              <div className="p-7">
                <div className="relative flex items-center justify-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("personalInfo.title")}
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="absolute right-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sky-600 dark:text-sky-400 text-sm font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                    >
                      <RiEditLine size={14} /> {t("actions.edit")}
                    </button>
                  )}
                </div>
                <div className="w-20 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-full mx-auto -translate-y-5.5" />

                {/* AVATAR SECTION */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 mb-6 border-b border-slate-100 dark:border-slate-800 -mt-6">
                  <div className="relative group flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-lg">
                      {profilePictureUrl ? (
                        <img
                          src={
                            profilePictureUrl.startsWith("blob:")
                              ? profilePictureUrl
                              : pipAvatar(profilePictureUrl)
                          }
                          alt="Profil"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 flex items-center justify-center">
                          <RiUserLine className="text-white text-4xl" />
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-md text-sky-600 dark:text-sky-400 hover:bg-sky-50 transition-colors"
                        >
                          <RiCameraLine size={14} />
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/jpg"
                          onChange={handleProfilePictureChange}
                          className="hidden"
                        />
                      </>
                    )}
                    {uploadingPicture && (
                      <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    {!isEditing ? (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {profilePictureUrl
                            ? t("avatar.hasPhoto")
                            : t("avatar.noPhoto")}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {t("avatar.formatInfo")}
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                          >
                            <RiCameraLine size={12} /> {t("actions.change")}
                          </button>
                          {profilePictureUrl && (
                            <button
                              onClick={removeProfilePicture}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
                            >
                              <RiCloseLine size={12} /> {t("actions.delete")}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* FORMULAIRE */}
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("form.firstName")}
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className={inputBase(!isEditing)}
                        placeholder={t("placeholders.firstName")}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("form.lastName")}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className={inputBase(!isEditing)}
                        placeholder={t("placeholders.lastName")}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                      {t("form.username")}
                    </label>
                    <div>
                      <input
                        type="text"
                        value={username || ""}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          setUsernameTouched(true);
                        }}
                        disabled={!isEditing}
                        className={`${inputBase(!isEditing)} ${usernameError ? "border-red-500" : ""}`}
                        placeholder={t("placeholders.username")}
                      />
                      {isCheckingUsername && (
                        <p className="text-xs text-slate-400 mt-1">
                          {t("username.checking")}
                        </p>
                      )}
                      {usernameError && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <AlertCircle size={12} /> {usernameError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("form.email")}
                      </label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className={inputBase(true)}
                      />
                      {emailVerified && <VerifiedBadge />}
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("form.phone")}
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        disabled
                        className={inputBase(true)}
                        placeholder={t("placeholders.phone")}
                      />
                      {phoneVerified && <VerifiedBadge />}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center justify-between mb-1.5">
                      <span>{t("form.bio")}</span>
                      <span className="text-slate-400">
                        {bioLength} / {bioMaxLength}
                      </span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) =>
                        setBio(e.target.value.slice(0, bioMaxLength))
                      }
                      disabled={!isEditing}
                      rows={3}
                      className={`${inputBase(!isEditing)} resize-none`}
                      placeholder={t("placeholders.bio")}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
                      {t("form.languages")}
                    </label>
                    <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[52px]">
                      {languages.map((lang) => (
                        <span
                          key={lang}
                          className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm"
                        >
                          {lang}
                          {isEditing && (
                            <button
                              onClick={() => removeLanguage(lang)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                      {isEditing &&
                        (showLanguageInput ? (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={newLanguage}
                              onChange={(e) => setNewLanguage(e.target.value)}
                              className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm bg-white"
                            >
                              <option value="">{t("actions.select")}</option>
                              {commonLanguages
                                .filter((l) => !languages.includes(l))
                                .map((l) => (
                                  <option key={l} value={l}>
                                    {l}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => addLanguage(newLanguage)}
                              disabled={!newLanguage}
                              className="px-2 py-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 text-white rounded-lg text-sm font-semibold"
                            >
                              {t("actions.add")}
                            </button>
                            <button
                              onClick={() => setShowLanguageInput(false)}
                              className="px-2 py-1.5 bg-slate-200 rounded-lg text-sm font-semibold"
                            >
                              {t("actions.cancel")}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowLanguageInput(true)}
                            className="px-3 py-1.5 border border-dashed border-sky-300 rounded-xl text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />{" "}
                            {t("actions.addLanguage")}
                          </button>
                        ))}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={handleProfileSave}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700 flex items-center justify-center gap-2 transition-all"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        {t("actions.save")}
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        {t("actions.cancel")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!isEditing && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  {t("security.prompt")}
                </p>
                <button
                  onClick={() => setActiveTab("security")}
                  className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm hover:underline"
                >
                  {t("security.goToSecurity")} <IoChevronForward />
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB SÉCURITÉ & CONFIDENTIALITÉ */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* MOT DE PASSE */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-500 to-purple-600" />
              <div className="p-7">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("password.title")}
                  </h2>
                  <div className="w-20 h-1 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 rounded-full mx-auto -translate-y-0.5" />
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  {passwordError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2">
                      <AlertCircle size={16} className="text-red-500" />
                      <p className="text-sm text-red-600">{passwordError}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                      {t("password.current")}
                    </label>
                    <div className="relative">
                      <Lock
                        size={16}
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
                        className={`${inputBase(false)} pl-9 pr-9`}
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                      >
                        {passwordForm.showCurrent ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("password.new")}
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
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
                          className={`${inputBase(false)} pl-9 pr-9`}
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                        >
                          {passwordForm.showNew ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        {t("password.confirm")}
                      </label>
                      <div className="relative">
                        <Lock
                          size={16}
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
                          className={`${inputBase(false)} pl-9 pr-9`}
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                        >
                          {passwordForm.showConfirm ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && !passwordsMatch && (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ {t("password.mismatch")}
                        </p>
                      )}
                    </div>
                  </div>

                  {passwordForm.newPassword && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: strengthInfo.width,
                              backgroundColor: strengthInfo.color,
                            }}
                          />
                        </div>
                        <span
                          className="text-xs font-bold"
                          style={{ color: strengthInfo.color }}
                        >
                          {strengthInfo.text}
                        </span>
                      </div>
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-xs font-bold text-slate-500 mb-2 uppercase">
                          {t("passwordStrength.security")}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${passwordCriteria.length ? "bg-emerald-500" : "bg-slate-300"}`}
                            >
                              {passwordCriteria.length && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${passwordCriteria.length ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              {t("passwordStrength.minLength")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${passwordCriteria.uppercase ? "bg-emerald-500" : "bg-slate-300"}`}
                            >
                              {passwordCriteria.uppercase && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${passwordCriteria.uppercase ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              {t("passwordStrength.uppercase")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${passwordCriteria.number ? "bg-emerald-500" : "bg-slate-300"}`}
                            >
                              {passwordCriteria.number && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${passwordCriteria.number ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              {t("passwordStrength.number")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-4 h-4 rounded-full ${passwordCriteria.special ? "bg-emerald-500" : "bg-slate-300"}`}
                            >
                              {passwordCriteria.special && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                            </div>
                            <span
                              className={`text-xs ${passwordCriteria.special ? "text-emerald-600" : "text-slate-500"}`}
                            >
                              {t("passwordStrength.special")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={
                        !passwordForm.currentPassword ||
                        !isPasswordValid ||
                        passwordForm.isSubmitting
                      }
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700 flex items-center justify-center gap-2 transition-all"
                    >
                      {passwordForm.isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RiSaveLine size={16} />
                      )}
                      {t("actions.save")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordForm((prev) => ({
                          ...prev,
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        }));
                        setPasswordError(null);
                      }}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RiCloseLine size={16} /> {t("actions.cancel")}
                    </button>
                  </div>

                  <div className="text-center mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <a
                      href={`/${preferredLocale}/forgot-password`}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      {t("password.forgot")}
                    </a>
                  </div>
                </form>
              </div>
            </div>

            {/* SESSIONS ACTIVES + VÉRIFICATION IDENTITÉ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {security.sessions.length > 0 && (
                <div
                  className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
                >
                  <div className="h-1 bg-gradient-to-r from-sky-500 to-purple-600" />
                  <div className="p-7">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <Monitor className="text-white text-xl" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                          {t("sessions.title")}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {t("sessions.subtitle")}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {security.sessions.map((s: any) => (
                        <div
                          key={s.id}
                          className={`flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700 ${card3d}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                s.isCurrent
                                  ? "bg-sky-100 dark:bg-sky-900/30"
                                  : "bg-slate-100 dark:bg-slate-800"
                              }`}
                            >
                              <TbDeviceDesktop
                                className={`text-xl ${
                                  s.isCurrent
                                    ? "text-sky-600 dark:text-sky-400"
                                    : "text-slate-400 dark:text-slate-500"
                                }`}
                              />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                  {s.device || t("sessions.unknownDevice")}
                                </p>
                                {s.isCurrent && (
                                  <span className="text-[9px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                                    {t("sessions.current")}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <MapPin
                                  size={10}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {s.location || t("sessions.unknownLocation")}{" "}
                                  · {s.ip || t("sessions.unknownIp")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors border border-rose-200 dark:border-rose-800"
                            >
                              {t("sessions.revoke")}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VÉRIFICATION IDENTITÉ */}
              <div
                className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
              >
                <div
                  className={`h-1 bg-gradient-to-r ${
                    cinStatus.status === "VALIDATED"
                      ? "from-emerald-400 to-teal-500"
                      : cinStatus.status === "REJECTED"
                        ? "from-rose-400 to-red-500"
                        : "from-sky-500 to-purple-600"
                  }`}
                />
                <div className="p-7">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm ${
                        cinStatus.status === "VALIDATED"
                          ? "from-emerald-400 to-teal-500"
                          : cinStatus.status === "REJECTED"
                            ? "from-rose-400 to-red-500"
                            : "from-sky-500 to-purple-600"
                      }`}
                    >
                      <RiShieldCheckLine className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t("verification.title")}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t("verification.subtitle")}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        {t("verification.status")}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[9px] font-semibold uppercase tracking-widest border ${
                          cinStatus.status === "VALIDATED"
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                            : cinStatus.status === "REJECTED"
                              ? "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40"
                              : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                        }`}
                      >
                        {cinStatus.status === "VALIDATED"
                          ? t("verification.verified")
                          : cinStatus.status === "REJECTED"
                            ? t("verification.rejected")
                            : t("verification.pending")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-8 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <RiIdCardLine className="text-slate-400 dark:text-slate-500 text-lg" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          {t("verification.cin")}
                        </p>
                        {cinStatus.status === "REJECTED" &&
                          cinStatus.rejectionReason && (
                            <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">
                              {t("verification.rejectionReason")} :{" "}
                              {cinStatus.rejectionReason}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed mb-4">
                    {t("verification.required")}
                  </p>

                  {cinStatus.status === "VALIDATED" && (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed"
                    >
                      {t("verification.verifiedButton")}
                    </button>
                  )}

                  {cinStatus.status === "PENDING" && (
                    <button
                      onClick={sendVerificationReminder}
                      disabled={sendingReminder || reminderSent}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm flex items-center justify-center gap-2"
                    >
                      {sendingReminder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : reminderSent ? (
                        `✓ ${t("verification.reminderSent")}`
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          {t("verification.reminderButton")}
                        </>
                      )}
                    </button>
                  )}

                  {waitTimeRemaining !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          {t("verification.waitMessage", {
                            hours: waitTimeRemaining,
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {reminderSent && !waitTimeRemaining && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          {t("verification.reminderSentMessage")}
                        </p>
                      </div>
                    </div>
                  )}

                  {(!cinStatus.status || cinStatus.status === "REJECTED") && (
                    <button
                      onClick={() => setShowCINModal(true)}
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-600 hover:via-indigo-600 hover:to-purple-700 text-white transition-all"
                    >
                      <RiCameraLine className="w-4 h-4 inline mr-2" />
                      {t("verification.startButton")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CIN Upload Modal */}
      {showCINModal && (
        <IdentityPage
          onClose={() => setShowCINModal(false)}
          onSuccess={async (data) => {
            await handleCINSubmission(data.rectoFile, data.versoFile);
          }}
          userId={currentUserId}
          initialRejectionReason={cinStatus.rejectionReason}
        />
      )}
    </div>
  );
}
