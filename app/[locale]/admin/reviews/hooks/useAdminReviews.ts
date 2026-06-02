"use client";

import { useState, useEffect, useCallback } from "react";
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
  };
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
  const tCommon = useTranslations("Common");
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [filterType, setFilterType] = useState<"all" | "flagged" | "pending">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stats
  const stats = {
    total: reviews.length,
    averageRating: reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0,
    flaggedCount: reviews.filter(r => r.isFlagged).length,
  };

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      } else {
        toast.error(tCommon("error.loading"));
      }
    } catch (error) {
      console.error(error);
      toast.error(tCommon("error.loading"));
    } finally {
      setLoading(false);
    }
  }, [getToken, tCommon]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const filteredReviews = reviews.filter((review) => {
    if (filterType === "flagged" && !review.isFlagged) return false;
    if (filterType === "pending" && review.response !== null) return false;
    
    if (ratingFilter !== "all") {
      const rating = parseInt(ratingFilter);
      if (ratingFilter === "low") {
        if (review.rating > 2) return false;
      } else if (ratingFilter === "high") {
        if (review.rating < 4) return false;
      } else if (review.rating !== rating) return false;
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const titleMatch = review.booking.listing.title.toLowerCase().includes(term);
      const reviewerMatch = `${review.reviewer.firstName} ${review.reviewer.lastName}`.toLowerCase().includes(term);
      const commentMatch = review.comment?.toLowerCase().includes(term) || false;
      if (!titleMatch && !reviewerMatch && !commentMatch) return false;
    }
    
    return true;
  });

  const handleToggleVisibility = async (reviewId: string, isHidden: boolean) => {
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
        fetchReviews();
      } else {
        toast.error(tCommon("error.general"));
      }
    } catch {
      toast.error(tCommon("error.general"));
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
        setReviews(prev => prev.filter(r => r.id !== selectedReview.id));
        setShowDeleteModal(false);
        setSelectedReview(null);
      } else {
        toast.error(tCommon("error.general"));
      }
    } catch {
      toast.error(tCommon("error.general"));
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

  return {
    loading,
    reviews: filteredReviews,
    allReviewsCount: reviews.length,
    stats,
    filterType,
    setFilterType,
    ratingFilter,
    setRatingFilter,
    searchTerm,
    setSearchTerm,
    showDeleteModal,
    deleting,
    selectedReview,
    handleToggleVisibility,
    handleDeleteReview,
    openDeleteModal,
    closeDeleteModal,
    t,
    tCommon,
  };
}