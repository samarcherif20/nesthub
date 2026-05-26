"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

const commonLanguages = [
  "Français", "Arabe", "Anglais", "Espagnol", "Allemand",
  "Italien", "Turc", "Russe", "Chinois", "Portugais",
];

export function useTenantProfile() {
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
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["Français", "Arabe"]);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  // Validation username
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  // Trust & verification
  const [trustScore, setTrustScore] = useState(0);
  const [positiveReviews, setPositiveReviews] = useState(0);
  const [idVerified, setIdVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  // Statistiques tenant
  const [totalTrips, setTotalTrips] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [favoriteDestinations, setFavoriteDestinations] = useState(0);
  const [responseRate, setResponseRate] = useState(0);
  const [completionRate, setCompletionRate] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);

  const [showLanguageInput, setShowLanguageInput] = useState(false);
  const [newLanguage, setNewLanguage] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bioMaxLength = 300;
  const bioLength = bio.length;

  // Vérification unicité username
  const checkUsernameUniqueness = useCallback(async (usernameValue: string) => {
    if (usernameValue === originalUsername) {
      setUsernameError("");
      return true;
    }
    if (usernameValue.length < 3) {
      setUsernameError("Le nom d'utilisateur doit contenir au moins 3 caractères");
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
      setUsernameError("Utilisez uniquement des lettres, chiffres et underscores");
      return false;
    }
    setIsCheckingUsername(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch(`/api/users/by-username/${encodeURIComponent(usernameValue)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 404) {
        setUsernameError("");
        return true;
      }
      if (response.ok) {
        const user = await response.json();
        if (user.id !== userId) {
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
  }, [getToken, originalUsername, userId]);

  useEffect(() => {
    if (!usernameTouched) return;
    const timer = setTimeout(() => {
      if (username) checkUsernameUniqueness(username);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, usernameTouched, checkUsernameUniqueness]);

  // Fetch données utilisateur
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
        setBio(user.bio || "");
        setLanguages(user.languages || ["Français", "Arabe"]);
        setProfilePictureUrl(user.profilePictureUrl || null);
        setIdVerified(user.idVerified ?? false);
        setEmailVerified(user.emailVerified ?? false);
        setPhoneVerified(user.phoneVerified ?? false);
        setPositiveReviews(user.positiveReviews || 0);
        setTrustScore(user.trustScore || 50);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, [getToken]);

  // Fetch statistiques tenant
  const fetchTenantStats = useCallback(async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/tenant-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const stats = data.stats;
        setTotalTrips(stats.totalTrips || 0);
        setTotalBookings(stats.totalBookings || 0);
        setTotalReviews(stats.totalReviews || 0);
        setTotalSpent(stats.totalSpent || 0);
        setFavoriteDestinations(stats.favoriteDestinations || 0);
        setResponseRate(stats.responseRate || 0);
        setCompletionRate(stats.completionRate || 0);
        setBadges(stats.badges || []);
      }
    } catch (error) {
      console.error("Error fetching tenant stats:", error);
    }
  }, [getToken]);

  // Upload photo
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
        toast.success("Photo de profil mise à jour !");
        return true;
      }
      throw new Error("Upload failed");
    } catch (error) {
      console.error("Error uploading picture:", error);
      toast.error("Échec du téléchargement");
      return false;
    } finally {
      setUploadingPicture(false);
    }
  }, [profilePictureFile, getToken]);

  // Sauvegarde
  const handleSave = useCallback(async () => {
    const isUsernameValid = await checkUsernameUniqueness(username);
    if (!isUsernameValid) {
      toast.error("Veuillez corriger le nom d'utilisateur");
      return;
    }
    setSaving(true);
    const toastId = toast.loading("Enregistrement...");
    try {
      const token = await getToken({ template: "my-app-template" });
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName, lastName, username, phone, bio, languages }),
      });
      const data = await response.json();
      if (response.ok) {
        if (profilePictureFile) await uploadProfilePicture();
        toast.success("Profil mis à jour !", { id: toastId });
        setIsEditing(false);
        setOriginalUsername(username);
        setUsernameTouched(false);
        await fetchUserData();
        await fetchTenantStats();
      } else {
        throw new Error(data.error || "Save failed");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Échec de l'enregistrement", { id: toastId });
    } finally {
      setSaving(false);
    }
  }, [firstName, lastName, username, phone, bio, languages, profilePictureFile, getToken, uploadProfilePicture, fetchUserData, fetchTenantStats, checkUsernameUniqueness]);

  const handleEdit = useCallback(() => {
    setOriginalData({ firstName, lastName, username, bio, languages: [...languages] });
    setOriginalUsername(username);
    setIsEditing(true);
  }, [firstName, lastName, username, bio, languages]);

  const handleCancel = useCallback(() => {
    if (originalData) {
      setFirstName(originalData.firstName);
      setLastName(originalData.lastName);
      setUsername(originalData.username);
      setOriginalUsername(originalData.username);
      setBio(originalData.bio);
      setLanguages([...originalData.languages]);
    }
    setIsEditing(false);
    setUsernameError("");
    setUsernameTouched(false);
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
  }, []);

  const handleProfilePictureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image trop volumineuse (max 5 Mo)");
        return;
      }
      setProfilePictureFile(file);
      setProfilePictureUrl(URL.createObjectURL(file));
    }
  }, []);

  const removeProfilePicture = useCallback(() => {
    setProfilePictureFile(null);
    setProfilePictureUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!isUserLoaded || !clerkUser) return;
    const loadAll = async () => {
      setLoading(true);
      await fetchUserData();
      await fetchTenantStats();
      setLoading(false);
    };
    loadAll();
  }, [clerkUser, getToken, isUserLoaded, fetchUserData, fetchTenantStats]);

  const trustLevel = (() => {
    if (trustScore >= 85) return { label: "Expert voyageur", color: "text-emerald-600 dark:text-emerald-400" };
    if (trustScore >= 60) return { label: "Voyageur confirmé", color: "text-teal-600 dark:text-teal-400" };
    if (trustScore >= 30) return { label: "Explorateur", color: "text-blue-600 dark:text-blue-400" };
    return { label: "Nouveau voyageur", color: "text-slate-500 dark:text-slate-400" };
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
    bio,
    languages,
    profilePictureUrl,
    trustScore,
    positiveReviews,
    idVerified,
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
    totalTrips,
    totalBookings,
    totalReviews,
    totalSpent,
    favoriteDestinations,
    responseRate,
    completionRate,
    badges,
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
  };
}