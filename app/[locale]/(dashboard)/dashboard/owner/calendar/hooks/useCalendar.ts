import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isPast: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  isCheckIn: boolean;
  isCheckOut: boolean;
  bookingId?: string;
  bookingGuest?: string;
  bookingNights?: number;
  bookingColor?: string;
  customPrice?: number;
  blockedReason?: string;
}

export interface BlockedDate {
  id: string;
  date?: string;
  reason?: string;
  customPrice?: number;
  startDate?: string;
  endDate?: string;
}

export interface Booking {
  id: string;
  checkIn: string;
  checkOut: string;
  status: string;
  guestName?: string;
  guestEmail?: string;
  totalPrice?: number;
  nights?: number;
  colorIndex?: number;
  tenant?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Listing {
  id: string;
  title: string;
  type: string;
  governorate: string;
  photos: Array<{ url: string; isMain: boolean }>;
}

export const BOOKING_COLORS = [
  { bg: "bg-indigo-500", light: "bg-indigo-50", text: "text-indigo-700", bar: "#6366f1" },
  { bg: "bg-violet-500", light: "bg-violet-50", text: "text-violet-700", bar: "#8b5cf6" },
  { bg: "bg-sky-500", light: "bg-sky-50", text: "text-sky-700", bar: "#0ea5e9" },
  { bg: "bg-emerald-500", light: "bg-emerald-50", text: "text-emerald-700", bar: "#10b981" },
  { bg: "bg-rose-500", light: "bg-rose-50", text: "text-rose-700", bar: "#f43f5e" },
  { bg: "bg-amber-500", light: "bg-amber-50", text: "text-amber-700", bar: "#f59e0b" },
];

export const FR_MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const FR_DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function normalizeBlockedDates(blockedDates: any[]): BlockedDate[] {
  const normalized: BlockedDate[] = [];
  for (const bd of blockedDates) {
    if (bd.startDate && bd.endDate && bd.startDate !== bd.endDate) {
      const start = new Date(bd.startDate);
      const end = new Date(bd.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      let current = new Date(start);
      while (current <= end) {
        normalized.push({
          id: bd.id,
          date: current.toISOString().split("T")[0],
          reason: bd.reason,
          customPrice: bd.customPrice,
          startDate: bd.startDate,
          endDate: bd.endDate,
        });
        current.setDate(current.getDate() + 1);
      }
    } else {
      const dateStr = bd.startDate?.split("T")[0] || bd.date;
      if (dateStr) {
        normalized.push({
          id: bd.id,
          date: dateStr,
          reason: bd.reason,
          customPrice: bd.customPrice,
          startDate: bd.startDate,
          endDate: bd.endDate,
        });
      }
    }
  }
  return normalized;
}

export function buildGrid(
  year: number,
  month: number,
  blockedDates: BlockedDate[],
  bookings: Booking[],
  pricingRules: any[] = [],
): CalendarDay[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: CalendarDay[] = [];

  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = offset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isPast: true,
      isBooked: false,
      isBlocked: true,
      isCheckIn: false,
      isCheckOut: false,
    });
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const dateStr = d.toISOString().split("T")[0];
    const isPast = d < todayMidnight;

    const blockedEntry = blockedDates.find((b) => b.date === dateStr);
    const isBlocked = !!blockedEntry && !isPast;

    const booking = bookings.find((b) => {
      const ci = new Date(b.checkIn);
      ci.setHours(0, 0, 0, 0);
      const co = new Date(b.checkOut);
      co.setHours(0, 0, 0, 0);
      return d >= ci && d < co;
    });
    const isCheckIn = !!bookings.find((b) => {
      const ci = new Date(b.checkIn);
      ci.setHours(0, 0, 0, 0);
      return isSameDay(d, ci);
    });
    const isCheckOut = !!bookings.find((b) => {
      const co = new Date(b.checkOut);
      co.setHours(0, 0, 0, 0);
      return isSameDay(d, co);
    });

    const colorIdx = booking ? (booking.colorIndex ?? 0) % BOOKING_COLORS.length : 0;

    const priceRule = pricingRules.find((r) => {
      const start = new Date(r.startDate);
      const end = new Date(r.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return d >= start && d <= end;
    });

    days.push({
      date: d,
      isCurrentMonth: true,
      isPast,
      isBooked: !!booking,
      isBlocked,
      isCheckIn,
      isCheckOut,
      bookingId: booking?.id,
      bookingGuest: booking?.tenant ? `${booking.tenant.firstName} ${booking.tenant.lastName || ""}` : booking?.guestName,
      bookingNights: booking?.nights,
      bookingColor: booking ? BOOKING_COLORS[colorIdx].bar : undefined,
      customPrice: priceRule?.fixedPrice || blockedEntry?.customPrice,
      blockedReason: blockedEntry?.reason,
    });
  }

  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isPast: true,
      isBooked: false,
      isBlocked: true,
      isCheckIn: false,
      isCheckOut: false,
    });
  }
  return days;
}

export function useCalendar() {
  const { getToken } = useAuth();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pricingRules, setPricingRules] = useState<any[]>([]);
  const [loadingCal, setLoadingCal] = useState(false);
  const [saving, setSaving] = useState(false);

  const authFetch = useCallback(async (url: string, opts: RequestInit = {}) => {
    const token = await getToken({ template: "my-app-template" });
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers ?? {}),
      },
    });
  }, [getToken]);

  useEffect(() => {
    setLoadingListings(true);
    authFetch("/api/listings/my?status=ACTIVE&page=1&pageSize=20")
      .then((r) => (r.ok ? r.json() : { listings: [] }))
      .then((d) => {
        const listingsData = d.listings ?? [];
        setListings(listingsData);
        if (listingsData.length > 0) setSelectedListing(listingsData[0]);
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, [authFetch]);

  const fetchAvailability = useCallback(async () => {
    if (!selectedListing) return;
    setLoadingCal(true);
    try {
      const y = currentDate.getFullYear(), m = currentDate.getMonth() + 1;
      const res = await authFetch(`/api/listings/availability?listingId=${selectedListing.id}&year=${y}&month=${m}`);
      if (res.ok) {
        const data = await res.json();

        const normalizedBlockedDates = normalizeBlockedDates(data.blockedDates ?? []);
        const formattedBookings: Booking[] = (data.bookings ?? []).map((b: any, i: number) => ({
          id: b.id,
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          status: b.status,
          guestName: b.tenant?.firstName ? `${b.tenant.firstName} ${b.tenant.lastName || ""}` : b.guestName,
          guestEmail: b.tenant?.email || b.guestEmail,
          totalPrice: b.totalPrice,
          nights: Math.ceil((new Date(b.checkOut).getTime() - new Date(b.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
          colorIndex: i,
          tenant: b.tenant,
        }));

        setBlockedDates(normalizedBlockedDates);
        setBookings(formattedBookings);
        setPricingRules(data.pricingRules ?? []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCal(false);
    }
  }, [selectedListing, currentDate, authFetch]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const days = buildGrid(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    blockedDates,
    bookings,
    pricingRules,
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisMonthDays = days.filter((d) => d.isCurrentMonth);
  const bookedDays = thisMonthDays.filter((d) => d.isBooked).length;
  const blockedDaysCount = thisMonthDays.filter((d) => d.isBlocked && !d.isPast).length;
  const totalDays = thisMonthDays.length;
  const occupancy = totalDays > 0 ? Math.round((bookedDays / totalDays) * 100) : 0;
  const revenue = bookings.reduce((s, b) => s + (b.totalPrice ?? 0), 0);

  const isDaySelected = (date: Date) => selectedDays.some((d) => isSameDay(d, date));

  const handleDayMouseEnter = (day: CalendarDay) => {
    if (!isSelecting || !rangeStart || !day.isCurrentMonth || day.isPast || day.isBooked || day.isBlocked) return;
    const start = rangeStart;
    const end = day.date;
    const newSelected: Date[] = [];
    const minDate = start < end ? start : end;
    const maxDate = start < end ? end : start;
    let current = new Date(minDate);
    while (current <= maxDate) {
      newSelected.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    setSelectedDays(newSelected);
  };

  const handleDayClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth || day.isPast || day.isBooked || day.isBlocked) return;
    if (!isSelecting) {
      setRangeStart(day.date);
      setSelectedDays([day.date]);
      setIsSelecting(true);
    } else {
      if (rangeStart) {
        const start = rangeStart;
        const end = day.date;
        const newSelected: Date[] = [];
        const minDate = start < end ? start : end;
        const maxDate = start < end ? end : start;
        let current = new Date(minDate);
        while (current <= maxDate) {
          newSelected.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
        setSelectedDays(newSelected);
      }
      setIsSelecting(false);
      setRangeStart(null);
    }
  };

  const clearSelection = () => {
    setSelectedDays([]);
    setRangeStart(null);
    setIsSelecting(false);
  };

  const selectedDatesAreBlocked = selectedDays.some((d) =>
    blockedDates.some((b) => {
      const bDate = b.date ? new Date(b.date) : null;
      return bDate && isSameDay(d, bDate);
    }),
  );

  const blockDates = async (reason?: string, specificDates?: Date[]) => {
    const datesToBlock = specificDates || selectedDays;
    if (!selectedListing || datesToBlock.length === 0) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/listings/availability", {
        method: "POST",
        body: JSON.stringify({
          listingId: selectedListing.id,
          action: "block",
          dates: datesToBlock.map((d) => d.toISOString().split("T")[0]),
          reason: reason || null,
        }),
      });
      if (res.ok) {
        clearSelection();
        await fetchAvailability();
      }
    } finally {
      setSaving(false);
    }
  };

  const unblockDates = async (specificDates?: Date[]) => {
    const datesToUnblock = specificDates || selectedDays;
    if (!selectedListing || datesToUnblock.length === 0) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/listings/availability", {
        method: "POST",
        body: JSON.stringify({
          listingId: selectedListing.id,
          action: "unblock",
          dates: datesToUnblock.map((d) => d.toISOString().split("T")[0]),
        }),
      });
      if (res.ok) {
        clearSelection();
        await fetchAvailability();
      }
    } finally {
      setSaving(false);
    }
  };

  const setPriceForDates = async (price: number, specificDates?: Date[]) => {
    const datesToPrice = specificDates || selectedDays;
    if (!selectedListing || datesToPrice.length === 0 || !price) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/listings/availability", {
        method: "POST",
        body: JSON.stringify({
          listingId: selectedListing.id,
          action: "setPrice",
          dates: datesToPrice.map((d) => d.toISOString().split("T")[0]),
          customPrice: price,
        }),
      });
      if (res.ok) {
        clearSelection();
        await fetchAvailability();
      }
    } finally {
      setSaving(false);
    }
  };

  const upcomingBookings = bookings
    .filter((b) => new Date(b.checkIn) >= today)
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

  return {
    listings,
    loadingListings,
    selectedListing,
    setSelectedListing,
    currentDate,
    setCurrentDate,
    days,
    today,
    selectedDays,
    clearSelection,
    isDaySelected,
    handleDayClick,
    handleDayMouseEnter,
    selectedDatesAreBlocked,
    bookings,
    blockedDates,
    pricingRules,
    loadingCal,
    saving,
    occupancy,
    revenue,
    bookedDays,
    blockedDaysCount,
    upcomingBookings,
    blockDates,
    unblockDates,
    setPriceForDates,
    fetchAvailability,
    BOOKING_COLORS,
    FR_MONTHS,
    FR_DAYS_SHORT,
  };
}