"use client";

import Image from "next/image";
import { useCompleteProfile } from "./hooks/useCompleteProfile";
import { useTenantProfile } from "./hooks/useTenantProfile";
import { useLandlordProfile } from "./hooks/useLandlordProfile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Loader2,
  User,
  CreditCard,
  Camera,
  MapPin,
  Languages,
  FileText,
  CheckCircle2,
  X,
  Crown,
  Moon,
  Sun,
} from "lucide-react";

// Liste des langues disponibles
const AVAILABLE_LANGUAGES = [
  "Français",
  "Anglais",
  "Arabe",
  "Allemand",
  "Espagnol",
  "Italien",
  "Chinois",
  "Russe",
  "Portugais",
  "Néerlandais",
  "Turc",
  "Japonais",
];

export default function CompleteProfilePage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const {
    isLoading,
    userRole,
    userData,
    user,
    selectedLanguages,
    setSelectedLanguages,
  } = useCompleteProfile();

  const tenantProfile = useTenantProfile(userData);
  const landlordProfile = useLandlordProfile(userData);

  // ✅ Correction : userRole peut être "PROPERTY_OWNER" ou "TENANT"
  const isLandlord = userRole === "PROPERTY_OWNER";
  const profile = isLandlord ? landlordProfile : tenantProfile;

  // Photo de profil depuis la base de données
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // État pour le genre
  const [gender, setGender] = useState(profile.gender || "");

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && theme === "dark";

  // Initialiser les langues sélectionnées depuis userData
  useEffect(() => {
    if (userData?.spokenLanguages && userData.spokenLanguages.length > 0) {
      setSelectedLanguages(userData.spokenLanguages);
      profile.setLanguages(userData.spokenLanguages);
    }
  }, [userData?.spokenLanguages]);

  // ✅ Mettre à jour la photo depuis userData ou depuis le profil
  useEffect(() => {
    if (userData?.profilePictureUrl && !profilePhotoUrl) {
      setProfilePhotoUrl(userData.profilePictureUrl);
    }
    if (profile.profilePhoto && !profilePhotoUrl) {
      setProfilePhotoUrl(profile.profilePhoto);
    }
  }, [userData?.profilePictureUrl, profile.profilePhoto]);

  // Mettre à jour le gender quand profile change
  useEffect(() => {
    if (profile.gender) {
      setGender(profile.gender);
    }
  }, [profile.gender]);

  // Gérer le changement de genre
  const handleGenderChange = (value: string) => {
    setGender(value);
    if (profile.setGender) {
      profile.setGender(value);
    }
  };

  // Supprimer une langue
  const handleRemoveLanguage = (lang: string) => {
    const newLanguages = selectedLanguages.filter((l) => l !== lang);
    setSelectedLanguages(newLanguages);
    profile.setLanguages(newLanguages);
  };

  // Gérer l'upload de photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsEditingPhoto(true);
    const previewUrl = URL.createObjectURL(file);
    setProfilePhotoUrl(previewUrl);
  };

  // Sauvegarder la nouvelle photo
  const handleSavePhoto = async () => {
    if (!uploadedFile) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", uploadedFile);

    try {
      const response = await fetch("/api/users/avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.profilePictureUrl) {
          setProfilePhotoUrl(data.profilePictureUrl);
          if (profile.updateProfilePhoto) {
            profile.updateProfilePhoto(data.profilePictureUrl);
          }
          toast.success("Photo de profil mise à jour !");
          router.refresh();
        } else {
          toast.error("Erreur lors de l'upload");
          setProfilePhotoUrl(userData?.profilePictureUrl || null);
        }
      } else {
        const error = await response.json();
        toast.error(error.error || "Erreur lors de l'upload");
        setProfilePhotoUrl(userData?.profilePictureUrl || null);
      }
    } catch (error) {
      console.error("Erreur upload photo:", error);
      toast.error("Erreur lors de l'upload");
      setProfilePhotoUrl(userData?.profilePictureUrl || null);
    } finally {
      setIsUploadingPhoto(false);
      setIsEditingPhoto(false);
      setUploadedFile(null);
    }
  };

  // Annuler la modification de la photo
  const handleCancelPhotoEdit = () => {
    setIsEditingPhoto(false);
    setUploadedFile(null);
    setProfilePhotoUrl(userData?.profilePictureUrl || null);
  };

  // Biographie pré-remplie par défaut si vide
  useEffect(() => {
    if (!profile.bio && userData) {
      const defaultBio = `Je m'appelle ${profile.firstName || ""} ${profile.lastName || ""}, ${profile.profession || ""} de profession. Passionné(e) par la location immobilière, je suis à la recherche de nouvelles opportunités.`;
      profile.setBio(defaultBio);
    }
  }, [profile.bio, profile.firstName, profile.lastName, profile.profession]);

  // Fermer le dropdown des langues en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-dropdown]")) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ PROGRESSION
  const fieldsToComplete = [
    {
      name: "commentConnu",
      label: "Comment nous avez-vous connu ?",
      value: profile.howFound && profile.howFound !== "",
    },
    {
      name: "langues",
      label: "Langues parlées",
      value: selectedLanguages.length > 0,
    },
    { name: "genre", label: "Genre", value: !!gender && gender !== "" },
  ];

  const filledCount = fieldsToComplete.filter((field) => field.value).length;
  const totalFields = fieldsToComplete.length;
  const baseProgress = 70;
  const progressPerField = 10;
  const calculatedProgress = baseProgress + filledCount * progressPerField;
  const progressPercentage = Math.min(calculatedProgress, 100);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm dark:text-white";
  const inputReadOnlyClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none text-sm";
  const textareaReadOnlyClass =
    "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none text-sm resize-none";
  const labelClass =
    "block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1";
  const sectionClass =
    "bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-sm";

  const steps = [
    {
      id: 1,
      name: "Informations personnelles",
      description: "Identité & coordonnées",
      completed: true,
    },
    {
      id: 2,
      name: "Photo de profil",
      description: "Photo d'identité",
      completed: !!profilePhotoUrl,
    },
    { id: 3, name: "Adresse", description: "Localisation", completed: true },
    {
      id: 4,
      name: "Biographie",
      description: "Présentation",
      completed: !!profile.bio,
    },
    {
      id: 5,
      name: "Comment nous avez-vous connu ?",
      description: "Source de découverte",
      completed: fieldsToComplete[0].value,
    },
    {
      id: 6,
      name: "Langues",
      description: "Langues parlées",
      completed: fieldsToComplete[1].value,
    },
    ...(isLandlord
      ? [
          {
            id: 7,
            name: "Coordonnées bancaires",
            description: "RIB & banque",
            completed: !!(profile.rib && profile.bankName),
          },
        ]
      : []),
  ];

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 ${
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
      }`}
    >
      {/* Header avec bouton theme toggle */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-end items-center px-6 py-3 max-w-7xl mx-auto">
          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? (
              <Sun size={18} className="text-yellow-500" />
            ) : (
              <Moon size={18} className="text-slate-700" />
            )}
          </button>
        </div>
      </header>

      <div className="flex min-h-screen pt-16">
        {/* STEPPER VERTICAL À GAUCHE */}
        <div className="w-80 flex-shrink-0 hidden lg:block sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="w-full px-4 py-6">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                Activer votre compte
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Complétez les étapes ci-dessous
              </p>

              <div className="space-y-6">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {step.completed ? (
                        <CheckCircle2 size={20} className="text-green-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center">
                          <span className="text-[11px] font-semibold text-slate-500">
                            {step.id}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-semibold ${step.completed ? "text-green-600 dark:text-green-400" : "text-slate-700 dark:text-slate-300"}`}
                      >
                        {step.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* BARRE DE PROGRESSION */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-medium text-slate-500">
                    Progression du profil
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600">
                    {progressPercentage}%
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>

                <div className="mt-3 space-y-1.5">
                  {fieldsToComplete.map((field) => (
                    <div
                      key={field.name}
                      className="flex items-center gap-2 text-[10px]"
                    >
                      {field.value ? (
                        <CheckCircle2 size={10} className="text-green-500" />
                      ) : (
                        <div className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600" />
                      )}
                      <span
                        className={
                          field.value
                            ? "text-green-600 dark:text-green-400"
                            : "text-slate-400"
                        }
                      >
                        {field.label}
                      </span>
                      {!field.value && (
                        <span className="text-[9px] text-amber-500">
                          (à remplir)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENU PRINCIPAL */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* COLONNE GAUCHE */}
              <div className="space-y-6">
                {/* Photo de profil */}
                <section className={sectionClass}>
                  <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Camera size={16} className="text-indigo-600" /> Photo de
                    profil
                  </h3>
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      {profilePhotoUrl ? (
                        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-200 shadow-lg">
                          <img
                            src={
                              profilePhotoUrl?.includes(
                                "blob.vercel-storage.com",
                              )
                                ? `/api/users/avatar?url=${encodeURIComponent(profilePhotoUrl)}`
                                : (profilePhotoUrl ?? "")
                            }
                            alt="Photo de profil"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center border-4 border-indigo-200">
                          <User size={48} className="text-indigo-400" />
                        </div>
                      )}
                      <label className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-md">
                        <Camera size={16} />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handlePhotoUpload}
                          disabled={isUploadingPhoto}
                        />
                      </label>
                    </div>

                    {isEditingPhoto && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={handleSavePhoto}
                          disabled={isUploadingPhoto}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 disabled:opacity-50"
                        >
                          {isUploadingPhoto ? "Upload..." : "Enregistrer"}
                        </button>
                        <button
                          onClick={handleCancelPhotoEdit}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-md hover:bg-red-700"
                        >
                          Annuler
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-400 text-center">
                      {profilePhotoUrl
                        ? "Photo actuelle. Cliquez sur l'icône pour la modifier."
                        : "Aucune photo. Cliquez sur l'icône pour en ajouter une."}
                    </p>
                  </div>
                </section>

                {/* Informations personnelles */}
                <section className={sectionClass}>
                  <h3 className="text-md font-bold mb-3 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <User size={16} className="text-indigo-600" /> Identité
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Prénom</label>
                      <input
                        type="text"
                        value={profile.firstName}
                        readOnly
                        className={inputReadOnlyClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Nom</label>
                      <input
                        type="text"
                        value={profile.lastName}
                        readOnly
                        className={inputReadOnlyClass}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Email</label>
                      <input
                        type="email"
                        value={user?.emailAddresses[0]?.emailAddress || ""}
                        readOnly
                        className={inputReadOnlyClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Téléphone</label>
                      <input
                        type="tel"
                        value={profile.phone}
                        readOnly
                        className={inputReadOnlyClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Date naissance</label>
                      <input
                        type="date"
                        value={profile.birthDate}
                        readOnly
                        className={inputReadOnlyClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>CIN</label>
                      <input
                        type="text"
                        value={profile.cinNumber || ""}
                        readOnly
                        className={inputReadOnlyClass}
                        placeholder="Non renseigné"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Profession</label>
                      <input
                        type="text"
                        value={profile.profession || ""}
                        readOnly
                        className={inputReadOnlyClass}
                        placeholder="Non renseigné"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className={labelClass}>Genre</label>
                      <div className="flex gap-6 text-sm">
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value="Homme"
                            checked={gender === "Homme"}
                            onChange={() => handleGenderChange("Homme")}
                          />
                          <span>Homme</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value="Femme"
                            checked={gender === "Femme"}
                            onChange={() => handleGenderChange("Femme")}
                          />
                          <span>Femme</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                          <input
                            type="radio"
                            name="gender"
                            value="Autre"
                            checked={gender === "Autre"}
                            onChange={() => handleGenderChange("Autre")}
                          />
                          <span>Autre</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* COLONNE DROITE */}
              <div className="space-y-6">
                {/* Biographie */}
                <section className={sectionClass}>
                  <h3 className="text-md font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <FileText size={16} className="text-indigo-600" />{" "}
                    Biographie
                  </h3>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => profile.setBio(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm dark:text-white resize-none"
                    placeholder="Parlez-nous de vous..."
                  />
                  <p className="text-right text-[10px] text-slate-400 mt-1">
                    {profile.bio?.length || 0}/300
                  </p>
                </section>

                {/* Adresse */}
                <section className={sectionClass}>
                  <h3 className="text-md font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <MapPin size={16} className="text-indigo-600" /> Adresse
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelClass}>Gouvernorat</label>
                      <input
                        type="text"
                        value={profile.governorate || ""}
                        readOnly
                        className={inputReadOnlyClass}
                        placeholder="Non renseigné"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Délégation / Ville</label>
                      <input
                        type="text"
                        value={profile.delegation || ""}
                        readOnly
                        className={inputReadOnlyClass}
                        placeholder="Non renseigné"
                      />
                    </div>
                  </div>
                </section>

                {/* Comment connu */}
                <section className={sectionClass}>
                  <label className={labelClass}>
                    Comment nous avez-vous connu ?
                  </label>
                  <select
                    value={profile.howFound}
                    onChange={(e) => profile.setHowFound(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Sélectionner</option>
                    <option value="google">Google</option>
                    <option value="social">Réseaux sociaux</option>
                    <option value="friend">Recommandation</option>
                    <option value="ads">Publicité</option>
                    <option value="other">Autre</option>
                  </select>
                </section>

                {/* Langues */}
                <section className={sectionClass}>
                  <h3 className="text-md font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <Languages size={16} className="text-indigo-600" /> Langues
                    parlées
                  </h3>

                  {selectedLanguages.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {selectedLanguages.map((lang) => (
                        <span
                          key={lang}
                          className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs rounded-full flex items-center gap-1"
                        >
                          {lang}
                          <X
                            size={11}
                            className="cursor-pointer hover:text-red-500"
                            onClick={() => handleRemoveLanguage(lang)}
                          />
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative" data-lang-dropdown>
                    <button
                      type="button"
                      onClick={() => setLangDropdownOpen((prev) => !prev)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-left flex items-center justify-between hover:border-indigo-400 transition-colors dark:text-white"
                    >
                      <span className="text-slate-500 dark:text-slate-400">
                        Sélectionner une langue...
                      </span>
                      <svg
                        className={`w-4 h-4 text-slate-400 transition-transform ${langDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {langDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg overflow-hidden">
                        {AVAILABLE_LANGUAGES.filter(
                          (lang) => !selectedLanguages.includes(lang),
                        ).length === 0 ? (
                          <p className="px-3 py-3 text-xs text-slate-400 text-center">
                            Toutes les langues sont sélectionnées
                          </p>
                        ) : (
                          AVAILABLE_LANGUAGES.filter(
                            (lang) => !selectedLanguages.includes(lang),
                          ).map((lang) => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => {
                                const updated = [...selectedLanguages, lang];
                                setSelectedLanguages(updated);
                                profile.setLanguages(updated);
                                setLangDropdownOpen(false);
                              }}
                              className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                            >
                              {lang}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* Section bancaire (propriétaire uniquement) */}
                {isLandlord && (
                  <section className={sectionClass}>
                    <h3 className="text-md font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <CreditCard size={16} className="text-indigo-600" />{" "}
                      Coordonnées bancaires
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className={labelClass}>RIB / IBAN</label>
                        <input
                          type="text"
                          value={profile.rib || ""}
                          onChange={(e) => profile.setRib(e.target.value)}
                          placeholder="Ex: TN59 1234 5678 9012 3456 7890"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Banque</label>
                        <input
                          type="text"
                          value={profile.bankName || ""}
                          onChange={(e) => profile.setBankName(e.target.value)}
                          placeholder="Ex: BIAT, Attijari..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Titulaire</label>
                        <input
                          type="text"
                          value={profile.accountHolder || ""}
                          onChange={(e) =>
                            profile.setAccountHolder(e.target.value)
                          }
                          placeholder="Nom complet du titulaire"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </section>
                )}

                {/* Bouton Enregistrer */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => {
                      if (profile.setLanguages) {
                        profile.setLanguages(selectedLanguages);
                      }
                      profile.handleSave();
                    }}
                    disabled={profile.isLoading}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {profile.isLoading ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Enregistrer"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
