"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  responseAt: string | null;
  createdAt: string;
  reviewer: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
  target: {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl: string | null;
  };
  booking: {
    checkIn: string;
    checkOut: string;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      type: string;
      photos: { url: string; isMain: boolean }[];
      pricePerNight?: number;
    };
  };
}

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePictureUrl?: string;
  createdAt: string;
}

interface UserStats {
  averageRating: number;
  totalReviews: number;
  reliabilityScore: number;
  totalBookings: number;
}

export function useReviews() {
  const t = useTranslations("Reviews");
  const tCommon = useTranslations("Common");
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"received" | "given">("received");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "rating_desc" | "rating_asc">("recent");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "replied" | "unreplied">("all");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });

      const reviewsRes = await fetch(`/api/reviews?tab=${tab}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        setReviews(data.reviews || []);
      }

      const profileRes = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.user || data);
      }

      const statsRes = await fetch("/api/users/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats || data);
      }
    } catch (error) {
      console.error(error);
      showToast("error", t("toasts.loadingError"));
    } finally {
      setLoading(false);
    }
  }, [getToken, tab, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReply = async (reviewId: string, response: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response }),
      });
      
      if (res.ok) {
        showToast("success", t("toasts.replySuccess"));
        fetchData();
      } else {
        const error = await res.json();
        showToast("error", error.error || t("toasts.replyError"));
      }
    } catch {
      showToast("error", t("toasts.connectionError"));
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      
      if (res.ok) {
        showToast("success", t("toasts.reportSuccess"));
      } else {
        const error = await res.json();
        showToast("error", error.error || t("toasts.reportError"));
      }
    } catch {
      showToast("error", t("toasts.connectionError"));
    }
  };

  const handleCreateReview = async (data: {
    rating: number;
    reviewerName: string;
    comment: string;
    listingId: string;
  }) => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: data.listingId,
          rating: data.rating,
          comment: data.comment,
          reviewerName: data.reviewerName,
        }),
      });

      if (res.ok) {
        showToast("success", t("toasts.reviewCreated"));
        fetchData();
        return true;
      } else {
        showToast("error", t("toasts.reviewError"));
        return false;
      }
    } catch {
      showToast("error", t("toasts.connectionError"));
      return false;
    }
  };

  const handleExportCSV = () => {
    const filtered = reviews.filter((r) => {
      if (filterStatus === "replied" && !r.response) return false;
      if (filterStatus === "unreplied" && r.response) return false;
      return true;
    });

    const headers = "ID,Titre Bien,Note,Voyageur,Commentaire,Date,Réponse\n";
    const rows = filtered
      .map(
        (r) =>
          `"${r.id}","${r.booking.listing.title}",${r.rating},"${r.reviewer.firstName} ${r.reviewer.lastName}","${r.comment?.replace(/"/g, '""') || ""}","${r.createdAt}","${r.response?.replace(/"/g, '""') || ""}"`,
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nesthub_avis_${tab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("success", t("toasts.exportSuccess"));
  };

  const filteredReviews = reviews.filter((r) => {
    const q = search.toLowerCase();
    if (q) {
      const titleMatch = r.booking.listing.title.toLowerCase().includes(q);
      const nameMatch = `${r.reviewer.firstName} ${r.reviewer.lastName}`.toLowerCase().includes(q);
      const locMatch = `${r.booking.listing.delegation} ${r.booking.listing.governorate}`.toLowerCase().includes(q);
      if (!titleMatch && !nameMatch && !locMatch) return false;
    }

    if (filterRating !== null && Math.floor(r.rating) !== filterRating) return false;

    if (tab === "received") {
      if (filterStatus === "replied" && !r.response) return false;
      if (filterStatus === "unreplied" && r.response) return false;
    }

    return true;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    if (sortBy === "rating_desc") return b.rating - a.rating;
    if (sortBy === "rating_asc") return a.rating - b.rating;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const activeFiltersCount = (search ? 1 : 0) + (filterRating !== null ? 1 : 0) + (filterStatus !== "all" ? 1 : 0);

  return {
    loading,
    tab,
    setTab,
    reviews,
    profile,
    stats,
    search,
    setSearch,
    sortBy,
    setSortBy,
    filterRating,
    setFilterRating,
    filterStatus,
    setFilterStatus,
    toast,
    setToast,
    showToast,
    filteredReviews: sortedReviews,
    activeFiltersCount,
    handleReply,
    handleReport,
    handleCreateReview,
    handleExportCSV,
    fetchData,
    t,
    tCommon,
  };
}