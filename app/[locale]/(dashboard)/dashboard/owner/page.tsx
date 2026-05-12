"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Home,
  Star,
  Download,
  RefreshCw,
  Wallet,
  Building2,
  Ticket,
  Calendar,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Circle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  Target,
  Activity,
  BarChart3,
  LineChart,
  Layers,
  Loader2,
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
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { useOwnerAnalytics } from "./hooks/useOwnerAnalytics";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

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

// Styles 3D comme dans l'exemple admin
const block3d =
  "shadow-[0_6px_0_0_rgba(0,0,0,0.06),0_12px_28px_-6px_rgba(0,0,0,0.11)] dark:shadow-[0_6px_0_0_rgba(0,0,0,0.38),0_12px_28px_-6px_rgba(0,0,0,0.48)]";
const card3d =
  "shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.07)] dark:shadow-[0_4px_0_0_rgba(0,0,0,0.28),0_8px_16px_-4px_rgba(0,0,0,0.32)]";

// FONCTION PIP - utilise la même API que les listings
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

const propertyColors = [
  "from-indigo-500 to-blue-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
];

// ─── KPI CARD COMPONENT AMÉLIORÉ ─────────────────────────────────────
function KPICard({
  title,
  value,
  suffix,
  growth,
  icon: Icon,
  gradient,
  sparklineData,
}: {
  title: string;
  value: string;
  suffix?: string;
  growth: number;
  icon: React.ElementType;
  gradient: string;
  sparklineData?: number[];
}) {
  const isPositive = growth >= 0;
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 transition-all duration-300 group hover:shadow-lg">
      {/* Background gradient glow */}
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20 bg-gradient-to-br ${gradient}`}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon size={20} className="text-white" />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
            }`}
          >
            {isPositive ? (
              <ArrowUpRight size={12} />
            ) : (
              <ArrowDownRight size={12} />
            )}
            {Math.abs(growth)}%
          </div>
        </div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {value}
          </span>
          {suffix && (
            <span className="text-sm font-medium text-slate-500">{suffix}</span>
          )}
        </div>

        {/* Mini sparkline */}
        {sparklineData && (
          <div className="mt-3 h-8 flex items-end gap-[2px]">
            {sparklineData.map((v, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all bg-gradient-to-br ${gradient} opacity-40`}
                style={{ height: `${(v / Math.max(...sparklineData)) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const configs: any = {
    booking: { icon: Calendar, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-500/10" },
    review: { icon: Star, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-500/10" },
    payment: { icon: CreditCard, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/10" },
    message: { icon: MessageSquare, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/10" },
  };
  const config = configs[type] || configs.booking;
  const Icon = config.icon;
  return (
    <div className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon size={16} className={config.color} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: any = {
    confirmed: { label: "Confirmé", color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" },
    pending: { label: "En attente", color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" },
    processing: { label: "En cours", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20" },
  };
  const config = configs[status] || configs.pending;
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}>
      {config.label}
    </span>
  );
}

// COMPOSANT DOUGHNUT AVEC TOOLTIP
function DoughnutWithTooltip({ data, isDark }: { data: any; isDark: boolean }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  
  const labels = ["Professionnel", "Étudiant", "Long séjour", "Court séjour", "Standard"];
  const values = [
    data?.professional || 0,
    data?.student || 0,
    data?.longStay || 0,
    data?.shortStay || 0,
    data?.standardStay || 0,
  ];
  const colors = [
    "rgba(99, 102, 241, 0.9)",
    "rgba(168, 85, 247, 0.9)", 
    "rgba(59, 130, 246, 0.9)",
    "rgba(6, 182, 212, 0.9)",
    "rgba(245, 158, 11, 0.9)",
  ];

  const total = values.reduce((a, b) => a + b, 0);

  const doughnutChartData = {
    labels: labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderWidth: 0,
      cutout: "72%",
      spacing: 3,
      borderRadius: 6,
      hoverOffset: 15,
    }],
  };

  const getPercentage = (value: number) => {
    if (total === 0) return "0";
    return ((value / total) * 100).toFixed(1);
  };

  return (
    <div 
      className="relative"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <div className="relative w-44 h-44 mx-auto mb-6">
        <Doughnut 
          data={doughnutChartData} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            cutout: "72%",
            plugins: {
              legend: { display: false },
              tooltip: { 
                enabled: true,
                callbacks: {
                  label: (context: any) => {
                    const label = labels[context.dataIndex];
                    const value = values[context.dataIndex];
                    const percentage = getPercentage(value);
                    return `${label}: ${value} (${percentage}%)`;
                  }
                }
              }
            },
            onHover: (event: any, activeElements: any) => {
              if (activeElements && activeElements.length > 0) {
                setHoveredIndex(activeElements[0].dataIndex);
              } else {
                setHoveredIndex(null);
              }
            }
          }}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">{total}</span>
          <span className="text-[10px] text-slate-500 font-medium">Total</span>
        </div>
        
        {hoveredIndex !== null && values[hoveredIndex] > 0 && (
          <div 
            className="absolute z-50 px-3 py-2 rounded-lg shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in zoom-in duration-200"
            style={{
              backgroundColor: isDark ? '#1e293b' : '#ffffff',
              border: `2px solid ${colors[hoveredIndex]}`,
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '100%',
              marginBottom: '12px'
            }}
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors[hoveredIndex] }}
              />
              <span className="text-xs font-semibold text-slate-900 dark:text-white">
                {labels[hoveredIndex]}
              </span>
              <span className="text-xs font-bold" style={{ color: colors[hoveredIndex] }}>
                {values[hoveredIndex]} ({getPercentage(values[hoveredIndex])}%)
              </span>
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
              style={{
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderRight: `2px solid ${colors[hoveredIndex]}`,
                borderBottom: `2px solid ${colors[hoveredIndex]}`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function OwnerAnalyticsPage() {
  const { data, loading, refreshing, refresh } = useOwnerAnalytics();
  const [period, setPeriod] = useState<"30days" | "90days" | "year">("90days");
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "radar">("line");
  const [dynamicPeriod, setDynamicPeriod] = useState<"7days" | "30days" | "90days" | "year">("30days");
  const [tasks, setTasks] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (data?.todoTasks) {
      setTasks(data.todoTasks);
    }
  }, [data]);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleTask = (index: number) => {
    setTasks(prev => prev.map((t, i) => i === index ? { ...t, done: !t.done } : t));
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Chargement de votre tableau de bord...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Erreur de chargement des données</p>
          <button onClick={refresh} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg">Réessayer</button>
        </div>
      </div>
    );
  }

  const gridColor = isDark ? "rgba(148, 163, 184, 0.08)" : "rgba(0, 0, 0, 0.05)";
  const tickColor = isDark ? "#64748b" : "#94a3b8";

  const revenueChartData = {
    labels: data.monthlyRevenue.labels,
    datasets: [
      { label: "Cette année", data: data.monthlyRevenue.amounts, backgroundColor: isDark ? "rgba(99, 102, 241, 0.8)" : "rgba(99, 102, 241, 0.6)", borderRadius: 8, borderSkipped: false },
      { label: "Année précédente", data: data.monthlyRevenue.previousAmounts, backgroundColor: isDark ? "rgba(148, 163, 184, 0.15)" : "rgba(100, 116, 139, 0.1)", borderRadius: 8, borderSkipped: false },
    ],
  };

  const revenueChartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: true, position: "top" as const, align: "end" as const, labels: { color: tickColor, usePointStyle: true, pointStyle: "rectRounded", padding: 20, font: { size: 11, weight: 500 } } } },
    scales: {
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { callback: (value: any) => (value / 1000).toFixed(0) + "k", color: tickColor, font: { size: 11 } }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { display: false } },
    },
  };

  const totalTravelers = (data.travelerTypes?.professional || 0) + (data.travelerTypes?.student || 0) + 
                         (data.travelerTypes?.longStay || 0) + (data.travelerTypes?.shortStay || 0) + 
                         (data.travelerTypes?.standardStay || 0);

  const daysMap = { "7days": 7, "30days": 30, "90days": 90, year: 30 };
  const days = daysMap[dynamicPeriod] || 30;
  const sliceStart = Math.max(0, data.weeklyData.labels.length - days);
  const dynamicLabels = data.weeklyData.labels.slice(sliceStart);
  const dynamicViews = data.weeklyData.views.slice(sliceStart);
  const dynamicBookings = data.weeklyData.bookings.slice(sliceStart);
  const dynamicRevenue = data.weeklyData.revenue.slice(sliceStart);

  const lineChartData = {
    labels: dynamicLabels,
    datasets: [
      { label: "Vues", data: dynamicViews, borderColor: "rgb(99, 102, 241)", backgroundColor: "rgba(99, 102, 241, 0.1)", fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6 },
      { label: "Réservations", data: dynamicBookings, borderColor: "rgb(16, 185, 129)", backgroundColor: "rgba(16, 185, 129, 0.1)", fill: true, tension: 0.4, borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 6, yAxisID: "y1" },
    ],
  };

  const barChartDataDynamic = {
    labels: dynamicLabels,
    datasets: [{ label: "Revenus (TND)", data: dynamicRevenue, backgroundColor: isDark ? "rgba(245, 158, 11, 0.8)" : "rgba(245, 158, 11, 0.6)", borderRadius: 6, borderSkipped: false }],
  };

  const radarChartData = {
    labels: ["Vues", "Réservations", "Revenu", "Occupation", "Note", "Conversion"],
    datasets: [
      { label: "Performance", data: [85, 72, 78, data.kpi.occupancyRate, data.kpi.averageRating * 20, 65], backgroundColor: "rgba(99, 102, 241, 0.15)", borderColor: "rgba(99, 102, 241, 0.8)", borderWidth: 2, pointBackgroundColor: "rgb(99, 102, 241)", pointRadius: 4 },
      { label: "Moyenne marché", data: [60, 55, 62, 65, 75, 50], backgroundColor: "rgba(148, 163, 184, 0.08)", borderColor: "rgba(148, 163, 184, 0.4)", borderWidth: 1.5, borderDash: [4, 4], pointBackgroundColor: "rgb(148, 163, 184)", pointRadius: 3 },
    ],
  };

  const dynamicChartOptions = {
    responsive: true, maintainAspectRatio: false, interaction: { mode: "index" as const, intersect: false },
    plugins: { legend: { position: "top" as const, align: "end" as const, labels: { color: tickColor, usePointStyle: true, pointStyle: "circle", padding: 20, font: { size: 11, weight: 500 } } } },
    scales: {
      y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 11 } }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 10 }, border: { display: false } },
      y1: { position: "right" as const, beginAtZero: true, grid: { drawOnChartArea: false }, ticks: { color: tickColor, font: { size: 11 } }, border: { display: false } },
    },
  };

  const barChartOptionsDynamic = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "top" as const, align: "end" as const, labels: { color: tickColor, usePointStyle: true, pointStyle: "rectRounded", padding: 20, font: { size: 11, weight: 500 } } } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (value: any) => value.toLocaleString() + " TND", color: tickColor, font: { size: 11 } }, grid: { color: gridColor }, border: { display: false } },
      x: { grid: { display: false }, ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 10 }, border: { display: false } },
    },
  };

  const radarOptions = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      r: { beginAtZero: true, max: 100, ticks: { stepSize: 25, color: tickColor, backdropColor: "transparent", font: { size: 10 } }, grid: { color: gridColor }, angleLines: { color: gridColor }, pointLabels: { color: tickColor, font: { size: 11, weight: 500 } } },
    },
    plugins: { legend: { position: "top" as const, align: "end" as const, labels: { color: tickColor, usePointStyle: true, pointStyle: "circle", padding: 20, font: { size: 11, weight: 500 } } } },
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6 gap-6">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Dashboard Analytique</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-full border border-indigo-200 dark:border-indigo-500/20">PRO</span>
          </div>
          <p className="text-sm text-slate-500">Voici l'état de vos performances immobilières.</p>
        </div>
        
      </div>

      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-1">
          {["30days", "90days", "year"].map((opt) => (
            <button key={opt} onClick={() => setPeriod(opt as any)} className={`px-4 py-1.5 text-xs font-semibold transition-all rounded-lg ${period === opt ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>
              {opt === "30days" ? "30 jours" : opt === "90days" ? "3 mois" : "Année"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2"><Clock size={12} /> Dernière mise à jour: {new Date().toLocaleTimeString()}</div>
      </div>

      {/* KPI Cards avec NOUVEAU STYLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Revenus Totaux"
          value={`${(data.kpi.totalRevenue / 1000).toFixed(1)}k`}
          suffix="TND"
          growth={data.kpi.revenueGrowth}
          icon={Wallet}
          gradient="from-indigo-500 to-purple-600"
          sparklineData={[12, 19, 15, 22, 18, 25, 28, 24, 30, 27, 32, 35]}
        />
        <KPICard
          title="Taux d'occupation"
          value={`${Math.round(data.kpi.occupancyRate)}`}
          suffix="%"
          growth={data.kpi.occupancyGrowth}
          icon={Building2}
          gradient="from-purple-500 to-pink-600"
          sparklineData={[65, 70, 68, 72, 75, 73, 78, 76, 80, 77, 82, 78]}
        />
        <KPICard
          title="Réservations"
          value={`${data.kpi.totalBookings}`}
          growth={data.kpi.bookingsGrowth}
          icon={Ticket}
          gradient="from-emerald-500 to-teal-600"
          sparklineData={[20, 25, 22, 28, 30, 26, 32, 35, 30, 38, 34, 40]}
        />
        <KPICard
          title="Note Moyenne"
          value={`${data.kpi.averageRating}`}
          suffix="/5"
          growth={2.1}
          icon={Star}
          gradient="from-amber-500 to-orange-600"
          sparklineData={[4.5, 4.6, 4.7, 4.6, 4.8, 4.7, 4.8, 4.9, 4.8, 4.7, 4.8, 4.8]}
        />
      </div>

      {/* Revenue Chart + Traveler Types */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className={`xl:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Revenus mensuels</h3><p className="text-xs text-slate-500 mt-0.5">Comparaison avec l'année précédente</p></div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /><span className="text-slate-600 dark:text-slate-400">Cette année</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-slate-400 dark:bg-slate-700" /><span className="text-slate-600 dark:text-slate-400">Précédente</span></div>
            </div>
          </div>
          <div className="h-[320px]"><Bar data={revenueChartData} options={revenueChartOptions} /></div>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
          <div className="flex items-center justify-between mb-5">
            <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Type de voyageurs</h3><p className="text-xs text-slate-500 mt-0.5">Répartition des séjours</p></div>
            <Users size={18} className="text-slate-500" />
          </div>
          
          <DoughnutWithTooltip data={data.travelerTypes} isDark={isDark} />
          
          <div className="space-y-3">
            {[
              { label: "Professionnel", value: data.travelerTypes.professional || 0, color: "bg-indigo-500" },
              { label: "Étudiant", value: data.travelerTypes.student || 0, color: "bg-purple-500" },
              { label: "Long séjour", value: data.travelerTypes.longStay || 0, color: "bg-blue-500" },
              { label: "Court séjour", value: data.travelerTypes.shortStay || 0, color: "bg-cyan-500" },
              { label: "Standard", value: data.travelerTypes.standardStay || 0, color: "bg-amber-500" },
            ].map((item) => (
              <div key={item.label} className="group relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-sm ${item.color}`} />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${item.color} transition-all duration-500`} style={{ width: `${item.value}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-slate-900 dark:text-white w-8 text-right">{item.value}%</span>
                  </div>
                </div>
                <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 shadow-lg">
                  {item.value}% des voyageurs
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Table avec images */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden ${block3d}`}>
        <div className="flex items-center justify-between p-5 border-b border-indigo-50 dark:border-indigo-900/30">
          <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Performance par Annonce</h3><p className="text-xs text-slate-500 mt-0.5">{data.listings.length} propriétés actives</p></div>
          <button className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1">Voir tout <ChevronRight size={14} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-indigo-50/50 dark:bg-indigo-900/10">
              <tr className="border-b border-indigo-100 dark:border-indigo-900/30">
                {["Propriété", "Vues", "Réservations", "Occupation", "Revenus", "Note", "Croissance"].map(h => <th key={h} className="px-5 py-3 text-[10px] font-semibold text-indigo-400 dark:text-indigo-500 uppercase tracking-wider">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data.listings.map((listing: any, idx: number) => {
                const imgUrl = listing.thumbnailUrl ? pip(listing.thumbnailUrl) : null;
                return (
                  <tr key={listing.id} className="hover:bg-indigo-50/20 dark:hover:bg-indigo-900/10 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {imgUrl && !imageErrors[listing.id] ? (
                          <img 
                            src={imgUrl} 
                            alt={listing.title}
                            className="w-9 h-9 rounded-lg object-cover shadow-sm"
                            loading="lazy"
                            onError={() => setImageErrors(prev => ({ ...prev, [listing.id]: true }))}
                          />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${propertyColors[idx % propertyColors.length]} flex items-center justify-center shadow-sm`}>
                            <Home size={14} className="text-white/80" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{listing.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{listing.views.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400">{listing.bookings}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${listing.occupancy >= 80 ? "bg-emerald-500" : listing.occupancy >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${listing.occupancy}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{Math.round(listing.occupancy)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-900 dark:text-white">{listing.revenue.toLocaleString()} <span className="text-xs font-normal text-slate-500">TND</span></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{listing.rating}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${listing.growth >= 0 ? "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10" : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-500/10"}`}>
                        {listing.growth >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}{Math.abs(listing.growth)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payments + Tasks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Paiements prévus</h3><p className="text-[10px] text-slate-500 mt-0.5">Ce mois-ci</p></div>
            <Calendar size={16} className="text-indigo-500" />
          </div>
          <div className="space-y-2.5">
            {data.upcomingPayments.map((payment: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors">
                  <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">{payment.day}</span>
                  <span className="text-[8px] text-slate-500 font-medium">{new Date().toLocaleString('fr', { month: 'short' }).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-900 dark:text-white truncate">{payment.title}</p><StatusBadge status={payment.status} /></div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">+{payment.amount.toLocaleString()}<span className="text-[10px] font-normal text-slate-500 ml-0.5">DT</span></span>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 rounded-lg transition-all">Voir tout le calendrier →</button>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">À faire</h3><p className="text-[10px] text-slate-500 mt-0.5">{tasks.filter((t: any) => !t.done).length} tâches en attente</p></div>
            <span className="bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/20">{tasks.filter((t: any) => t.urgent && !t.done).length} URGENT</span>
          </div>
          <div className="space-y-2">
            {tasks.slice(0, 4).map((task: any, idx: number) => (
              <button key={idx} onClick={() => toggleTask(idx)} className={`w-full flex items-start gap-3 p-3 border rounded-xl transition-all text-left ${task.done ? "border-slate-200 dark:border-slate-800/40 bg-slate-100 dark:bg-slate-800/10 opacity-50" : task.urgent ? "border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 hover:bg-red-100 dark:hover:bg-red-500/10" : "border-slate-200 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-800/40"}`}>
                {task.done ? <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" /> : task.urgent ? <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" /> : <Circle size={16} className="text-slate-400 dark:text-slate-600 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${task.done ? "text-slate-500 line-through" : "text-slate-700 dark:text-slate-200"}`}>{task.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{task.property}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Activité récente</h3><p className="text-[10px] text-slate-500 mt-0.5">Dernières actions</p></div>
            <Activity size={16} className="text-slate-500" />
          </div>
          <div className="space-y-1">
            {data.recentActivity.map((activity: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/30 rounded-xl transition-colors">
                <ActivityIcon type={activity.type} />
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{activity.title}</p><p className="text-[10px] text-slate-500 truncate">{activity.detail}</p></div>
                <span className="text-[10px] text-slate-500 flex-shrink-0">{activity.time}</span>
              </div>
            ))}
          </div>
          <button className="w-full mt-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 rounded-lg transition-all">Voir toute l'activité →</button>
        </div>
      </div>

      {/* Advanced Charts */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${block3d}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div><h3 className="text-base font-bold text-slate-900 dark:text-white">{activeChart === "line" ? "Évolution des vues & réservations" : activeChart === "bar" ? "Revenus journaliers" : "Performance multidimensionnelle"}</h3><p className="text-xs text-slate-500 mt-0.5">Analyse détaillée des métriques</p></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
              {[{ id: "line", icon: LineChart, label: "Courbes" }, { id: "bar", icon: BarChart3, label: "Barres" }, { id: "radar", icon: Layers, label: "Radar" }].map((chart) => (
                <button key={chart.id} onClick={() => setActiveChart(chart.id as any)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === chart.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}><chart.icon size={13} />{chart.label}</button>
              ))}
            </div>
            {activeChart !== "radar" && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-lg p-0.5">
                {["7days", "30days", "90days", "year"].map((p) => (
                  <button key={p} onClick={() => setDynamicPeriod(p as any)} className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-md transition-all ${dynamicPeriod === p ? "bg-slate-700 text-white dark:bg-slate-700" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}>{p === "7days" ? "7j" : p === "30days" ? "30j" : p === "90days" ? "90j" : "1an"}</button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="h-[380px]">
          {activeChart === "line" && <Line data={lineChartData} options={dynamicChartOptions} />}
          {activeChart === "bar" && <Bar data={barChartDataDynamic} options={barChartOptionsDynamic} />}
          {activeChart === "radar" && <Radar data={radarChartData} options={radarOptions} />}
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-5 text-white ${card3d}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><div className="flex items-center gap-2 mb-3"><Target size={16} className="text-indigo-200" /><span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">Conversion</span></div><p className="text-3xl font-black">{(data.kpi.totalBookings / (data.listings.reduce((sum: number, l: any) => sum + l.views, 0) || 1) * 100).toFixed(1)}%</p><p className="text-xs text-indigo-200 mt-1">des vues en réservations</p><div className="flex items-center gap-1 mt-3 text-xs text-indigo-200"><TrendingUp size={12} /><span>+0.8% vs mois dernier</span></div></div>
        </div>
        <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-5 text-white ${card3d}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><div className="flex items-center gap-2 mb-3"><Zap size={16} className="text-emerald-200" /><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Tarif Journalier</span></div><p className="text-3xl font-black">{data.kpi.avgDailyRate} <span className="text-lg font-bold text-emerald-200">TND</span></p><p className="text-xs text-emerald-200 mt-1">prix moyen par nuit</p><div className="flex items-center gap-1 mt-3 text-xs text-emerald-200"><TrendingUp size={12} /><span>+{data.kpi.avgDailyRateGrowth}% vs mois dernier</span></div></div>
        </div>
        <div className={`relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 rounded-2xl p-5 text-white ${card3d}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><div className="flex items-center gap-2 mb-3"><Home size={16} className="text-purple-200" /><span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">Propriétés Actives</span></div><p className="text-3xl font-black">{data.kpi.totalListings}</p><p className="text-xs text-purple-200 mt-1">annonces en ligne</p><div className="flex items-center gap-1 mt-3 text-xs text-purple-200"><Sparkles size={12} /><span>{data.listings.filter((l: any) => l.rating >= 4.8).length} superhost</span></div></div>
        </div>
        <div className={`relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 rounded-2xl p-5 text-white ${card3d}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative"><div className="flex items-center gap-2 mb-3"><MapPin size={16} className="text-amber-200" /><span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">Meilleure Ville</span></div><p className="text-2xl font-black">{data.topCities[0]?.name || "N/A"}</p><p className="text-xs text-amber-200 mt-1">{data.topCities[0]?.bookings || 0} réservations</p><div className="flex items-center gap-1 mt-3 text-xs text-amber-200"><TrendingUp size={12} /><span>{data.topCities[0]?.revenue?.toLocaleString() || 0} TND</span></div></div>
        </div>
      </div>

      {/* Top Cities Performance */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-5 ${card3d}`}>
        <div className="flex items-center justify-between mb-5">
          <div><h3 className="text-base font-bold text-slate-900 dark:text-white">Performance par ville</h3><p className="text-xs text-slate-500 mt-0.5">Répartition géographique des revenus</p></div>
          <MapPin size={18} className="text-slate-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.topCities.map((city: any, idx: number) => (
            <div key={city.name} className="bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl p-4 transition-colors group relative">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${propertyColors[idx % propertyColors.length]} flex items-center justify-center shadow-sm`}>
                  <MapPin size={12} className="text-white/80" />
                </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">{city.name}</span>
              </div>
              <div className="space-y-2">
                <div><p className="text-[10px] text-slate-500 uppercase">Revenus</p><p className="text-sm font-bold text-slate-900 dark:text-white">{city.revenue.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">TND</span></p></div>
                <div><p className="text-[10px] text-slate-500 uppercase">Réservations</p><p className="text-sm font-bold text-slate-900 dark:text-white">{city.bookings}</p></div>
                <div className="pt-1"><div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full bg-gradient-to-r ${propertyColors[idx % propertyColors.length]}`} style={{ width: `${city.percentage * 3.8}%` }} /></div><p className="text-[10px] text-slate-500 mt-1">{city.percentage.toFixed(1)}% du total</p></div>
              </div>
              <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-slate-800 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap">
                  {city.bookings} résas
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 pb-2 border-t border-slate-200 dark:border-slate-800/40 gap-2">
        <p className="text-xs text-slate-500">© 2026 StayAnalytics. Tableau de bord propriétaire.</p>
        <div className="flex items-center gap-4 text-xs text-slate-500"><span>Données en temps réel</span><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />Connecté</span></div>
      </div>
    </div>
  );
}