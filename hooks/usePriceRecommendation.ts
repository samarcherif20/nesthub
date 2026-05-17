import { useState } from "react";

interface RecommendationParams {
  governorate: string;
  type: string;
  rooms: number;
  bathrooms: number;
  surfaceArea: number | null;
  equipment: Record<string, boolean>;
  hasBalcony: boolean;
  hasGarden: boolean;
  hasGarage: boolean;
  hasElevator: boolean;
  isFurnished: boolean;
  rentalType: string;
}

export function usePriceRecommendation() {
  const [loading, setLoading] = useState(false);
  const [pricePerNight, setPricePerNight] = useState<number | null>(null);
  const [pricePerMonth, setPricePerMonth] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getRecommendation = async (params: RecommendationParams) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/listings/recommend-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success) {
        setPricePerNight(data.pricePerNight);
        setPricePerMonth(data.pricePerMonth);
        return {
          pricePerNight: data.pricePerNight,
          pricePerMonth: data.pricePerMonth
        };
      } else {
        setError(data.error);
        return null;
      }
    } catch (err) {
      setError("Erreur de connexion");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { getRecommendation, loading, pricePerNight, pricePerMonth, error };
}