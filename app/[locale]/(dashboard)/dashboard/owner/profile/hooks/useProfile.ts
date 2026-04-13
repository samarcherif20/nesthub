// app/[locale]/(dashboard)/owner/profile/hooks/useProfile.ts
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface AvailabilitySlot {
  day: string;
  hours: string;
  enabled: boolean;
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  userType: "tenant" | "owner" | "professional";
  bio: string;
  profession: string;
  languages: string[];
  profilePictureUrl: string | null;
  availability: AvailabilitySlot[];
  trustScore: number;
  memberSince: string;
  positiveReviews: number;
  idVerified: boolean;
  idVerifiedDate: string;
  emailVerified: boolean;
  phoneVerified: boolean;
}

const defaultAvailability: AvailabilitySlot[] = [
  { day: "Lun - Ven", hours: "09:00 - 19:00", enabled: true },
  { day: "Samedi", hours: "10:00 - 15:00", enabled: true },
  { day: "Dimanche", hours: "Fermé", enabled: false },
];

const commonLanguages = [
  "Français", "Arabe", "Anglais", "Espagnol", "Allemand",
  "Italien", "Turc", "Russe", "Chinois", "Portugais",
];

export function useProfile() {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Mode édition

  // Original data for cancel
  const [originalData, setOriginalData] = useState<{
    firstName: string;
    lastName: string;
    userType: "tenant" | "owner" | "professional";
    bio: string;
    profession: string;
    languages: string[];
    availability: AvailabilitySlot[];
  } | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"tenant" | "owner" | "professional">("owner");
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Français", "Arabe"]);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(defaultAvailability);

  // Trust score state
  const [trustScore, setTrustScore] = useState(94);
  const [memberSince, setMemberSince] = useState("2023");
  const [positiveReviews, setPositiveReviews] = useState(12);
  const [idVerified, setIdVerified] = useState(true);
  const [idVerifiedDate, setIdVerifiedDate] = useState("12 Mars 2023");
  const [emailVerified, setEmailVerified] = useState(true);
  const [phoneVerified, setPhoneVerified] = useState(true);

  // UI state
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 300;
  const bioLength = bio.length;

  // Enable edit mode
  const handleEdit = useCallback(() => {
    setOriginalData({
      firstName,
      lastName,
      userType,
      bio,
      profession,
      languages: [...languages],
      availability: [...availability],
    });
    setIsEditing(true);
    toast.info("Mode édition activé", { duration: 2000 });
  }, [firstName, lastName, userType, bio, profession, languages, availability]);

  // Cancel edit mode
  const handleCancel = useCallback(() => {
    if (originalData) {
      setFirstName(originalData.firstName);
      setLastName(originalData.lastName);
      setUserType(originalData.userType);
      setBio(originalData.bio);
      setProfession(originalData.profession);
      setLanguages([...originalData.languages]);
      setAvailability([...originalData.availability]);
    }
    setIsEditing(false);
    setOriginalData(null);
    toast.info("Modifications annulées", { duration: 2000 });
  }, [originalData]);

  const addLanguage = useCallback((lang: string) => {
    if (lang && !languages.includes(lang)) {
      setLanguages(prev => [...prev, lang]);
      toast.success(`Langue "${lang}" ajoutée`);
    }
    setNewLanguage("");
    setShowLanguageInput(false);
  }, [languages]);

  const removeLanguage = useCallback((lang: string) => {
    setLanguages(prev => prev.filter(l => l !== lang));
    toast.info(`Langue "${lang}" supprimée`);
  }, []);

  const handleProfilePictureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image trop volumineuse. Taille maximale : 5 Mo.");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner un fichier image (JPG, PNG).");
        return;
      }
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePictureUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeProfilePicture = useCallback(() => {
    setProfilePictureFile(null);
    setProfilePictureUrl(clerkUser?.imageUrl || null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Photo de profil supprimée");
  }, [clerkUser?.imageUrl]);

  const uploadProfilePicture = useCallback(async () => {
    if (!profilePictureFile) return;
    setUploadingPicture(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const formData = new FormData();
      formData.append("file", profilePictureFile);

      const response = await fetch("/api/users/avatar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfilePictureUrl(data.profilePictureUrl);
        toast.success("Photo de profil mise à jour avec succès !");
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading picture:", error);
      toast.error("Échec du téléchargement de la photo");
      return false;
    } finally {
      setUploadingPicture(false);
    }
  }, [profilePictureFile, getToken]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const toastId = toast.loading("Enregistrement en cours...");
    
    try {
      const token = await getToken({ template: "my-app-template" });

      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          userType,
          bio,
          profession,
          languages,
          availability,
        }),
      });

      if (response.ok) {
        if (profilePictureFile) {
          await uploadProfilePicture();
        }
        toast.success("Profil mis à jour avec succès !", { id: toastId });
        setIsEditing(false);
        setOriginalData(null);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Échec de l'enregistrement du profil", { id: toastId });
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, phone, userType, bio, profession, languages, availability, profilePictureFile, getToken, uploadProfilePicture]);

  // Load user data
  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;

    const fetchUserData = async () => {
      setLoading(true);
      const toastId = toast.loading("Chargement du profil...");
      
      try {
        const token = await getToken({ template: "my-app-template" });
        const response = await fetch("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user as UserProfile;

          setFirstName(user.firstName || clerkUser.firstName || "");
          setLastName(user.lastName || clerkUser.lastName || "");
          setEmail(user.email || clerkUser.emailAddresses[0]?.emailAddress || "");
          setPhone(user.phone || "");
          setUserType(user.userType || "owner");
          setBio(user.bio || "");
          setProfession(user.profession || "");
          setLanguages(user.languages || ["Français", "Arabe"]);
          setProfilePictureUrl(user.profilePictureUrl || clerkUser.imageUrl || null);
          setAvailability(user.availability || defaultAvailability);
          setTrustScore(user.trustScore || 94);
          setMemberSince(user.memberSince || "2023");
          setPositiveReviews(user.positiveReviews || 12);
          setIdVerified(user.idVerified ?? true);
          setIdVerifiedDate(user.idVerifiedDate || "12 Mars 2023");
          setEmailVerified(user.emailVerified ?? true);
          setPhoneVerified(user.phoneVerified ?? true);
          
          toast.success("Profil chargé", { id: toastId });
        } else {
          throw new Error("Failed to load profile");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        toast.error("Erreur lors du chargement du profil", { id: toastId });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [clerkUser, getToken, isUserLoaded]);

  const trustLevel = (() => {
    if (trustScore >= 90) return { label: "Superhôte", color: "text-amber-600 dark:text-amber-400" };
    if (trustScore >= 75) return { label: "Expert", color: "text-emerald-600 dark:text-emerald-400" };
    if (trustScore >= 50) return { label: "Fiable", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Nouveau", color: "text-slate-500 dark:text-slate-400" };
  })();

  return {
    // State
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
    
    // Actions
    setFirstName,
    setLastName,
    setUserType,
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
  };
}