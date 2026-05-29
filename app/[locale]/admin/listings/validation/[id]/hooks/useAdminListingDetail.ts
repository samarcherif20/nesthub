// app/[locale]/admin/listings/validation/hooks/useAdminListingDetail.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export interface ListingDetail {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  governorate: string;
  delegation: string;
  street: string;
  latitude: number | null;
  longitude: number | null;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  cleaningFee: number | null;
  securityDeposit: number | null;
  rooms: number;
  bathrooms: number;
  numberOfKitchens: number;
  surfaceArea: number;
  maxGuests: number;
  floorNumber: number;
  hasElevator: boolean;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  isFurnished: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
  viewCount: number;
  bookingCount: number;
  totalRevenue: number;
  favoriteCount: number;
  rentalType: string;
  hasPendingRevision?: boolean;
  pendingRevisionData?: {
    changes: Array<{ field: string; oldValue: any; newValue: any }>;
    submittedAt?: Date;
  };
  equipment: Record<string, boolean>;
  services: Record<string, boolean>;
  houseRules: Record<string, boolean>;
  customRules: string;
  photos: Array<{ url: string; thumbnailUrl: string; isMain: boolean }>;
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    profilePictureUrl: string | null;
    isIdentityVerified: boolean;
    createdAt: Date;
    stats: { averageRating: number; totalReviews: number };
    bio?: string | null;
  };
  upcomingBookings: Array<{
    id: string;
    tenantName: string;
    tenantAvatar: string | null;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    status: string;
    totalPrice: number;
  }>;
  createdAt: Date;
  publishedAt: Date | null;
  rejectionReason: string | null;

  ownerBio?: string | null;
  equipmentList?: Array<{ name: string; icon: string }>;
  houseRulesList?: string[];
}

export interface ToastState {
  msg: string;
  type: "success" | "error" | "info";
}

export function useAdminListingDetail(
  listingId: string,
  locale: string = "fr",
) {
  const { getToken } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminListingDetail");

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionDetails, setRejectionDetails] = useState("");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [showChanges, setShowChanges] = useState(false);

  const showToast = (
    msg: string,
    type: "success" | "error" | "info" = "info",
  ) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return "";
    if (
      url.includes("vercel-storage.com") ||
      url.includes("googleusercontent.com")
    ) {
      return `/api/listings/image?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // Prend en compte les équipements de la révision
  const getEquipmentList = (
    equipment: Record<string, boolean>,
    pendingRevisionData?: {
      changes: Array<{ field: string; oldValue: any; newValue: any }>;
    },
  ): Array<{ name: string; icon: string }> => {
    if (!equipment) return [];

    // Récupérer les équipements actifs actuels
    let activeEquipment = Object.entries(equipment)
      .filter(([, v]) => v === true)
      .map(([k]) => k);

    // Si des changements sont en attente, appliquer les modifications
    if (pendingRevisionData?.changes) {
      for (const change of pendingRevisionData.changes) {
        if (change.field === "equipment") {
          // Cas où tout l'objet equipment a été modifié
          const newEquip = change.newValue || {};
          activeEquipment = Object.entries(newEquip)
            .filter(([, v]) => v === true)
            .map(([k]) => k);
        } else if (change.field.startsWith("equipment.")) {
          const equipName = change.field.replace("equipment.", "");
          const newValue = change.newValue;
          if (newValue === true) {
            if (!activeEquipment.includes(equipName))
              activeEquipment.push(equipName);
          } else {
            activeEquipment = activeEquipment.filter((e) => e !== equipName);
          }
        }
      }
    }

    return activeEquipment.map((key) => ({
      name: key,
      icon: key,
    }));
  };

  // Dans useAdminListingDetail.ts, dans getHouseRulesList
  const getHouseRulesList = (
    houseRules: Record<string, boolean>,
    customRules: string,
    listingData: any,
    pendingRevisionData?: {
      changes: Array<{ field: string; oldValue: any; newValue: any }>;
    },
  ): string[] => {
    // Règles de base
    let rules: string[] = [];

    if (houseRules?.noSmoking === true) rules.push("noSmoking");
    if (houseRules?.noPets === true) rules.push("noPets");
    if (houseRules?.noParties === true) rules.push("noParties");
    if (houseRules?.childrenAllowed === true) rules.push("childrenAllowed");
    if (houseRules?.quietAfter22 === true) rules.push("quietAfter22"); // ✅ AJOUTE CETTE LIGNE
    if (listingData?.petsAllowed === true) rules.push("petsAllowed");
    if (listingData?.smokingAllowed === true) rules.push("smokingAllowed");
    if (customRules) rules.push(customRules);

    // Appliquer les modifications de la révision
    if (pendingRevisionData?.changes) {
      for (const change of pendingRevisionData.changes) {
        if (change.field === "houseRules") {
          const newRules = change.newValue || {};
          rules = [];
          if (newRules.noSmoking === true) rules.push("noSmoking");
          if (newRules.noPets === true) rules.push("noPets");
          if (newRules.noParties === true) rules.push("noParties");
          if (newRules.childrenAllowed === true) rules.push("childrenAllowed");
          if (newRules.quietAfter22 === true) rules.push("quietAfter22"); // ✅ AJOUTE CETTE LIGNE
        } else if (change.field === "petsAllowed") {
          if (change.newValue === true && !rules.includes("petsAllowed"))
            rules.push("petsAllowed");
          else if (change.newValue !== true)
            rules = rules.filter((r) => r !== "petsAllowed");
        } else if (change.field === "smokingAllowed") {
          if (change.newValue === true && !rules.includes("smokingAllowed"))
            rules.push("smokingAllowed");
          else if (change.newValue !== true)
            rules = rules.filter((r) => r !== "smokingAllowed");
        } else if (change.field.startsWith("houseRules.")) {
          const ruleName = change.field.replace("houseRules.", "");
          if (change.newValue === true && !rules.includes(ruleName))
            rules.push(ruleName);
          else if (change.newValue !== true)
            rules = rules.filter((r) => r !== ruleName);
        }
      }
    }

    return rules;
  };
  const fetchListing = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/listings/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      const pendingRevisionData = data.pendingRevisionData;
      const equipmentList = getEquipmentList(
        data.equipment || {},
        pendingRevisionData,
      );
      const houseRulesList = getHouseRulesList(
        data.houseRules || {},
        data.customRules || "",
        data,
        pendingRevisionData,
      );

      setListing({
        ...data,
        equipmentList,
        houseRulesList,
        ownerBio: data.owner?.bio || null,
      });
    } catch (error) {
      console.error("Error fetching listing:", error);
      showToast(t("fetchError"), "error");
    } finally {
      setLoading(false);
    }
  }, [getToken, listingId, t]);

  const handleValidate = async (
    action: "approve" | "reject",
  ): Promise<{ success: boolean; message: string }> => {
    if (action === "reject" && !rejectionReason) {
      return { success: false, message: t("rejectionRequired") };
    }

    setActionLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/listings/${listingId}/validate`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action,
          rejectionReason:
            action === "reject"
              ? `${rejectionReason}${rejectionDetails ? ` — ${rejectionDetails}` : ""}`
              : undefined,
          isRevision: listing?.hasPendingRevision ?? false,
        }),
      });

      if (!res.ok) throw new Error();

      const isRev = listing?.hasPendingRevision;
      let successMessage = "";

      if (isRev) {
        successMessage =
          action === "approve"
            ? t("modificationApproved")
            : t("modificationRejected");
      } else {
        successMessage =
          action === "approve" ? t("listingApproved") : t("listingRejected");
      }

      setActionLoading(false);
      return { success: true, message: successMessage };
    } catch (error) {
      console.error("Error:", error);
      setActionLoading(false);
      return { success: false, message: t("operationError") };
    }
  };

  useEffect(() => {
    fetchListing();
  }, [fetchListing]);

  const isPending = listing?.status === "PENDING_REVIEW";
  const isRevision = !!(
    listing?.hasPendingRevision && listing?.status === "ACTIVE"
  );
  const needsValidation = isPending || isRevision;

  //  Photos pour l'affichage miniature (1 grande + 4 petites)
  const mainPhoto =
    listing?.photos?.find((p) => p.isMain) ?? listing?.photos?.[0];
  const otherPhotos =
    listing?.photos?.filter((p) => !p.isMain && p.url !== mainPhoto?.url) ?? [];
  const displayPhotos = [mainPhoto, ...otherPhotos.slice(0, 4)].filter(
    Boolean,
  ) as typeof listing.photos;

  //  TOUTES les photos pour la lightbox (sans limite)
  const allPhotos = listing?.photos ?? [];

  // Vérifier s'il y a des photos supplémentaires cachées
  const hasMorePhotos = otherPhotos.length > 4;
  const hiddenPhotosCount = otherPhotos.length - 4;
  const activeEquipment = listing?.equipmentList || [];

  const statusCfg = (() => {
    const status = listing?.status || "DRAFT";
    return {
      label: status,
      bg: "",
      text: "",
      dot: "",
    };
  })();

  const formatPrice = (price: number | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "TND",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: Date) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return {
    listing,
    loading,
    actionLoading,
    rejectionReason,
    rejectionDetails,
    toast,
    lightboxImg,
    showChanges,
    isPending,
    isRevision,
    needsValidation,
    displayPhotos,
    allPhotos,
    hasMorePhotos,
    hiddenPhotosCount,
    activeEquipment,
    statusCfg,
    setRejectionReason,
    setRejectionDetails,
    setLightboxImg,
    setShowChanges,
    setToast,
    getImageUrl,
    handleValidate,
    formatPrice,
    formatDate,
    fetchListing,
  };
}
