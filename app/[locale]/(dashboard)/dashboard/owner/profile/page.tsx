"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Shield,
  Camera,
  X,
  Plus,
  CheckCircle,
  Award,
  Clock,
  IdCard,
  XCircle,
  Edit2,
  Save,
  X as XIcon,
  Loader2,
  Home,
  Calendar,
  TrendingUp,
  DollarSign,
  Star,
  HomeIcon,
  Key,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import {
  RiUserLine,
  RiShieldCheckLine,
  RiCameraLine,
  RiAwardLine,
  RiTimeLine,
  RiIdCardLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiEditLine,
  RiSaveLine,
  RiStarLine,
  RiMedalLine,
  RiVerifiedBadgeLine,
  RiUserHeartLine,
} from "react-icons/ri";
import { MdOutlineVerified } from "react-icons/md";
import { TbLanguage } from "react-icons/tb";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useProfile } from "./hooks/useProfile";
// Add at the top with other imports
import { useCINStatus } from "./hooks/useCINStatus";
import IdentityPage from "@/components/ui/modals/IdentityModal";
const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(0,0,0,0.09)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.25),0_8px_16px_-4px_rgba(0,0,0,0.30)]";

function Field({ label, icon: Icon, children, badge }: any) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Icon size={10} /> {label}
        </label>
        {badge}
      </div>
      {children}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
      <MdOutlineVerified size={10} /> Vérifié
    </span>
  );
}

function TrustBar({ score }: { score: number }) {
  const milestones = [
    { label: "Nouveau", threshold: 0 },
    { label: "Fiable", threshold: 40 },
    { label: "Expert", threshold: 70 },
    { label: "Superhôte", threshold: 90 },
  ];
  return (
    <div>
      <div className="overflow-hidden h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-2">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-700"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex justify-between text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {milestones.map((m) => (
          <span
            key={m.label}
            className={
              score >= m.threshold ? "text-indigo-600 dark:text-indigo-400" : ""
            }
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function getUserTypeLabel(userType: string) {
  switch (userType) {
    case "owner":
      return (
        <span className="flex items-center gap-1.5">
          <HomeIcon size={12} className="text-sky-600 dark:text-sky-400" />
          <span className="text-slate-700 dark:text-slate-300">
            Property Owner
          </span>
        </span>
      );
    case "tenant":
      return (
        <span className="flex items-center gap-1.5">
          <Key size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-slate-700 dark:text-slate-300">Tenant</span>
        </span>
      );
    case "professional":
      return (
        <span className="flex items-center gap-1.5">
          <Briefcase
            size={12}
            className="text-purple-600 dark:text-purple-400"
          />
          <span className="text-slate-700 dark:text-slate-300">Both</span>
        </span>
      );
    default:
      return (
        <span className="flex items-center gap-1.5">
          <User size={12} className="text-slate-500 dark:text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400">
            Utilisateur
          </span>
        </span>
      );
  }
}

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const {
    loading,
    saving,
    isEditing,
    firstName,
    lastName,
    username,
    email,
    phone,
    userType,
    bio,
    profession,
    languages,
    profilePictureUrl,
    availability,
    trustScore,
    positiveReviews,
    idVerified,
    idVerifiedDate,
    emailVerified,
    phoneVerified,
    bioLength,
    bioMaxLength,
    trustLevel,
    showLanguageInput,
    newLanguage,
    fileInputRef,
    commonLanguages,
    sendingReminder,
    reminderSent,
    waitTimeRemaining,
    editingSlot,
    tempHours,
    uploadingPicture,
    totalProperties,
    totalBookings,
    totalReviews,
    totalEarnings,
    responseRate,
    responseTime,
    completionRate,
    badges,
    // ✅ Nouveaux champs pour validation username
    usernameError,
    isCheckingUsername,
    usernameTouched,
    setFirstName,
    setLastName,
    setUsername,
    setUsernameTouched,
    setBio,
    setProfession,
    setAvailability,
    setShowLanguageInput,
    setNewLanguage,
    addLanguage,
    removeLanguage,
    handleProfilePictureChange,
    removeProfilePicture,
    handleSave,
    handleEdit,
    handleCancel,
    sendVerificationReminder,
    updateAvailabilitySlot,
    toggleAvailabilityDay,
    startEditSlot,
    cancelEditSlot,
    setEditingSlot,
    setTempHours,
  } = useProfile();
  const {
    cinStatus,
    loading: cinLoading,
    showCINModal,
    setShowCINModal,
    submitting: cinSubmitting,
    handleCINSubmission,
    currentUserId, // ✅ AJOUTER CETTE LIGNE
  } = useCINStatus();

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50/20 dark:bg-slate-900/0 z-50">
        <LoadingSpinner
          variant="spinner"
          size="lg"
          color="primary"
          text="Chargement du profil..."
          speed="normal"
        />
      </div>
    );
  }

  const inputBase = (disabled: boolean) =>
    `w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm transition-all font-medium text-slate-900 dark:text-white outline-none ${
      disabled
        ? "opacity-60 cursor-default"
        : "focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
    }`;

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/20 dark:bg-slate-900/0">
      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-900/0 border-b border-slate-100 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-7">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t("page.title")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {t("page.description")}
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-10 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-8 space-y-7">
            {/* PERSONAL INFO CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-sky-500 via-purple-500 to-violet-600" />
              <div className="p-7">
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-violet-600 flex items-center justify-center shadow-sm">
                      <RiUserLine className="text-white text-xl" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      {t("sections.personalInfo")}
                    </h2>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      <RiEditLine size={12} /> {t("actions.edit")}
                    </button>
                  )}
                </div>

                {/* AVATAR SECTION */}
                <div className="flex flex-col sm:flex-row items-center gap-7 pb-7 mb-7 border-b border-slate-100 dark:border-slate-800">
                  <div className="relative group flex-shrink-0">
                    <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700 shadow-xl group-hover:scale-[1.02] transition-transform duration-300">
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
                        <div className="w-full h-full bg-gradient-to-br from-sky-500 to-violet-500 flex items-center justify-center">
                          <RiUserLine className="text-white text-5xl" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-2 -right-2 w-9 h-9 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center shadow-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    >
                      <RiCameraLine size={15} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={handleProfilePictureChange}
                      className="hidden"
                    />
                    {uploadingPicture && (
                      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 rounded-2xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("avatar.title")}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs">
                      {t("avatar.description")}
                    </p>
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                      >
                        <RiCameraLine size={12} /> {t("avatar.edit")}
                      </button>
                      {profilePictureUrl && (
                        <button
                          onClick={removeProfilePicture}
                          className="px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <RiCloseLine size={12} /> {t("avatar.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* FORM GRID - USERNAME EN PREMIER */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* ✅ USERNAME EN PREMIER (prend toute la ligne si tu veux, ici première position) */}
                  <div className="sm:col-span-2">
                    <Field
                      label={t("fields.username") || "Nom d'utilisateur"}
                      icon={RiUserLine}
                    >
                      <div>
                        <input
                          type="text"
                          value={username || ""}
                          onChange={(e) => {
                            setUsername(e.target.value);
                            setUsernameTouched(true);
                          }}
                          onBlur={() => {
                            setUsernameTouched(true);
                          }}
                          disabled={!isEditing}
                          className={`${inputBase(!isEditing)} ${usernameError ? "border-red-500 focus:border-red-500" : ""}`}
                          placeholder="nom_utilisateur"
                        />
                        {isCheckingUsername && (
                          <div className="flex items-center gap-1 mt-1">
                            <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                            <span className="text-[10px] text-slate-400">
                              Vérification...
                            </span>
                          </div>
                        )}
                        {usernameError && (
                          <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {usernameError}
                          </p>
                        )}
                        {!usernameError &&
                          username &&
                          usernameTouched &&
                          !isCheckingUsername &&
                          isEditing && (
                            <p className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1">
                              <CheckCircle size={10} /> Nom d'utilisateur
                              disponible
                            </p>
                          )}
                      </div>
                    </Field>
                  </div>

                  <Field label={t("fields.firstName")} icon={RiUserLine}>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      className={inputBase(!isEditing)}
                    />
                  </Field>

                  <Field label={t("fields.lastName")} icon={RiUserLine}>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className={inputBase(!isEditing)}
                    />
                  </Field>

                  <Field
                    label={t("fields.userType")}
                    icon={RiUserHeartLine}
                    badge={
                      <span className="text-[9px] font-semibold text-amber-600 dark:text-amber-400">
                        {t("fields.notEditable")}
                      </span>
                    }
                  >
                    <div className="w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
                      {getUserTypeLabel(userType)}
                    </div>
                  </Field>

                  <Field
                    label={t("fields.email")}
                    icon={RiUserLine}
                    badge={emailVerified ? <VerifiedBadge /> : undefined}
                  >
                    <input
                      type="email"
                      value={email}
                      disabled
                      className={inputBase(true)}
                    />
                  </Field>

                  <Field
                    label={t("fields.phone")}
                    icon={RiUserLine}
                    badge={phoneVerified ? <VerifiedBadge /> : undefined}
                  >
                    <input
                      type="tel"
                      value={phone}
                      disabled
                      className={inputBase(true)}
                      placeholder="+216 00 000 000"
                    />
                  </Field>

                  <Field label={t("fields.profession")} icon={RiMedalLine}>
                    <input
                      type="text"
                      value={profession}
                      onChange={(e) => setProfession(e.target.value)}
                      disabled={!isEditing}
                      className={inputBase(!isEditing)}
                    />
                  </Field>
                </div>

                {/* BIO */}
                <div className="mt-5">
                  <Field
                    label={t("fields.bio")}
                    icon={RiUserLine}
                    badge={
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500">
                        {bioLength} / {bioMaxLength}
                      </span>
                    }
                  >
                    <textarea
                      value={bio}
                      onChange={(e) =>
                        setBio(e.target.value.slice(0, bioMaxLength))
                      }
                      disabled={!isEditing}
                      rows={4}
                      className={`${inputBase(!isEditing)} resize-none`}
                    />
                  </Field>
                </div>

                {/* LANGUAGES */}
                <div className="mt-5">
                  <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <TbLanguage size={10} /> {t("fields.languages")}
                  </label>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[52px]">
                    {languages.map((lang) => (
                      <span
                        key={lang}
                        className="flex items-center gap-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm text-slate-700 dark:text-slate-200"
                      >
                        {lang}
                        {isEditing && (
                          <button
                            onClick={() => removeLanguage(lang)}
                            className="text-slate-400 hover:text-rose-500 transition-colors"
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
                            className="px-2 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          >
                            <option value="">Sélectionner…</option>
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
                            className="px-2 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-40"
                          >
                            {t("actions.add")}
                          </button>
                          <button
                            onClick={() => setShowLanguageInput(false)}
                            className="px-2 py-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            {t("actions.cancel")}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowLanguageInput(true)}
                          className="px-3 py-1.5 border border-dashed border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> {t("actions.add")}
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AVAILABILITY CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
              <div className="p-7">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm">
                      <RiTimeLine className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {t("sections.availability")}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t("availability.description")}
                      </p>
                    </div>
                  </div>
                  {isEditing && (
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                      Cliquez pour modifier
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availability.map((slot) => (
                    <div
                      key={slot.day}
                      onClick={() => {
                        if (isEditing) {
                          toggleAvailabilityDay(slot.day);
                        }
                      }}
                      className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        slot.enabled
                          ? `bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40`
                          : "bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-45"
                      } ${card3d}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {slot.day}
                        </span>
                        {isEditing && (
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
                              slot.enabled
                                ? "bg-emerald-500 dark:bg-emerald-600 text-white shadow-sm"
                                : "bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                            }`}
                          >
                            {slot.enabled ? (
                              <CheckCircle size={10} />
                            ) : (
                              <X size={10} />
                            )}
                          </div>
                        )}
                      </div>

                      {isEditing && editingSlot === slot.day ? (
                        <div
                          className="flex items-center gap-1 mt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={tempHours}
                            onChange={(e) => setTempHours(e.target.value)}
                            className="flex-1 px-2 py-1 text-xs rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                          >
                            <option value="09:00 - 19:00">
                              09:00 - 19:00 (Journée)
                            </option>
                            <option value="10:00 - 15:00">
                              10:00 - 15:00 (Matinée)
                            </option>
                            <option value="08:00 - 12:00">
                              08:00 - 12:00 (Matin)
                            </option>
                            <option value="14:00 - 20:00">
                              14:00 - 20:00 (Après-midi)
                            </option>
                            <option value="Sur rendez-vous">
                              Sur rendez-vous
                            </option>
                            <option value="Fermé">Fermé</option>
                          </select>
                          <button
                            onClick={() =>
                              updateAvailabilitySlot(slot.day, tempHours)
                            }
                            className="p-1 rounded bg-emerald-500 dark:bg-emerald-600 text-white hover:bg-emerald-600 dark:hover:bg-emerald-700"
                          >
                            <CheckCircle size={12} />
                          </button>
                          <button
                            onClick={cancelEditSlot}
                            className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="block font-bold text-sm text-slate-900 dark:text-white">
                            {slot.hours}
                          </span>
                          {isEditing && slot.enabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditSlot(slot.day, slot.hours);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-800/40"
                            >
                              <Edit2
                                size={12}
                                className="text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400"
                              />
                            </button>
                          )}
                        </div>
                      )}
                      {slot.enabled && !isEditing && (
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 flex items-center justify-center gap-2"
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
                      className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {t("actions.cancel")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            {/* TRUST SCORE CARD */}
            <div className="bg-gradient-to-br from-sky-500 via-purple-600 to-violet-600 p-px rounded-3xl shadow-xl">
              <div className="bg-white dark:bg-slate-900 rounded-[calc(1.5rem-1px)] p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {t("trust.title")}
                    </h3>
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${trustLevel.color}`}
                    >
                      {trustLevel.label}
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center">
                    <RiAwardLine className="text-indigo-600 dark:text-indigo-400 text-2xl" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                    {trustScore}
                  </span>
                  <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">
                    /100
                  </span>
                </div>
                <TrustBar score={trustScore} />
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  {[
                    { ok: idVerified, label: t("trust.idVerified") },
                    {
                      ok: true,
                      label: t("trust.positiveReviews", {
                        count: positiveReviews,
                      }),
                    },
                    {
                      ok: true,
                      label: t("trust.memberSince", {
                        date: new Date().getFullYear().toString(),
                      }),
                    },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500 dark:bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"}`}
                      >
                        {ok ? (
                          <RiCheckboxCircleLine
                            className="text-white"
                            size={12}
                          />
                        ) : (
                          <RiCloseLine
                            className="text-slate-400 dark:text-slate-500"
                            size={12}
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* VERIFICATION CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div
                className={`h-1 bg-gradient-to-r ${
                  cinStatus.status === "VALIDATED"
                    ? "from-emerald-400 to-teal-500"
                    : cinStatus.status === "REJECTED"
                      ? "from-rose-400 to-red-500"
                      : "from-amber-400 to-orange-500"
                }`}
              />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm ${
                      cinStatus.status === "VALIDATED"
                        ? "from-emerald-400 to-teal-500"
                        : cinStatus.status === "REJECTED"
                          ? "from-rose-400 to-red-500"
                          : "from-amber-400 to-orange-500"
                    }`}
                  >
                    <RiShieldCheckLine className="text-white text-xl" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {t("verification.title")}
                  </h3>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl p-4 mb-4">
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
                        ? "✓ Vérifié"
                        : cinStatus.status === "REJECTED"
                          ? "✗ Rejeté"
                          : "⏳ En attente"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-8 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <RiIdCardLine className="text-slate-400 dark:text-slate-500 text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {t("verification.idType")}
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
                  {t("verification.description")}
                </p>

                {/* ============================================ */}
                {/* CASE 1: VALIDATED - NO BUTTON */}
                {/* ============================================ */}
                {cinStatus.status === "VALIDATED" && (
                  <button
                    disabled
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-not-allowed"
                  >
                    ✓ Identité vérifiée
                  </button>
                )}

                {/* ============================================ */}
                {/* CASE 2: PENDING - ONLY REMINDER BUTTON */}
                {/* ============================================ */}
                {cinStatus.status === "PENDING" && (
                  <button
                    onClick={sendVerificationReminder}
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

                {/* ============================================ */}
                {/* CASE 3: REJECTED - REAPPLY BUTTON (ANIMATED) */}
                {/* ============================================ */}
                {cinStatus.status === "REJECTED" && cinStatus.canReapply && (
                  <button
                    onClick={() => setShowCINModal(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white shadow-lg animate-pulse flex items-center justify-center gap-2 group"
                  >
                    <svg
                      className="w-4 h-4 group-hover:rotate-12 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Réappliquer maintenant
                  </button>
                )}

                {/* ============================================ */}
                {/* CASE 4: NO STATUS / INITIAL - START BUTTON */}
                {/* ============================================ */}
                {!cinStatus.status && (
                  <button
                    onClick={() => setShowCINModal(true)}
                    className="w-full py-3 rounded-xl text-sm font-semibold transition-all bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-sm flex items-center justify-center gap-2"
                  >
                    <RiCameraLine className="w-4 h-4" />
                    {t("verification.start")}
                  </button>
                )}

                {/* Wait time message */}
                {waitTimeRemaining !== null && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Vous avez déjà envoyé un rappel récemment. Veuillez
                        patienter {waitTimeRemaining} heures.{" "}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reminder sent message */}
                {reminderSent &&
                  cinStatus.status === "PENDING" &&
                  !waitTimeRemaining && (
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
              </div>
            </div>

            {/* STATISTIQUES CARD */}
            <div
              className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden ${block3d}`}
            >
              <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                    <TrendingUp
                      size={14}
                      className="text-indigo-600 dark:text-indigo-400"
                    />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Statistiques
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <Home
                      size={16}
                      className="text-sky-500 dark:text-sky-400 mx-auto mb-1"
                    />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {totalProperties}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Propriétés
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <Calendar
                      size={16}
                      className="text-emerald-500 dark:text-emerald-400 mx-auto mb-1"
                    />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {totalBookings}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Réservations
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <Star
                      size={16}
                      className="text-amber-500 dark:text-amber-400 mx-auto mb-1"
                    />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {totalReviews}
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Avis reçus
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 text-center">
                    <DollarSign
                      size={16}
                      className="text-indigo-500 dark:text-indigo-400 mx-auto mb-1"
                    />
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {totalEarnings.toLocaleString()} TND
                    </p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400">
                      Gains totaux
                    </p>
                  </div>
                </div>

                {badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-[8px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400"
                      >
                        {badge === "SUPERHOST" && "⭐ Superhôte"}
                        {badge === "EXPERT" && "🎯 Expert"}
                        {badge === "RELIABLE" && "✅ Fiable"}
                        {badge === "VERIFIED" && "🔒 Vérifié"}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Taux de réponse
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {responseRate}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      Temps de réponse
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {responseTime}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-2">
                    <span className="text-slate-500 dark:text-slate-400">
                      Complétion profil
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {completionRate}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {/* CIN Upload Modal - Only shows when showCINModal is true */}
      {showCINModal && (
        <IdentityPage
          onClose={() => setShowCINModal(false)}
          onSuccess={async (data) => {
            await handleCINSubmission(data.rectoFile, data.versoFile);
          }}
          userId={currentUserId} // ← Passe l'ID utilisateur
          initialRejectionReason={cinStatus.rejectionReason}
        />
      )}
    </div>
  );
}
