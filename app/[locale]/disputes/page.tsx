// app/[locale]/disputes/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  IoChevronForwardOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoPersonOutline,
  IoHomeOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoTimeOutline,
  IoWalletOutline,
} from "react-icons/io5";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const pipListingImage = (url: string) =>
  `/api/listings/image?url=${encodeURIComponent(url)}`;

interface Dispute {
  id: string;
  reference: string;
  status: "OPEN" | "IN_REVIEW" | "RESOLVED" | "REJECTED";
  type: string;
  description: string;
  refundAmount: number | null;
  resolvedAmount: number | null;
  priority: "HIGH" | "MEDIUM" | "LOW";
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    totalPrice: number;
    listing: {
      id: string;
      title: string;
      governorate: string;
      delegation: string;
      images?: string[];
    };
    tenant: { firstName: string; lastName: string };
    owner: { firstName: string; lastName: string };
  };
}

const TYPE_LABELS: Record<string, string> = {
  DAMAGE: "Dommages matériels",
  CLEANING: "Propreté",
  MISREPRESENTATION: "Logement non conforme",
  NOISE: "Bruit / nuisance",
  PAYMENT: "Problème de paiement",
  CANCELLATION: "Annulation abusive",
  OTHER: "Autre",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  OPEN: { label: "En attente", color: "text-amber-600", dot: "bg-amber-500" },
  IN_REVIEW: { label: "En cours d'examen", color: "text-blue-600", dot: "bg-blue-500" },
  RESOLVED: { label: "Résolu", color: "text-green-600", dot: "bg-green-500" },
  REJECTED: { label: "Rejeté", color: "text-red-600", dot: "bg-red-500" },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  HIGH: { label: "Élevée", color: "text-red-600" },
  MEDIUM: { label: "Moyenne", color: "text-amber-600" },
  LOW: { label: "Basse", color: "text-blue-600" },
};

export default function DisputesPage() {
  const { getToken } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ open: 0, inReview: 0, resolved: 0 });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/disputes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const disputesList = Array.isArray(data) ? data : data.disputes || [];
      setDisputes(disputesList);
      
      const open = disputesList.filter((d: Dispute) => d.status === "OPEN").length;
      const inReview = disputesList.filter((d: Dispute) => d.status === "IN_REVIEW").length;
      const resolved = disputesList.filter((d: Dispute) => d.status === "RESOLVED").length;
      setStats({ open, inReview, resolved });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Dispute["status"]) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${config.color}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  const activeDisputes = disputes.filter(d => d.status === "OPEN" || d.status === "IN_REVIEW");
  const pastDisputes = disputes.filter(d => d.status === "RESOLVED" || d.status === "REJECTED");

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
            Suivi des litiges
          </h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
            Gérez vos réclamations actives et consultez l'historique de vos résolutions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar Stats */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-4">Aperçu</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm font-medium">En attente</span>
                  <span className="bg-amber-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{stats.open}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm font-medium">En examen</span>
                  <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">{stats.inReview}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <span className="text-sm font-medium">Résolus</span>
                  <span className="text-slate-600 text-xs font-bold">{stats.resolved}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-4">
                <IoShieldCheckmarkOutline className="text-2xl" />
              </div>
              <h3 className="font-bold text-lg mb-2">Besoin d'aide ?</h3>
              <p className="text-sm opacity-90 mb-4">Nos conseillers sont disponibles 24/7</p>
              <button className="w-full bg-white text-indigo-600 py-2 rounded-full font-bold text-sm hover:bg-opacity-90 transition">
                Contacter le support
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9 space-y-8">
            {/* Active Disputes */}
            <section>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Litiges actifs</h2>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>
              <div className="space-y-4">
                {activeDisputes.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500">Aucun litige actif</p>
                    <Link href="/disputes/new" className="text-indigo-600 text-sm mt-2 inline-block">
                      Ouvrir un litige →
                    </Link>
                  </div>
                ) : (
                  activeDisputes.map((dispute) => (
                    <Link
                      key={dispute.id}
                      href={`/disputes/${dispute.id}`}
                      className="block bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-col md:flex-row gap-5">
                        <div className="w-24 h-24 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
                          {dispute.booking.listing.images?.[0] ? (
                            <img
                              src={pipListingImage(dispute.booking.listing.images[0])}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IoHomeOutline className="text-slate-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">
                              {TYPE_LABELS[dispute.type] || dispute.type}
                            </span>
                            {getStatusBadge(dispute.status)}
                            <span className={`text-[10px] font-bold uppercase ${PRIORITY_CONFIG[dispute.priority]?.color}`}>
                              {PRIORITY_CONFIG[dispute.priority]?.label}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">
                            {dispute.booking.listing.title}
                          </h3>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <IoCalendarOutline className="text-[12px]" />
                            {format(new Date(dispute.booking.checkIn), "dd MMM yyyy", { locale: fr })} - {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", { locale: fr })}
                          </p>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <IoLocationOutline className="text-[12px]" />
                            {dispute.booking.listing.governorate}, {dispute.booking.listing.delegation}
                          </p>
                          {dispute.refundAmount && (
                            <p className="text-sm font-semibold text-amber-600 mt-2">
                              Montant demandé: {dispute.refundAmount.toLocaleString("fr-FR")} TND
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <IoChevronForwardOutline className="text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            {/* Past Disputes */}
            {pastDisputes.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Historique</h2>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                </div>
                <div className="space-y-3 opacity-75">
                  {pastDisputes.map((dispute) => (
                    <Link
                      key={dispute.id}
                      href={`/disputes/${dispute.id}`}
                      className="block bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
                    >
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase text-slate-500">
                              {TYPE_LABELS[dispute.type] || dispute.type}
                            </span>
                            {getStatusBadge(dispute.status)}
                          </div>
                          <h3 className="font-medium text-sm text-slate-800 dark:text-slate-200">
                            {dispute.booking.listing.title}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(dispute.booking.checkIn), "dd MMM yyyy", { locale: fr })} - {format(new Date(dispute.booking.checkOut), "dd MMM yyyy", { locale: fr })}
                          </p>
                          {dispute.resolvedAmount && (
                            <p className="text-xs text-green-600 mt-1">
                              Remboursement: {dispute.resolvedAmount.toLocaleString("fr-FR")} TND
                            </p>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-slate-400">
                            {format(new Date(dispute.updatedAt), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}