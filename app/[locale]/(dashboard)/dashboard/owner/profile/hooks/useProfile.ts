"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

interface AvailabilitySlot {
  day: string;
  hours: string;
  enabled: boolean;
}

// Interface pour les données du profil (alignée avec l'API)
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
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

// Interface pour les stats (alignée avec l'API)
interface UserStats {
  totalListings: number;
  totalBookings: number;
  totalReviews: number;
  totalEarned: number;
  responseRate: number;
  responseTime: string;
  completionRate: number;
  badges: string[];
  reliabilityScore: number;
  averageRating: number;
  memberSince: string;
}

const defaultAvailability: AvailabilitySlot[] = [
  { day: "Monday", hours: "09:00 - 19:00", enabled: true },
  { day: "Tuesday", hours: "09:00 - 19:00", enabled: true },
  { day: "Wednesday", hours: "09:00 - 19:00", enabled: true },
  { day: "Thursday", hours: "09:00 - 19:00", enabled: true },
  { day: "Friday", hours: "09:00 - 19:00", enabled: true },
  { day: "Saturday", hours: "10:00 - 15:00", enabled: true },
  { day: "Sunday", hours: "Fermé", enabled: false },
];

const commonLanguages = [
  "Français",
  "Arabe",
  "Anglais",
  "Espagnol",
  "Allemand",
  "Italien",
  "Turc",
  "Russe",
  "Chinois",
  "Portugais",
];

interface ToastState {
  type: "success" | "error";
  message: string;
}

export function useProfile(
  setToast: React.Dispatch<React.SetStateAction<ToastState | null>>,
) {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [originalData, setOriginalData] = useState<any>(null);
  const [originalUsername, setOriginalUsername] = useState("");
  const [userId, setUserId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState<"tenant" | "owner" | "professional">(
    "owner",
  );
  const [bio, setBio] = useState("");
  const [profession, setProfession] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Français", "Arabe"]);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(
    null,
  );
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null,
  );
  const [availability, setAvailability] =
    useState<AvailabilitySlot[]>(defaultAvailability);

  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Statistiques
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [responseTime, setResponseTime] = useState("--");
  const [completionRate, setCompletionRate] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const [memberSince, setMemberSince] = useState("");

  // Trust score
  const [trustScore, setTrustScore] = useState(0);
  const [positiveReviews, setPositiveReviews] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [idVerifiedDate, setIdVerifiedDate] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderSent, setReminderSent] = useState(false);
  const [waitTimeRemaining, setWaitTimeRemaining] = useState<number | null>(
    null,
  );

  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [tempHours, setTempHours] = useState("");
  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 300;
  const bioLength = bio.length;

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const checkUsernameUniqueness = useCallback(
    async (usernameValue: string) => {
      if (usernameValue === originalUsername) {
        setUsernameError("");
        return true;
      }

      if (usernameValue.length < 3) {
        setUsernameError(
          "Le nom d'utilisateur doit contenir au moins 3 caractères",
        );
        return false;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
        setUsernameError(
          "Utilisez uniquement des lettres, chiffres et underscores",
        );
        return false;
      }

      setIsCheckingUsername(true);
      try {
        const token = await getToken({ template: "my-app-template" });
        const response = await fetch(
          `/api/users/by-username/${encodeURIComponent(usernameValue)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 404) {
          setUsernameError("");
          return true;
        }

        if (response.ok) {
          const userData = await response.json();
          if (userData.id !== userId) {
            setUsernameError("Ce nom d'utilisateur est déjà pris");
            return false;
          }
        }
        setUsernameError("");
        return true;
      } catch (error) {
        console.error("Erreur vérification username:", error);
        return true;
      } finally {
        setIsCheckingUsername(false);
      }
    },
    [getToken, originalUsername, userId],
  );

  useEffect(() => {
    if (!usernameTouched) return;
    const timer = setTimeout(() => {
      if (username) {
        checkUsernameUniqueness(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, usernameTouched, checkUsernameUniqueness]);

  // Récupérer les données utilisateur
  const fetchUserData = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;

        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setUsername(user.username || "");
        setOriginalUsername(user.username || "");
        setUserId(user.id || "");
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
        setTrustScore(user.trustScore || 50);
        setMemberSince(user.memberSince || new Date().getFullYear().toString());
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [getToken]);

  // Récupérer les statistiques
  const fetchUserStats = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;

        // ✅ Aligné avec les champs retournés par l'API
        setTotalProperties(stats.totalListings || 0);
        setTotalBookings(stats.totalBookings || 0);
        setTotalReviews(stats.totalReviews || 0);
        setTotalEarnings(stats.totalEarned || 0);
        setResponseRate(stats.responseRate || 0);
        setResponseTime(stats.responseTime || "--");
        setCompletionRate(stats.completionRate || 0);
        setBadges(stats.badges || []);

        // ✅ Mettre à jour trustScore avec reliabilityScore si disponible
        if (stats.reliabilityScore) {
          setTrustScore(stats.reliabilityScore);
        }

        // ✅ Mettre à jour memberSince si l'API le fournit
        if (stats.memberSince) {
          setMemberSince(stats.memberSince);
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  }, [getToken]);

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
        showToast("success", "Photo de profil mise à jour avec succès !");
        return true;
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading picture:", error);
      showToast("error", "Échec du téléchargement de la photo");
      return false;
    } finally {
      setUploadingPicture(false);
    }
  }, [profilePictureFile, getToken]);

  const handleSave = useCallback(async () => {
    const isUsernameValid = await checkUsernameUniqueness(username);
    if (!isUsernameValid) {
      showToast("error", "Veuillez corriger le nom d'utilisateur");
      return;
    }

    setSaving(true);

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
          username,
          phone,
          userType,
          bio,
          profession,
          languages,
          availability,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (profilePictureFile) {
          await uploadProfilePicture();
        }

        showToast("success", "Profil mis à jour avec succès !");
        setIsEditing(false);
        setOriginalData(null);
        setOriginalUsername(username);
        setUsernameTouched(false);

        await fetchUserData();
        await fetchUserStats();
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Échec de l'enregistrement",
      );
    } finally {
      setSaving(false);
    }
  }, [
    firstName,
    lastName,
    username,
    phone,
    userType,
    bio,
    profession,
    languages,
    availability,
    profilePictureFile,
    getToken,
    uploadProfilePicture,
    fetchUserData,
    fetchUserStats,
    checkUsernameUniqueness,
  ]);

  const handleEdit = useCallback(() => {
    setOriginalData({
      firstName,
      lastName,
      username,
      userType,
      bio,
      profession,
      languages: [...languages],
      availability: [...availability],
    });
    setOriginalUsername(username);
    setIsEditing(true);
    showToast("success", "Mode édition activé");
  }, [
    firstName,
    lastName,
    username,
    userType,
    bio,
    profession,
    languages,
    availability,
  ]);

  const handleCancel = useCallback(() => {
    if (originalData) {
      setFirstName(originalData.firstName);
      setLastName(originalData.lastName);
      setUsername(originalData.username);
      setOriginalUsername(originalData.username);
      setUserType(originalData.userType);
      setBio(originalData.bio);
      setProfession(originalData.profession);
      setLanguages([...originalData.languages]);
      setAvailability([...originalData.availability]);
    }
    setIsEditing(false);
    setOriginalData(null);
    setUsernameError("");
    setUsernameTouched(false);
    showToast("success", "Modifications annulées");
  }, [originalData]);

  const addLanguage = useCallback(
    (lang: string) => {
      if (lang && !languages.includes(lang)) {
        setLanguages((prev) => [...prev, lang]);
        showToast("success", `Langue "${lang}" ajoutée`);
      }
      setNewLanguage("");
      setShowLanguageInput(false);
    },
    [languages],
  );

  const removeLanguage = useCallback((lang: string) => {
    setLanguages((prev) => prev.filter((l) => l !== lang));
    showToast("success", `Langue "${lang}" supprimée`);
  }, []);

  const handleProfilePictureChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast("error", "Image trop volumineuse. Taille maximale : 5 Mo.");
          return;
        }
        if (!file.type.startsWith("image/")) {
          showToast(
            "error",
            "Veuillez sélectionner un fichier image (JPG, PNG).",
          );
          return;
        }
        setProfilePictureFile(file);
        const localPreview = URL.createObjectURL(file);
        setProfilePictureUrl(localPreview);
      }
    },
    [],
  );

  const removeProfilePicture = useCallback(() => {
    setProfilePictureFile(null);
    setProfilePictureUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    showToast("success", "Photo de profil supprimée");
  }, []);

  const updateAvailabilitySlot = useCallback((day: string, hours: string) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, hours, enabled: true } : slot,
      ),
    );
    setEditingSlot(null);
    setTempHours("");
    showToast("success", `Disponibilité mise à jour pour ${day}`);
  }, []);

  const toggleAvailabilityDay = useCallback((day: string) => {
    setAvailability((prev) =>
      prev.map((slot) =>
        slot.day === day ? { ...slot, enabled: !slot.enabled } : slot,
      ),
    );
  }, []);

  const startEditSlot = useCallback((day: string, currentHours: string) => {
    setEditingSlot(day);
    setTempHours(currentHours);
  }, []);

  const cancelEditSlot = useCallback(() => {
    setEditingSlot(null);
    setTempHours("");
  }, []);

  const sendVerificationReminder = useCallback(async () => {
    setSendingReminder(true);

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
        showToast("success", "Rappel envoyé à l'administrateur !");
        setReminderSent(true);
        setWaitTimeRemaining(null);
      } else if (response.status === 429) {
        const waitTime = data.waitTime || 24;
        setWaitTimeRemaining(waitTime);
        showToast(
          "error",
          `Veuillez patienter ${waitTime} heures avant d'envoyer un nouveau rappel`,
        );
      } else {
        throw new Error(data.error || "Failed to send reminder");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      showToast("error", "Erreur lors de l'envoi du rappel");
    } finally {
      setSendingReminder(false);
    }
  }, [clerkUser?.id, getToken]);

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
    if (trustScore >= 90)
      return {
        label: "Superhôte",
        color: "text-amber-600 dark:text-amber-400",
      };
    if (trustScore >= 75)
      return {
        label: "Expert",
        color: "text-emerald-600 dark:text-emerald-400",
      };
    if (trustScore >= 50)
      return { label: "Fiable", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Nouveau", color: "text-slate-500 dark:text-slate-400" };
  })();

  return {
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
    usernameError,
    isCheckingUsername,
    usernameTouched,
    totalProperties,
    totalBookings,
    totalReviews,
    totalEarnings,
    responseRate,
    responseTime,
    completionRate,
    badges,
    memberSince,
    setFirstName,
    setLastName,
    setUsername,
    setUsernameTouched,
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
