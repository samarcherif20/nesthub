"use client";

import * as React from "react";
import { useState } from "react";
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
  Search,
  Bell,
  Sun,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Clock,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Circle,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  Activity,
  BarChart3,
  LineChart,
  Layers,
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

// Données mockées intégrées
const MOCK_DATA = {
  kpi: {
    totalRevenue: 125430,
    revenueGrowth: 12.5,
    occupancyRate: 78,
    occupancyGrowth: 5.2,
    totalBookings: 342,
    bookingsGrowth: 8.3,
    averageRating: 4.8,
    avgDailyRate: 245,
    avgDailyRateGrowth: 3.2,
    totalListings: 8,
  },
  monthlyRevenue: {
    labels: [
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
    amounts: [
      8500, 9200, 10100, 11800, 13400, 15200, 16800, 17500, 16200, 14800, 12900,
      11200,
    ],
    previousAmounts: [
      7200, 7800, 8600, 9800, 11200, 12800, 14200, 14800, 13800, 12500, 10800,
      9500,
    ],
  },
  travelerTypes: {
    family: 45,
    couple: 35,
    business: 15,
    solo: 5,
  },
  listings: [
    {
      id: "1",
      title: "Villa Bleue",
      views: 1250,
      bookings: 48,
      revenue: 28500,
      growth: 8.5,
      occupancy: 85,
      rating: 4.9,
    },
    {
      id: "2",
      title: "Appartement Centre",
      views: 980,
      bookings: 32,
      revenue: 19200,
      growth: -2.3,
      occupancy: 72,
      rating: 4.6,
    },
    {
      id: "3",
      title: "Studio Mer",
      views: 1450,
      bookings: 56,
      revenue: 33600,
      growth: 15.2,
      occupancy: 90,
      rating: 4.8,
    },
    {
      id: "4",
      title: "Duplex Jardin",
      views: 760,
      bookings: 28,
      revenue: 16800,
      growth: 5.1,
      occupancy: 68,
      rating: 4.7,
    },
  ],
  upcomingPayments: [
    {
      day: 15,
      title: "Villa Bleue - Séjour 5 nuits",
      amount: 1250,
      date: "15 Jan 2026",
      status: "confirmed",
    },
    {
      day: 18,
      title: "Studio Mer - Séjour 3 nuits",
      amount: 735,
      date: "18 Jan 2026",
      status: "pending",
    },
    {
      day: 22,
      title: "Appartement Centre - Séjour 7 nuits",
      amount: 980,
      date: "22 Jan 2026",
      status: "confirmed",
    },
    {
      day: 25,
      title: "Duplex Jardin - Séjour 4 nuits",
      amount: 680,
      date: "25 Jan 2026",
      status: "processing",
    },
  ],
  todoTasks: [
    {
      title: "Mettre à jour le calendrier",
      property: "Villa Bleue",
      urgent: true,
      done: false,
    },
    {
      title: "Répondre au message client",
      property: "Studio Mer",
      urgent: true,
      done: false,
    },
    {
      title: "Ajouter des photos",
      property: "Appartement Centre",
      urgent: false,
      done: false,
    },
    {
      title: "Vérifier les disponibilités",
      property: "Duplex Jardin",
      urgent: false,
      done: true,
    },
  ],
  weeklyData: {
    labels: [
      "Lun",
      "Mar",
      "Mer",
      "Jeu",
      "Ven",
      "Sam",
      "Dim",
      "Lun",
      "Mar",
      "Mer",
      "Jeu",
      "Ven",
      "Sam",
      "Dim",
    ],
    views: [45, 52, 48, 61, 73, 85, 78, 51, 58, 54, 67, 79, 91, 84],
    bookings: [3, 4, 3, 5, 7, 9, 8, 4, 5, 4, 6, 8, 10, 9],
    revenue: [
      750, 980, 720, 1250, 1850, 2450, 2100, 820, 1100, 890, 1350, 1980, 2680,
      2320,
    ],
  },
  recentActivity: [
    {
      type: "booking",
      title: "Nouvelle réservation",
      detail: "Villa Bleue - 3 nuits",
      time: "il y a 2h",
    },
    {
      type: "review",
      title: "Nouvel avis",
      detail: "Studio Mer - 5 étoiles",
      time: "il y a 5h",
    },
    {
      type: "payment",
      title: "Paiement reçu",
      detail: "Duplex Jardin - 980 DT",
      time: "hier",
    },
    {
      type: "message",
      title: "Message client",
      detail: "Appartement Centre",
      time: "hier",
    },
  ],
  topCities: [
    { name: "Sidi Bou Saïd", revenue: 45200, bookings: 128, percentage: 36 },
    { name: "Tunis", revenue: 28400, bookings: 76, percentage: 22.6 },
    { name: "Hammamet", revenue: 23600, bookings: 62, percentage: 18.8 },
    { name: "Djerba", revenue: 18200, bookings: 48, percentage: 14.5 },
    { name: "Sousse", revenue: 9800, bookings: 28, percentage: 7.8 },
  ],
};

// ─── KPI Card Component ───────────────────────────────────────────────
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
    <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700/60 transition-all duration-300 group">
      <div
        className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-3xl transition-opacity group-hover:opacity-20 ${gradient}`}
      />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div
            className={`p-2.5 rounded-xl ${gradient} bg-opacity-10 shadow-lg`}
          >
            <Icon size={20} className="text-white" />
          </div>
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
              isPositive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
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
          <span className="text-2xl font-bold text-white">{value}</span>
          {suffix && (
            <span className="text-sm font-medium text-slate-500">{suffix}</span>
          )}
        </div>
        {sparklineData && (
          <div className="mt-3 h-8 flex items-end gap-[2px]">
            {sparklineData.map((v, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm transition-all ${gradient} opacity-40`}
                style={{ height: `${(v / Math.max(...sparklineData)) * 100}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Icon ────────────────────────────────────────────────────
function ActivityIcon({ type }: { type: string }) {
  const configs: Record<
    string,
    { icon: React.ElementType; color: string; bg: string }
  > = {
    booking: { icon: Calendar, color: "text-blue-400", bg: "bg-blue-500/10" },
    review: { icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    payment: {
      icon: CreditCard,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    message: {
      icon: MessageSquare,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  };
  const config = configs[type] || configs.booking;
  const Icon = config.icon;
  return (
    <div
      className={`w-9 h-9 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0`}
    >
      <Icon size={16} className={config.color} />
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; color: string }> = {
    confirmed: {
      label: "Confirmé",
      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    },
    pending: {
      label: "En attente",
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    },
    processing: {
      label: "En cours",
      color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    },
  };
  const config = configs[status] || configs.pending;
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.color}`}
    >
      {config.label}
    </span>
  );
}

// ─── Property Color Generator ─────────────────────────────────────────
const propertyColors = [
  "from-indigo-500 to-blue-600",
  "from-purple-500 to-pink-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-red-600",
];

export default function OwnerAnalyticsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [period, setPeriod] = useState<"30days" | "90days" | "year">("90days");
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "radar">(
    "line",
  );
  const [dynamicPeriod, setDynamicPeriod] = useState<
    "7days" | "30days" | "90days" | "year"
  >("30days");
  const [tasks, setTasks] = useState(MOCK_DATA.todoTasks);

  const data = MOCK_DATA;

  const toggleTask = (index: number) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, done: !t.done } : t)),
    );
  };

  // ─── Chart Configs ────────────────────────────────────────────────
  const gridColor = "rgba(148, 163, 184, 0.08)";
  const tickColor = "#64748b";

  const revenueChartData = {
    labels: data.monthlyRevenue.labels,
    datasets: [
      {
        label: "Cette année",
        data: data.monthlyRevenue.amounts,
        backgroundColor: "rgba(99, 102, 241, 0.8)",
        borderRadius: 8,
        borderSkipped: false,
      },
      {
        label: "Année précédente",
        data: data.monthlyRevenue.previousAmounts,
        backgroundColor: "rgba(148, 163, 184, 0.15)",
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 20,
          font: { size: 11, weight: 500 as const },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: {
          callback: (value: any) => (value / 1000).toFixed(0) + "k",
          color: tickColor,
          font: { size: 11 },
        },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const doughnutData = {
    labels: ["Famille", "Couple", "Business", "Solo"],
    datasets: [
      {
        data: [
          data.travelerTypes.family,
          data.travelerTypes.couple,
          data.travelerTypes.business,
          data.travelerTypes.solo,
        ],
        backgroundColor: [
          "rgba(99, 102, 241, 0.9)",
          "rgba(168, 85, 247, 0.9)",
          "rgba(59, 130, 246, 0.9)",
          "rgba(6, 182, 212, 0.9)",
        ],
        borderWidth: 0,
        cutout: "72%",
        spacing: 3,
        borderRadius: 6,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const totalTravelers =
    data.travelerTypes.family +
    data.travelerTypes.couple +
    data.travelerTypes.business +
    data.travelerTypes.solo;

  // Dynamic chart
  const daysMap: Record<string, number> = {
    "7days": 7,
    "30days": 30,
    "90days": 90,
    year: 30,
  };
  const days = daysMap[dynamicPeriod] || 30;
  const sliceStart = Math.max(0, data.weeklyData.labels.length - days);

  const dynamicLabels = data.weeklyData.labels.slice(sliceStart);
  const dynamicViews = data.weeklyData.views.slice(sliceStart);
  const dynamicBookings = data.weeklyData.bookings.slice(sliceStart);
  const dynamicRevenue = data.weeklyData.revenue.slice(sliceStart);

  const lineChartData = {
    labels: dynamicLabels,
    datasets: [
      {
        label: "Vues",
        data: dynamicViews,
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(99, 102, 241)",
      },
      {
        label: "Réservations",
        data: dynamicBookings,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgb(16, 185, 129)",
        yAxisID: "y1",
      },
    ],
  };

  const barChartDataDynamic = {
    labels: dynamicLabels,
    datasets: [
      {
        label: "Revenus (TND)",
        data: dynamicRevenue,
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  };

  const radarChartData = {
    labels: [
      "Vues",
      "Réservations",
      "Revenu",
      "Occupation",
      "Note",
      "Conversion",
    ],
    datasets: [
      {
        label: "Performance",
        data: [85, 72, 78, 80, 92, 65],
        backgroundColor: "rgba(99, 102, 241, 0.15)",
        borderColor: "rgba(99, 102, 241, 0.8)",
        borderWidth: 2,
        pointBackgroundColor: "rgb(99, 102, 241)",
        pointRadius: 4,
      },
      {
        label: "Moyenne marché",
        data: [60, 55, 62, 65, 75, 50],
        backgroundColor: "rgba(148, 163, 184, 0.08)",
        borderColor: "rgba(148, 163, 184, 0.4)",
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointBackgroundColor: "rgb(148, 163, 184)",
        pointRadius: 3,
      },
    ],
  };

  const dynamicChartOptions = {
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
          pointStyle: "circle",
          padding: 20,
          font: { size: 11, weight: 500 as const },
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
        ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 10 },
        border: { display: false },
      },
      y1: {
        position: "right" as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: tickColor, font: { size: 11 } },
        border: { display: false },
      },
    },
  };

  const barChartOptionsDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "rectRounded",
          padding: 20,
          font: { size: 11, weight: 500 as const },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString() + " TND",
          color: tickColor,
          font: { size: 11 },
        },
        grid: { color: gridColor },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 10 },
        border: { display: false },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: tickColor,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 11, weight: 500 as const },
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-slate-900/0">
      {/* Main Content - sans Sidebar car elle n'existe pas */}
      <main className="transition-all duration-300 ml-0">
    
        {/* ─── Page Content ─────────────────────────────────────────── */}
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Dashboard Analytique
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-400 rounded-full border border-indigo-500/20">
                  PRO
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Bienvenue samoureeh, voici l'état de vos performances immobilières.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all">
                <RefreshCw size={16} />
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all">
                <Download size={15} /> Exporter
              </button>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl p-1">
              {[
                { id: "30days", label: "30 jours" },
                { id: "90days", label: "3 mois" },
                { id: "year", label: "Année" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPeriod(opt.id as any)}
                  className={`px-4 py-1.5 text-xs font-semibold transition-all rounded-lg ${
                    period === opt.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 ml-2">
              <Clock size={12} /> Dernière mise à jour: il y a 5 min
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title="Revenus Totaux"
              value={`${(data.kpi.totalRevenue / 1000).toFixed(1)}k`}
              suffix="TND"
              growth={data.kpi.revenueGrowth}
              icon={Wallet}
              gradient="bg-gradient-to-br from-indigo-500 to-purple-600"
              sparklineData={[12, 19, 15, 22, 18, 25, 28, 24, 30, 27, 32, 35]}
            />
            <KPICard
              title="Taux d'occupation"
              value={`${data.kpi.occupancyRate}`}
              suffix="%"
              growth={data.kpi.occupancyGrowth}
              icon={Building2}
              gradient="bg-gradient-to-br from-purple-500 to-pink-600"
              sparklineData={[65, 70, 68, 72, 75, 73, 78, 76, 80, 77, 82, 78]}
            />
            <KPICard
              title="Réservations"
              value={`${data.kpi.totalBookings}`}
              growth={data.kpi.bookingsGrowth}
              icon={Ticket}
              gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
              sparklineData={[20, 25, 22, 28, 30, 26, 32, 35, 30, 38, 34, 40]}
            />
            <KPICard
              title="Note Moyenne"
              value={`${data.kpi.averageRating}`}
              suffix="/5"
              growth={2.1}
              icon={Star}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600"
              sparklineData={[
                4.5, 4.6, 4.7, 4.6, 4.8, 4.7, 4.8, 4.9, 4.8, 4.7, 4.8, 4.8,
              ]}
            />
          </div>

          {/* Revenue Chart + Traveler Types */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Revenus mensuels
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Comparaison avec l'année précédente
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                    <span className="text-slate-400">Cette année</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                    <span className="text-slate-400">Précédente</span>
                  </div>
                </div>
              </div>
              <div className="h-[320px]">
                <Bar data={revenueChartData} options={revenueChartOptions} />
              </div>
            </div>

            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Type de voyageurs
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Répartition des séjours
                  </p>
                </div>
                <Users size={18} className="text-slate-600" />
              </div>
              <div className="relative w-44 h-44 mx-auto mb-6">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {totalTravelers}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    Total %
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  {
                    label: "Famille",
                    value: data.travelerTypes.family,
                    color: "bg-indigo-500",
                  },
                  {
                    label: "Couple",
                    value: data.travelerTypes.couple,
                    color: "bg-purple-500",
                  },
                  {
                    label: "Business",
                    value: data.travelerTypes.business,
                    color: "bg-blue-500",
                  },
                  {
                    label: "Solo",
                    value: data.travelerTypes.solo,
                    color: "bg-cyan-500",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2.5 h-2.5 rounded-sm ${item.color}`}
                      />
                      <span className="text-sm text-slate-400">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-white w-8 text-right">
                        {item.value}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Listings Performance Table */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800/60">
              <div>
                <h3 className="text-base font-bold text-white">
                  Performance par Annonce
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {data.listings.length} propriétés actives
                </p>
              </div>
              <button className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                Voir tout <ChevronRight size={14} />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    {[
                      "Propriété",
                      "Vues",
                      "Réservations",
                      "Occupation",
                      "Revenus",
                      "Note",
                      "Croissance",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {data.listings.map((listing, idx) => (
                    <tr
                      key={listing.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${propertyColors[idx % propertyColors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}
                          >
                            <Home size={14} className="text-white/80" />
                          </div>
                          <span className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">
                            {listing.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">
                        {listing.views.toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">
                        {listing.bookings}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${listing.occupancy >= 80 ? "bg-emerald-500" : listing.occupancy >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${listing.occupancy}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {listing.occupancy}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-white">
                        {listing.revenue.toLocaleString()}{" "}
                        <span className="text-xs font-normal text-slate-500">
                          TND
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <Star
                            size={12}
                            className="text-amber-400 fill-amber-400"
                          />
                          <span className="text-sm font-medium text-white">
                            {listing.rating}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${listing.growth >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}
                        >
                          {listing.growth >= 0 ? (
                            <TrendingUp size={10} />
                          ) : (
                            <TrendingDown size={10} />
                          )}
                          {Math.abs(listing.growth)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payments + Tasks + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Upcoming Payments */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Paiements prévus
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Ce mois-ci
                  </p>
                </div>
                <Calendar size={16} className="text-indigo-400" />
              </div>
              <div className="space-y-2.5">
                {data.upcomingPayments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex flex-col items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition-colors">
                      <span className="text-xs font-bold text-white leading-none">
                        {payment.day}
                      </span>
                      <span className="text-[8px] text-slate-500 font-medium">
                        JAN
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {payment.title}
                      </p>
                      <StatusBadge status={payment.status} />
                    </div>
                    <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                      +{payment.amount.toLocaleString()}
                      <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                        DT
                      </span>
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 rounded-lg transition-all">
                Voir tout le calendrier →
              </button>
            </div>

            {/* Todo Tasks */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">À faire</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {tasks.filter((t) => !t.done).length} tâches en attente
                  </p>
                </div>
                <span className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  {tasks.filter((t) => t.urgent && !t.done).length} URGENT
                </span>
              </div>
              <div className="space-y-2">
                {tasks.map((task, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleTask(idx)}
                    className={`w-full flex items-start gap-3 p-3 border rounded-xl transition-all text-left ${task.done ? "border-slate-800/40 bg-slate-800/10 opacity-50" : task.urgent ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10" : "border-slate-800/60 bg-slate-800/20 hover:bg-slate-800/40"}`}
                  >
                    {task.done ? (
                      <CheckCircle2
                        size={16}
                        className="text-emerald-500 flex-shrink-0 mt-0.5"
                      />
                    ) : task.urgent ? (
                      <AlertCircle
                        size={16}
                        className="text-red-400 flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <Circle
                        size={16}
                        className="text-slate-600 flex-shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium ${task.done ? "text-slate-600 line-through" : "text-slate-200"}`}
                      >
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {task.property}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Activité récente
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Dernières actions
                  </p>
                </div>
                <Activity size={16} className="text-slate-600" />
              </div>
              <div className="space-y-1">
                {data.recentActivity.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 hover:bg-slate-800/30 rounded-xl transition-colors"
                  >
                    <ActivityIcon type={activity.type} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">
                        {activity.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {activity.detail}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-600 flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 py-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/5 rounded-lg transition-all">
                Voir toute l'activité →
              </button>
            </div>
          </div>

          {/* Advanced Charts */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  {activeChart === "line" &&
                    "Évolution des vues & réservations"}
                  {activeChart === "bar" && "Revenus journaliers"}
                  {activeChart === "radar" && "Performance multidimensionnelle"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analyse détaillée des métriques
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
                  {[
                    { id: "line", icon: LineChart, label: "Courbes" },
                    { id: "bar", icon: BarChart3, label: "Barres" },
                    { id: "radar", icon: Layers, label: "Radar" },
                  ].map((chart) => (
                    <button
                      key={chart.id}
                      onClick={() => setActiveChart(chart.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeChart === chart.id ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}
                    >
                      <chart.icon size={13} />
                      {chart.label}
                    </button>
                  ))}
                </div>
                {activeChart !== "radar" && (
                  <div className="flex items-center bg-slate-800/50 rounded-lg p-0.5">
                    {["7days", "30days", "90days", "year"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setDynamicPeriod(p as any)}
                        className={`px-2.5 py-1.5 text-[10px] font-semibold rounded-md transition-all ${dynamicPeriod === p ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-300"}`}
                      >
                        {p === "7days"
                          ? "7j"
                          : p === "30days"
                            ? "30j"
                            : p === "90days"
                              ? "90j"
                              : "1an"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="h-[380px]">
              {activeChart === "line" && (
                <Line data={lineChartData} options={dynamicChartOptions} />
              )}
              {activeChart === "bar" && (
                <Bar
                  data={barChartDataDynamic}
                  options={barChartOptionsDynamic}
                />
              )}
              {activeChart === "radar" && (
                <Radar data={radarChartData} options={radarOptions} />
              )}
            </div>
          </div>

          {/* Bottom Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-indigo-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Conversion
                  </span>
                </div>
                <p className="text-3xl font-black">5.2%</p>
                <p className="text-xs text-indigo-200 mt-1">
                  des vues en réservations
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-indigo-200">
                  <TrendingUp size={12} />
                  <span>+0.8% vs mois dernier</span>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-2xl p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-emerald-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                    Tarif Journalier
                  </span>
                </div>
                <p className="text-3xl font-black">
                  {data.kpi.avgDailyRate}{" "}
                  <span className="text-lg font-bold text-emerald-200">
                    TND
                  </span>
                </p>
                <p className="text-xs text-emerald-200 mt-1">
                  prix moyen par nuit
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-emerald-200">
                  <TrendingUp size={12} />
                  <span>+{data.kpi.avgDailyRateGrowth}% vs mois dernier</span>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-pink-800 rounded-2xl p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Home size={16} className="text-purple-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-200">
                    Propriétés Actives
                  </span>
                </div>
                <p className="text-3xl font-black">{data.kpi.totalListings}</p>
                <p className="text-xs text-purple-200 mt-1">
                  annonces en ligne
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-purple-200">
                  <Sparkles size={12} />
                  <span>2 superhost</span>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-orange-700 to-red-800 rounded-2xl p-5 text-white">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-amber-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    Meilleure Ville
                  </span>
                </div>
                <p className="text-2xl font-black">Sidi Bou Saïd</p>
                <p className="text-xs text-amber-200 mt-1">
                  {data.topCities[0].bookings} réservations
                </p>
                <div className="flex items-center gap-1 mt-3 text-xs text-amber-200">
                  <TrendingUp size={12} />
                  <span>{data.topCities[0].revenue.toLocaleString()} TND</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Cities Performance */}
          <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-white">
                  Performance par ville
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Répartition géographique des revenus
                </p>
              </div>
              <MapPin size={18} className="text-slate-600" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {data.topCities.map((city, idx) => (
                <div
                  key={city.name}
                  className="bg-slate-800/30 hover:bg-slate-800/50 rounded-xl p-4 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className={`w-7 h-7 rounded-lg bg-gradient-to-br ${propertyColors[idx % propertyColors.length]} flex items-center justify-center shadow-sm`}
                    >
                      <MapPin size={12} className="text-white/80" />
                    </div>
                    <span className="text-xs font-semibold text-white truncate">
                      {city.name}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Revenus
                      </p>
                      <p className="text-sm font-bold text-white">
                        {city.revenue.toLocaleString()}{" "}
                        <span className="text-[10px] font-normal text-slate-500">
                          TND
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase">
                        Réservations
                      </p>
                      <p className="text-sm font-bold text-white">
                        {city.bookings}
                      </p>
                    </div>
                    <div className="pt-1">
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${propertyColors[idx % propertyColors.length]}`}
                          style={{ width: `${city.percentage * 3.8}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {city.percentage}% du total
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-800/40">
            <p className="text-xs text-slate-600">
              © 2026 StayAnalytics. Tableau de bord propriétaire.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>Données en temps réel</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Connecté
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
