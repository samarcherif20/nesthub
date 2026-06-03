"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  responseAt: string | null;
  createdAt: string;
  isPublished: boolean;
  isFlagged: boolean;
  flagReason: string | null;
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
  } | null;
  booking: {
    id: string;
    reference: string;
    checkIn: string;
    checkOut: string;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
    };
  };
}

export function useAdminReviews() {
  const t = useTranslations("AdminReviews");
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filterType, setFilterType] = useState<"all" | "flagged" | "pending">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  
  // Ref pour éviter les appels multiples
  const isFirstRender = useRef(true);
  // ✅ Ref pour le debounce de la recherche
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSearchTerm = useRef(searchTerm);

  // Stats
  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    flaggedCount: reviews.filter(r => r.isFlagged).length,
  };

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        filter: filterType,
        ratingFilter: ratingFilter,
        dateFilter: dateFilter,
        search: searchTerm,
      });
      const res = await fetch(`/api/admin/reviews?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setPagination({
          page: data.page || page,
          limit: data.limit || 20,
          totalCount: data.totalCount || 0,
          totalPages: data.totalPages || 1,
        });
      } else {
        toast.error(t("errors.loading"));
      }
    } catch (error) {
      console.error(error);
      toast.error(t("errors.loading"));
    } finally {
      setLoading(false);
    }
  }, [getToken, filterType, ratingFilter, dateFilter, searchTerm, t]);

  // ✅ Déclencher fetchReviews quand les filtres changent (avec debounce pour la recherche)
  useEffect(() => {
    // Ignorer le premier render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      fetchReviews(1);
      return;
    }

    // ✅ Si seul le searchTerm a changé, on applique un debounce
    if (lastSearchTerm.current !== searchTerm) {
      lastSearchTerm.current = searchTerm;
      
      // Nettoyer le timeout précédent
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      
      // Nouveau timeout : attendre 500ms après la dernière frappe
      searchTimeout.current = setTimeout(() => {
        fetchReviews(1);
      }, 500);
      return;
    }
    
    // Pour les autres filtres, déclencher directement
    fetchReviews(1);
  }, [filterType, ratingFilter, dateFilter, searchTerm, fetchReviews]);

  // ✅ Nettoyer le timeout au démontage du composant
  useEffect(() => {
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const handleToggleVisibility = async (reviewId: string, isHidden: boolean) => {
    setActionLoading(reviewId);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/reviews/${reviewId}/visibility`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublished: !isHidden }),
      });
      if (res.ok) {
        toast.success(isHidden ? t("toasts.reviewHidden") : t("toasts.reviewShown"));
        fetchReviews(pagination.page);
      } else {
        toast.error(t("errors.general"));
      }
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedReview) return;
    setDeleting(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/admin/reviews/${selectedReview.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success(t("toasts.reviewDeleted"));
        setShowDeleteModal(false);
        setSelectedReview(null);
        fetchReviews(pagination.page);
      } else {
        toast.error(t("errors.general"));
      }
    } catch {
      toast.error(t("errors.general"));
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteModal = (review: AdminReview) => {
    setSelectedReview(review);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedReview(null);
  };

  const handlePageChange = (page: number) => {
    fetchReviews(page);
  };

  // Fonction manuelle pour rafraîchir
  const refreshReviews = () => {
    fetchReviews(pagination.page);
  };

  return {
    loading,
    reviews,
    pagination,
    allReviewsCount: pagination.totalCount,
    stats,
    filterType,
    setFilterType,
    ratingFilter,
    setRatingFilter,
    searchTerm,
    setSearchTerm,
    dateFilter,
    setDateFilter,
    showDeleteModal,
    deleting,
    selectedReview,
    actionLoading,
    handleToggleVisibility,
    handleDeleteReview,
    openDeleteModal,
    closeDeleteModal,
    handlePageChange,
    fetchReviews: refreshReviews,
    t,
  };
}