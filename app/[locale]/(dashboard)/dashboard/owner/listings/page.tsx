// app/[locale]/(dashboard)/owner/listings/page.tsx
"use client";

import { useState, useEffect } from "react";
import * as React from "react"; // ✅ Ajout de l'import React
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

// Icônes React
import {
Users,
  Home,
  Building2,
  Hotel,
  Layers,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Archive,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Listing {
  id: string;
  title: string;
  type: string;
  governorate: string;
  delegation: string;
  pricePerNight: number | null;
  pricePerMonth: number | null;
  status: string;
  viewCount: number;
  bookingCount: number;
  photos: Array<{ url: string; isMain: boolean }>;
  publishedAt: string | null;
  createdAt: string;
  stats?: {
    views: number;
    bookings: number;
    revenue: number;
  };
}

// Fonction pip pour les images Vercel Blob
const pip = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

export default function OwnerListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params); // ✅ Maintenant React est défini
  const router = useRouter();
  const { user } = useUser();
  const t = useTranslations("OwnerListings");

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchListings();
  }, [activeTab, currentPage, searchQuery]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/listings/my?status=${activeTab === "all" ? "ALL" : activeTab.toUpperCase()}&page=${currentPage}&pageSize=10&search=${searchQuery}`,
      );
      if (res.ok) {
        const data = await res.json();
        setListings(data.listings);
        setTotalPages(data.pagination.totalPages);
        setTotalCount(data.pagination.totalCount);
      }
    } catch (error) {
      console.error("Error fetching listings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchListings();
      }
    } catch (error) {
      console.error("Error deleting listing:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return {
          color:
            "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400",
          icon: CheckCircle,
          label: t("status.active"),
        };
      case "INACTIVE":
        return {
          color:
            "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
          icon: Clock,
          label: t("status.inactive"),
        };
      case "DRAFT":
        return {
          color:
            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
          icon: AlertCircle,
          label: t("status.draft"),
        };
      case "ARCHIVED":
        return {
          color:
            "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
          icon: Archive,
          label: t("status.archived"),
        };
      default:
        return {
          color:
            "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
          icon: AlertCircle,
          label: status,
        };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "APARTMENT":
        return Building2;
      case "VILLA":
        return Home;
      case "STUDIO":
        return Hotel;
      case "DUPLEX":
        return Layers;
      default:
        return Building2;
    }
  };

  const tabs = [
    { id: "all", label: t("tabs.all"), count: totalCount },
    {
      id: "active",
      label: t("tabs.active"),
      count: listings.filter((l) => l.status === "ACTIVE").length,
    },
    {
      id: "inactive",
      label: t("tabs.inactive"),
      count: listings.filter((l) => l.status === "INACTIVE").length,
    },
    {
      id: "draft",
      label: t("tabs.draft"),
      count: listings.filter((l) => l.status === "DRAFT").length,
    },
  ];

  const mainPhoto = (listing: Listing) => {
    const photo = listing.photos?.find((p) => p.isMain) || listing.photos?.[0];
    return photo?.url ? pip(photo.url) : null;
  };

  return (
    <div className="min-h-screen bg-[#f5f8f7] dark:bg-[#10221b]">
      <div className="px-6 py-8 lg:px-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-tight">
              {t("title")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-xl">
              {t("description")}
            </p>
          </div>
          <Link
            href={`/${locale}/dashboard/owner/listings/create`}
            className="flex items-center justify-center gap-2 rounded-xl h-12 px-8 bg-[#0df293] text-slate-900 text-base font-bold transition-transform active:scale-95 shadow-lg shadow-[#0df293]/20 hover:opacity-90"
          >
            <Plus size={20} />
            <span>{t("addProperty")}</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stats.totalRevenue")}
              </p>
              <div className="p-2 bg-[#0df293]/10 rounded-lg text-[#0df293]">
                <DollarSign size={20} />
              </div>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
              {listings
                .reduce((sum, l) => sum + (l.stats?.revenue || 0), 0)
                .toLocaleString()}{" "}
              TND
            </p>
            <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
              <TrendingUp size={14} />
              <span>+12.5%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stats.activeListings")}
              </p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Home size={20} />
              </div>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
              {listings.filter((l) => l.status === "ACTIVE").length}{" "}
              {t("stats.properties")}
            </p>
            <p className="text-slate-400 text-sm font-medium">
              {t("stats.stablePortfolio")}
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stats.totalViews")}
              </p>
              <div className="p-2 bg-[#0df293]/10 rounded-lg text-[#0df293]">
                <Eye size={20} />
              </div>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
              {listings
                .reduce((sum, l) => sum + (l.viewCount || 0), 0)
                .toLocaleString()}
            </p>
            <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
              <TrendingUp size={14} />
              <span>+8.2%</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                {t("stats.occupancyRate")}
              </p>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                <Users size={20} />
              </div>
            </div>
            <p className="text-slate-900 dark:text-white text-2xl font-bold leading-tight">
              94%
            </p>
            <div className="flex items-center gap-1 text-emerald-500 text-sm font-bold">
              <TrendingUp size={14} />
              <span>+2.1%</span>
            </div>
          </div>
        </div>

        {/* Listings Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Filters/Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 overflow-x-auto">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`border-b-2 py-4 text-sm font-bold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "border-[#0df293] text-slate-900 dark:text-white"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}{" "}
                  <span className="ml-2 text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 py-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0df293]/50"
                />
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Filter size={14} />
                {t("filter")}
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <LoadingSpinner  className="animate-spin text-[#0df293]" />
            </div>
          ) : listings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Home size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
                {t("empty.description")}
              </p>
              <Link
                href={`/${locale}/dashboard/owner/listings/create`}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0df293] text-slate-900 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus size={18} />
                {t("empty.cta")}
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {listings.map((listing) => {
                const StatusIcon = getStatusBadge(listing.status).icon;
                const TypeIcon = getTypeIcon(listing.type);
                const mainImage = mainPhoto(listing);
                const price = listing.pricePerNight || listing.pricePerMonth;
                const priceUnit = listing.pricePerNight
                  ? t("unit.night")
                  : t("unit.month");

                return (
                  <div
                    key={listing.id}
                    className="group hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors p-6 flex flex-col xl:flex-row xl:items-center gap-6"
                  >
                    {/* Image */}
                    <div className="flex-shrink-0 w-full xl:w-48 h-32 rounded-lg overflow-hidden relative">
                      {mainImage ? (
                        <img
                          src={mainImage}
                          alt={listing.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <Home size={32} className="text-slate-400" />
                        </div>
                      )}
                      {listing.status === "ACTIVE" && (
                        <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                          <CheckCircle size={10} />
                          {t("badge.verified")}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={18} className="text-slate-400" />
                          <h3 className="text-lg font-bold truncate">
                            {listing.title}
                          </h3>
                        </div>
                        <span
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusBadge(listing.status).color}`}
                        >
                          <StatusIcon size={10} />
                          {getStatusBadge(listing.status).label}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1 mb-4">
                        <MapPin size={14} />
                        {listing.governorate}
                        {listing.delegation ? `, ${listing.delegation}` : ""}
                      </p>

                      <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            {t("stats.views")}
                          </span>
                          <div className="flex items-center gap-2">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-sm font-bold">
                              {listing.viewCount?.toLocaleString() || 0}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            {t("stats.bookings")}
                          </span>
                          <span className="text-sm font-bold">
                            {listing.bookingCount || 0}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            {t("stats.price")}
                          </span>
                          <span className="text-sm font-bold">
                            {price ? `${price.toLocaleString()} TND` : "—"}{" "}
                            <span className="text-xs font-normal text-slate-400">
                              {priceUnit}
                            </span>
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                            {t("stats.published")}
                          </span>
                          <span className="text-sm font-medium">
                            {listing.publishedAt
                              ? new Date(
                                  listing.publishedAt,
                                ).toLocaleDateString(
                                  locale === "fr" ? "fr-FR" : "en-US",
                                )
                              : t("stats.notPublished")}
                          </span>
                        </div>

                        {/* AI Insight */}
                        <div className="flex-1 min-w-[200px] p-3 rounded-lg bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-1">
                            <Star size={14} className="fill-current" />
                            <span className="text-xs font-bold uppercase tracking-wide">
                              {t("aiInsights.title")}
                            </span>
                          </div>
                          <p className="text-xs text-purple-600 dark:text-purple-300 leading-snug">
                            {listing.status === "DRAFT"
                              ? t("aiInsights.draftTip")
                              : listing.viewCount < 100
                                ? t("aiInsights.lowViewsTip")
                                : t("aiInsights.highDemandTip")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex xl:flex-col gap-2 xl:min-w-[120px]">
                      <Link
                        href={`/${locale}/dashboard/owner/listings/${listing.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
                      >
                        <Eye size={16} />
                        {t("actions.view")}
                      </Link>
                      <Link
                        href={`/${locale}/dashboard/owner/listings/${listing.id}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit size={16} />
                        {t("actions.edit")}
                      </Link>
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="flex items-center justify-center size-10 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-background-dark/30">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {t("pagination.showing", {
                  start: (currentPage - 1) * 10 + 1,
                  end: Math.min(currentPage * 10, totalCount),
                  total: totalCount,
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center justify-center size-8 rounded border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`flex items-center justify-center size-8 rounded border text-xs font-bold transition-colors ${
                        currentPage === pageNum
                          ? "border-[#0df293] bg-[#0df293] text-slate-900"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center justify-center size-8 rounded border border-slate-200 dark:border-slate-700 text-slate-400 disabled:opacity-50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4">
            <span>© 2024 NestHub Management Ecosystem</span>
            <a href="#" className="hover:text-[#0df293] transition-colors">
              {t("footer.legal")}
            </a>
            <a href="#" className="hover:text-[#0df293] transition-colors">
              {t("footer.aiPolicy")}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <span className="size-2 bg-[#0df293] rounded-full animate-pulse" />
            <span>{t("footer.aiStatus")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
