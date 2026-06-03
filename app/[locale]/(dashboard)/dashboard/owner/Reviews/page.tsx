"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { fr, enUS } from "date-fns/locale";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  IoStarSharp,
  IoStarOutline,
  IoStarHalfSharp,
  IoDownloadOutline,
  IoChatbubbleOutline,
  IoFilterOutline,
  IoAddOutline,
  IoSearchOutline,
  IoNotificationsOutline,
  IoPersonCircleOutline,
  IoHomeOutline,
  IoLocationOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
} from "react-icons/io5";

const cardShadow = "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]";

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  
  return (
    <div className="flex text-amber-400">
      {[...Array(5)].map((_, i) => {
        if (i < fullStars) {
          return <IoStarSharp key={i} className="text-sm fill-amber-400" />;
        } else if (i === fullStars && hasHalfStar) {
          return <IoStarHalfSharp key={i} className="text-sm fill-amber-400" />;
        } else {
          return <IoStarOutline key={i} className="text-sm text-gray-300" />;
        }
      })}
    </div>
  );
}

function formatDate(date: string | Date, locale: string) {
  return format(new Date(date), "dd MMM yyyy", { locale: locale === "fr" ? fr : enUS });
}

export default function OwnerDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "fr";
  const t = useTranslations("OwnerDashboard");
  const { getToken } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 14250,
    projectedRevenue: 3890,
    averageRating: 4.92,
    totalReviews: 84,
  });
  const [properties, setProperties] = useState<any[]>([]);
  const [receivedReviews, setReceivedReviews] = useState<any[]>([]);
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"received" | "given">("received");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken({ template: "my-app-template" });
        const res = await fetch("/api/owner/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setProperties(data.properties || []);
          setReceivedReviews(data.receivedReviews || []);
          setGivenReviews(data.givenReviews || []);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken]);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ response: replyText }),
      });
      if (res.ok) {
        setReplyingTo(null);
        setReplyText("");
        // Rafraîchir les données
        const refreshRes = await fetch("/api/owner/dashboard", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setReceivedReviews(data.receivedReviews || []);
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] flex items-center justify-center">
        <LoadingSpinner size="lg" color="primary" variant="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-body">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-[1440px] mx-auto">
          <div className="text-2xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 font-headline">
            NESTHUB
          </div>
          <div className="hidden md:flex items-center gap-8">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="bg-[#e5e8f1] border-none rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-primary/20 w-64 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors">
                <IoNotificationsOutline className="text-xl" />
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white rounded-full font-medium text-sm transition-transform active:scale-95 duration-200">
                {t("ownerBadge")}
              </button>
              <button className="p-1 border-2 border-[#a5c8ff] rounded-full">
                <IoPersonCircleOutline className="text-3xl text-slate-600" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Side Navigation Bar */}
      <aside className="fixed left-0 top-0 h-full w-72 pt-24 bg-slate-50 flex flex-col gap-2 px-4 border-r border-slate-100 z-40">
        <div className="px-4 py-6 mb-4">
          <h2 className="text-xl font-bold text-slate-900 font-headline">{t("sidebar.title")}</h2>
          <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider">{t("sidebar.subtitle")}</p>
        </div>
        <nav className="flex flex-col gap-1">
          {[
            { icon: <IoHomeOutline size={20} />, label: t("sidebar.dashboard"), href: "/owner/dashboard", active: true },
            { icon: <IoHomeOutline size={20} />, label: t("sidebar.listings"), href: "/owner/listings" },
            { icon: <IoCalendarOutline size={20} />, label: t("sidebar.history"), href: "/owner/history" },
            { icon: <IoCalendarOutline size={20} />, label: t("sidebar.bookings"), href: "/owner/bookings" },
            { icon: <IoPersonCircleOutline size={20} />, label: t("sidebar.settings"), href: "/owner/settings" },
          ].map((item) => (
            <a
              key={item.label}
              href={`/${locale}${item.href}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto mb-8 px-4">
          <button className="w-full py-4 bg-[#005cab] text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <IoAddOutline size={20} />
            {t("sidebar.addListing")}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-72 pt-28 pb-12 px-12 min-h-screen">
        {/* KPIs Section */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h1 className="text-3xl font-extrabold font-headline tracking-tight text-slate-900">
                {t("kpi.title")}
              </h1>
              <p className="text-slate-500 mt-1">{t("kpi.subtitle")}</p>
            </div>
            <div className="flex gap-3">
              <button className="bg-[#e5e8f1] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#d7dae3] transition-colors">
                {t("kpi.last7days")}
              </button>
              <button className="bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm border border-slate-100">
                {t("kpi.thisMonth")}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* KPI 1 */}
            <div className="bg-white p-8 rounded-2xl relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#005cab]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{t("kpi.totalRevenue")}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-headline">{stats.totalRevenue.toLocaleString()}</span>
                <span className="text-lg font-bold text-[#005cab]">TND</span>
              </div>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                <IoTrendingUpOutline className="text-sm" />
                <span>+12.5% {t("kpi.vsLastMonth")}</span>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-8 rounded-2xl relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#712ae2]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{t("kpi.projectedRevenue")}</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-headline">{stats.projectedRevenue.toLocaleString()}</span>
                <span className="text-lg font-bold text-[#712ae2]">TND</span>
              </div>
              <p className="mt-4 text-slate-400 text-sm">{t("kpi.basedOn", { count: 14 })}</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-8 rounded-2xl relative overflow-hidden group shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4b41e1]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{t("kpi.averageRating")}</p>
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold font-headline">{stats.averageRating.toFixed(2)}</span>
                <Stars rating={stats.averageRating} />
              </div>
              <p className="mt-4 text-slate-400 text-sm">{t("kpi.reviewsCount", { count: stats.totalReviews })}</p>
            </div>
          </div>
        </section>

        {/* Earnings by Property */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold font-headline">{t("earnings.title")}</h2>
              <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                <IoDownloadOutline className="text-sm" />
                {t("earnings.download")}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 uppercase text-[10px] tracking-[0.2em] font-bold border-b border-slate-50">
                    <th className="pb-4 pl-4">{t("earnings.table.property")}</th>
                    <th className="pb-4">{t("earnings.table.bookings")}</th>
                    <th className="pb-4">{t("earnings.table.netRevenue")}</th>
                    <th className="pb-4">{t("earnings.table.status")}</th>
                    <th className="pb-4 text-right pr-4">{t("earnings.table.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {properties.map((prop) => (
                    <tr key={prop.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5 pl-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                            {prop.imageUrl ? (
                              <img src={`/api/listings/image?url=${encodeURIComponent(prop.imageUrl)}`} alt={prop.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <IoHomeOutline className="text-2xl" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{prop.title}</p>
                            <p className="text-xs text-slate-500">{prop.location}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 font-semibold">{prop.bookingsCount}</td>
                      <td className="py-5">
                        <p className="font-bold text-slate-900">{prop.netRevenue.toLocaleString()} TND</p>
                        <p className={`text-xs ${prop.revenueChange >= 0 ? "text-emerald-500" : "text-amber-500"}`}>
                          {prop.revenueChange >= 0 ? "+" : ""}{prop.revenueChange}% vs obj.
                        </p>
                      </td>
                      <td className="py-5">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full ${
                          prop.status === "ACTIVE" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                        }`}>
                          {prop.status === "ACTIVE" ? t("earnings.status.active") : t("earnings.status.full")}
                        </span>
                      </td>
                      <td className="py-5 text-right pr-4">
                        <button className="text-slate-400 hover:text-primary transition-colors">
                          <IoHomeOutline className="text-lg" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Reviews Management */}
        <section>
          <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab("received")}
                  className={`relative pb-4 text-sm font-bold transition-all ${
                    activeTab === "received" ? "text-[#005cab]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t("reviews.received")} ({receivedReviews.length})
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-[#005cab] rounded-full transition-all ${
                    activeTab === "received" ? "w-full" : "w-0"
                  }`} />
                </button>
                <button
                  onClick={() => setActiveTab("given")}
                  className={`relative pb-4 text-sm font-bold transition-all ${
                    activeTab === "given" ? "text-[#005cab]" : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t("reviews.given")} ({givenReviews.length})
                  <div className={`absolute bottom-0 left-0 h-0.5 bg-[#005cab] rounded-full transition-all ${
                    activeTab === "given" ? "w-full" : "w-0"
                  }`} />
                </button>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <IoFilterOutline className="text-lg" />
                <span className="text-xs font-bold uppercase tracking-wider">{t("reviews.filterByDate")}</span>
              </div>
            </div>

            {/* Avis Reçus */}
            {activeTab === "received" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {receivedReviews.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400">{t("reviews.noReceived")}</div>
                ) : (
                  receivedReviews.map((review) => (
                    <div key={review.id} className="p-6 rounded-2xl bg-[#f1f3fd] border border-slate-100 hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {review.reviewerName?.[0] || "U"}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm">{review.reviewerName}</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                              {formatDate(review.createdAt, locale)} • {review.listingTitle}
                            </p>
                          </div>
                        </div>
                        <Stars rating={review.rating} />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic mb-6">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                      {replyingTo === review.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            rows={3}
                            className="w-full p-3 rounded-xl border border-gray-200 bg-white text-sm"
                            placeholder={t("reviews.writeResponse")}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleReply(review.id)}
                              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary/90"
                            >
                              {t("reviews.sendResponse")}
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText(""); }}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300"
                            >
                              {t("reviews.cancel")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="w-full py-2 bg-white text-primary text-xs font-bold rounded-xl border border-primary/10 hover:bg-primary hover:text-white transition-all"
                        >
                          <IoChatbubbleOutline className="inline mr-1" />
                          {review.response ? t("reviews.modifyResponse") : t("reviews.respond")}
                        </button>
                      )}
                      {review.response && replyingTo !== review.id && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-primary/10">
                          <p className="text-[10px] font-semibold text-primary mb-1">{t("reviews.yourResponse")}</p>
                          <p className="text-xs text-slate-600 italic">&ldquo;{review.response}&rdquo;</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Avis Donnés */}
            {activeTab === "given" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {givenReviews.length === 0 ? (
                  <div className="col-span-2 text-center py-12 text-slate-400">{t("reviews.noGiven")}</div>
                ) : (
                  givenReviews.map((review) => (
                    <div key={review.id} className="p-6 rounded-2xl bg-[#f1f3fd] border border-slate-100">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-sm">{t("reviews.evaluationFor")} {review.listingTitle}</h4>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase">
                          {review.rating >= 4 ? t("reviews.recommended") : t("reviews.notRecommended")}
                        </div>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">{t("reviews.cleanliness")}</span>
                          <Stars rating={review.cleanliness || review.rating} />
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-500 font-medium">{t("reviews.communication")}</span>
                          <Stars rating={review.communication || review.rating} />
                        </div>
                      </div>
                      <div className="p-3 bg-white rounded-xl text-xs text-slate-500 leading-relaxed">
                        &ldquo;{review.comment}&rdquo;
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}