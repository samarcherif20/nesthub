"use client";
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Users,
  Home,
  Shield,
  Scale,
  AlertTriangle,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  MoreHorizontal,
  Eye,
  BarChart3,
  LineChart,
  Clock,
  UserCheck,
  UserX,
  Ban,
  Lock,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  Server,
  Wifi,
  Zap,
  Star,
  DollarSign,
  Ticket,
  AlertCircle,
  XCircle,
  CheckCircle,
  Sparkles,
  X,
  Command,
  Hash,
  Mail,
  Globe,
  ArrowRight,
  Layers,
  MapPin,
  Circle,
  FileText,
  CreditCard,
  Settings,
  Activity,
  Fingerprint,
  SlidersHorizontal,
  Radio,
  Crosshair,
  Gauge,
  Cpu,
  HardDrive,
  Monitor,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut, Radar, PolarArea } from "react-chartjs-2";
import { useDashboard } from "./hooks/useDashboard";
import { useRouter, usePathname } from "next/navigation";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);

const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// Color maps
const roleBadge: Record<string, string> = {
  ADMIN:
    "text-red-600 dark:text-red-400 border-red-500/30 bg-red-50 dark:bg-red-500/10",
  PROPERTY_OWNER:
    "text-violet-600 dark:text-violet-400 border-violet-500/30 bg-violet-50 dark:bg-violet-500/10",
  TENANT:
    "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10",
  BOTH: "text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-50 dark:bg-blue-500/10",
  CO_HOST:
    "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10",
};
const roleLabel: Record<string, string> = {
  ADMIN: "ADMIN",
  PROPERTY_OWNER: "PROPRIÉTAIRE",
  TENANT: "LOCATAIRE",
  BOTH: "LES DEUX",
  CO_HOST: "CO-HÔTE",
};
const statusBadge: Record<string, string> = {
  ACTIVE:
    "text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10",
  PENDING_VALIDATION:
    "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-500/10",
  TEMPORARILY_SUSPENDED:
    "text-orange-600 dark:text-orange-400 border-orange-500/30 bg-orange-50 dark:bg-orange-500/10",
  PERMANENTLY_BANNED:
    "text-red-600 dark:text-red-400 border-red-500/30 bg-red-50 dark:bg-red-500/10",
  SECURITY_LOCKED:
    "text-rose-600 dark:text-rose-400 border-rose-500/30 bg-rose-50 dark:bg-rose-500/10",
  INACTIVE:
    "text-gray-500 dark:text-gray-400 border-gray-600/30 bg-gray-100 dark:bg-gray-500/10",
};
const statusLabel: Record<string, string> = {
  ACTIVE: "ACTIF",
  PENDING_VALIDATION: "EN ATTENTE",
  TEMPORARILY_SUSPENDED: "SUSPENDU",
  PERMANENTLY_BANNED: "BANNI",
  SECURITY_LOCKED: "VERROUILLÉ",
  INACTIVE: "INACTIF",
};
const trustBadge: Record<string, string> = {
  green:
    "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
  gray: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-500/10",
  orange: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
  red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10",
};
const trustLabel: Record<string, string> = {
  green: "Très fiable",
  gray: "Neutre",
  orange: "Prudence",
  red: "Risqué",
};
const prioBadge: Record<string, string> = {
  HIGH: "text-red-600 dark:text-red-400 border-red-500/30 bg-red-50 dark:bg-red-500/10",
  NORMAL:
    "text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-50 dark:bg-amber-500/10",
  LOW: "text-gray-500 dark:text-gray-400 border-gray-600/30 bg-gray-100 dark:bg-gray-500/10",
  ESCALATED:
    "text-red-500 dark:text-red-300 border-red-400/40 bg-red-50 dark:bg-red-500/15",
};
const prioLabel: Record<string, string> = {
  HIGH: "HAUTE",
  NORMAL: "NORMALE",
  LOW: "BASSE",
  ESCALATED: "ESCALADÉ",
};

function Sparkline({
  data,
  color = "#00ffc8",
  h = 24,
}: {
  data: number[];
  color?: string;
  h?: number;
}) {
  const max = Math.max(...data),
    min = Math.min(...data),
    range = max - min || 1;
  const w = 80;
  const pts = data
    .map(
      (v, i) =>
        `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`,
    )
    .join(" ");
  const area = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      style={{ height: h }}
      preserveAspectRatio="none"
    >
      <polygon points={area} fill={color} opacity="0.1" />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PanelHead({
  label,
  status,
  icon: Icon,
}: {
  label: string;
  status?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200 dark:border-white/5">
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon
            size={14}
            className="text-indigo-600 dark:text-emerald-400/70"
          />
        )}
        <span className="text-xs font-semibold text-indigo-700 dark:text-emerald-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      {status && (
        <div className="flex items-center gap-1.5">
          <span className="status-dot w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-emerald-600 dark:text-emerald-500">
            {status}
          </span>
        </div>
      )}
    </div>
  );
}

function MetricBlock({
  label,
  value,
  unit,
  change,
  spark,
  color,
}: {
  label: string;
  value: string;
  unit?: string;
  change: number;
  spark: number[];
  color: string;
}) {
  const up = change >= 0;
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 transition-all duration-300 ${card3d}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`text-xs font-bold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
        >
          {up ? "▲" : "▼"} {Math.abs(change)}%
        </span>
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
      <Sparkline data={spark} color={color} h={20} />
    </div>
  );
}

function RadialRing({
  pct,
  label,
  color = "#00ffc8",
  size = 80,
}: {
  pct: number;
  label: string;
  color?: string;
  size?: number;
}) {
  const r = (size - 10) / 2,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.04)"
          strokeWidth="5"
        />
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        <text
          x={cx}
          y={cy + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-900 dark:fill-white font-bold"
          style={{ fontSize: size * 0.2 }}
        >
          {pct}%
        </text>
      </svg>
      <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

interface Toast {
  id: number;
  type: "ok" | "err" | "info";
  title: string;
  msg: string;
}
let _tid = 0;

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const add = useCallback((type: Toast["type"], title: string, msg: string) => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, type, title, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  const rm = useCallback(
    (id: number) => setToasts((p) => p.filter((t) => t.id !== id)),
    [],
  );
  return { toasts, add, rm };
}

function ToastStack({
  toasts,
  onRm,
}: {
  toasts: Toast[];
  onRm: (id: number) => void;
}) {
  const icons = { ok: CheckCircle, err: XCircle, info: AlertCircle };
  const colors = {
    ok: "border-emerald-500/30 bg-emerald-500/5",
    err: "border-red-500/30 bg-red-500/5",
    info: "border-cyan-500/30 bg-cyan-500/5",
  };
  const ic = {
    ok: "text-emerald-500",
    err: "text-red-500",
    info: "text-cyan-500",
  };
  return (
    <div className="fixed bottom-4 right-4 z-[100] space-y-2 w-72">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={`flex items-start gap-2.5 p-3 rounded-lg border backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 ${colors[t.type]}`}
          >
            <Icon size={14} className={`${ic[t.type]} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {t.title}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                {t.msg}
              </p>
            </div>
            <button
              onClick={() => onRm(t.id)}
              className="text-slate-400 hover:text-slate-900 dark:text-gray-500 dark:hover:text-white"
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

interface DUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  riskScore: number;
  trustLabel: string;
  trustBadge: string;
  isVerified: boolean;
  profilePictureUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

function UserDrawer({
  user,
  onClose,
  onAction,
  t,
}: {
  user: DUser | null;
  onClose: () => void;
  onAction: (m: string) => void;
  t: any;
}) {
  const [avatarError, setAvatarError] = useState(false);

  if (!user) return null;

  const getUserInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[80]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] text-indigo-600 dark:text-emerald-400 uppercase tracking-wider">
              {t("userDrawer.title")}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
              {user.profilePictureUrl && !avatarError ? (
                <img
                  src={`/api/admin/serve-image?url=${encodeURIComponent(user.profilePictureUrl)}`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <span className="text-white font-bold text-sm">
                  {getUserInitials()}
                </span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {user.name}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-gray-500">
                {user.email}
              </p>
              <div className="flex gap-1.5 mt-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleBadge[user.role]}`}
                >
                  {roleLabel[user.role]}
                </span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trustBadge[user.trustBadge]}`}
                >
                  {trustLabel[user.trustBadge]}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-1">
                {t("userDrawer.status")}
              </p>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.5 rounded border ${statusBadge[user.status]}`}
              >
                {statusLabel[user.status]}
              </span>
            </div>
            <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg p-3">
              <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase mb-1">
                {t("userDrawer.riskScore")}
              </p>
              <span
                className={`text-sm font-bold ${user.riskScore <= 30 ? "text-emerald-600 dark:text-emerald-400" : user.riskScore <= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}
              >
                {user.riskScore}
                <span className="text-gray-400 text-[11px]">/100</span>
              </span>
              <div className="w-full h-0.5 bg-slate-200 dark:bg-white/5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${user.riskScore <= 30 ? "bg-emerald-500" : user.riskScore <= 60 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${user.riskScore}%` }}
                />
              </div>
            </div>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg p-3 space-y-2">
            <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider">
              {t("userDrawer.information")}
            </p>
            {[
              { i: Mail, l: t("userDrawer.email"), v: user.email },
              { i: Hash, l: t("userDrawer.id"), v: user.id.slice(0, 8) },
              {
                i: ShieldCheck,
                l: t("userDrawer.verified"),
                v: user.isVerified ? t("common.yes") : t("common.no"),
              },
              { i: Clock, l: t("userDrawer.lastLogin"), v: t("userDrawer.twoHoursAgo") },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-2">
                <x.i size={11} className="text-slate-400 dark:text-gray-600" />
                <span className="text-[11px] text-slate-500 dark:text-gray-500 w-20">
                  {x.l}
                </span>
                <span className="text-[11px] text-slate-900 dark:text-gray-300">
                  {x.v}
                </span>
              </div>
            ))}
          </div>
          <div className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg p-3">
            <p className="text-[10px] text-slate-500 dark:text-gray-500 uppercase tracking-wider mb-2">
              {t("userDrawer.trustEvaluation")}
            </p>
            {[
              { l: t("userDrawer.identity"), s: user.isVerified ? 100 : 0 },
              { l: t("userDrawer.payments"), s: 85 },
              { l: t("userDrawer.reviews"), s: 92 },
              { l: t("userDrawer.activity"), s: 68 },
              { l: t("userDrawer.reports"), s: 95 },
            ].map((x) => (
              <div key={x.l} className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] text-slate-500 dark:text-gray-500 w-20">
                  {x.l}
                </span>
                <div className="flex-1 h-0.5 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${x.s >= 80 ? "bg-emerald-500" : x.s >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${x.s}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-gray-500 w-6 text-right">
                  {x.s}%
                </span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              {
                l: t("userDrawer.suspend"),
                i: Ban,
                c: "border-orange-500/20 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10",
              },
              {
                l: t("userDrawer.verify"),
                i: ShieldCheck,
                c: "border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10",
              },
              {
                l: t("userDrawer.notify"),
                i: Bell,
                c: "border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10",
              },
              {
                l: t("userDrawer.notes"),
                i: FileText,
                c: "border-violet-500/20 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10",
              },
              {
                l: t("userDrawer.ban"),
                i: UserX,
                c: "border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10",
              },
              {
                l: t("userDrawer.unlock"),
                i: Lock,
                c: "border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10",
              },
            ].map((a) => (
              <button
                key={a.l}
                onClick={() => onAction(`${a.l}: ${user.name}`)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${a.c}`}
              >
                <a.i size={14} />
                <span className="text-[10px] font-medium">{a.l}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const t = useTranslations("AdminDashboard");
  const { data, loading, error, pendingVerificationsCount } = useDashboard();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";

  const { theme } = useTheme();
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [drawer, setDrawer] = useState<DUser | null>(null);
  const [userFilter, setUserFilter] = useState("ALL");
  const [expLog, setExpLog] = useState<string | null>(null);
  const [chartTab, setChartTab] = useState<"rev" | "book">("rev");
  const { toasts, add, rm } = useToasts();
  const [time, setTime] = useState(new Date());
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});
  const [pendingReminderDismissed, setPendingReminderDismissed] =
    useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (showAllUsers && allUsers.length === 0) {
      fetch("/api/admin/users?limit=100")
        .then((res) => res.json())
        .then((data) => setAllUsers(data.users || []));
    }
  }, [showAllUsers, allUsers.length]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center">
            <LoadingSpinner className="w-12 h-12" />
          </div>
          <p className="text-slate-500 mt-4 text-sm">{t("loading")}</p>
        </div>
      </div>
    );
  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-500">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p className="text-sm">{t("error")}: {error}</p>
        </div>
      </div>
    );

  const isDark = theme === "dark";
  const gridColor = isDark
    ? "rgba(148, 163, 184, 0.08)"
    : "rgba(0, 0, 0, 0.05)";
  const tickColor = isDark ? "#64748b" : "#94a3b8";

  const getUserInitials = (user: any) => {
    const first = user.firstName?.charAt(0) || "";
    const last = user.lastName?.charAt(0) || "";
    if (first || last) return `${first}${last}`.toUpperCase();
    return (
      user.name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  const stackedRevChart = {
    labels: data.revenue?.labels || [
      "Jan",
      "Fév",
      "Mar",
      "Avr",
      "Mai",
      "Juin",
      "Juil",
      "Aoû",
      "Sep",
      "Oct",
      "Nov",
      "Déc",
    ],
    datasets: [
      {
        label: t("charts.commissions"),
        data: data.revenue?.commissions || [],
        backgroundColor: "rgba(99,102,241,0.8)",
        borderRadius: {
          topLeft: 0,
          topRight: 0,
          bottomLeft: 4,
          bottomRight: 4,
        },
        borderSkipped: false,
      },
      {
        label: t("charts.payments"),
        data: data.revenue?.payouts || [],
        backgroundColor: "rgba(6,182,212,0.5)",
        borderRadius: 0,
        borderSkipped: false,
      },
      {
        label: t("charts.refunds"),
        data: data.revenue?.refunds || [],
        backgroundColor: "rgba(245,158,11,0.5)",
        borderRadius: {
          topLeft: 4,
          topRight: 4,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
      },
    ],
  };
  const stackedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "rectRounded" as const,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          callback: (v: any) => (v / 1000).toFixed(0) + "k",
          color: tickColor,
          font: { size: 11 },
        },
        border: { display: false },
      },
      x: {
        stacked: true,
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const areaChart = {
    labels: data.bookingTrend?.labels || [],
    datasets: [
      {
        label: t("charts.completed"),
        data: data.bookingTrend?.completed || [],
        borderColor: "#10b981",
        backgroundColor: (ctx: any) => {
          const c = ctx.chart;
          const { ctx: cx, chartArea } = c;
          if (!chartArea) return "rgba(16,185,129,0.1)";
          const g = cx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          g.addColorStop(0, "rgba(16,185,129,0.25)");
          g.addColorStop(1, "rgba(16,185,129,0.0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
      },
      {
        label: t("charts.cancelled"),
        data: data.bookingTrend?.cancelled || [],
        borderColor: "#ef4444",
        backgroundColor: (ctx: any) => {
          const c = ctx.chart;
          const { ctx: cx, chartArea } = c;
          if (!chartArea) return "rgba(239,68,68,0.05)";
          const g = cx.createLinearGradient(
            0,
            chartArea.top,
            0,
            chartArea.bottom,
          );
          g.addColorStop(0, "rgba(239,68,68,0.12)");
          g.addColorStop(1, "rgba(239,68,68,0.0)");
          return g;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 1.5,
        pointRadius: 0,
      },
      {
        label: t("charts.pending"),
        data: data.bookingTrend?.pending || [],
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.03)",
        fill: true,
        tension: 0.4,
        borderWidth: 1.5,
        borderDash: [3, 3],
        pointRadius: 0,
      },
    ],
  };
  const areaOpts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const radarChart = {
    labels: [
      t("radarLabels.users"),
      t("radarLabels.listings"),
      t("radarLabels.bookings"),
      t("radarLabels.revenue"),
      t("radarLabels.trust"),
      t("radarLabels.conversion"),
    ],
    datasets: [
      {
        label: t("radarDatasets.currentMonth"),
        data: [
          data.radarMetrics?.currentUsers || 0,
          data.radarMetrics?.currentListings || 0,
          data.radarMetrics?.currentBookings || 0,
          data.radarMetrics?.currentRevenue || 0,
          data.radarMetrics?.currentTrust || 0,
          data.radarMetrics?.currentConversion || 0,
        ],
        backgroundColor: "rgba(99,102,241,0.12)",
        borderColor: "#6366f1",
        borderWidth: 2,
        pointBackgroundColor: "#6366f1",
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: t("radarDatasets.previousMonth"),
        data: [
          data.radarMetrics?.previousUsers || 0,
          data.radarMetrics?.previousListings || 0,
          data.radarMetrics?.previousBookings || 0,
          data.radarMetrics?.previousRevenue || 0,
          data.radarMetrics?.previousTrust || 0,
          data.radarMetrics?.previousConversion || 0,
        ],
        backgroundColor: "rgba(148,163,184,0.08)",
        borderColor: "#94a3b8",
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointBackgroundColor: "#94a3b8",
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };
  const radarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 25,
          color: tickColor,
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: { color: gridColor },
        angleLines: { color: gridColor },
        pointLabels: {
          color: tickColor,
          font: { size: 11, weight: 500 as const },
        },
      },
    },
  };

  const polarChart = {
    labels: data.topGovernorates?.map((g: any) => g.name) || [],
    datasets: [
      {
        data: data.topGovernorates?.map((g: any) => g.revenue / 1000) || [],
        backgroundColor: [
          "rgba(99,102,241,0.7)",
          "rgba(6,182,212,0.7)",
          "rgba(16,185,129,0.7)",
          "rgba(245,158,11,0.7)",
          "rgba(239,68,68,0.6)",
          "rgba(168,85,247,0.6)",
        ],
        borderWidth: 0,
      },
    ],
  };
  const polarOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "circle" as const,
          padding: 8,
          font: { size: 11 },
        },
      },
    },
    scales: {
      r: {
        beginAtZero: true,
        ticks: { display: false },
        grid: { color: gridColor },
        angleLines: { color: gridColor },
      },
    },
  };

  const hBarLabels = [
    t("accountStatus.active"),
    t("accountStatus.pending"),
    t("accountStatus.suspended"),
    t("accountStatus.locked"),
    t("accountStatus.banned"),
    t("accountStatus.inactive"),
  ];
  const hBarValues = [
    data.accountStatus?.active || 0,
    data.accountStatus?.pending || 0,
    data.accountStatus?.suspended || 0,
    data.accountStatus?.locked || 0,
    data.accountStatus?.banned || 0,
    data.accountStatus?.inactive || 0,
  ];
  const hBarChart = {
    labels: hBarLabels,
    datasets: [
      {
        label: t("accountStatus.users"),
        data: hBarValues,
        backgroundColor: [
          "rgba(16,185,129,0.7)",
          "rgba(245,158,11,0.7)",
          "rgba(249,115,22,0.7)",
          "rgba(239,68,68,0.7)",
          "rgba(220,38,38,0.7)",
          "rgba(100,116,139,0.5)",
        ],
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };
  const hBarOpts = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "rectRounded" as const,
          padding: 12,
          font: { size: 11 },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const uDist = {
    labels: [
      t("userDistribution.tenants"),
      t("userDistribution.owners"),
      t("userDistribution.both"),
      t("userDistribution.coHosts"),
      t("userDistribution.admins"),
    ],
    datasets: [
      {
        data: [
          data.userDistribution?.tenants || 0,
          data.userDistribution?.owners || 0,
          data.userDistribution?.both || 0,
          data.userDistribution?.coHosts || 0,
          data.userDistribution?.admins || 0,
        ],
        backgroundColor: [
          "#6366f1",
          "#8b5cf6",
          "#06b6d4",
          "#10b981",
          "#ef4444",
        ],
        borderWidth: 0,
        cutout: "78%",
        spacing: 2,
        borderRadius: 4,
      },
    ],
  };
  const dOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const totalU = data.kpi?.totalUsers || 0;
  const displayedUsers = showAllUsers ? allUsers : data.recentUsers || [];
  const filtU =
    userFilter === "ALL"
      ? displayedUsers
      : displayedUsers.filter((u: any) => u.status === userFilter);
  const timeStr = time.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/0">
      <UserDrawer
        user={drawer}
        onClose={() => setDrawer(null)}
        onAction={(m) => add("ok", t("toasts.actionExecuted"), m)}
        t={t}
      />
      <ToastStack toasts={toasts} onRm={rm} />

      <header className="bg-white dark:bg-slate-900/0 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 lg:px-10 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {t("title")}
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-500/20">
                  {t("globalBadge")}
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("systemsNominal")}
                </span>
                <span className="text-xs font-mono text-slate-700 dark:text-slate-300 ml-2">
                  {timeStr}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="px-6 lg:px-10 py-8 space-y-6">
        <AnimatePresence>
          {pendingVerificationsCount > 0 && !pendingReminderDismissed && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="mx-5 mb-4 flex items-center gap-3 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 rounded-2xl px-4 py-3 border border-red-200 dark:border-red-800/50 shadow-lg shadow-red-500/20"
            >
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              >
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              </motion.div>
              <div className="flex-1">
                <p className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider">
                  {pendingVerificationsCount} {t("pendingAlert.requests")}
                </p>
                <p className="text-[11px] font-medium text-red-600 dark:text-red-400 flex items-center gap-1.5 mt-0.5">
                  {t("pendingAlert.waiting")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/${locale}/admin/verifications`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-700 dark:text-red-300 text-xs font-semibold transition-all"
                >
                  <Eye className="w-3.5 h-3.5" />
                  {t("pendingAlert.process")}
                </Link>
                <button
                  onClick={() => setPendingReminderDismissed(true)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              icon: Shield,
              n: data.kpi?.pendingVerifications || 0,
              l: t("statusBar.verifications"),
              c: "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
            },
            {
              icon: Scale,
              n: data.kpi?.openDisputes || 0,
              l: t("statusBar.disputes"),
              c: "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400",
            },
            {
              icon: AlertTriangle,
              n: data.kpi?.openReports || 0,
              l: t("statusBar.reports"),
              c: "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400",
            },
            {
              icon: UserCheck,
              n: (data.recentUsers || []).filter((u: any) => u.status === "PENDING_VALIDATION").length,
              l: t("statusBar.newUsers"),
              c: "border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400",
            },
          ].map((s) => (
            <div
              key={s.l}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${s.c}`}
            >
              <s.icon size={14} />
              <span className="text-xs font-bold">{s.n}</span>
              <span className="text-[11px] opacity-70">{s.l}</span>
            </div>
          ))}
          <div className="flex-1" />
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricBlock
            label={t("kpi.users")}
            value={(data.kpi?.totalUsers || 0).toLocaleString()}
            change={data.kpi?.usersGrowth || 0}
            spark={data.sparklineData?.totalUsers || [80, 95, 88, 110, 105, 120, 135, 128, 142, 150, 145, 160]}
            color="#6366f1"
          />
          <MetricBlock
            label={t("kpi.activeListings")}
            value={(data.kpi?.activeListings || 0).toLocaleString()}
            change={data.kpi?.listingsGrowth || 0}
            spark={data.sparklineData?.activeListings || [120, 135, 128, 150, 145, 165, 180, 175, 190, 200, 195, 215]}
            color="#06b6d4"
          />
          <MetricBlock
            label={t("kpi.bookings")}
            value={(data.kpi?.totalBookings || 0).toLocaleString()}
            change={data.kpi?.bookingsGrowth || 0}
            spark={data.sparklineData?.bookings || [200, 220, 215, 245, 235, 260, 280, 270, 295, 310, 300, 325]}
            color="#10b981"
          />
          <MetricBlock
            label={t("kpi.revenue")}
            value={`${((data.kpi?.platformRevenue || 0) / 1000).toFixed(0)}k`}
            unit={t("kpi.unit")}
            change={data.kpi?.revenueGrowth || 0}
            spark={data.sparklineData?.revenue || [50, 62, 58, 74, 68, 82, 96, 90, 105, 115, 108, 128]}
            color="#f59e0b"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-emerald-400 uppercase tracking-wider">
                  {chartTab === "rev" ? t("charts.stackedRevenue") : t("charts.bookingTrends")}
                </span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
                <button
                  onClick={() => setChartTab("rev")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${chartTab === "rev" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t("charts.stacked")}
                </button>
                <button
                  onClick={() => setChartTab("book")}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all ${chartTab === "book" ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {t("charts.area")}
                </button>
              </div>
            </div>
            <div className="h-[300px]">
              {chartTab === "rev" ? (
                <Bar data={stackedRevChart} options={stackedOpts} />
              ) : (
                <Line data={areaChart} options={areaOpts} />
              )}
            </div>
          </div>
          <div className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <PanelHead label={t("radar.title")} status={t("radar.live")} icon={Crosshair} />
            <div className="h-[300px]">
              <Radar data={radarChart} options={radarOpts} />
            </div>
          </div>
        </div>

        {/* Users Table + Répartition utilisateurs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Users Table */}
          <div className={`lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden ${block3d}`}>
            <div className="flex flex-wrap items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 gap-3">
              <div className="flex items-center gap-2">
                <Fingerprint size={16} className="text-indigo-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-indigo-700 dark:text-emerald-400 uppercase tracking-wider">
                  {t("usersTable.title")}
                </span>
                <span className="text-[11px] text-slate-500">
                  // {filtU.length} {t("usersTable.records")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
                  {["ALL", "ACTIVE", "PENDING_VALIDATION", "TEMPORARILY_SUSPENDED"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setUserFilter(s)}
                      className={`px-2 py-1 text-[11px] font-bold rounded transition-all ${userFilter === s ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"}`}
                    >
                      {s === "ALL" ? t("usersTable.filters.all") : statusLabel[s]}
                    </button>
                  ))}
                </div>
                <a href={`/${locale}/admin/users`} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-xs font-medium">
                  <Users size={16} />
                  {t("usersTable.viewAll")}
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    {[
                      t("usersTable.columns.user"),
                      t("usersTable.columns.role"),
                      t("usersTable.columns.status"),
                      t("usersTable.columns.risk"),
                      t("usersTable.columns.trust"),
                      t("usersTable.columns.verified"),
                      t("usersTable.columns.joined"),
                    ].map((h) => (
                      <th key={h} className="px-5 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtU.map((u: any) => (
                    <tr
                      key={u.id}
                      onClick={() => setDrawer({ ...u, name: u.name, firstName: u.firstName, lastName: u.lastName, profilePictureUrl: u.profilePictureUrl })}
                      className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {u.profilePictureUrl && !avatarErrors[u.id] ? (
                              <img
                                src={`/api/admin/serve-image?url=${encodeURIComponent(u.profilePictureUrl)}`}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={() => setAvatarErrors((prev) => ({ ...prev, [u.id]: true }))}
                              />
                            ) : (
                              <span className="text-white font-bold text-xs">{getUserInitials(u)}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                              {u.name}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${roleBadge[u.role]}`}>
                          {roleLabel[u.role]}
                        </span>
                       </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded-full border ${statusBadge[u.status]}`}>
                          {statusLabel[u.status]}
                        </span>
                       </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${u.riskScore <= 30 ? "bg-emerald-500" : u.riskScore <= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${u.riskScore}%` }} />
                          </div>
                          <span className={`text-xs font-bold ${u.riskScore <= 30 ? "text-emerald-600 dark:text-emerald-400" : u.riskScore <= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                            {u.riskScore}
                          </span>
                        </div>
                       </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[11px] font-bold px-2 py-1 rounded ${trustBadge[u.trustBadge]}`}>
                          {trustLabel[u.trustBadge]}
                        </span>
                       </td>
                      <td className="px-5 py-3.5">
                        {u.isVerified ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-slate-400" />}
                       </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500 dark:text-slate-400">{u.joinedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Répartition utilisateurs - Doughnut */}
          <div className={`lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <PanelHead label={t("userDistribution.title")} icon={Layers} />
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="relative w-52 h-52">
                <Doughnut data={uDist} options={dOpts} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">{totalU}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">{t("userDistribution.total")}</span>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-3 w-full">
                {uDist.labels.map((l, i) => (
                  <div key={l} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: uDist.datasets[0].backgroundColor[i] }} />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">{l}</span>
                    <span className="text-[11px] font-bold text-slate-900 dark:text-white ml-auto">{uDist.datasets[0].data[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row: PolarArea + HBar + Rings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className={`lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <PanelHead label={t("regionalRevenue.title")} icon={MapPin} />
            <div className="h-[260px]">
              <PolarArea data={polarChart} options={polarOpts} />
            </div>
            <div className="mt-4 space-y-1">
              {(data.topGovernorates || []).slice(0, 3).map((g: any, i: number) => (
                <div key={g.name} className="flex items-center gap-2 text-[11px]">
                  <span className="w-4 text-slate-400">{i + 1}.</span>
                  <span className="flex-1 text-slate-600 dark:text-slate-400">{g.name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{g.revenue.toLocaleString()} TND</span>
                </div>
              ))}
            </div>
          </div>

          <div className={`lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <PanelHead label={t("accountStatus.title")} icon={Layers} />
            <div className="h-[260px]">
              <Bar data={hBarChart} options={hBarOpts} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2">
                <p className="text-[11px] text-slate-500">{t("accountStatus.active")}</p>
                <p className="text-base font-bold text-emerald-600">{data.accountStatus?.active || 0}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2">
                <p className="text-[11px] text-slate-500">{t("accountStatus.suspended")}</p>
                <p className="text-base font-bold text-orange-600">{data.accountStatus?.suspended || 0}</p>
              </div>
              <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2">
                <p className="text-[11px] text-slate-500">{t("accountStatus.banned")}</p>
                <p className="text-base font-bold text-red-600">{data.accountStatus?.banned || 0}</p>
              </div>
            </div>
          </div>

          <div className={`lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 ${block3d}`}>
            <PanelHead label={t("kpiRings.title")} icon={Gauge} />
            <div className="grid grid-cols-2 gap-4 mt-4">
              <RadialRing pct={data.ringsData?.occupation || 78} label={t("kpiRings.occupation")} color="#6366f1" size={80} />
              <RadialRing pct={data.ringsData?.satisfaction || 92} label={t("kpiRings.satisfaction")} color="#8b5cf6" size={80} />
              <RadialRing pct={data.ringsData?.activity || 65} label={t("kpiRings.activity")} color="#06b6d4" size={80} />
              <RadialRing pct={data.ringsData?.health || 94} label={t("kpiRings.health")} color="#10b981" size={80} />
            </div>
          </div>
        </div>

        {/* 3-Col: Verif + Disputes + Audit Trail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
{/* Bloc 1 - File d'attente vérification */}
<div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 ${card3d}`}>
  <PanelHead label={t("verificationQueue.title")} icon={Shield} />
  <div className="space-y-2">
    {(data.verificationQueue || []).length > 0 ? (
      data.verificationQueue.map((v: any) => {
        // Détermine la redirection selon le type
        let redirectUrl = "";
        let badgeText = "";
        let badgeColor = "";
        
        // Vérification d'identité (a documentFrontUrl et pas de listingId)
        if (v.type === "identity") {
          redirectUrl = `/${locale}/admin/verifications/${v.id}`;
          badgeText = t("verificationQueue.identityVerification");
          badgeColor = "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
        } 
        // Vérification de propriété (a listingId)
        else if (v.listingId) {
          redirectUrl = `/${locale}/admin/listings/validation/${v.listingId}`;
          badgeText = t("verificationQueue.propertyVerification");
          badgeColor = "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
        }
        // Fallback pour les autres cas
        else {
          redirectUrl = `/${locale}/admin/verifications`;
          badgeText = t("verificationQueue.defaultVerification");
          badgeColor = "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400";
        }
        
        return (
          <Link 
            key={v.id} 
            href={redirectUrl}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${badgeColor}`}>
              {v.type === "identity" ? <UserCheck size={14} /> : <Home size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{v.userName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{badgeText}</p>
            </div>
            {v.urgency === "high" && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
            <ChevronRight size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      })
    ) : (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Shield size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
        <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("emptyStates.noPendingVerifications")}</p>
        <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">{t("emptyStates.allVerificationsProcessed")}</p>
      </div>
    )}
  </div>
</div>

          {/* Bloc 2 - Litiges actifs - CLICKABLE */}
          <Link href={`/${locale}/admin/disputes`} className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 ${card3d} hover:shadow-lg transition-all cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-700`}>
            <PanelHead label={t("activeDisputes.title")} icon={Scale} />
            <div className="space-y-2">
              {(data.disputes || []).length > 0 ? (
                data.disputes.map((d: any) => (
                  <div key={d.id} className="p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{d.bookingRef}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${prioBadge[d.priority]}`}>{prioLabel[d.priority]}</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{d.type}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{d.description}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Scale size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("emptyStates.noActiveDisputes")}</p>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">{t("emptyStates.allDisputesResolved")}</p>
                </div>
              )}
            </div>
          </Link>

          {/* Bloc 3 - Audit Trail */}
          <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 ${card3d}`}>
            <PanelHead label={t("auditTrail.title")} icon={Eye} />
            <div className="space-y-1">
              {(data.auditLogs || []).length > 0 ? (
                data.auditLogs.map((log: any) => (
                  <div key={log.id}>
                    <div onClick={() => setExpLog(expLog === log.id ? null : log.id)} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer group">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${log.action?.includes("SUSPEND") ? "bg-orange-100 dark:bg-orange-500/10 text-orange-600" : log.action?.includes("BAN") ? "bg-red-100 dark:bg-red-500/10 text-red-600" : log.action?.includes("APPROVE") ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600" : "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600"}`}>
                        {log.action?.includes("SUSPEND") ? <Ban size={12} /> : log.action?.includes("BAN") ? <UserX size={12} /> : log.action?.includes("APPROVE") ? <CheckCircle size={12} /> : <Settings size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-slate-900 dark:text-white">{log.admin}</span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded">{log.action}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{log.target}</p>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex-shrink-0">{log.createdAt}</span>
                      <ChevronDown size={12} className={`text-slate-400 transition-transform flex-shrink-0 ${expLog === log.id ? "rotate-180" : ""}`} />
                    </div>
                    {expLog === log.id && (
                      <div className="ml-9 mb-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{log.details}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Eye size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("emptyStates.noRecentAudits")}</p>
                  <p className="text-[9px] text-slate-300 dark:text-slate-600 mt-1">{t("emptyStates.noAdminActivity")}</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-2 border-t border-slate-200 dark:border-slate-800/40 gap-2">
          <p className="text-[11px] text-slate-500 dark:text-slate-500">2026 {t("footer.copyright")}</p>
          <a href={`/${locale}/admin/users`} className="text-[11px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
            {t("footer.userManagement")} <ArrowRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}