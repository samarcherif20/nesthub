"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";

export function useTenantProfile(userData: any) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  // Données pré-remplies (readonly)
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [cinNumber, setCinNumber] = useState("");
  const [profession, setProfession] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [delegation, setDelegation] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [gender, setGender] = useState("");

  // Champs à remplir
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Français"]);
  const [howFound, setHowFound] = useState("");

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
      setProfilePhoto(userData.profilePictureUrl || null);
      setGovernorate(userData.governorate || "");
      setDelegation(userData.delegation || "");
       let genderValue = userData.gender;
    let genderFromPassport = userData.cinData?.sex;
    
    if (genderFromPassport) {
      // Si le passeport a fourni un sexe, on le prend (priorité)
      if (genderFromPassport === "MALE") setGender("Homme");
      else if (genderFromPassport === "FEMALE") setGender("Femme");
      else setGender(genderFromPassport);
    } else if (genderValue) {
      // Sinon, on prend la valeur existante dans userData
      if (genderValue === "MALE") setGender("Homme");
      else if (genderValue === "FEMALE") setGender("Femme");
      else setGender(genderValue);
    }
      setHowFound(userData.howFound || "");
      if (userData.spokenLanguages?.length)
        setLanguages(userData.spokenLanguages);
    }
  }, [userData]);

  const updateProfilePhoto = (url: string | null) => setProfilePhoto(url);
  const setLanguagesWrapper = (newLanguages: string[]) =>
    setLanguages(newLanguages);

  const handleSave = async () => {
    setIsLoading(true);
    const clerkId = user?.id || localStorage.getItem("currentUserId");
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
          dateNaissance: birthDate,
          cinNumber,
          profession,
          bio,
          languages,
          gender,
          governorate,
          delegation,
          howFound,
        }),
      });

      if (response.ok) {
        toast.success("Profil locataire enregistré !");
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

  const handleSkip = () => router.push("/fr/search");

  return {
    isLoading,
    firstName,
    lastName,
    phone,
    birthDate,
    cinNumber,
    profession,
    profilePhoto,
    updateProfilePhoto,
    governorate,
    delegation,
    gender,
    setGender,
    bio,
    setBio,
    languages,
    setLanguages: setLanguagesWrapper,
    howFound,
    setHowFound,
    handleSave,
    handleSkip,
  };
}
