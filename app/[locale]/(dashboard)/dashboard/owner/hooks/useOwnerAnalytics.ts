import { useState, useEffect, useCallback } from 'react';

interface AnalyticsData {
  kpi: any;
  monthlyRevenue: any;
  travelerTypes: any;
  listings: any[];
  upcomingPayments: any[];
  todoTasks: any[];
  recentActivity: any[];
  topCities: any[];
  weeklyData: any;
}

export function useOwnerAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/owner/analytics');
      if (!response.ok) throw new Error('Erreur de chargement');
      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refreshing, refresh };
}