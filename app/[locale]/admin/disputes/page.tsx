// app/[locale]/(dashboard)/admin/disputes/page.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Alert from "@/components/ui/Alert";
import {
  IoSearchOutline,
  IoNotificationsOutline,
  IoHelpCircleOutline,
  IoSettingsOutline,
  IoLogOutOutline,
  IoShareOutline,
  IoReceiptOutline,
  IoHomeOutline,
  IoChatbubbleOutline,
  IoFilterOutline,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoAlertCircleOutline,
  IoTimeOutline,
  IoChevronForwardOutline,
  IoSendOutline,
  IoImagesOutline,
  IoRefreshOutline,
  IoArchiveOutline,
  IoPersonCircleOutline,
  IoEllipsisVerticalOutline,
  IoWalletOutline,
  IoHammerOutline,
} from "react-icons/io5";
import { MdOutlineGavel } from "react-icons/md";
import { TbBoom } from "react-icons/tb";

// ─── pip helper ───────────────────────────────────────────────────────────────
const pipAvatar = (url: string) => `/api/users/avatar?url=${encodeURIComponent(url)}`;

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function AdminSidebar({ active }: { active: string }) {
  const navItems = [
    { label: "Dashboard", href: "/fr/admin", icon: <IoShareOutline /> },
    { label: "Transactions", href: "/fr/admin/transactions", icon: <IoReceiptOutline /> },
    { label: "Property Listings", href: "/fr/admin/properties", icon: <IoHomeOutline /> },
    { label: "Disputes", href: "/fr/admin/disputes", icon: <MdOutlineGavel /> },
    { label: "Moderation", href: "/fr/admin/moderation", icon: <IoChatbubbleOutline /> },
  ];

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-slate-50 dark:bg-slate-950 flex flex-col py-8 px-4 gap-6 z-50 border-r border-slate-100 dark:border-slate-800">
      <div className="px-4">
        <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">
          Nesthub Atlas
        </span>
        <div className="flex items-center gap-3 mt-5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Admin Dashboard</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Management Suite</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {navItems.map(({ label, href, icon }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              active === label
                ? "text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-blue-300 hover:translate-x-1"
            }`}
          >
            <span className="text-base">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1">
        <Link href="/fr/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors">
          <IoSettingsOutline className="text-base" />
          Settings
        </Link>
        <Link href="/fr/logout" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors">
          <IoLogOutOutline className="text-base" />
          Logout
        </Link>
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <button className="w-full py-2.5 px-4 bg-[#005cab] text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
            <IoHelpCircleOutline className="text-sm" />
            Help Center
          </button>
        </div>
      </div>
    </aside>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type Severity = "HIGH" | "MEDIUM" | "LOW";
type DisputeStatus = "OPEN" | "IN_REVIEW" | "RESOLVED" | "DENIED" | "ARCHIVED";

interface DisputeMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "TENANT" | "OWNER" | "ADMIN";
  content: string;
  attachments?: string[];
  createdAt: string;
}

interface Dispute {
  id: string;
  reference: string;
  reporter: {
    id: string;
    firstName: string;
    lastName: string;
    image?: string;
  };
  subject: string;
  status: DisputeStatus;
  severity: Severity;
  date: string;
  listing?: {
    id: string;
    title: string;
    image?: string;
  };
  messages: DisputeMessage[];
  refundAmount?: number;
}

interface DisputeStats {
  avgResolutionHours: number;
  totalReported: number;
  topSubject: string;
  pendingPayouts: number;
}

// ─── Severity badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }: { severity: Severity }) {
  const map: Record<Severity, { dot: string; text: string; label: string }> = {
    HIGH: { dot: "bg-red-500 animate-pulse", text: "text-red-600 dark:text-red-400", label: "High" },
    MEDIUM: { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Medium" },
    LOW: { dot: "bg-blue-400", text: "text-blue-500 dark:text-blue-400", label: "Low" },
  };
  const { dot, text, label } = map[severity];
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${dot}`} />
      <span className={`text-xs font-bold uppercase tracking-tight ${text}`}>{label}</span>
    </div>
  );
}

// ─── Subject chip ─────────────────────────────────────────────────────────────
function SubjectChip({ subject }: { subject: string }) {
  const icons: Record<string, React.ReactNode> = {
    Cleaning: <TbBoom className="text-xs" />,
    Deposit: <IoWalletOutline className="text-xs" />,
    Noise: <IoAlertCircleOutline className="text-xs" />,
    Refund: <IoReceiptOutline className="text-xs" />,
    Damage: <IoHammerOutline className="text-xs" />,
  };
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium">
      {icons[subject] ?? <IoAlertCircleOutline className="text-xs" />}
      {subject}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, image, size = 32 }: { name: string; size?: number; image?: string }) {
  const [err, setErr] = useState(false);
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["bg-blue-200 text-blue-800", "bg-purple-200 text-purple-800", "bg-teal-200 text-teal-800", "bg-amber-200 text-amber-800", "bg-pink-200 text-pink-800"];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center font-bold flex-shrink-0 ${!image || err ? color : "bg-slate-200"}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {image && !err ? (
        <img src={pipAvatar(image)} alt={name} className="w-full h-full object-cover" onError={() => setErr(true)} />
      ) : (
        initials
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminDisputesPage() {
  const { getToken } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [stats, setStats] = useState<DisputeStats>({
    avgResolutionHours: 4.2,
    totalReported: 128,
    topSubject: "Cleaning",
    pendingPayouts: 2450,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"active" | "archive">("active");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken({ template: "my-app-template" });
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers ?? {}),
        },
      });
    },
    [getToken]
  );

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: tab === "active" ? "OPEN,IN_REVIEW" : "RESOLVED,DENIED,ARCHIVED",
        ...(search && { search }),
      });
      const res = await authFetch(`/api/admin/disputes?${params}`);
      if (res.ok) {
        const data = await res.json();
        const items: Dispute[] = data.disputes ?? [];
        setDisputes(items);
        if (data.stats) setStats(data.stats);
        if (items.length > 0 && !selectedDispute) {
          setSelectedDispute(items[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [authFetch, tab, search, selectedDispute]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedDispute?.messages]);

  const handleAction = async (action: "resolve" | "deny", disputeId: string) => {
    setActionLoading(action);
    try {
      const res = await authFetch(`/api/admin/disputes/${disputeId}/${action}`, { method: "POST" });
      if (res.ok) {
        setAlert({ type: "success", message: action === "resolve" ? "Litige résolu avec succès" : "Litige refusé" });
        setSelectedDispute((p) => p ? { ...p, status: action === "resolve" ? "RESOLVED" : "DENIED" } : p);
        fetchDisputes();
      } else {
        setAlert({ type: "error", message: "Erreur lors de l'action" });
      }
    } catch {
      setAlert({ type: "error", message: "Erreur de connexion" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedDispute) return;
    setSendingMessage(true);
    try {
      const res = await authFetch(`/api/admin/disputes/${selectedDispute.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const msg = await res.json();
        setSelectedDispute((p) =>
          p ? { ...p, messages: [...p.messages, msg.message ?? { id: Date.now().toString(), senderId: "admin", senderName: "Admin", senderRole: "ADMIN", content: newMessage, createdAt: new Date().toISOString() }] } : p
        );
        setNewMessage("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingMessage(false);
    }
  };

  const filtered = disputes.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.reference.toLowerCase().includes(q) ||
      d.reporter.firstName.toLowerCase().includes(q) ||
      d.reporter.lastName.toLowerCase().includes(q) ||
      d.subject.toLowerCase().includes(q)
    );
  });

  const fmtTime = (d: string) =>
    new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="bg-[#f9f9ff] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen flex transition-colors">
      <AdminSidebar active="Disputes" />

      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {/* ── Top nav ── */}
        <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl sticky top-0 z-40 w-full px-6 md:px-8 h-16 flex items-center justify-between shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search litiges..."
                className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm w-60 md:w-80 focus:ring-4 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchDisputes}
              className="p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all"
              title="Refresh"
            >
              <IoRefreshOutline className="text-xl" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all">
              <IoNotificationsOutline className="text-xl" />
            </button>
            <button className="p-2 text-slate-500 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 rounded-full transition-all">
              <IoPersonCircleOutline className="text-xl" />
            </button>
          </div>
        </header>

        {/* Alert */}
        {alert && (
          <div className="fixed top-20 right-5 z-[60] w-full max-w-sm">
            <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
          </div>
        )}

        <section className="p-5 md:p-8 space-y-7 flex-1 max-w-7xl mx-auto w-full">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Dispute Management
              </h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                Review and resolve reported issues within the Atlas ecosystem.
              </p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
              <button
                onClick={() => { setTab("active"); setSelectedDispute(null); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === "active"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Active Cases
              </button>
              <button
                onClick={() => { setTab("archive"); setSelectedDispute(null); }}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === "archive"
                    ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Archive
              </button>
            </div>
          </div>

          {/* ── Main 2-column grid ── */}
          <div className="grid grid-cols-12 gap-6" style={{ height: "calc(100vh - 320px)", minHeight: 500 }}>

            {/* ── Left: Case Queue ── */}
            <div className="col-span-12 lg:col-span-8 bg-slate-50 dark:bg-slate-800/40 rounded-2xl flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800">
              {/* Queue header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl">
                <span className="font-bold text-base text-slate-900 dark:text-white">Case Queue</span>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                    <IoFilterOutline className="text-xs" />
                    Filter
                  </span>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">
                    {filtered.length} case{filtered.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <LoadingSpinner fullScreen={false} variant="spinner" size="md" color="primary" text="Chargement..." speed="normal" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-600 gap-3">
                    <MdOutlineGavel className="text-5xl" />
                    <p className="text-sm font-medium">Aucun litige trouvé</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-separate border-spacing-0">
                    <thead>
                      <tr className="sticky top-0 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-sm z-10">
                        {["Case ID", "Reporter", "Subject", "Date", "Severity"].map((h) => (
                          <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((d, i) => {
                        const isSelected = selectedDispute?.id === d.id;
                        return (
                          <tr
                            key={d.id}
                            onClick={() => setSelectedDispute(d)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-blue-50/60 dark:bg-blue-950/20"
                                : i % 2 === 0
                                  ? "hover:bg-white dark:hover:bg-slate-900"
                                  : "bg-white/40 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900"
                            }`}
                          >
                            <td className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              #{d.reference}
                            </td>
                            <td className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50">
                              <div className="flex items-center gap-2.5">
                                <Avatar
                                  name={`${d.reporter.firstName} ${d.reporter.lastName}`}
                                  image={d.reporter.image}
                                  size={30}
                                />
                                <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                  {d.reporter.firstName} {d.reporter.lastName.charAt(0)}.
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50">
                              <SubjectChip subject={d.subject} />
                            </td>
                            <td className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                              {fmtDate(d.date)}
                            </td>
                            <td className="px-5 py-4 border-b border-slate-100/50 dark:border-slate-800/50">
                              <SeverityBadge severity={d.severity} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* ── Right: Details panel ── */}
            <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl flex flex-col border border-slate-100 dark:border-slate-800 shadow-[0_8px_16px_-4px_rgba(24,28,34,0.07)] overflow-hidden">
              {selectedDispute ? (
                <>
                  {/* Panel header */}
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                          Case Details
                        </p>
                        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                          #{selectedDispute.reference}
                        </h2>
                      </div>
                      {(selectedDispute.status === "OPEN" || selectedDispute.status === "IN_REVIEW") && (
                        <span className="px-2.5 py-1 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-lg text-[10px] font-bold uppercase">
                          Action Required
                        </span>
                      )}
                      {selectedDispute.status === "RESOLVED" && (
                        <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-[10px] font-bold uppercase">
                          Resolved
                        </span>
                      )}
                      {selectedDispute.status === "DENIED" && (
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase">
                          Denied
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Issue:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{selectedDispute.subject}</span>
                      </div>
                      {selectedDispute.listing && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Listing:</span>
                          <Link
                            href={`/fr/listings/${selectedDispute.listing.id}`}
                            className="font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[150px]"
                          >
                            {selectedDispute.listing.title}
                          </Link>
                        </div>
                      )}
                      {selectedDispute.refundAmount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Refund claimed:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {selectedDispute.refundAmount.toLocaleString("fr-FR")} TND
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conversation */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
                    {selectedDispute.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-300 dark:text-slate-700 gap-2">
                        <IoChatbubbleOutline className="text-4xl" />
                        <p className="text-xs">Aucun message</p>
                      </div>
                    ) : (
                      selectedDispute.messages.map((msg) => {
                        const isTenant = msg.senderRole === "TENANT";
                        const isAdmin = msg.senderRole === "ADMIN";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isTenant ? "items-start" : "items-end"} max-w-[88%] ${isTenant ? "mr-auto" : "ml-auto"}`}
                          >
                            {/* Attachment image */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="mb-2 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800">
                                <img
                                  src={msg.attachments[0]}
                                  alt="attachment"
                                  className="w-full h-28 object-cover"
                                />
                              </div>
                            )}
                            <div
                              className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                isTenant
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                                  : isAdmin
                                    ? "bg-purple-600 text-white rounded-tr-none"
                                    : "bg-[#005cab] text-white rounded-tr-none"
                              }`}
                            >
                              {msg.content}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-600 mt-1 mx-1 uppercase font-bold tracking-tight">
                              {msg.senderName} · {fmtTime(msg.createdAt)}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message input + actions */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 rounded-b-2xl space-y-3">
                    {/* Message input */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                        placeholder="Ajouter une note admin..."
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={sendingMessage || !newMessage.trim()}
                        className="w-9 h-9 rounded-xl bg-[#005cab] flex items-center justify-center text-white hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
                      >
                        {sendingMessage ? (
                          <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        ) : (
                          <IoSendOutline className="text-sm" />
                        )}
                      </button>
                    </div>

                    {/* Open full case */}
                    <Link
                      href={`/fr/admin/disputes/${selectedDispute.id}`}
                      className="w-full py-2.5 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white rounded-full font-bold text-sm shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-[.98] transition-all flex items-center justify-center gap-2"
                    >
                      Open Full Case
                      <IoChevronForwardOutline className="text-sm" />
                    </Link>

                    {/* Accept / Deny — only for open cases */}
                    {(selectedDispute.status === "OPEN" || selectedDispute.status === "IN_REVIEW") && (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleAction("deny", selectedDispute.id)}
                          disabled={!!actionLoading}
                          className="py-2.5 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === "deny" ? (
                            <span className="w-3 h-3 rounded-full border-2 border-slate-300/30 border-t-slate-500 animate-spin" />
                          ) : (
                            <IoCloseCircleOutline className="text-sm" />
                          )}
                          DENIED
                        </button>
                        <button
                          onClick={() => handleAction("resolve", selectedDispute.id)}
                          disabled={!!actionLoading}
                          className="py-2.5 bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-full font-bold text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          {actionLoading === "resolve" ? (
                            <span className="w-3 h-3 rounded-full border-2 border-emerald-300/30 border-t-emerald-500 animate-spin" />
                          ) : (
                            <IoCheckmarkCircleOutline className="text-sm" />
                          )}
                          RESOLVED
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-300 dark:text-slate-700 gap-3">
                  <MdOutlineGavel className="text-5xl" />
                  <p className="text-sm font-medium text-slate-400 dark:text-slate-600">
                    Sélectionner un litige
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Bento stats ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: "Avg Resolution",
                value: `${stats.avgResolutionHours}`,
                unit: "hrs",
                icon: <IoTimeOutline className="text-7xl" />,
                cls: "bg-slate-100 dark:bg-slate-800/60",
              },
              {
                label: "Total Reported",
                value: `${stats.totalReported}`,
                unit: "",
                icon: <IoAlertCircleOutline className="text-7xl text-blue-600 dark:text-blue-400" />,
                cls: "bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-100 dark:border-blue-900/40",
              },
              {
                label: "Top Subject",
                value: stats.topSubject,
                unit: "",
                icon: <TbBoom className="text-7xl" />,
                cls: "bg-slate-100 dark:bg-slate-800/60",
              },
              {
                label: "Pending Payouts",
                value: `${stats.pendingPayouts.toLocaleString("fr-FR")}`,
                unit: "TND",
                icon: <IoWalletOutline className="text-7xl" />,
                cls: "bg-slate-100 dark:bg-slate-800/60",
              },
            ].map(({ label, value, unit, icon, cls }) => (
              <div key={label} className={`${cls} rounded-2xl p-5 flex flex-col justify-between h-28 relative overflow-hidden border border-transparent`}>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest relative z-10">
                  {label}
                </span>
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white relative z-10">
                  {value}{unit && <span className="text-sm font-normal text-slate-500 dark:text-slate-400 ml-1">{unit}</span>}
                </span>
                <div className="absolute -right-4 -bottom-4 opacity-[0.06] pointer-events-none">
                  {icon}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}