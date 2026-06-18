// hooks/usePayment.ts
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export interface BookingData {
  id: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  cleaningFee: number;
  serviceFee: number;
  totalPrice: number;
  listing: {
    id: string;
    title: string;
    image?: string;
    location?: string;
    rating?: number;
    bedrooms?: number;
    maxGuests?: number;
    type?: string;
  };
  reference?: string;
}

interface PaymentBlockData {
  offerId: string;
  blockedUntil: number;
  attempts: number;
}

export function usePayment() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const offerId = searchParams.get("offerId");
  const conversationId = searchParams.get("conversationId");

  // États principaux
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  // États UI
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [imgErr, setImgErr] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showCardBack, setShowCardBack] = useState(false);
  
  // Timer et expiration
  const [timeLeft, setTimeLeft] = useState<number>(24 * 60 * 60);
  const [offerExpired, setOfferExpired] = useState(false);
  
  // Blocage paiement
  const [isBlocked, setIsBlocked] = useState(false);
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [isStripeReady, setIsStripeReady] = useState(false);

  // Helpers
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const formatTimeRemaining = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}min`;
    if (minutes > 0) return `${minutes}min ${secs}s`;
    return `${secs}s`;
  }, []);

  const fmtPrice = useCallback((n: number) => n.toLocaleString("fr-FR"), []);
  
  const fmtShort = useCallback((d: string) => {
    return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }, []);
  
  const fmtDay = useCallback((d: string) => {
    return new Date(d).toLocaleDateString("fr-FR", { weekday: "long" });
  }, []);

  // Vérifier si le paiement est bloqué
  const checkPaymentBlock = useCallback(() => {
    if (!offerId) return;
    const blockData = localStorage.getItem(`payment_blocked_${offerId}`);
    if (blockData) {
      try {
        const { blockedUntil }: PaymentBlockData = JSON.parse(blockData);
        if (Date.now() < blockedUntil) {
          setIsBlocked(true);
          const remainingMinutes = Math.floor((blockedUntil - Date.now()) / 60000);
          showToast(`Paiement bloqué pour ${remainingMinutes} minutes`, "error");
          return true;
        } else {
          localStorage.removeItem(`payment_blocked_${offerId}`);
          setIsBlocked(false);
          return false;
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsBlocked(false);
    return false;
  }, [offerId, showToast]);

  // Bloquer le paiement après 3 échecs
  const handlePaymentFailed = useCallback((offerId: string, cooldownSeconds: number) => {
    const blockData: PaymentBlockData = {
      offerId,
      blockedUntil: Date.now() + cooldownSeconds * 1000,
      attempts: 3,
    };
    localStorage.setItem(`payment_blocked_${offerId}`, JSON.stringify(blockData));
    setIsBlocked(true);
  }, []);

  // Incrémenter les tentatives
  const incrementPaymentAttempt = useCallback(() => {
    const newAttempts = paymentAttempts + 1;
    setPaymentAttempts(newAttempts);
    if (newAttempts >= 3) {
      handlePaymentFailed(offerId!, 30 * 60);
      showToast("3 tentatives échouées. Paiement bloqué 30 minutes.", "error");
      return true;
    }
    showToast(`Tentative ${newAttempts}/3 échouée`, "error");
    return false;
  }, [paymentAttempts, offerId, handlePaymentFailed, showToast]);

  // Timer d'expiration de l'offre
  useEffect(() => {
    if (!booking || offerExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setOfferExpired(true);
          showToast("L'offre a expiré", "error");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [booking, offerExpired, showToast]);

  // Récupérer l'offre et créer le payment intent
  const fetchOffer = useCallback(async () => {
    if (!offerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Récupérer l'offre
      const res = await fetch(`/api/offers/${offerId}`);
      if (!res.ok) throw new Error("Offre non trouvée");
      
      const offer = await res.json();
      
      // 2. Calculer le temps restant
      const createdAt = new Date(offer.createdAt);
      const expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setOfferExpired(true);

      // 3. Construire l'objet booking
      setBooking({
        id: offer.id,
        checkIn: offer.checkIn,
        checkOut: offer.checkOut,
        nights: offer.nights,
        guests: offer.guests,
        pricePerNight: offer.pricePerNight,
        cleaningFee: offer.cleaningFee ?? 85,
        serviceFee: offer.serviceFee ?? Math.round(offer.pricePerNight * offer.nights * 0.05),
        totalPrice: offer.totalPrice,
        reference: offer.reference,
        listing: {
          id: offer.listing.id,
          title: offer.listing.title,
          image: offer.listing.image,
          location: offer.listing.location,
          bedrooms: offer.listing.bedrooms,
          maxGuests: offer.listing.maxGuests,
          type: offer.listing.type,
        },
      });

      // 4. Créer le payment intent
      const paymentRes = await fetch("/api/payments/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId, conversationId }),
      });

      const paymentData = await paymentRes.json();
      if (paymentRes.ok) {
        setClientSecret(paymentData.clientSecret);
      } else {
        showToast(paymentData.error || "Erreur de création du paiement", "error");
      }
    } catch (error: any) {
      showToast(error.message || "Erreur de connexion", "error");
    } finally {
      setIsLoading(false);
    }
  }, [offerId, conversationId, showToast]);

  // ❌ confirmBooking SUPPRIMÉ - le webhook Stripe s'en occupe

  // Initialisation
  useEffect(() => {
    checkPaymentBlock();
    fetchOffer();
  }, [fetchOffer, checkPaymentBlock]);

  return {
    // Données
    booking,
    isLoading,
    isProcessing,
    setIsProcessing,
    clientSecret,
    toast,
    setToast,
    imgErr,
    setImgErr,
    agreed,
    setAgreed,
    showCardBack,
    setShowCardBack,
    timeLeft,
    offerExpired,
    isBlocked,
    paymentAttempts,
    isStripeReady,
    setIsStripeReady,
    offerId,
    conversationId,
    
    // Helpers
    showToast,
    formatTimeRemaining,
    fmtPrice,
    fmtShort,
    fmtDay,
    
    // Actions (garder handlePaymentFailed et incrementPaymentAttempt, PAS confirmBooking)
    handlePaymentFailed,
    incrementPaymentAttempt,
    checkPaymentBlock,
  };
}