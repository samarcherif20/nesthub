// app/[locale]/(dashboard)/owner/analytics/page.tsx
"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import {
  TrendingUp, TrendingDown, Eye, CalendarDays, DollarSign,
  Users, Home, Star, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Download, Filter, RefreshCw, Calendar, Clock, Award, Target,
  Zap, Shield, Sparkles, Activity, BarChart3, PieChart,
  LineChart, AreaChart, CandlestickChart,
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
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar, PolarArea } from 'react-chartjs-2';
import ListingSelector from "@/components/ui/owner/ListingSelector";

// Enregistrement des composants Chart.js
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
  Filler
);

interface StatsData {
  summary: {
    totalViews: number;
    totalBookings: number;
    totalRevenue: number;
    occupancyRate: number;
    averageRating: number;
    totalReviews: number;
    conversionRate: number;
  };
  chartData: Array<{
    date: string;
    views: number;
    bookings: number;
    revenue: number;
  }>;
}

// Données simulées pour les graphiques
const generateChartData = (days: number) => {
  const labels = [];
  const views = [];
  const bookings = [];
  const revenue = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    labels.push(date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }));
    views.push(Math.floor(Math.random() * 200) + 50);
    bookings.push(Math.floor(Math.random() * 20) + 1);
    revenue.push(Math.floor(Math.random() * 5000) + 1000);
  }
  
  return { labels, views, bookings, revenue };
};

export default function OwnerAnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const { getToken } = useAuth();

  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [period, setPeriod] = useState<"7days" | "30days" | "90days" | "year">("30days");
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState<"line" | "bar" | "radar">("line");

  const daysMap = { "7days": 7, "30days": 30, "90days": 90, "year": 365 };
  const chartData = generateChartData(daysMap[period]);

  // Configuration des graphiques
  const lineChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Vues',
        data: chartData.views,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Réservations',
        data: chartData.bookings,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: 'white',
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: 'y1',
      },
    ],
  };

  const barChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Revenus (TND)',
        data: chartData.revenue,
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.8,
      },
    ],
  };

  const radarChartData = {
    labels: ['Vues', 'Réservations', 'Revenu', 'Taux occup.', 'Note', 'Conversion'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 62, 78, 70, 92, 55],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointRadius: 4,
      },
    ],
  };

  const doughnutChartData = {
    labels: ['Nuits', 'Frais ménage', 'Services', 'Frais plateforme'],
    datasets: [
      {
        data: [75, 15, 7, 3],
        backgroundColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 158, 11)',
          'rgb(139, 92, 246)',
        ],
        borderWidth: 0,
        cutout: '60%',
      },
    ],
  };

  const polarAreaData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        data: [12, 19, 15, 17, 22, 25],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(16, 185, 129, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(6, 182, 212, 0.7)',
        ],
        borderWidth: 0,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { backgroundColor: 'rgba(0,0,0,0.8)', padding: 12 },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
      y1: { position: 'right' as const, beginAtZero: true, grid: { drawOnChartArea: false } },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw.toLocaleString()} TND` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (value: any) => value.toLocaleString() + ' TND' } } },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { r: { beginAtZero: true, max: 100, ticks: { stepSize: 20 } } },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
  };

  const polarOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
                Analytics Dashboard
              </h1>
              <p className="text-on-surface-variant mt-1">
                Visualisez vos performances avec des graphiques interactifs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
                <Download size={18} className="text-on-surface-variant" />
              </button>
              <button className="p-2.5 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors">
                <RefreshCw size={18} className="text-on-surface-variant" />
              </button>
            </div>
          </div>
        </div>

        {/* Sélecteur d'annonces */}
        <div className="mb-8">
          <ListingSelector selectedListingId={selectedListingId} onSelectListing={setSelectedListingId} />
        </div>

        {selectedListingId ? (
          <>
            {/* Period Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div className="flex gap-2 bg-surface-container-low rounded-xl p-1">
                {[
                  { value: "7days", label: "7 jours" },
                  { value: "30days", label: "30 jours" },
                  { value: "90days", label: "3 mois" },
                  { value: "year", label: "Année" },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      period === p.value
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md"
                        : "text-on-surface-variant hover:bg-surface-container-high"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Eye size={18} className="text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <TrendingUp size={12} /> +12.5%
                  </div>
                </div>
                <p className="text-3xl font-black text-on-surface">2,847</p>
                <p className="text-xs text-on-surface-variant mt-1">Vues totales</p>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <CalendarDays size={18} className="text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <TrendingUp size={12} /> +8.3%
                  </div>
                </div>
                <p className="text-3xl font-black text-on-surface">142</p>
                <p className="text-xs text-on-surface-variant mt-1">Réservations</p>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <DollarSign size={18} className="text-amber-500" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <TrendingUp size={12} /> +15.2%
                  </div>
                </div>
                <p className="text-3xl font-black text-on-surface">48,250 TND</p>
                <p className="text-xs text-on-surface-variant mt-1">Revenu total</p>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Activity size={18} className="text-purple-500" />
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-500">
                    <TrendingUp size={12} /> +2.1%
                  </div>
                </div>
                <p className="text-3xl font-black text-on-surface">78%</p>
                <p className="text-xs text-on-surface-variant mt-1">Taux d'occupation</p>
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setActiveChart("line")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeChart === "line"
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <LineChart size={16} /> Courbes
              </button>
              <button
                onClick={() => setActiveChart("bar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeChart === "bar"
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <BarChart3 size={16} /> Barres
              </button>
              <button
                onClick={() => setActiveChart("radar")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeChart === "radar"
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Activity size={16} /> Radar
              </button>
            </div>

            {/* Main Chart */}
            <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md mb-8">
              <h3 className="font-headline font-bold text-on-surface mb-4">
                {activeChart === "line" && "Évolution des vues et réservations"}
                {activeChart === "bar" && "Revenus par jour"}
                {activeChart === "radar" && "Performance multidimensionnelle"}
              </h3>
              <div className="h-[400px]">
                {activeChart === "line" && <Line data={lineChartData} options={lineChartOptions} />}
                {activeChart === "bar" && <Bar data={barChartData} options={barChartOptions} />}
                {activeChart === "radar" && <Radar data={radarChartData} options={radarOptions} />}
              </div>
            </div>

            {/* Multiple Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Doughnut Chart */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <h3 className="font-headline font-bold text-on-surface mb-4">Répartition des revenus</h3>
                <div className="h-[300px]">
                  <Doughnut data={doughnutChartData} options={doughnutOptions} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" />Nuits: 75%</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" />Frais ménage: 15%</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" />Services: 7%</div>
                  <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" />Plateforme: 3%</div>
                </div>
              </div>

              {/* Polar Area Chart */}
              <div className="bg-surface-container-lowest rounded-2xl p-6 shadow-md">
                <h3 className="font-headline font-bold text-on-surface mb-4">Réservations par mois</h3>
                <div className="h-[300px]">
                  <PolarArea data={polarAreaData} options={polarOptions} />
                </div>
              </div>
            </div>

            {/* Additional Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={18} className="text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Conversion</span>
                </div>
                <p className="text-3xl font-black">5.2%</p>
                <p className="text-sm text-white/80 mt-1">des vues en réservations</p>
                <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: "5.2%" }} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={18} className="text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Satisfaction</span>
                </div>
                <p className="text-3xl font-black">4.92/5</p>
                <p className="text-sm text-white/80 mt-1">basé sur 124 avis</p>
                <div className="mt-3 flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} className="fill-white text-white" />
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={18} className="text-white/80" />
                  <span className="text-xs font-bold uppercase tracking-wider">Recommandation IA</span>
                </div>
                <p className="text-sm font-bold">+15% de revenus potentiels</p>
                <p className="text-xs text-white/80 mt-1">en ajustant les prix du week-end</p>
                <button className="mt-3 text-xs bg-white/20 px-3 py-1.5 rounded-lg hover:bg-white/30 transition-colors">
                  Analyser
                </button>
              </div>
            </div>

            {/* Insights Section */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface mb-2">Insights IA</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Vos performances sont en hausse de <span className="font-bold text-primary">+15%</span> ce mois-ci.
                    Les week-ends génèrent <span className="font-bold text-primary">40%</span> de vos revenus.
                    Augmenter vos prix le vendredi et samedi pourrait augmenter vos revenus de <span className="font-bold text-primary">+8%</span>.
                  </p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-surface-container-lowest rounded-2xl p-16 text-center">
            <Home size={48} className="mx-auto text-outline mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">Sélectionnez une annonce</h3>
            <p className="text-on-surface-variant">Choisissez une annonce pour voir ses statistiques détaillées</p>
          </div>
        )}
      </div>
    </div>
  );
}