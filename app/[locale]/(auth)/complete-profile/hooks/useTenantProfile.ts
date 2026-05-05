import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function useTenantProfile(userData: any) {
  const router = useRouter();
  const { user } = useUser();

  const [isLoading, setIsLoading] = useState(false);

  // ========== DONNÉES PRÉ-REMPLIES DEPUIS L'INSCRIPTION (readonly) ==========
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [delegation, setDelegation] = useState("");
  const [country, setCountry] = useState("tunisia");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

  // ========== CHAMPS À REMPLIR PAR L'UTILISATEUR ==========
  const [bio, setBio] = useState("");
  const [occupation, setOccupation] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [langInput, setLangInput] = useState("");

  // ========== PRÉFÉRENCES ==========
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [howFound, setHowFound] = useState("");

  // ========== QUESTIONS SUPPLÉMENTAIRES ==========
  const [housingType, setHousingType] = useState("");
  const [budget, setBudget] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [hasPets, setHasPets] = useState(false);
  const [isSmoker, setIsSmoker] = useState(false);

  // ========== AUTRES ==========
  const [gender, setGender] = useState("");

  const availableLanguages = [
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

  // ✅ FONCTION POUR METTRE À JOUR LES LANGUES
  const updateLanguages = (newLanguages: string[]) => {
    setLanguages(newLanguages);
  };

  // ✅ FONCTION POUR METTRE À JOUR LA PHOTO
  const updateProfilePhoto = (url: string | null) => {
    setProfilePhoto(url);
  };

  // Remplir les données depuis userData
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setPhone(userData.phoneNumber || "");
      setBirthDate(
        userData.dateOfBirth ? userData.dateOfBirth.split("T")[0] : "",
      );
      setCinNumber(userData.cinNumber || "");
      setProfession(userData.profession || "");
      setBio(userData.bio || "");
      setGovernorate(userData.governorate || userData.region || "");
      setDelegation(userData.delegation || userData.city || "");
      setProfilePhoto(userData.profilePictureUrl || null);
      setGender(userData.gender || "");

      if (userData.spokenLanguages) setLanguages(userData.spokenLanguages);
    }
  }, [userData]);

  const handleAddLanguage = (lang: string) => {
    if (lang && !languages.includes(lang)) {
      setLanguages([...languages, lang]);
    }
    setLangInput("");
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const clerkId = user?.id || localStorage.getItem("clerkUserId");
    if (!clerkId) {
      toast.error("Session expirée");
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch("/api/users/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: clerkId,
          firstName,
          lastName,
          phoneNumber: phone,
          birthDate,
          cinNumber,
          profession,
          bio,
          occupation,
          address: `${address}, ${city}, ${region}, ${postalCode}, ${country}`,
          languages,
          emailNotif,
          smsNotif,
          newsletter,
          howFound,
          gender,
          // Questions supplémentaires
          housingType,
          budget,
          moveInDate,
          hasPets,
          isSmoker,
        }),
      });

      if (response.ok) {
        toast.success("Profil enregistré !");
        router.push("/fr/search");
      } else {
        const error = await response.json();
        toast.error("Erreur", { description: error.error });
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => router.push("/fr/dashboard");

  const inputReadOnlyClass =
    "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed outline-none text-sm";
  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm";
  const labelClass =
    "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";
  const sectionClass =
    "bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm";

  return {
    isLoading,
    // Données pré-remplies (readonly)
    firstName,
    lastName,
    phone,
    setPhone,
    birthDate,
    setBirthDate,
    cinNumber,
    profession,
    address,
    setAddress,
    city,
    setCity,
    region,
    setRegion,
    postalCode,
    setPostalCode,
    country,
    setCountry,
    profilePhoto, // ← AJOUTÉ
    updateProfilePhoto, // ← AJOUTÉ
    governorate,
    delegation,
    gender,
    setGender,
    // Champs à remplir
    bio,
    setBio,
    occupation,
    setOccupation,
    languages,
    langInput,
    setLangInput,
    setLanguages: updateLanguages,
    // Préférences
    emailNotif,
    setEmailNotif,
    smsNotif,
    setSmsNotif,
    newsletter,
    setNewsletter,
    howFound,
    setHowFound,
    // Questions supplémentaires
    housingType,
    setHousingType,
    budget,
    setBudget,
    moveInDate,
    setMoveInDate,
    hasPets,
    setHasPets,
    isSmoker,
    setIsSmoker,
    // Actions
    handleAddLanguage,
    handleRemoveLanguage,
    handleSave,
    handleSkip,
    // Classes
    inputClass,
    inputReadOnlyClass,
    labelClass,
    sectionClass,
    availableLanguages,
    user,
  };
}
