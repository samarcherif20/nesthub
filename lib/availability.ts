// lib/availability.ts
import { prisma } from "@/lib/prisma";

export interface AvailabilitySlot {
  day: string;
  hours: string;
  enabled: boolean;
}

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  message: string;
  nextAvailableTime: string | null;
  currentHours?: string | null;
}

export async function checkOwnerAvailability(ownerId: string): Promise<AvailabilityCheckResult> {
  const owner = await prisma.user.findUnique({
    where: { id: ownerId },
    select: { availability: true, vacationMode: true, vacationMessage: true }
  });

  // Mode vacances activé
  if (owner?.vacationMode) {
    return {
      isAvailable: false,
      message: owner.vacationMessage || "Le propriétaire est actuellement en vacances.",
      nextAvailableTime: null
    };
  }

  const availability = owner?.availability as AvailabilitySlot[] | null;
  
  if (!availability || availability.length === 0) {
    return {
      isAvailable: true,
      message: "Disponible",
      nextAvailableTime: null
    };
  }

  const now = new Date();
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const currentDay = days[now.getDay()];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Trouver le créneau du jour actuel
  const todaySlot = availability.find(slot => 
    slot.day.toLowerCase() === currentDay || 
    (slot.day === "Lun - Ven" && ["lundi", "mardi", "mercredi", "jeudi", "vendredi"].includes(currentDay))
  );

  // Jour non disponible
  if (!todaySlot || !todaySlot.enabled) {
    const nextSlot = findNextAvailableSlot(availability, now);
    return {
      isAvailable: false,
      message: "Le propriétaire n'est pas disponible aujourd'hui.",
      nextAvailableTime: nextSlot
    };
  }

  // Vérifier les horaires
  if (todaySlot.hours === "Fermé") {
    return {
      isAvailable: false,
      message: "Le propriétaire est fermé aujourd'hui.",
      nextAvailableTime: findNextAvailableSlot(availability, now)
    };
  }

  if (todaySlot.hours === "Sur rendez-vous") {
    return {
      isAvailable: false,
      message: "Uniquement sur rendez-vous. Contactez le propriétaire.",
      nextAvailableTime: null
    };
  }

  // Extraire les heures
  const hoursMatch = todaySlot.hours.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);
  if (!hoursMatch) {
    return {
      isAvailable: true,
      message: "Disponible",
      nextAvailableTime: null,
      currentHours: todaySlot.hours
    };
  }

  const startHour = parseInt(hoursMatch[1]);
  const startMinute = parseInt(hoursMatch[2]);
  const endHour = parseInt(hoursMatch[3]);
  const endMinute = parseInt(hoursMatch[4]);

  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  if (currentTotalMinutes < startTotalMinutes) {
    const nextTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
    return {
      isAvailable: false,
      message: `Le propriétaire sera disponible à ${nextTime}.`,
      nextAvailableTime: nextTime,
      currentHours: todaySlot.hours
    };
  }

  if (currentTotalMinutes > endTotalMinutes) {
    const nextSlot = findNextAvailableSlot(availability, now);
    return {
      isAvailable: false,
      message: "Le propriétaire n'est plus disponible aujourd'hui.",
      nextAvailableTime: nextSlot,
      currentHours: todaySlot.hours
    };
  }

  return {
    isAvailable: true,
    message: "Le propriétaire est disponible.",
    nextAvailableTime: null,
    currentHours: todaySlot.hours
  };
}

function findNextAvailableSlot(availability: AvailabilitySlot[], now: Date): string | null {
  const days = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
  const currentDayIndex = now.getDay();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Parcourir les 7 prochains jours
  for (let i = 1; i <= 7; i++) {
    const nextDayIndex = (currentDayIndex + i) % 7;
    const nextDayName = days[nextDayIndex];
    
    const slot = availability.find(s => 
      s.day.toLowerCase() === nextDayName ||
      (s.day === "Lun - Ven" && nextDayIndex >= 1 && nextDayIndex <= 5)
    );
    
    if (slot && slot.enabled && slot.hours !== "Fermé") {
      const hoursMatch = slot.hours.match(/(\d{1,2}):(\d{2})/);
      if (hoursMatch) {
        const hour = parseInt(hoursMatch[1]);
        const minute = parseInt(hoursMatch[2]);
        const date = new Date(now);
        date.setDate(date.getDate() + i);
        date.setHours(hour, minute, 0, 0);
        return date.toLocaleDateString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
      }
      return `${nextDayName} ${slot.hours}`;
    }
  }
  
  return null;
}