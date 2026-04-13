// app/[locale]/(dashboard)/owner/analytics/page.tsx
"use client";

import * as React from "react";
import { useState } from "react";
import { useTheme } from "next-themes";
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
  Sparkles,
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

// Données pour les graphiques statiques (design HTML)
const revenueDataStatic = {
  labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
  amounts: [1240, 2150, 1800, 2850, 2450, 3250],
};

const travelerData = {
  family: 45,
  couple: 30,
  business: 25,
};

const listingPerformance = [
  {
    title: "Villa Azure - Gammarth",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCY-bgi4wJpegnjnRBwavOL-AMRlFYRiIquotKwReaJQKu-lWj6-FXEm1-m_rfKmtO0Kh-N3baSgEqnoFtCH4V-xCVnHYgnln954VjWysJFsEE66OYtwQp9BmhoIS42tOSLfKfQXoELjWmOW4r6YIQZBU_iDmDe6Zl0c-L-2LC9WdhLj82FFKEDi5Vnm073HHxd_lKdPt7m_L49PK06fpXx0X2-STU0RnsRgAc5hbUyOrzqlSLNO2Qb2KF8J_d-ynR9Ptu2sY8icdc",
    views: 1240,
    bookings: 12,
    revenue: 6800,
    growth: 18,
  },
  {
    title: "Loft Urbain - Lac II",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCBYcclQzrT4vevphYoNYh9vc1VzGBgR7oSVYd1Gi4gPb3HboLBQLwVbrLAPBRJKLVSNhzeE86zgfNzURMohixqHgnBYXibkEZv3Y_VA_EdYdxk4NOld9zIxs8zbyfoc4Gvt_YOClydwtejr-GFQ-zoBcBjSXqH_6ZcA5yvR1nqfju1lHEeqyTQDiCP5q9l6gntXPwhZ-vuOV_IX68zQ29FExnI2ivBXy4r9Wlun-g92JXh56U3LBMprXQCFF3N-x03JQ5OzNiA_DA",
    views: 850,
    bookings: 8,
    revenue: 4150,
    growth: 5,
  },
  {
    title: "Studio Palm - Hammamet",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD4wAj8Rodx1mYjy9OOKYnYBFJESOPTvUm6Lw9bjE2cjfopWygoZiMY2m1s5rLsaO0-8HBy_DYixAbLxzC-hscRvxpsrc26CjmfW6jz5bjf8vsGJXKky-LNMeUangb_aVw0_2hkX7lEejw5YjuBgdFLSLRB3Mr-BTmQ9q-Ab_u61njupHJJG9Qg8L5L7fo2PrnkiVgnZAqb80yflWyCAvcwp1GbNBfUXRX8jyTkVONDZGG06AAMr4Sp8PGc4c88OopCpczf9ViHjwo",
    views: 420,
    bookings: 4,
    revenue: 1500,
    growth: -2,
  },
];

const upcomingPayments = [
  { day: 22, title: "Villa Azure (Dépôt)", amount: 450, date: "Demain" },
  { day: 24, title: "Loft Urbain (Solde)", amount: 820, date: "Jeudi" },
];

const todoTasks = [
  {
    title: "Valider la caution",
    property: "Villa Azure • Mohamed A.",
    urgent: false,
  },
  { title: "Répondre au message", property: "Mohamed • Urgent", urgent: true },
  {
    title: "Contrôler inventaire",
    property: "Loft Urbain • Fin de séjour",
    urgent: false,
  },
];

// Fonction pour générer des données dynamiques (pour les graphiques interactifs)
const generateDynamicChartData = (days: number) => {
  const labels = [];
  const views = [];
  const bookings = [];
  const revenue = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(
      date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    );
    views.push(Math.floor(Math.random() * 200) + 50);
    bookings.push(Math.floor(Math.random() * 20) + 1);
    revenue.push(Math.floor(Math.random() * 5000) + 1000);
  }

  return { labels, views, bookings, revenue };
};

export default function OwnerAnalyticsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [period, setPeriod] = useState<"30days" | "90days" | "year">("90days");
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "radar">(
    "line",
  );
  const [dynamicPeriod, setDynamicPeriod] = useState<
    "7days" | "30days" | "90days" | "year"
  >("30days");

  const daysMap = { "7days": 7, "30days": 30, "90days": 90, year: 365 };
  const dynamicChartData = generateDynamicChartData(daysMap[dynamicPeriod]);

  // Graphique en barres statique (design HTML)
  const staticBarChartData = {
    labels: revenueDataStatic.labels,
    datasets: [
      {
        label: "Revenus (TND)",
        data: revenueDataStatic.amounts,
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

  // Donut chart pour les voyageurs
  const doughnutData = {
    labels: ["Famille", "Couple", "Business"],
    datasets: [
      {
        data: [travelerData.family, travelerData.couple, travelerData.business],
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

  // Graphiques dynamiques (type ChartJS interactif)
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
        backgroundColor: [
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
          "rgb(245, 158, 11)",
          "rgb(139, 92, 246)",
        ],
        borderWidth: 0,
        cutout: "60%",
      },
    ],
  };

  const polarAreaData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"],
    datasets: [
      {
        data: [12, 19, 15, 17, 22, 25],
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

  const doughnutOptionsDynamic = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
  };

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: { color: isDark ? "#e2e8f0" : "#0f172a" },
      },
    },
  };

  const totalTravelers =
    travelerData.family + travelerData.couple + travelerData.business;

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Analytique
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Bienvenue, voici l'état de vos performances immobilières.
            </p>
          </div>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-full p-1 self-start">
            <button
              onClick={() => setPeriod("30days")}
              className={`px-5 py-2 text-sm font-medium transition-all rounded-full ${period === "30days" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
            >
              Derniers 30 jours
            </button>
            <button
              onClick={() => setPeriod("90days")}
              className={`px-5 py-2 text-sm font-semibold transition-all rounded-full ${period === "90days" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
            >
              3 mois
            </button>
            <button
              onClick={() => setPeriod("year")}
              className={`px-5 py-2 text-sm font-medium transition-all rounded-full ${period === "year" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-slate-600 dark:text-slate-400"}`}
            >
              Année
            </button>
          </div>
        </div>

        {/* ==================== SECTION 1: KPI & STATIC DASHBOARD ==================== */}

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] border-b-4 border-indigo-500 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                <Wallet size={24} />
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +12%
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
              Revenus Totaux
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              12 450 TND
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] border-b-4 border-purple-500 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Building2 size={24} />
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                +5%
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
              Taux d'occupation
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              82%
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] border-b-4 border-violet-500 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">
                <Ticket size={24} />
              </span>
              <span className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-full">
                -2%
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
              Réservations
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              24
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] border-b-4 border-orange-400 hover:-translate-y-1 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 rounded-2xl bg-orange-100 dark:bg-orange-900/30 text-orange-500">
                <Star size={24} />
              </span>
              <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                Stable
              </span>
            </div>
            <div className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
              Note Moyenne
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              4.9/5
            </div>
          </div>
        </div>

        {/* Bento Grid Main Content */}
        <div className="grid grid-cols-12 gap-6 mb-12">
          {/* Main Chart (Bar) - Statique */}
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Revenus par mois
              </h3>
              <div className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>{" "}
                Revenus (TND)
              </div>
            </div>
            <div className="h-[400px]">
              <Bar data={staticBarChartData} options={staticBarChartOptions} />
            </div>
          </div>

          {/* Secondary Chart (Pie) */}
          <div className="col-span-12 lg:col-span-4 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Type de voyageurs
            </h3>
            <div className="relative w-48 h-48 mx-auto mb-8">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalTravelers}%
                </span>
              </div>
            </div>
            <div className="space-y-3 mt-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Famille
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {travelerData.family}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Couple
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {travelerData.couple}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-violet-500"></span>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Business
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {travelerData.business}%
                </span>
              </div>
            </div>
          </div>

          {/* Table: Performance par Annonce */}
          <div className="col-span-12 lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
              Performance par Annonce
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-4 font-semibold text-xs uppercase">
                      Titre
                    </th>
                    <th className="pb-4 font-semibold text-xs uppercase">
                      Vues
                    </th>
                    <th className="pb-4 font-semibold text-xs uppercase">
                      Réservations
                    </th>
                    <th className="pb-4 font-semibold text-xs uppercase">
                      Revenus
                    </th>
                    <th className="pb-4 font-semibold text-xs uppercase">
                      Croissance
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {listingPerformance.map((listing, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={listing.image}
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-medium text-sm text-slate-900 dark:text-white">
                            {listing.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 text-sm text-slate-600 dark:text-slate-400">
                        {listing.views.toLocaleString()}
                      </td>
                      <td className="py-4 text-sm text-slate-600 dark:text-slate-400">
                        {listing.bookings}
                      </td>
                      <td className="py-4 text-sm font-semibold text-slate-900 dark:text-white">
                        {listing.revenue.toLocaleString()} TND
                      </td>
                      <td className="py-4">
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

          {/* Right Column Widgets */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Calendrier des paiements */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Paiements prévus
                </h3>
                <Calendar size={20} className="text-indigo-500" />
              </div>
              <div className="space-y-4">
                {upcomingPayments.map((payment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center font-bold text-xs shadow-sm text-slate-700 dark:text-white">
                      {payment.day}
                    </div>
                    <div className="flex-grow">
                      <div className="text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                        {payment.date}
                      </div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {payment.title}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      +{payment.amount} DT
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                Voir tout le calendrier
              </button>
            </div>

            {/* To-do list */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white">
                  To-do list
                </h3>
                <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {todoTasks.length} TÂCHES
                </span>
              </div>
              <div className="space-y-3">
                {todoTasks.map((task, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-3 p-3 border border-slate-100 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 group"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-500 h-4 w-4"
                    />
                    <div className="flex-grow">
                      <div className="text-sm font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-slate-700 dark:text-slate-300">
                        {task.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
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
        </div>

        {/* ==================== SECTION 2: ANALYSES AVANCÉES CHART.JS ==================== */}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-12">
         
          {/* Chart Type Selector */}
          <div className="flex gap-2 mb-6">
            {[
              { id: "line", icon: LineChart, label: "Courbes" },
              { id: "bar", icon: BarChart3, label: "Barres" },
              { id: "radar", icon: Activity, label: "Radar" },
            ].map((chart) => (
              <button
                key={chart.id}
                onClick={() => setActiveChart(chart.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeChart === chart.id ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"}`}
              >
                <chart.icon size={16} /> {chart.label}
              </button>
            ))}
          </div>

          {/* Main Dynamic Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700 mb-8">
            <h3 className="font-headline font-bold text-slate-900 dark:text-white mb-4">
              {activeChart === "line" && "Évolution des vues et réservations"}
              {activeChart === "bar" && "Revenus par jour"}
              {activeChart === "radar" && "Performance multidimensionnelle"}
            </h3>
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

          {/* Multiple Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700">
              <h3 className="font-headline font-bold text-slate-900 dark:text-white mb-4">
                Répartition des revenus
              </h3>
              <div className="h-[300px]">
                <Doughnut
                  data={doughnutChartData}
                  options={doughnutOptionsDynamic}
                />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-700">
              <h3 className="font-headline font-bold text-slate-900 dark:text-white mb-4">
                Réservations par mois
              </h3>
              <div className="h-[300px]">
                <PolarArea data={polarAreaData} options={polarOptions} />
              </div>
            </div>
          </div>

          {/* Additional Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Target size={18} className="text-white/80" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Conversion
                </span>
              </div>
              <p className="text-3xl font-black">5.2%</p>
              <p className="text-sm text-white/80 mt-1">
                des vues en réservations
              </p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Star size={18} className="text-white/80" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Satisfaction
                </span>
              </div>
              <p className="text-3xl font-black">4.92/5</p>
              <p className="text-sm text-white/80 mt-1">basé sur 124 avis</p>
            </div>
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-white/80" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Recommandation IA
                </span>
              </div>
              <p className="text-sm font-bold">+15% de revenus potentiels</p>
              <button className="mt-3 text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                Analyser
              </button>
            </div>
          </div>

          {/* Insights Section */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-500/5 to-purple-600/5 border border-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Sparkles size={22} className="text-indigo-500" />
              </div>
              <div>
                <h3 className="font-headline font-bold text-slate-900 dark:text-white mb-2">
                  Insights IA
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Vos performances sont en hausse de{" "}
                  <span className="font-bold text-indigo-500">+15%</span> ce
                  mois-ci. Les week-ends génèrent{" "}
                  <span className="font-bold text-indigo-500">40%</span> de vos
                  revenus.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
