// app/[locale]/(dashboard)/owner/profile/page.tsx
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
import { GoShieldCheck } from "react-icons/go";
import { BsPersonCheck, BsPatchCheckFill } from "react-icons/bs";
import { MdOutlineVerified } from "react-icons/md";
import { TbLanguage } from "react-icons/tb";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useProfile } from "./hooks/useProfile";

const pipAvatar = (url: string) =>
  `/api/users/avatar?url=${encodeURIComponent(url)}`;

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.05),0_12px_28px_-6px_rgba(0,0,0,0.09)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.35),0_12px_28px_-6px_rgba(0,0,0,0.45)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.04),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.25),0_8px_16px_-4px_rgba(0,0,0,0.30)]";

function Field({
  label,
  icon: Icon,
  children,
  badge,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
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
  const current = milestones.reduce(
    (prev, m) => (score >= m.threshold ? m : prev),
    milestones[0],
  );
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

export default function ProfilePage() {
  const t = useTranslations("Profile");
  const {
    loading,
    saving,
    isEditing,
    firstName,
    lastName,
    email,
    phone,
    userType,
    bio,
    profession,
    languages,
    profilePictureUrl,
    availability,
    trustScore,
    memberSince,
    positiveReviews,
    idVerified,
    idVerifiedDate,
    emailVerified,
    phoneVerified,
    bioLength,
    bioMaxLength,
    trustLevel,
    uploadingPicture,
    showLanguageInput,
    newLanguage,
    fileInputRef,
    commonLanguages,
    setFirstName,
    setLastName,
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
  } = useProfile();

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background-light  dark:bg-background-dark gap-4">
        <LoadingSpinner />
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          {t("loading.message")}
        </p>
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
    <div className="flex-1 flex flex-col overflow-y-auto bg-background-light  dark:bg-background-dark">
      {/* PAGE HEADER */}
      <div className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-7">
          <div>
            <div className="flex items-center gap-2 mb-2"></div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {t("page.title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {t("page.description")}
            </p>
          </div>
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
                          src={pipAvatar(profilePictureUrl)}
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

                {/* FORM GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label={t("fields.firstName")} icon={RiUserLine}>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      disabled={!isEditing}
                      className={inputBase(!isEditing)}
                      placeholder={t("fields.firstName")}
                    />
                  </Field>

                  <Field label={t("fields.lastName")} icon={RiUserLine}>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      disabled={!isEditing}
                      className={inputBase(!isEditing)}
                      placeholder={t("fields.lastName")}
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
                    <select
                      disabled
                      className={`${inputBase(true)} appearance-none`}
                    >
                      <option value="tenant">Locataire</option>
                      <option value="owner">Propriétaire</option>
                      <option value="professional">Professionnel</option>
                    </select>
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
                      placeholder={t("fields.profession")}
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
                      placeholder={t("fields.bioPlaceholder")}
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
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {availability.map((slot, idx) => (
                    <div
                      key={slot.day}
                      onClick={() => {
                        if (!isEditing) return;
                        const n = [...availability];
                        n[idx].enabled = !n[idx].enabled;
                        setAvailability(n);
                      }}
                      className={`p-4 rounded-2xl border-2 transition-all ${isEditing ? "cursor-pointer" : ""} ${
                        slot.enabled
                          ? `bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800/40 ${isEditing ? "hover:bg-emerald-100 dark:hover:bg-emerald-900/25" : ""}`
                          : "bg-slate-50 dark:bg-slate-800/40 border-transparent opacity-45"
                      } ${card3d}`}
                    >
                      <span className="block text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                        {slot.day}
                      </span>
                      <span className="block font-bold text-sm text-slate-900 dark:text-white">
                        {slot.hours}
                      </span>
                      {slot.enabled && (
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="lg:col-span-4 space-y-6">
            {/* TRUST SCORE */}
            <div className="bg-gradient-to-br from-sky-500 via-purple-600 to-violet-600 p-px rounded-3xl shadow-xl shadow-indigo-200/40 dark:shadow-indigo-900/50">
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
                    {
                      ok: idVerified,
                      label: t("trust.idVerified"),
                    },
                    {
                      ok: true,
                      label: t("trust.positiveReviews", {
                        count: positiveReviews,
                      }),
                    },
                    {
                      ok: true,
                      label: t("trust.memberSince", { date: memberSince }),
                    },
                  ].map(({ ok, label }) => (
                    <div key={label} className="flex items-center gap-2.5">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`}
                      >
                        {ok ? (
                          <RiCheckboxCircleLine
                            className="text-white"
                            size={12}
                          />
                        ) : (
                          <RiCloseLine className="text-slate-400" size={12} />
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
                className={`h-1 bg-gradient-to-r ${idVerified ? "from-emerald-400 to-teal-500" : "from-amber-400 to-orange-500"}`}
              />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm ${
                      idVerified
                        ? "from-emerald-400 to-teal-500"
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
                        idVerified
                          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40"
                          : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40"
                      }`}
                    >
                      {idVerified
                        ? t("verification.verified")
                        : t("verification.pending")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-11 h-8 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      <RiIdCardLine className="text-slate-400 text-lg" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {t("verification.idType")}
                      </p>
                      {idVerifiedDate && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {t("verification.verifiedDate", {
                            date: idVerifiedDate,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed mb-4">
                  {t("verification.description")}
                </p>

                <button
                  className={`w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 border-2 ${
                    idVerified
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:text-white"
                      : "bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white border-transparent shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
                  }`}
                >
                  {idVerified
                    ? t("verification.update")
                    : t("verification.start")}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
