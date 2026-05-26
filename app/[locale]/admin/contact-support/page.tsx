// app/admin/contacts/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import Pagination from "@/components/ui/Pagination";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";

import {
  IoDownloadOutline,
  IoMailOutline,
  IoPersonOutline,
  IoEllipsisVertical,
  IoFilterOutline,
  IoSearchOutline,
  IoCloseOutline,
  IoChatbubbleOutline,
} from "react-icons/io5";
import { PiUsersThree } from "react-icons/pi";
import { MdOutlinePending } from "react-icons/md";
import { BsFiletypeCsv, BsFiletypePdf, BsEnvelope } from "react-icons/bs";
import { FiChevronDown } from "react-icons/fi";
import { GoShieldCheck } from "react-icons/go";

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  userId: string | null;
  message: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export default function AdminContactsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const router = useRouter();
  const t = useTranslations("AdminContacts");

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Stats calculées
  const total = messages.length;
  const pending = messages.filter((m) => m.status === "PENDING").length;
  const replied = messages.filter((m) => m.status === "REPLIED").length;
  const userMessages = messages.filter((m) => m.userId !== null).length;
  const visitorMessages = messages.filter((m) => m.userId === null).length;
  const responseRate = total > 0 ? (replied / total) * 100 : 0;

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact/list");
      const data = await res.json();
      setMessages(data.messages);
    } catch (err) {
      setError("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des messages
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch =
      msg.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      typeFilter === "all"
        ? true
        : typeFilter === "user"
        ? msg.userId !== null
        : typeFilter === "visitor"
        ? msg.userId === null
        : true;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "new"
        ? msg.status === "PENDING"
        : statusFilter === "resolved"
        ? msg.status === "REPLIED"
        : true;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMessages.length / itemsPerPage);
  const paginatedMessages = filteredMessages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleRowClick = (id: string) => {
    router.push(`/admin/contact-support/${id}`);
  };

  const handleExport = (format: string) => {
    setShowExportOptions(false);
    console.log(`Export as ${format}`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Alerte erreur */}
      {error && (
        <div className="fixed top-5 right-5 z-[60] w-full max-w-sm">
          <Alert type="error" message={error} onClose={() => setError(null)} />
        </div>
      )}

      {/* HEADER */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t("page.title")}
          </h2>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">
            {t("page.description")}
          </p>
        </div>

        {/* Bouton Export */}
        <div className="relative">
          <button
            onClick={() => setShowExportOptions(!showExportOptions)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-sm font-semibold shadow-sm transition-all"
          >
            <IoDownloadOutline className="text-base" />
            {t("actions.export")}
            <FiChevronDown className="text-xs" />
          </button>
          {showExportOptions && (
            <div className={`absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 z-50 overflow-hidden ${block3d}`}>
              <button onClick={() => handleExport("csv")} className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3">
                <BsFiletypeCsv className="text-emerald-500 text-lg" />
                <span className="text-sm font-semibold">CSV</span>
              </button>
              <button onClick={() => handleExport("pdf")} className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center gap-3 border-t border-indigo-50">
                <BsFiletypePdf className="text-red-500 text-lg" />
                <span className="text-sm font-semibold">PDF</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: t("stats.totalInquiries"), value: total, Icon: PiUsersThree, grad: "from-indigo-500 to-blue-600", cls: "text-indigo-600" },
          { title: t("stats.pending"), value: pending, Icon: MdOutlinePending, grad: "from-amber-400 to-orange-500", cls: "text-amber-600" },
          { title: t("stats.responseRate"), value: `${responseRate.toFixed(1)}%`, Icon: GoShieldCheck, grad: "from-emerald-400 to-teal-500", cls: "text-emerald-600" },
          { title: t("stats.userMessages"), value: userMessages, Icon: IoPersonOutline, grad: "from-violet-500 to-purple-600", cls: "text-violet-600" },
          { title: t("stats.visitorMessages"), value: visitorMessages, Icon: BsEnvelope, grad: "from-sky-400 to-blue-500", cls: "text-sky-600" },
        ].map(({ title, value, Icon, grad, cls }) => (
          <div key={title} className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-4 flex items-center gap-4 ${card3d}`}>
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-sm`}>
              <Icon className="text-white text-xl" />
            </div>
            <div>
              <p className={`text-2xl font-black leading-none ${cls}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-medium">{title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTRES + TABLEAU */}
      <div className={`flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
        {/* Barre de filtres */}
        <div className="px-5 py-4 border-b border-indigo-50 dark:border-indigo-900/30 bg-gradient-to-r from-indigo-50/40 to-violet-50/20">
          <div className="flex flex-wrap items-center gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-[200px]">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-base" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filtre Type */}
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm">
              <option value="all">{t("filters.type.all")}</option>
              <option value="user">{t("filters.type.user")}</option>
              <option value="visitor">{t("filters.type.visitor")}</option>
            </select>

            {/* Filtre Statut */}
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 rounded-xl text-sm">
              <option value="all">{t("filters.status.all")}</option>
              <option value="new">{t("filters.status.new")}</option>
              <option value="resolved">{t("filters.status.resolved")}</option>
            </select>

           
          </div>
        </div>

        {/* TABLEAU */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-40"><LoadingSpinner /></div>
          ) : paginatedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-indigo-300">
              <IoMailOutline className="text-5xl" />
              <p className="text-sm text-slate-500">{t("messages.noMessages")}</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-indigo-50/50">
                <tr className="border-b border-indigo-100">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.sender")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.type")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.message")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.status")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.date")}</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-indigo-400 uppercase tracking-wider">{t("table.headers.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedMessages.map((msg) => (
                  <tr key={msg.id} onClick={() => handleRowClick(msg.id)} className="hover:bg-indigo-50/20 cursor-pointer group">
                    {/* Expéditeur */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-bold text-xs">{getInitials(msg.fullName)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{msg.fullName}</p>
                          <p className="text-[11px] text-slate-400">{msg.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${msg.userId ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                        {msg.userId ? "Utilisateur" : "Visiteur"}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="text-sm text-slate-700 truncate">{msg.message.length > 80 ? msg.message.substring(0, 80) + "..." : msg.message}</p>
                    </td>

                    {/* Statut */}
                    <td className="px-4 py-3.5">
                      {msg.status === "PENDING" ? (
                        <span className="flex items-center gap-1.5 text-amber-600 font-semibold text-xs">
                          <span className="h-2 w-2 rounded-full bg-amber-500"></span>Nouveau
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span>Répondu
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3.5 text-xs text-slate-500">{formatDate(msg.createdAt)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => handleRowClick(msg.id)} className="p-1.5 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Voir et répondre">
                        <IoChatbubbleOutline className="text-base" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION - Apparaît seulement si plus de 10 lignes */}
        {filteredMessages.length > itemsPerPage && (
          <div className="flex-shrink-0 border-t border-indigo-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMessages.length}
              pageSize={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}