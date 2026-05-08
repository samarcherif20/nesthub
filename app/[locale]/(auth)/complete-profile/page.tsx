"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  User,
  CreditCard,
  Camera,
  MapPin,
  Languages,
  FileText,
  X,
  Save,
  Search,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useCompleteProfile } from "./hooks/useCompleteProfile";
import { useTenantProfile } from "./hooks/useTenantProfile";
import { useLandlordProfile } from "./hooks/useLandlordProfile";
import { toast } from "sonner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function HalfGauge({ pct }: { pct: number }) {
  const r = 40;
  const circ = Math.PI * r;
  const filled = (pct / 100) * circ;

  return (
    <svg width="96" height="56" viewBox="0 0 96 56">
      <defs>
        <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <path
        d={`M 8 48 A ${r} ${r} 0 0 1 88 48`}
        fill="none"
        strokeWidth="8"
        strokeLinecap="round"
        className="stroke-slate-200 dark:stroke-slate-700"
      />
      <path
        d={`M 8 48 A ${r} ${r} 0 0 1 88 48`}
        fill="none"
        stroke="url(#gaugeGradient)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circ - filled}`}
        className="transition-all duration-700"
      />
      <text
        x="48"
        y="38"
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        className="fill-slate-800 dark:fill-slate-100"
      >
        {pct}%
      </text>
    </svg>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const t = useTranslations("CompleteProfile");
  const { isLoading: isProfileLoading, userRole, userData, user, selectedLanguages, setSelectedLanguages, profilePhotoUrl: initialPhotoUrl } = useCompleteProfile();
  
  const tenantProfile = useTenantProfile(userData);
  const landlordProfile = useLandlordProfile(userData);
  
  const profile = userRole === "PROPERTY_OWNER" ? landlordProfile : tenantProfile;
  const isLandlord = userRole === "PROPERTY_OWNER";

  // Cast profile as any for landlord-specific properties to avoid TypeScript errors
  const profileAny = profile as any;

  // Get translated available languages
  const AVAILABLE_LANGUAGES = [
    { code: "FR", name: t("languageFrench") },
    { code: "EN", name: t("languageEnglish") },
    { code: "AR", name: t("languageArabic") },
    { code: "DE", name: t("languageGerman") },
    { code: "ES", name: t("languageSpanish") },
    { code: "IT", name: t("languageItalian") },
    { code: "ZH", name: t("languageChinese") },
    { code: "RU", name: t("languageRussian") },
    { code: "PT", name: t("languagePortuguese") },
    { code: "NL", name: t("languageDutch") },
    { code: "TR", name: t("languageTurkish") },
    { code: "JA", name: t("languageJapanese") },
  ];

  const HOW_FOUND_OPTIONS = [
    { value: "", label: t("howFoundPlaceholder") },
    { value: "google", label: t("howFoundGoogle") },
    { value: "social", label: t("howFoundSocial") },
    { value: "friend", label: t("howFoundFriend") },
    { value: "ads", label: t("howFoundAds") },
    { value: "other", label: t("howFoundOther") },
  ];

  // Local state for UI
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [gender, setGender] = useState("");
  const [langSearch, setLangSearch] = useState("");
  const [langFocused, setLangFocused] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [touched, setTouched] = useState({
    gender: false,
    howFound: false,
    languages: false,
    rib: false,
    bankName: false,
    accountHolder: false,
  });

  // Sync data from hooks
  useEffect(() => {
    if (initialPhotoUrl && !profilePhotoUrl) {
      setProfilePhotoUrl(initialPhotoUrl);
    }
    if (profileAny.profilePhoto && !profilePhotoUrl) {
      setProfilePhotoUrl(profileAny.profilePhoto);
    }
  }, [initialPhotoUrl, profileAny.profilePhoto]);

  useEffect(() => {
    if (profileAny.gender) {
      setGender(profileAny.gender);
    }
  }, [profileAny.gender]);

  useEffect(() => {
    if (userData?.spokenLanguages && userData.spokenLanguages.length > 0) {
      setSelectedLanguages(userData.spokenLanguages);
      if (profileAny.setLanguages) {
        profileAny.setLanguages(userData.spokenLanguages);
      }
    }
  }, [userData?.spokenLanguages]);

  // Handle click outside for language dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenderChange = (value: string) => {
    setGender(value);
    if (profileAny.setGender) {
      profileAny.setGender(value);
    }
    setTouched(prev => ({ ...prev, gender: true }));
  };

  const handleRemoveLanguage = useCallback((langName: string) => {
    const newLanguages = selectedLanguages.filter(l => l !== langName);
    setSelectedLanguages(newLanguages);
    if (profileAny.setLanguages) {
      profileAny.setLanguages(newLanguages);
    }
    setTouched(prev => ({ ...prev, languages: true }));
  }, [selectedLanguages, profileAny.setLanguages]);

  const addLanguage = useCallback((langName: string) => {
    if (!selectedLanguages.includes(langName)) {
      const newLanguages = [...selectedLanguages, langName];
      setSelectedLanguages(newLanguages);
      if (profileAny.setLanguages) {
        profileAny.setLanguages(newLanguages);
      }
    }
    setLangSearch("");
    setLangFocused(false);
    setTouched(prev => ({ ...prev, languages: true }));
  }, [selectedLanguages, profileAny.setLanguages]);

  const getDisplayImageUrl = (url: string | null) => {
    if (!url) return null;
    if (url.includes("blob.vercel-storage.com")) {
      return `/api/users/avatar?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profilePictureUrl) {
          setProfilePhotoUrl(data.profilePictureUrl);
          if (profileAny.updateProfilePhoto) {
            profileAny.updateProfilePhoto(data.profilePictureUrl);
          }
          toast.success(t("photoUpdated"));
          router.refresh();
        } else {
          toast.error(t("uploadError"));
        }
      } else {
        const error = await response.json();
        toast.error(error.error || t("uploadError"));
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(t("uploadError"));
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const filteredLanguages = AVAILABLE_LANGUAGES.filter(
    (lang) => !selectedLanguages.includes(lang.name) && lang.name.toLowerCase().includes(langSearch.toLowerCase()),
  );

  // Validation - Bank info only required for landlords
  const isGenderValid = gender !== "";
  const isLanguagesValid = selectedLanguages.length > 0;
  const isHowFoundValid = profileAny.howFound !== "" && profileAny.howFound !== null;
  const isBankValid = !isLandlord || (profileAny.rib && profileAny.bankName && profileAny.accountHolder);
  const isFormValid = isGenderValid && isLanguagesValid && isHowFoundValid && isBankValid;

  const handleSave = async () => {
    // Mark all as touched
    setTouched({
      gender: true,
      howFound: true,
      languages: true,
      rib: true,
      bankName: true,
      accountHolder: true,
    });

    if (!isFormValid) {
      let errorMessage = t("missingFields") + "\n";
      if (!isGenderValid) errorMessage += `- ${t("gender")}\n`;
      if (!isLanguagesValid) errorMessage += `- ${t("languages")}\n`;
      if (!isHowFoundValid) errorMessage += `- ${t("howFound")}\n`;
      if (isLandlord && !isBankValid) errorMessage += `- ${t("bankInfo")}\n`;
      toast.error(t("missingFieldsTitle"), { description: errorMessage });
      return;
    }

    if (profileAny.setLanguages) {
      profileAny.setLanguages(selectedLanguages);
    }
    
    try {
      await profileAny.handleSave();
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2500);
    } catch (error) {
      toast.error(t("saveError"), {
        description: t("saveErrorDesc"),
      });
    }
  };

  const pct = Math.min(
    70 + [profileAny.howFound !== "", selectedLanguages.length > 0, gender !== ""].filter(Boolean).length * 10,
    100,
  );

  // Steps - Bank step only for landlords
  const steps = [
    { id: 1, label: t("step1"), done: true },
    { id: 2, label: t("step2"), done: !!profilePhotoUrl },
    { id: 3, label: t("step3"), done: true },
    { id: 4, label: t("step4"), done: !!profileAny.bio },
    { id: 5, label: t("step5"), done: profileAny.howFound !== "" },
    { id: 6, label: t("step6"), done: selectedLanguages.length > 0 },
    ...(isLandlord ? [{ id: 7, label: t("step7"), done: !!(profileAny.rib && profileAny.bankName && profileAny.accountHolder) }] : []),
  ];

  const lbl =
    "mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400";
  const ro =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3.5 py-2 text-sm text-slate-600 dark:text-slate-400 outline-none cursor-not-allowed";
  const ed =
    "w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20";
  const card =
    "rounded-2xl border border-white/80 dark:border-white/10 bg-white/94 dark:bg-slate-900/80 shadow-[0_18px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.35)] backdrop-blur-sm";

 // Loading state with LoadingSpinner component - centered in the middle of the page
if (isProfileLoading) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-slate-950 z-50">
      <div className="flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">
          {t("loading.message")}
        </p>
      </div>
    </div>
  );
}

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white dark:bg-slate-950">
      {/* Background decorations - dark mode aware */}
      <div className="absolute inset-0 bg-white dark:from-slate-950 dark:via-[#0f172a] dark:to-[#111827]" />
      <div className="absolute -top-24 left-[-6rem] h-72 w-72 rounded-full bg-white/70 dark:bg-blue-500/10 blur-3xl" />
      <div className="absolute top-8 right-16 h-56 w-56 rounded-full bg-sky-200/50 dark:bg-purple-500/10 blur-3xl" />
      <div
        className="absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 dark:from-[#172554] dark:via-[#1d4ed8] dark:to-[#581c87] shadow-[0_-18px_50px_rgba(59,130,246,0.22)] dark:shadow-[0_-18px_50px_rgba(37,99,235,0.18)]"
        style={{ clipPath: "polygon(0 32%, 100% 0, 100% 100%, 0 100%)" }}
      />
      <div className="absolute inset-x-0 bottom-[41.5%] h-px rotate-[-5deg] bg-white/40 dark:bg-white/10" />

      <div className="relative z-10 flex h-full flex-col px-12 py-7">
        {/* Header */}
        <div className="mb-5 flex flex-shrink-0 items-center justify-between">
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 via-sky-500 to-purple-500 bg-clip-text text-xl font-bold text-transparent">
              {t("title")}
            </h1>
            <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-400">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-5">
            <HalfGauge pct={pct} />
            {showSaved && (
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ {t("saved")}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={profileAny.isLoading || !isFormValid}
              className={`flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-bold shadow-md transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed ${
                isFormValid && !profileAny.isLoading
                  ? "bg-blue-400 dark:bg-blue-500 text-black dark:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:via-purple-500 hover:to-indigo-500 hover:text-white"
                  : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed"
              }`}
            >
              {profileAny.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={15} />}
              {t("save")}
            </button>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div className="grid flex-1 min-h-0 grid-cols-[210px_minmax(0,1fr)_minmax(0,1fr)] gap-5">
          {/* Left Column - Steps */}
          <div className={`${card} h-full p-5`}>
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                {t("progress")}
              </p>
              <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
                {t("steps")}
              </p>
            </div>
            <div className="relative flex h-[calc(100%-3rem)] flex-col justify-center gap-5">
              <div className="absolute left-[14px] top-3 bottom-3 w-px bg-slate-200 dark:bg-white/10" />
              {steps.map((step) => (
                <div key={step.id} className="relative flex items-center gap-3">
                  <div
                    className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all ${
                      step.done
                        ? "border-blue-500 bg-gradient-to-r from-blue-500 via-sky-500 to-purple-500 text-white shadow-md shadow-blue-200/70 dark:shadow-blue-950/40"
                        : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.done ? "✓" : step.id}
                  </div>
                  <span
                    className={`text-[13px] ${
                      step.done
                        ? "font-medium text-slate-700 dark:text-slate-200"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Column - Personal Info & Address */}
          <div className="flex h-full flex-col gap-4">
            {/* Personal Information */}
            <div className={`${card} flex-1 p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  {t("personalInfo")}
                </h2>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("firstName")}</label>
                    <input value={profileAny.firstName || ""} readOnly className={ro} />
                  </div>
                  <div>
                    <label className={lbl}>{t("lastName")}</label>
                    <input value={profileAny.lastName || ""} readOnly className={ro} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>{t("email")}</label>
                  <input value={user?.emailAddresses[0]?.emailAddress || ""} readOnly className={ro} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t("birthDate")}</label>
                    <input value={profileAny.birthDate || ""} readOnly className={ro} />
                  </div>
                  <div>
                    <label className={lbl}>{t("cin")}</label>
                    <input value={profileAny.cinNumber || ""} readOnly className={ro} placeholder={t("notProvided")} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>{t("phone")}</label>
                  <input value={profileAny.phone || ""} readOnly className={ro} />
                </div>
                <div>
                  <label className={lbl}>{t("profession")}</label>
                  <input value={profileAny.profession || ""} readOnly className={ro} placeholder={t("notProvided")} />
                </div>
                <div>
                  <label className={lbl}>
                    {t("gender")} <span className="text-red-500">*</span>
                    {touched.gender && !gender && (
                      <span className="text-red-500 text-[8px] ml-1">{t("genderRequired")}</span>
                    )}
                  </label>
                  <div className="flex h-[36px] items-center gap-5">
                    {[
                      { value: "Homme", label: t("man") },
                      { value: "Femme", label: t("woman") },
                      { value: "Autre", label: t("other") },
                    ].map((g) => (
                      <label
                        key={g.value}
                        className="flex cursor-pointer items-center gap-1.5 text-[13px] text-slate-600 dark:text-slate-300"
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g.value}
                          checked={gender === g.value}
                          onChange={() => handleGenderChange(g.value)}
                          className="h-3.5 w-3.5 accent-blue-500 dark:accent-blue-400"
                        />
                        {g.label}
                      </label>
                    ))}
                  </div>
                  {touched.gender && !gender && (
                    <p className="text-[10px] text-red-500 mt-1">{t("genderSelect")}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{t("address")}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>{t("governorate")}</label>
                  <input value={profileAny.governorate || ""} readOnly className={ro} placeholder={t("notProvided")} />
                </div>
                <div>
                  <label className={lbl}>{t("delegation")}</label>
                  <input value={profileAny.delegation || ""} readOnly className={ro} placeholder={t("notProvided")} />
                </div>
              </div>
            </div>

            {/* Bank Section - ONLY for landlords */}
            {isLandlord && (
              <div className={`${card} p-6`}>
                <div className="mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-purple-500 dark:text-purple-400" />
                  <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                    {t("bankInfo")} <span className="text-red-500">*</span>
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lbl}>{t("rib")} *</label>
                    <input
                      value={profileAny.rib || ""}
                      onChange={(e) => {
                        profileAny.setRib?.(e.target.value);
                        setTouched(prev => ({ ...prev, rib: true }));
                      }}
                      className={`${ed} ${touched.rib && !profileAny.rib ? "border-red-400" : ""}`}
                      placeholder="TN59 1234..."
                    />
                    {touched.rib && !profileAny.rib && (
                      <p className="text-[9px] text-red-500 mt-0.5">{t("required")}</p>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>{t("bankName")} *</label>
                    <input
                      value={profileAny.bankName || ""}
                      onChange={(e) => {
                        profileAny.setBankName?.(e.target.value);
                        setTouched(prev => ({ ...prev, bankName: true }));
                      }}
                      className={`${ed} ${touched.bankName && !profileAny.bankName ? "border-red-400" : ""}`}
                      placeholder="BIAT, Attijari..."
                    />
                    {touched.bankName && !profileAny.bankName && (
                      <p className="text-[9px] text-red-500 mt-0.5">{t("required")}</p>
                    )}
                  </div>
                  <div>
                    <label className={lbl}>{t("accountHolder")} *</label>
                    <input
                      value={profileAny.accountHolder || ""}
                      onChange={(e) => {
                        profileAny.setAccountHolder?.(e.target.value);
                        setTouched(prev => ({ ...prev, accountHolder: true }));
                      }}
                      className={`${ed} ${touched.accountHolder && !profileAny.accountHolder ? "border-red-400" : ""}`}
                      placeholder="Nom complet"
                    />
                    {touched.accountHolder && !profileAny.accountHolder && (
                      <p className="text-[9px] text-red-500 mt-0.5">{t("required")}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Photo, Bio, How Found, Languages */}
          <div className="flex h-full flex-col gap-4">
            {/* Profile Photo */}
            <div className={`${card} p-6`}>
              <div className="mb-4 flex items-center gap-2">
                <Camera size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{t("profilePhoto")}</h2>
              </div>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <div className="flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-full border-[3px] border-blue-100 dark:border-blue-500/20 bg-slate-100 dark:bg-slate-800">
                    {profilePhotoUrl ? (
                      <img 
                        src={getDisplayImageUrl(profilePhotoUrl) || ""} 
                        alt="Profile" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      <User size={26} className="text-slate-300 dark:text-slate-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 dark:bg-blue-600 text-white shadow-md transition-colors hover:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Camera size={11} />
                  </button>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {profileAny.firstName} {profileAny.lastName}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{profileAny.profession}</p>
                  <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{t("photoHint")}</p>
                </div>
              </div>
              {isUploadingPhoto && (
                <div className="mt-3 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-400" />
                </div>
              )}
            </div>

            {/* Biography */}
            <div className={`${card} flex flex-1 flex-col p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <FileText size={16} className="text-blue-500 dark:text-blue-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">{t("bio")}</h2>
              </div>
              <textarea
                value={profileAny.bio || ""}
                onChange={(e) => profileAny.setBio(e.target.value.slice(0, 300))}
                className="flex-1 w-full resize-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                placeholder={t("bioPlaceholder")}
              />
              <p className="mt-1.5 text-right text-[10px] font-medium text-slate-400 dark:text-slate-500">
                {profileAny.bio?.length || 0}/300
              </p>
            </div>

            {/* How did you find us */}
            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <Search size={16} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  {t("howFound")} <span className="text-red-500">*</span>
                </h2>
              </div>
              <div className="relative">
                <select
                  value={profileAny.howFound || ""}
                  onChange={(e) => {
                    profileAny.setHowFound(e.target.value);
                    setTouched(prev => ({ ...prev, howFound: true }));
                  }}
                  className={`w-full appearance-none rounded-lg border ${
                    touched.howFound && !profileAny.howFound ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  } bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20`}
                >
                  {HOW_FOUND_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              </div>
              {touched.howFound && !profileAny.howFound && (
                <p className="text-[10px] text-red-500 mt-1">{t("genderSelect")}</p>
              )}
            </div>

            {/* Languages */}
            <div className={`${card} p-6`}>
              <div className="mb-3 flex items-center gap-2">
                <Languages size={16} className="text-purple-500 dark:text-purple-400" />
                <h2 className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
                  {t("languages")} <span className="text-red-500">*</span>
                </h2>
              </div>
              {touched.languages && selectedLanguages.length === 0 && (
                <p className="text-[10px] text-red-500 mb-2">{t("atLeastOne")}</p>
              )}
              {selectedLanguages.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="flex h-7 items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-3 text-xs font-medium text-blue-700 dark:text-blue-300"
                    >
                      {lang}
                      <X
                        size={11}
                        className="cursor-pointer transition-colors hover:text-red-500"
                        onClick={() => handleRemoveLanguage(lang)}
                      />
                    </span>
                  ))}
                </div>
              )}
              <div className="relative" ref={langRef}>
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                />
                <input
                  type="text"
                  value={langSearch}
                  onChange={(e) => setLangSearch(e.target.value)}
                  onFocus={() => setLangFocused(true)}
                  placeholder={t("searchLanguage")}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 pl-9 pr-3.5 text-sm text-slate-700 dark:text-slate-200 outline-none transition-all focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {langFocused && filteredLanguages.length > 0 && (
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                    {filteredLanguages.map((lang) => (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          addLanguage(lang.name);
                          setTouched(prev => ({ ...prev, languages: true }));
                        }}
                        className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-sm text-slate-600 dark:text-slate-300 transition-colors hover:bg-blue-50 dark:hover:bg-white/5 hover:text-blue-700 dark:hover:text-blue-300"
                      >
                        <Languages size={12} className="text-slate-400 dark:text-slate-500" />
                        {langSearch
                          ? lang.name
                              .split(new RegExp(`(${langSearch})`, "gi"))
                              .map((part, i) =>
                                part.toLowerCase() === langSearch.toLowerCase() ? (
                                  <strong key={i} className="text-blue-600 dark:text-blue-400">
                                    {part}
                                  </strong>
                                ) : (
                                  <span key={i}>{part}</span>
                                ),
                              )
                          : lang.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedLanguages.length === 0 && (
                <p className="text-[10px] text-slate-400 mt-1.5">{t("clickToSelect")}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}