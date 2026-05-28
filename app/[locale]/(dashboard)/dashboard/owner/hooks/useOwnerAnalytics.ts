// hooks/useOwnerAnalytics.ts
import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  kpi: {
    totalRevenue: number;
    revenueGrowth: number;
    occupancyRate: number;
    occupancyGrowth: number;
    totalBookings: number;
    bookingsGrowth: number;
    averageRating: number;
    avgDailyRate: number;
    avgDailyRateGrowth: number;
    totalListings: number;
  };
  monthlyRevenue: {
    labels: string[];
    amounts: number[];
    previousAmounts: number[];
  };
  travelerTypes: {
    longStay: number;
    shortStay: number;
    standardStay: number;
  };
  listings: Array<{
    id: string;
    title: string;
    thumbnailUrl: string | null;
    views: number;
    bookings: number;
    revenue: number;
    growth: number;
    occupancy: number;
    rating: number;
  }>;
  upcomingPayments: Array<{
    day: number;
    title: string;
    amount: number;
    date: string;
    status: string;
  }>;
  todoTasks: Array<{
    title: string;
    property: string;
    urgent: boolean;
    done: boolean;
  }>;
  recentActivity: Array<{
    type: "booking" | "review" | "payment" | "message";
    title: string;
    detail: string;
    time: string;
  }>;
  topCities: Array<{
    name: string;
    revenue: number;
    bookings: number;
    percentage: number;
  }>;
  weeklyData: {
    labels: string[];
    views: number[];
    bookings: number[];
    revenue: number[];
  };
}

export function useOwnerAnalytics(period: "30days" | "90days" | "year" = "90days") {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/owner/analytics?period=${period}`);
      if (!response.ok) {
        throw new Error('Erreur de chargement des données');
      }
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur fetch analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, period]);

  return { 
    data, 
    loading, 
    error, 
    refreshing, 
    refresh 
  };
}