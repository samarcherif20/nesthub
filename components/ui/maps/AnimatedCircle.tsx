// components/ui/maps/AnimatedCircle.tsx
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ✅ Importer Circle dynamiquement sans SSR
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);

interface AnimatedCircleProps {
  center: [number, number];
  radius: number;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  weight?: number;
  children?: React.ReactNode;
}

export function AnimatedCircle({
  center,
  radius,
  color = "#ef4444",
  fillColor = "#ef4444",
  fillOpacity = 0.25,
  weight = 2.5,
  children,
}: AnimatedCircleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pulseEffect, setPulseEffect] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Animation de pulsation automatique
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      setPulseEffect(true);
      setTimeout(() => setPulseEffect(false), 800);
    }, 2000);

    return () => clearInterval(interval);
  }, [isMounted]);

  const getPathOptions = () => {
    const baseOptions = {
      color: color,
      fillColor: fillColor,
      fillOpacity: fillOpacity,
      weight: isHovered ? weight + 1 : weight,
    };

    if (pulseEffect) {
      return {
        ...baseOptions,
        fillOpacity: fillOpacity + 0.2,
        weight: weight + 2,
      };
    }

    return baseOptions;
  };

  // Ne pas rendre pendant l'hydratation
  if (!isMounted) {
    return null;
  }

  return (
    <Circle
      center={center}
      radius={isHovered ? radius * 1.05 : radius}
      pathOptions={getPathOptions()}
      eventHandlers={{
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
      }}
    >
      {children}
    </Circle>
  );
}
