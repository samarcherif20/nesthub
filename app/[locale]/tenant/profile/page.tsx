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
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">
      <MdOutlineVerified size={10} /> Vérifié
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
      return { text: "Très faible", color: "#ef4444", width: "20%" };
    if (strength === 2)
      return { text: "Faible", color: "#f97316", width: "40%" };
    if (strength === 3)
      return { text: "Moyen", color: "#eab308", width: "60%" };
    if (strength === 4) return { text: "Fort", color: "#22c55e", width: "80%" };
    if (strength === 5)
      return { text: "Très fort", color: "#10b981", width: "100%" };
    return { text: "Très faible", color: "#ef4444", width: "20%" };
  };

  const strengthInfo = getStrengthLabelWithWidth();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!passwordForm.currentPassword) {
      setPasswordError("Veuillez entrer votre mot de passe actuel");
      showToast("error", "Veuillez entrer votre mot de passe actuel");
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError("Veuillez entrer un nouveau mot de passe");
      showToast("error", "Veuillez entrer un nouveau mot de passe");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      showToast("error", "Les mots de passe ne correspondent pas");
      return;
    }
    if (!isPasswordValid) {
      setPasswordError("Le nouveau mot de passe n'est pas assez fort");
      showToast("error", "Le nouveau mot de passe n'est pas assez fort");
      return;
    }

    try {
      await changePassword();
      setPasswordError(null);
      setIsEditingPassword(false);
      showToast("success", "Mot de passe mis à jour avec succès !");
      setPasswordForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error: any) {
      const errorMsg = error.message || "Mot de passe actuel incorrect";
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
      showToast("success", "Heures calmes mises à jour");
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleProfileSave = async () => {
    try {
      await handleSave();
      showToast("success", "Profil mis à jour avec succès !");
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors de la mise à jour");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await revokeSession(sessionId);
      showToast("success", "Session révoquée avec succès");
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors de la révocation");
    }
  };

  const handleExportData = async (format: "csv" | "json") => {
    try {
      await exportUserData(format);
      showToast("success", `Données exportées en ${format.toUpperCase()}`);
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors de l'exportation");
    }
  };

  const handleDeactivateAccount = async () => {
    setShowDeactivateConfirm(false);
    try {
      await deactivateAccount();
      showToast("success", "Votre compte a été désactivé avec succès");
    } catch (error: any) {
      showToast("error", error.message || "Erreur lors de la désactivation");
    }
  };

  const handleUpdateLanguage = async (locale: string) => {
    try {
      await updateLanguage(locale);
      showToast("success", "Langue mise à jour avec succès");
    } catch (error: any) {
      showToast(
        "error",
        error.message || "Erreur lors du changement de langue",
      );
    }
  };
  const sendVerificationReminder = async () => {
    setSendingReminder(true);
    try {
      // Appel API vers ton endpoint de rappel
      const res = await fetch("/api/admin/verification-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Demande de vérification d'identité" }),
      });
      if (res.ok) {
        setReminderSent(true);
        showToast("success", "Rappel envoyé à l'administrateur");
      }
    } catch (error) {
      showToast("error", "Erreur lors de l'envoi du rappel");
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
          text="Chargement..."
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
      <TenantHeader></TenantHeader>
      {/* SWITCHER - PLUS LONG, BOUTON SÉLECTIONNÉ TRANSPARENT */}
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
              Informations personnelles
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
              Sécurité & confidentialité
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
                {/* HEADER AVEC TITRE CENTRÉ */}
                <div className="relative flex items-center justify-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Informations personnelles
                  </h2>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="absolute right-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sky-600 dark:text-sky-400 text-sm font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all"
                    >
                      <RiEditLine size={14} /> Modifier
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
                            ? "Photo de profil"
                            : "Aucune photo"}
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          JPG, PNG ou GIF. Taille max 5MB.
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors flex items-center gap-1"
                          >
                            <RiCameraLine size={12} /> Changer
                          </button>
                          {profilePictureUrl && (
                            <button
                              onClick={removeProfilePicture}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors flex items-center gap-1"
                            >
                              <RiCloseLine size={12} /> Supprimer
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
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        disabled={!isEditing}
                        className={inputBase(!isEditing)}
                        placeholder="Prénom"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        disabled={!isEditing}
                        className={inputBase(!isEditing)}
                        placeholder="Nom"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1.5 block">
                      Nom d'utilisateur
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
                        placeholder="nom_utilisateur"
                      />
                      {isCheckingUsername && (
                        <p className="text-xs text-slate-400 mt-1">
                          Vérification...
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
                        Email
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
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        disabled
                        className={inputBase(true)}
                        placeholder="+216 00 000 000"
                      />
                      {phoneVerified && <VerifiedBadge />}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 flex items-center justify-between mb-1.5">
                      <span>Biographie</span>
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
                      placeholder="Parlez-nous un peu de vous..."
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2 block">
                      Langues parlées
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
                              <option value="">Sélectionner...</option>
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
                              Ajouter
                            </button>
                            <button
                              onClick={() => setShowLanguageInput(false)}
                              className="px-2 py-1.5 bg-slate-200 rounded-lg text-sm font-semibold"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setShowLanguageInput(true)}
                            className="px-3 py-1.5 border border-dashed border-sky-300 rounded-xl text-sm font-semibold text-sky-600 hover:bg-sky-50 transition-all flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Ajouter une langue
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
                        Enregistrer
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* PHRASE VERS SÉCURITÉ */}
            {!isEditing && (
              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Vous souhaitez modifier votre mot de passe ou vérifier votre
                  identité ?
                </p>
                <button
                  onClick={() => setActiveTab("security")}
                  className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm hover:underline"
                >
                  Aller à Sécurité & confidentialité <IoChevronForward />
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB SÉCURITÉ & CONFIDENTIALITÉ */}
        {activeTab === "security" && (
          <div className="space-y-6">
            {/* MOT DE PASSE - FORMULAIRE TOUJOURS VISIBLE */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-500 to-purple-600" />
              <div className="p-7">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    Mot de passe
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
                      Mot de passe actuel
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
                        Nouveau mot de passe
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
                        Confirmation
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
                          ⚠️ Les mots de passe ne correspondent pas
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
                          Sécurité du mot de passe
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
                              Au moins 8 caractères
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
                              Majuscule et minuscule
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
                              Au moins un chiffre
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
                              Caractère spécial
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
                      Enregistrer
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
                      <RiCloseLine size={16} /> Annuler
                    </button>
                  </div>

                  {/* LIEN MOT DE PASSE OUBLIÉ */}
                  <div className="text-center mt-4 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <a
                      href={`/${preferredLocale}/forgot-password`}
                      className="text-xs text-sky-600 dark:text-sky-400 hover:underline"
                    >
                      Mot de passe oublié ?
                    </a>
                  </div>
                </form>
              </div>
            </div>

            {/* SESSIONS ACTIVES + VÉRIFICATION IDENTITÉ - CÔTE À CÔTE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SESSIONS ACTIVES */}
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
                          Sessions actives
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Gérez vos sessions connectées
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
                                  {s.device || "Appareil inconnu"}
                                </p>
                                {s.isCurrent && (
                                  <span className="text-[9px] font-bold bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">
                                    Actuelle
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <MapPin
                                  size={10}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {s.location || "Localisation inconnue"} ·{" "}
                                  {s.ip || "IP inconnue"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!s.isCurrent && (
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors border border-rose-200 dark:border-rose-800"
                            >
                              Révoquer
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
                        Vérification d'identité
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Sécurisez votre profil et débloquez toutes les
                        fonctionnalités
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        Statut
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
                          ? "✓ Vérifié"
                          : cinStatus.status === "REJECTED"
                            ? "✗ Rejeté"
                            : " En attente"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-8 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                        <RiIdCardLine className="text-slate-400 dark:text-slate-500 text-lg" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">
                          Carte d'identité nationale (CIN)
                        </p>
                        {cinStatus.status === "REJECTED" &&
                          cinStatus.rejectionReason && (
                            <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">
                              Motif : {cinStatus.rejectionReason}
                            </p>
                          )}
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed mb-4">
                    La vérification d'identité est obligatoire pour réserver des
                    propriétés sur NESTHUB.
                  </p>

                  {cinStatus.status === "VALIDATED" && (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed"
                    >
                      ✓ Identité vérifiée
                    </button>
                  )}

                  {cinStatus.status === "PENDING" && (
                    <button
                      onClick={() => {
                        // Appel à sendVerificationReminder
                        if (typeof sendVerificationReminder === "function") {
                          sendVerificationReminder();
                        }
                      }}
                      disabled={sendingReminder || reminderSent}
                      className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm flex items-center justify-center gap-2"
                    >
                      {sendingReminder ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : reminderSent ? (
                        "✓ Rappel envoyé"
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          Envoyer un rappel
                        </>
                      )}
                    </button>
                  )}

                  {/* Message d'attente */}
                  {waitTimeRemaining !== null && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Vous avez déjà envoyé un rappel récemment. Veuillez
                          patienter {waitTimeRemaining} heures.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Message de confirmation */}
                  {reminderSent && !waitTimeRemaining && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-400">
                          Un rappel a été envoyé à l'administrateur. Vous serez
                          notifié une fois votre identité vérifiée.
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
                      Commencer la vérification
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PHRASE APRÈS LES CARTES */}
            <div className="text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                Vous souhaitez modifier votre mot de passe ou vérifier votre
                identité ?
              </p>
              <button
                onClick={() => setActiveTab("security")}
                className="inline-flex items-center gap-2 text-sky-600 dark:text-sky-400 font-semibold text-sm hover:underline"
              >
                Aller à Sécurité & confidentialité <IoChevronForward />
              </button>
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
