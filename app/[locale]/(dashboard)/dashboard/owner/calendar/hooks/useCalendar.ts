// app/[locale]/(dashboard)/owner/calendar/hooks/useCalendar.ts
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
  { bg: "#6366f1", light: "rgba(99,102,241,0.15)", dark: "rgba(99,102,241,0.25)" },
  { bg: "#8b5cf6", light: "rgba(139,92,246,0.15)", dark: "rgba(139,92,246,0.25)" },
  { bg: "#0ea5e9", light: "rgba(14,165,233,0.15)", dark: "rgba(14,165,233,0.25)" },
  { bg: "#10b981", light: "rgba(16,185,129,0.15)", dark: "rgba(16,185,129,0.25)" },
  { bg: "#f59e0b", light: "rgba(245,158,11,0.15)", dark: "rgba(245,158,11,0.25)" },
];

export const FR_MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
export const FR_DAYS_SHORT = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function normalizeBlockedDates(blockedDates: any[]): BlockedDate[] {
  const normalized: BlockedDate[] = [];
  for (const bd of blockedDates) {
    // Gérer les plages de dates
    if (bd.startDate && bd.endDate) {
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
    } 
    // Gérer les dates simples
    else {
      const dateStr = bd.startDate?.split("T")[0] || bd.date?.split("T")[0];
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

  // Jours du mois précédent
  let offset = firstDay.getDay() - 1;
  if (offset < 0) offset = 6;
  for (let i = offset; i > 0; i--) {
    const d = new Date(year, month, 1 - i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isPast: true,
      isBooked: false,
      isBlocked: false,
      isCheckIn: false,
      isCheckOut: false,
    });
  }

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Jours du mois courant
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year, month, i);
    const dateStr = d.toISOString().split("T")[0];
    const isPast = d < todayMidnight;

    // Vérifier si bloqué
    const blockedEntry = blockedDates.find((b) => b.date === dateStr);
    const isBlocked = !!blockedEntry && !isPast;

    // Vérifier si réservé
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

    // Vérifier les prix spéciaux
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

  // Compléter pour avoir 42 jours (6 semaines)
  const remaining = 42 - days.length;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    days.push({
      date: d,
      isCurrentMonth: false,
      isPast: true,
      isBooked: false,
      isBlocked: false,
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

  // Charger les listings
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

  // Rafraîchir les disponibilités
  const fetchAvailability = useCallback(async () => {
    if (!selectedListing) return;
    setLoadingCal(true);
    try {
      const y = currentDate.getFullYear();
      const m = currentDate.getMonth() + 1;
      console.log(`🔄 Fetch availability pour ${selectedListing.id} - ${y}/${m}`);

      const res = await authFetch(
        `/api/listings/availability?listingId=${selectedListing.id}&year=${y}&month=${m}`,
      );
      
      if (res.ok) {
        const data = await res.json();
        console.log(`📊 Données reçues: blockedDates=${data.blockedDates?.length}, pricingRules=${data.pricingRules?.length}, bookings=${data.bookings?.length}`);

        const normalizedBlockedDates = normalizeBlockedDates(data.blockedDates ?? []);
        console.log(`📅 normalizedBlockedDates:`, normalizedBlockedDates.map(b => b.date));
        
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
      } else {
        console.error("Erreur API:", await res.text());
      }
    } catch (e) {
      console.error("Erreur fetchAvailability:", e);
    } finally {
      setLoadingCal(false);
    }
  }, [selectedListing, currentDate, authFetch]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability, selectedListing?.id]);

  // Construction du grid (recalculé à chaque changement des données)
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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
    } catch (e) {
      console.error(e);
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