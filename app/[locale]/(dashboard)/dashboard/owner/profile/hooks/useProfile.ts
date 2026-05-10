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
  stats?: {
    totalBookings: number;
    totalListings: number;
    totalReviews: number;
    totalEarned: number;
    responseRate: number;
  };
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
  const [isEditing, setIsEditing] = useState(false);

  const [originalData, setOriginalData] = useState<{
    firstName: string;
    lastName: string;
    userType: "tenant" | "owner" | "professional";
    bio: string;
    profession: string;
    languages: string[];
    availability: AvailabilitySlot[];
  } | null>(null);

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

  // 📊 STATISTIQUES DYNAMIQUES (viennent de l'API /api/users/stats)
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [responseTime, setResponseTime] = useState("--");
  const [completionRate, setCompletionRate] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  // Trust score state
  const [trustScore, setTrustScore] = useState(0);
  const [positiveReviews, setPositiveReviews] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [idVerifiedDate, setIdVerifiedDate] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number | null>(null);

  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [tempHours, setTempHours] = useState("");

  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const bioMaxLength = 300;
  const bioLength = bio.length;

  const sendVerificationReminder = useCallback(async () => {
    setSendingReminder(true);
    const toastId = toast.loading("Envoi du rappel...");

    try {
      const token = await getToken({ template: "my-app-template" });
      
      const response = await fetch("/api/admin/verification-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: clerkUser?.id,
          message: "L'utilisateur demande une vérification de son identité",
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Rappel envoyé à l'administrateur !", { id: toastId });
        setReminderSent(true);
        setWaitTimeRemaining(null);
      } else if (response.status === 429) {
        const waitTime = data.waitTime || 24;
        setWaitTimeRemaining(waitTime);
        toast.error(`Veuillez patienter ${waitTime} heures avant d'envoyer un nouveau rappel`, { id: toastId });
      } else {
        throw new Error(data.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      toast.error("Erreur lors de l'envoi du rappel", { id: toastId });
    } finally {
      setSendingReminder(false);
    }
  }, [clerkUser?.id, getToken]);

  const updateAvailabilitySlot = useCallback((day: string, hours: string) => {
    setAvailability(prev => prev.map(slot => 
      slot.day === day ? { ...slot, hours, enabled: true } : slot
    ));
    setEditingSlot(null);
    setTempHours("");
    toast.success(`Disponibilité mise à jour pour ${day}`);
  }, []);

  const toggleAvailabilityDay = useCallback((day: string) => {
    setAvailability(prev => prev.map(slot =>
      slot.day === day ? { ...slot, enabled: !slot.enabled } : slot
    ));
  }, []);

  const startEditSlot = useCallback((day: string, currentHours: string) => {
    setEditingSlot(day);
    setTempHours(currentHours);
  }, []);

  const cancelEditSlot = useCallback(() => {
    setEditingSlot(null);
    setTempHours("");
  }, []);

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
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      setProfilePictureUrl(localPreview);
    }
  }, []);

  const removeProfilePicture = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setProfilePictureFile(null);
    setProfilePictureUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Photo de profil supprimée");
  }, [previewUrl]);

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
        setPreviewUrl(null);
        // Recharger les données après sauvegarde
        await fetchUserData();
        await fetchUserStats();
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

  // 📊 Récupérer les statistiques depuis l'API existante /api/users/stats
  const fetchUserStats = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        
        setTotalProperties(stats.totalListings || 0);
        setTotalBookings(stats.totalBookings || 0);
        setTotalReviews(stats.totalReviews || 0);
        setResponseRate(stats.responseRate || 0);
        setResponseTime(stats.responseTime || "--");
        setCompletionRate(stats.completionRate || 0);
        setBadges(stats.badges || []);
        setTrustScore(stats.reliabilityScore || 0);
        
        // Calculer les gains totaux approximatifs (à adapter selon ta logique)
        const estimatedEarnings = stats.totalBookings * 50; // Exemple
        setTotalEarnings(estimatedEarnings);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [getToken]);

  const fetchUserData = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user as UserProfile;

        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setEmail(user.email || "");
        setPhone(user.phone || "");
        setUserType(user.userType || "owner");
        setBio(user.bio || "");
        setProfession(user.profession || "");
        setLanguages(user.languages || ["Français", "Arabe"]);
        setProfilePictureUrl(user.profilePictureUrl || null);
        setAvailability(user.availability || defaultAvailability);
        setIdVerified(user.idVerified ?? false);
        setIdVerifiedDate(user.idVerifiedDate || "");
        setEmailVerified(user.emailVerified ?? false);
        setPhoneVerified(user.phoneVerified ?? false);
        setPositiveReviews(user.positiveReviews || 0);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [getToken]);

  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;

    const loadAllData = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchUserStats();
      setLoading(false);
    };

    loadAllData();
  }, [clerkUser, getToken, isUserLoaded, fetchUserData, fetchUserStats]);

  const trustLevel = (() => {
    if (trustScore >= 90) return { label: "Superhôte", color: "text-amber-600 dark:text-amber-400" };
    if (trustScore >= 75) return { label: "Expert", color: "text-emerald-600 dark:text-emerald-400" };
    if (trustScore >= 50) return { label: "Fiable", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Nouveau", color: "text-slate-500 dark:text-slate-400" };
  })();

  return {
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
    sendingReminder,
    reminderSent,
    waitTimeRemaining,
    editingSlot,
    tempHours,
    // 📊 STATISTIQUES DYNAMIQUES
    totalProperties,
    totalBookings,
    totalReviews,
    totalEarnings,
    responseRate,
    responseTime,
    completionRate,
    badges,
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
    sendVerificationReminder,
    updateAvailabilitySlot,
    toggleAvailabilityDay,
    startEditSlot,
    cancelEditSlot,
    setEditingSlot,
    setTempHours,
  };
}