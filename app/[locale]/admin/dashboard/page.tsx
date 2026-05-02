// app/[locale]/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  IoBedOutline,
  IoPeopleOutline,
  IoFlashOutline,
  IoDocumentTextOutline,
  IoWarningOutline,
  IoWalletOutline,
  IoTrendingUpOutline,
  IoCalendarOutline,
  IoLocationOutline,
  IoTimeOutline,
  IoStatsChartOutline,
  IoBarChartOutline,
  IoPieChartOutline,
  IoRocketOutline,
  IoHappyOutline,
  IoStarOutline,
  IoThumbsUpOutline,
} from "react-icons/io5";
import { MdOutlineGavel, MdOutlineFamilyRestroom, MdOutlineVerified } from "react-icons/md";
import { FaMoneyBillWave, FaUserGraduate, FaBriefcase, FaChartLine, FaUsers, FaBuilding, FaHandHoldingUsd, FaRegCalendarAlt, FaRegClock } from "react-icons/fa";
import { GiPodiumWinner, GiFastArrow, GiGlobal, GiChart, GiGrowth } from "react-icons/gi";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Line,
  FunnelChart,
  Funnel,
  LabelList,
  Sankey,
} from "recharts";

const COLORS = {
  primary: "#005cab",
  secondary: "#712ae2",
  tertiary: "#4b41e1",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  surface: "#e0e2ec",
  dark: "#1e293b",
  light: "#f8fafc",
  blue: "#3b82f6",
  purple: "#8b5cf6",
  pink: "#ec4899",
  orange: "#f97316",
  teal: "#14b8a6",
};

interface DashboardStats {
  revenue: {
    monthly: number;
    growth: number;
    chart: { month: string; revenue: number; commissions: number; netProfit: number }[];
  };
  users: {
    total: number;
    newThisMonth: number;
    growth: number;
    chart?: { month: string; count: number }[];
  };
  occupancy: {
    rate: number;
    totalListings: number;
    activeBookings: number;
  };
  disputes: {
    active: number;
    highSeverity: number;
    change: number;
  };
  marketShare: {
    apartments: number;
    villas: number;
    studios: number;
    other: number;
  };
  bookingTrends: { month: string; confirmed: number; cancelled: number }[];
  tenantDemographics: {
    professionals: number;
    students: number;
    families: number;
  };
  topGovernorates: { name: string; percentage: number }[];
  topHosts: {
    name: string;
    conversion: number;
    listings: number;
    avatar?: string;
  }[];
  pendingVerifications: number;
  totalRevenue: number;
  totalBookings: number;
}

// Données simulées pour les graphiques avancés
const userGrowthData = [
  { month: "Jan", count: 120, revenue: 45000 },
  { month: "Fév", count: 145, revenue: 52000 },
  { month: "Mar", count: 168, revenue: 61000 },
  { month: "Avr", count: 192, revenue: 73000 },
  { month: "Mai", count: 210, revenue: 82000 },
  { month: "Juin", count: 245, revenue: 95000 },
];

const scatterData = [
  { responseTime: 2, conversion: 95, bookings: 45, name: "Ahmed M." },
  { responseTime: 5, conversion: 88, bookings: 38, name: "Sarra B." },
  { responseTime: 8, conversion: 82, bookings: 32, name: "Mohamed K." },
  { responseTime: 12, conversion: 75, bookings: 28, name: "Leila A." },
  { responseTime: 15, conversion: 70, bookings: 24, name: "Karim S." },
  { responseTime: 20, conversion: 62, bookings: 20, name: "Nadia H." },
  { responseTime: 25, conversion: 55, bookings: 16, name: "Rami B." },
  { responseTime: 3, conversion: 92, bookings: 42, name: "Hela M." },
  { responseTime: 6, conversion: 86, bookings: 35, name: "Walid J." },
  { responseTime: 10, conversion: 78, bookings: 30, name: "Sonia T." },
];

const funnelData = [
  { name: "Vues annonce", value: 12500, fill: COLORS.primary },
  { name: "Demandes info", value: 3200, fill: COLORS.secondary },
  { name: "Offres envoyées", value: 1850, fill: COLORS.tertiary },
  { name: "Paiements", value: 890, fill: COLORS.success },
  { name: "Séjours confirmés", value: 620, fill: COLORS.blue },
];

const sankeyData = {
  nodes: [
    { name: "Tunis" }, { name: "Sousse" }, { name: "Hammamet" }, { name: "Djerba" },
    { name: "Appartement" }, { name: "Villa" }, { name: "Studio" },
    { name: "Confirmées" }, { name: "Annulées" },
  ],
  links: [
    { source: 0, target: 4, value: 45 }, { source: 0, target: 5, value: 30 }, { source: 0, target: 6, value: 25 },
    { source: 1, target: 4, value: 50 }, { source: 1, target: 5, value: 35 }, { source: 1, target: 6, value: 15 },
    { source: 2, target: 4, value: 55 }, { source: 2, target: 5, value: 40 }, { source: 2, target: 6, value: 5 },
    { source: 3, target: 4, value: 40 }, { source: 3, target: 5, value: 50 }, { source: 3, target: 6, value: 10 },
    { source: 4, target: 7, value: 70 }, { source: 4, target: 8, value: 30 },
    { source: 5, target: 7, value: 75 }, { source: 5, target: 8, value: 25 },
    { source: 6, target: 7, value: 65 }, { source: 6, target: 8, value: 35 },
  ],
};

function StatCard({ title, value, unit, icon, trend, trendValue, color }: any) {
  return (
    <div className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100">
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-xl ${color === "primary" ? "bg-blue-50 text-blue-600" : color === "secondary" ? "bg-purple-50 text-purple-600" : color === "tertiary" ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"}`}>
            {icon}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${trend === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              {trend === "up" ? <IoTrendingUpOutline className="text-xs" /> : <IoTrendingUpOutline className="text-xs rotate-180" />}
              {trendValue}%
            </div>
          )}
        </div>
        <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black font-jakarta">{value.toLocaleString("fr-FR")}</p>
          <span className="text-sm font-medium text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = await getToken({ template: "my-app-template" });
      const res = await fetch("/api/admin/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-white">
        <LoadingSpinner size="lg" color="primary" />
      </div>
    );
  }

  if (!stats) return null;

  const marketShareData = [
    { name: "Appartements", value: stats.marketShare.apartments, color: COLORS.primary },
    { name: "Villas", value: stats.marketShare.villas, color: COLORS.secondary },
    { name: "Studios", value: stats.marketShare.studios, color: COLORS.tertiary },
    { name: "Autres", value: stats.marketShare.other, color: "#f97316" },
  ];

  const demographicsData = [
    { name: "Professionnels", value: stats.tenantDemographics.professionals, color: COLORS.primary, icon: <FaBriefcase /> },
    { name: "Étudiants", value: stats.tenantDemographics.students, color: COLORS.secondary, icon: <FaUserGraduate /> },
    { name: "Familles", value: stats.tenantDemographics.families, color: COLORS.tertiary, icon: <MdOutlineFamilyRestroom /> },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black font-jakarta text-slate-800">Tableau de bord</h1>
            <p className="text-slate-500 mt-1">Vue d'ensemble stratégique de la plateforme</p>
          </div>
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-sm font-semibold text-slate-700 hover:shadow-md transition-all flex items-center gap-2">
              <IoCalendarOutline /> Cette semaine
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-[#005cab] to-[#712ae2] rounded-xl shadow-md text-sm font-semibold text-white hover:shadow-lg transition-all flex items-center gap-2">
              <IoDocumentTextOutline /> Export
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Revenus Mensuels"
          value={stats.revenue.monthly}
          unit="TND"
          icon={<FaMoneyBillWave className="text-xl" />}
          trend="up"
          trendValue={stats.revenue.growth}
          color="primary"
        />
        <StatCard
          title="Nouveaux Utilisateurs"
          value={stats.users.newThisMonth}
          unit="inscrits"
          icon={<FaUsers className="text-xl" />}
          trend="up"
          trendValue={stats.users.growth}
          color="secondary"
        />
        <StatCard
          title="Taux d'Occupation"
          value={Math.round(stats.occupancy.rate)}
          unit="%"
          icon={<IoBedOutline className="text-xl" />}
          color="tertiary"
        />
        <StatCard
          title="Litiges Actifs"
          value={stats.disputes.active}
          unit="dossiers"
          icon={<MdOutlineGavel className="text-xl" />}
          trend="down"
          trendValue={Math.abs(stats.disputes.change)}
          color="error"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Financial Analysis - Area Chart */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold font-jakarta text-slate-800 flex items-center gap-2">
                <FaChartLine className="text-blue-600" />
                Performance Financière
              </h2>
              <p className="text-sm text-slate-400">Revenu brut vs Commissions vs Profit net</p>
            </div>
            <div className="flex gap-4 text-[11px] font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Revenu</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div>Commissions</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-500"></div>Profit</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={stats.revenue.chart}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="commissionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.tertiary} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={COLORS.tertiary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "white" }} />
              <Area type="monotone" dataKey="revenue" name="Revenu brut" stroke={COLORS.primary} fill="url(#revenueGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="commissions" name="Commissions" stroke={COLORS.secondary} fill="url(#commissionGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="netProfit" name="Profit net" stroke={COLORS.tertiary} fill="url(#profitGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Market Share - Pie Chart */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold font-jakarta text-slate-800 mb-4 flex items-center gap-2">
            <IoPieChartOutline className="text-purple-600" />
            Parts de Marché
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={marketShareData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} dataKey="value" label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {marketShareData.map((entry, idx) => <Cell key={idx} fill={entry.color} stroke="white" strokeWidth={2} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {marketShareData.map((item) => (
              <div key={item.name} className="flex justify-between items-center p-2 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} /><span className="text-sm">{item.name}</span></div>
                <span className="text-sm font-bold" style={{ color: item.color }}>{Math.round(item.value)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Trends - Bar Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold font-jakarta text-slate-800 flex items-center gap-2">
                <IoBarChartOutline className="text-green-600" />
                Tendances Réservations
              </h2>
              <p className="text-sm text-slate-400">Validées vs Annulées</p>
            </div>
            <div className="flex gap-4 text-xs font-bold">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div>Validées</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-400"></div>Annulées</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats.bookingTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }} />
              <Bar dataKey="confirmed" name="Validées" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              <Bar dataKey="cancelled" name="Annulées" fill={COLORS.error} fillOpacity={0.7} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Demographics - Radial Bar */}
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold font-jakarta text-slate-800 mb-4 flex items-center gap-2">
            <IoStatsChartOutline className="text-orange-600" />
            Profil Locataires
          </h2>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart data={demographicsData} innerRadius={25} outerRadius={70} barSize={18}>
                  <RadialBar dataKey="value" background cornerRadius={10}>
                    {demographicsData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                  </RadialBar>
                  <Legend iconSize={8} layout="vertical" verticalAlign="middle" align="right" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-4">
              {demographicsData.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-600">{item.name}</span>
                    <span className="font-bold" style={{ color: item.color }}>{item.value}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Growth - Bizarre Funnel Chart */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold font-jakarta text-slate-800 mb-4 flex items-center gap-2">
            <FaRegCalendarAlt className="text-teal-600" />
            Croissance Utilisateurs
          </h2>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#64748b" }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} />
              <Tooltip contentStyle={{ borderRadius: "12px" }} />
              <Legend />
              <Bar yAxisId="left" dataKey="count" name="Nouveaux utilisateurs" fill={COLORS.primary} radius={[6, 6, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenu généré (TND)" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 4, fill: COLORS.secondary }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Top Governorates */}
        <div className="col-span-12 lg:col-span-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold font-jakarta text-slate-800 mb-4 flex items-center gap-2">
            <IoLocationOutline className="text-cyan-600" />
            Top Gouvernorats
          </h2>
          <div className="space-y-5">
            {stats.topGovernorates.map((gov, idx) => (
              <div key={gov.name}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-400 w-5">{idx + 1}</span>
                    <span className="font-medium text-slate-700">{gov.name}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{gov.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: `${gov.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="col-span-12 lg:col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold font-jakarta text-slate-800 mb-6 flex items-center gap-2">
            <GiPodiumWinner className="text-yellow-600" />
            Top Performeurs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.topHosts.map((host, idx) => (
              <div key={idx} className={`p-5 rounded-xl ${idx === 0 ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300" : "bg-slate-50 border border-slate-200"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${idx === 0 ? "bg-gradient-to-br from-yellow-500 to-amber-500" : "bg-gradient-to-br from-slate-500 to-slate-600"}`}>
                    {host.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-lg">{host.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm font-bold text-green-600">{host.conversion}% conversion</span>
                      <span className="text-xs text-slate-400">{host.listings} biens</span>
                    </div>
                  </div>
                  {idx === 0 && <IoStarOutline className="text-yellow-500 text-2xl ml-auto" />}
                </div>
                {idx === 0 && (
                  <div className="mt-3 pt-2 border-t border-yellow-200">
                    <p className="text-xs text-amber-700 flex items-center gap-1"><IoThumbsUpOutline /> Top performeur du mois</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed right-8 bottom-8 z-50">
        <button className="w-14 h-14 bg-gradient-to-r from-[#005cab] to-[#712ae2] rounded-full text-white shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 group">
          <IoFlashOutline className="text-2xl group-hover:rotate-12 transition-transform" />
        </button>
      </div>
    </div>
  );
}