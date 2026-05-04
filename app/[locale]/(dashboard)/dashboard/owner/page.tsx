// app/[locale]/(dashboard)/owner/analytics/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@clerk/nextjs";
import {
  TrendingUp,
  Eye,
  CalendarDays,
  DollarSign,
  Home,
  Star,
  Download,
  RefreshCw,
  Zap,
  Activity,
  BarChart3,
  LineChart,
  Target,
  Wallet,
  Building2,
  Ticket,
  Calendar,
  ChevronRight,
  TrendingDown,
  Users,
  CheckCircle,
  Clock,
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
import { Line, Bar, Doughnut, PolarArea, Radar } from "react-chartjs-2";
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

// Helper pour les images
const pip = (url: string) => `/api/listings/image?url=${encodeURIComponent(url)}`;

// Types
interface ListingStats {
  id: string;
  title: string;
  image: string;
  views: number;
  bookings: number;
  revenue: number;
  growth: number;
}

interface DashboardData {
  kpi: {
    totalRevenue: number;
    revenueGrowth: number;
    occupancyRate: number;
    occupancyGrowth: number;
    totalBookings: number;
    bookingsGrowth: number;
    averageRating: number;
  };
  monthlyRevenue: {
    labels: string[];
    amounts: number[];
  };
  travelerTypes: {
    family: number;
    couple: number;
    business: number;
  };
  listings: ListingStats[];
  upcomingPayments: Array<{
    day: number;
    title: string;
    amount: number;
    date: string;
  }>;
  todoTasks: Array<{ title: string; property: string; urgent: boolean }>;
  dynamicMetrics: {
    views: number[];
    bookings: number[];
    revenue: number[];
  };
}

export default function OwnerAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { getToken } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<"30days" | "90days" | "year">("90days");
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "radar">(
    "line",
  );
  const [dynamicPeriod, setDynamicPeriod] = useState<
    "7days" | "30days" | "90days" | "year"
  >("30days");
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch(`/api/owner/analytics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Erreur chargement analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  // Génération des données dynamiques pour les graphiques ChartJS
  const generateDynamicChartData = () => {
    const daysMap: Record<string, number> = {
      "7days": 7,
      "30days": 30,
      "90days": 90,
      year: 30,
    };
    const days = daysMap[dynamicPeriod] || 30;
    const labels = [];
    const views = data?.dynamicMetrics?.views || [];
    const bookings = data?.dynamicMetrics?.bookings || [];
    const revenue = data?.dynamicMetrics?.revenue || [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(
        date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
      );
    }

    return { labels, views, bookings, revenue };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!data) return null;

  const dynamicChartData = generateDynamicChartData();
  const totalTravelers =
    data.travelerTypes.family +
    data.travelerTypes.couple +
    data.travelerTypes.business;

  // Graphiques statiques
  const staticBarChartData = {
    labels: data.monthlyRevenue.labels,
    datasets: [
      {
        label: "Revenus (TND)",
        data: data.monthlyRevenue.amounts,
        backgroundColor: "rgba(0, 92, 171, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const staticBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString() + " TND",
          color: isDark ? "#94a3b8" : "#475569",
        },
        grid: { color: isDark ? "#334155" : "#e2e8f0" },
      },
      x: { ticks: { color: isDark ? "#94a3b8" : "#475569" } },
    },
  };

  const doughnutData = {
    labels: ["Famille", "Couple", "Business"],
    datasets: [
      {
        data: [
          data.travelerTypes.family,
          data.travelerTypes.couple,
          data.travelerTypes.business,
        ],
        backgroundColor: ["#005cab", "#712ae2", "#4b41e1"],
        borderWidth: 0,
        cutout: "60%",
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
  };

  // Graphiques dynamiques
  const lineChartData = {
    labels: dynamicChartData.labels,
    datasets: [
      {
        label: "Vues",
        data: dynamicChartData.views,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Réservations",
        data: dynamicChartData.bookings,
        borderColor: "rgb(16, 185, 129)",
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        fill: true,
        tension: 0.4,
        yAxisID: "y1",
      },
    ],
  };

  const barChartData = {
    labels: dynamicChartData.labels,
    datasets: [
      {
        label: "Revenus (TND)",
        data: dynamicChartData.revenue,
        backgroundColor: "rgba(245, 158, 11, 0.8)",
        borderRadius: 8,
      },
    ],
  };

  const radarChartData = {
    labels: [
      "Vues",
      "Réservations",
      "Revenu",
      "Taux occup.",
      "Note",
      "Conversion",
    ],
    datasets: [
      {
        label: "Performance",
        data: [85, 62, 78, 70, 92, 55],
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
    ],
  };

  const doughnutChartData = {
    labels: ["Nuits", "Frais ménage", "Services", "Frais plateforme"],
    datasets: [
      {
        data: [75, 15, 7, 3],
        backgroundColor: ["#005cab", "#10b981", "#f59e0b", "#8b5cf6"],
        borderWidth: 0,
        cutout: "60%",
      },
    ],
  };

  const polarAreaData = {
    labels: data.monthlyRevenue.labels,
    datasets: [
      {
        data: data.monthlyRevenue.amounts.map((v) => Math.round(v / 100)),
        backgroundColor: [
          "rgba(59, 130, 246, 0.7)",
          "rgba(16, 185, 129, 0.7)",
          "rgba(245, 158, 11, 0.7)",
          "rgba(139, 92, 246, 0.7)",
          "rgba(236, 72, 153, 0.7)",
          "rgba(6, 182, 212, 0.7)",
        ],
        borderWidth: 0,
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
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? "#334155" : "#e2e8f0" },
        ticks: { color: isDark ? "#94a3b8" : "#475569" },
      },
      x: { ticks: { color: isDark ? "#94a3b8" : "#475569" } },
      y1: {
        position: "right" as const,
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: { color: isDark ? "#94a3b8" : "#475569" },
      },
    },
  };

  const barChartOptionsDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => value.toLocaleString() + " TND",
          color: isDark ? "#94a3b8" : "#475569",
        },
        grid: { color: isDark ? "#334155" : "#e2e8f0" },
      },
      x: { ticks: { color: isDark ? "#94a3b8" : "#475569" } },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, color: isDark ? "#94a3b8" : "#475569" },
        grid: { color: isDark ? "#334155" : "#e2e8f0" },
      },
    },
    plugins: { legend: { labels: { color: isDark ? "#e2e8f0" : "#0f172a" } } },
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Analytique
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bienvenue, voici l'état de vos performances immobilières.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAnalytics}
              className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw size={18} className="text-slate-500" />
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all">
              <Download size={16} /> Exporter
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm w-fit mb-8">
          {[
            { id: "30days", label: "Derniers 30 jours" },
            { id: "90days", label: "3 mois" },
            { id: "year", label: "Année" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id as any)}
              className={`px-5 py-2 text-sm font-medium transition-all rounded-full ${period === opt.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600">
                <Wallet size={24} />
              </span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${data.kpi.revenueGrowth >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                {data.kpi.revenueGrowth >= 0 ? "+" : ""}
                {data.kpi.revenueGrowth}%
              </span>
            </div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
              Revenus Totaux
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.kpi.totalRevenue.toLocaleString()} TND
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600">
                <Building2 size={24} />
              </span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${data.kpi.occupancyGrowth >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                {data.kpi.occupancyGrowth >= 0 ? "+" : ""}
                {data.kpi.occupancyGrowth}%
              </span>
            </div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
              Taux d'occupation
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.kpi.occupancyRate}%
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-violet-500">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600">
                <Ticket size={24} />
              </span>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${data.kpi.bookingsGrowth >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
              >
                {data.kpi.bookingsGrowth >= 0 ? "+" : ""}
                {data.kpi.bookingsGrowth}%
              </span>
            </div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
              Réservations
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.kpi.totalBookings}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-amber-500">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600">
                <Star size={24} />
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                Stable
              </span>
            </div>
            <div className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">
              Note Moyenne
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {data.kpi.averageRating}/5
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Revenus par mois
              </h3>
              <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>{" "}
                Revenus (TND)
              </div>
            </div>
            <div className="h-[400px]">
              <Bar data={staticBarChartData} options={staticBarChartOptions} />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Type de voyageurs
            </h3>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalTravelers}%
                </span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  <span>Famille</span>
                </div>
                <span className="font-bold">{data.travelerTypes.family}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span>Couple</span>
                </div>
                <span className="font-bold">{data.travelerTypes.couple}%</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                  <span>Business</span>
                </div>
                <span className="font-bold">
                  {data.travelerTypes.business}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Listings Performance Table - AVEC pip POUR LES IMAGES */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 mb-12 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Performance par Annonce
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Titre
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Vues
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Réservations
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Revenus
                  </th>
                  <th className="px-6 py-4 font-semibold text-xs uppercase">
                    Croissance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.listings.map((listing, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                          {listing.image && !imageErrors[listing.id] ? (
                            <img
                              src={pip(listing.image)}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setImageErrors(prev => ({ ...prev, [listing.id]: true }));
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                              <Home size={16} className="text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-sm text-slate-900 dark:text-white">
                          {listing.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {listing.views.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {listing.bookings}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">
                      {listing.revenue.toLocaleString()} TND
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-xs font-bold flex items-center gap-1 ${listing.growth >= 0 ? "text-green-600" : "text-red-500"}`}
                      >
                        {listing.growth >= 0 ? (
                          <TrendingUp size={12} />
                        ) : (
                          <TrendingDown size={12} />
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

        {/* Right Side Widgets */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                Paiements prévus
              </h3>
              <Calendar size={20} className="text-indigo-500" />
            </div>
            <div className="space-y-4">
              {data.upcomingPayments.map((payment, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                >
                  <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center font-bold text-xs shadow-sm text-slate-700 dark:text-slate-300">
                    {payment.day}
                  </div>
                  <div className="flex-grow">
                    <div className="text-xs font-bold uppercase text-slate-400">
                      {payment.date}
                    </div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {payment.title}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-indigo-600">
                    +{payment.amount} DT
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-sm font-semibold text-indigo-600 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors">
              Voir tout le calendrier
            </button>
          </div>

          <div className="col-span-12 lg:col-span-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                À faire
              </h3>
              <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {data.todoTasks.length} TÂCHES
              </span>
            </div>
            <div className="space-y-3">
              {data.todoTasks.map((task, idx) => (
                <label
                  key={idx}
                  className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 text-indigo-500 h-4 w-4"
                  />
                  <div className="flex-grow">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">
                      {task.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {task.property}
                    </div>
                  </div>
                  {task.urgent && (
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1"></span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Advanced Charts Section */}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
          <div className="flex gap-2 mb-6">
            {[
              { id: "line", icon: LineChart, label: "Courbes" },
              { id: "bar", icon: BarChart3, label: "Barres" },
              { id: "radar", icon: Activity, label: "Radar" },
            ].map((chart) => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeChart === chart.id ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-slate-700"}`}
              >
                <chart.icon size={16} /> {chart.label}
              </button>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {activeChart === "line" && "Évolution des vues et réservations"}
                {activeChart === "bar" && "Revenus par jour"}
                {activeChart === "radar" && "Performance multidimensionnelle"}
              </h3>
              <div className="flex gap-2">
                {["7days", "30days", "90days", "year"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setDynamicPeriod(p as any)}
                    className={`px-3 py-1 text-xs rounded-lg transition-colors ${dynamicPeriod === p ? "bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
                  >
                    {p === "7days"
                      ? "7j"
                      : p === "30days"
                        ? "30j"
                        : p === "90days"
                          ? "90j"
                          : "Année"}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[400px]">
              {activeChart === "line" && (
                <Line data={lineChartData} options={dynamicChartOptions} />
              )}
              {activeChart === "bar" && (
                <Bar data={barChartData} options={barChartOptionsDynamic} />
              )}
              {activeChart === "radar" && (
                <Radar data={radarChartData} options={radarOptions} />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                Répartition des revenus
              </h3>
              <div className="h-[300px]">
                <Doughnut
                  data={doughnutChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">
                Réservations par mois
              </h3>
              <div className="h-[300px]">
                <PolarArea
                  data={polarAreaData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} />
                <span className="text-xs font-bold uppercase">Conversion</span>
              </div>
              <p className="text-3xl font-black">5.2%</p>
              <p className="text-sm text-white/80 mt-1">
                des vues en réservations
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} />
                <span className="text-xs font-bold uppercase">
                  Satisfaction
                </span>
              </div>
              <p className="text-3xl font-black">{data.kpi.averageRating}/5</p>
              <p className="text-sm text-white/80 mt-1">basé sur 124 avis</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}