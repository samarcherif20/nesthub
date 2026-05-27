// hooks/useBookings.ts
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export interface Booking {
  id: string;
  conversationId?: string;
  reference: string;
  listing: {
    id: string;
    title: string;
    governorate: string;
    images?: { url: string }[];
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export interface BookingStats {
  totalBookings: number;
  activeStays: number;
  revenueThisMonth: number;
  cancellationRate: number;
  totalRevenue: number;
  pendingPayments: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export interface FilterOptions {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
}

export function useBookings() {
  const { getToken } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    status: "ALL",
    dateFrom: "",
    dateTo: "",
    minAmount: "",
  });

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (filters.search) params.append("search", filters.search);
      if (filters.status !== "ALL") params.append("status", filters.status);
      if (filters.dateFrom) params.append("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.append("dateTo", filters.dateTo);
      if (filters.minAmount) params.append("minAmount", filters.minAmount);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.bookings) {
        setBookings(data.bookings);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 10,
            totalCount: 0,
            totalPages: 1,
          },
        );
        setStats(data.stats || null);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, pagination.page, filters]);

  const handlePageChange = (page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  };

  const updateFilters = (newFilters: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      status: "ALL",
      dateFrom: "",
      dateTo: "",
      minAmount: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const executeAction = async (
    bookingId: string,
    action: "confirm" | "cancel" | "delete"
  ) => {
    try {
      const token = await getToken();

      if (action === "delete") {
        const res = await fetch(`/api/admin/bookings?id=${bookingId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          await fetchBookings();
          return { success: true, message: "deleteSuccess" };
        } else {
          return { success: false, message: data.error || "errorUnknown" };
        }
      } else {
        const res = await fetch(`/api/admin/bookings`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            action: action === "confirm" ? "confirm" : "cancel",
          }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchBookings();
          return {
            success: true,
            message: action === "confirm" ? "confirmSuccess" : "cancelSuccess",
          };
        } else {
          return { success: false, message: data.error || "errorUnknown" };
        }
      }
    } catch (error) {
      console.error("Erreur:", error);
      return { success: false, message: "errorUnknown" };
    }
  };

  const exportToCSV = async (): Promise<{ success: boolean; message: string; blob?: Blob }> => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/bookings/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const blob = await res.blob();
      return { success: true, message: "exportSuccess", blob };
    } catch (error) {
      console.error("Erreur export:", error);
      return { success: false, message: "exportError" };
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return {
    bookings,
    stats,
    pagination,
    loading,
    filters,
    updateFilters,
    resetFilters,
    handlePageChange,
    executeAction,
    exportToCSV,
    fetchBookings,
  };
}