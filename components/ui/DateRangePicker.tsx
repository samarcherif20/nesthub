// components/ui/DateRangePicker.tsx
'use client';

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import { type DateRange } from "react-day-picker";

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  className?: string;
}

// Pour l'affichage seulement (format français)
const formatDisplayDate = (date: Date): string => {
  return format(date, "dd/MM/yyyy");
};

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  className = '',
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Convertir les props ISO en Date pour le calendrier
  const [tempRange, setTempRange] = React.useState<DateRange | undefined>(() => {
    if (startDate && endDate) {
      return {
        from: new Date(startDate),
        to: new Date(endDate),
      };
    }
    return undefined;
  });

  // Mettre à jour le tempRange quand les props changent
  React.useEffect(() => {
    if (startDate && endDate) {
      setTempRange({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    } else {
      setTempRange(undefined);
    }
  }, [startDate, endDate]);

  // Présélections rapides
  const presets = [
    {
      label: "Aujourd'hui",
      getValue: () => ({
        from: new Date(),
        to: new Date(),
      }),
    },
    {
      label: "7 derniers jours",
      getValue: () => ({
        from: subDays(new Date(), 7),
        to: new Date(),
      }),
    },
    {
      label: "30 derniers jours",
      getValue: () => ({
        from: subDays(new Date(), 30),
        to: new Date(),
      }),
    },
    {
      label: "Ce mois-ci",
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: "Mois dernier",
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
  ];

  const handlePreset = (preset: typeof presets[0]) => {
    const range = preset.getValue();
    setTempRange(range);
  };

  const handleSelect = (range: DateRange | undefined) => {
    setTempRange(range);
  };

  // Valider la sélection - ENVOIE EN ISO POUR L'API
  const handleApply = () => {
    if (tempRange?.from && tempRange?.to) {
      // FORMAT ISO pour l'API (yyyy-MM-dd)
      const isoStart = format(tempRange.from, "yyyy-MM-dd");
      const isoEnd = format(tempRange.to, "yyyy-MM-dd");
      
      console.log("📅 Dates envoyées à l'API (ISO):", { isoStart, isoEnd });
      
      onStartDateChange(isoStart);
      onEndDateChange(isoEnd);
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    if (startDate && endDate) {
      setTempRange({
        from: new Date(startDate),
        to: new Date(endDate),
      });
    } else {
      setTempRange(undefined);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempRange(undefined);
    onStartDateChange("");
    onEndDateChange("");
    setIsOpen(false);
  };

  // AFFICHAGE en français mais VALEUR en ISO
  const getButtonText = () => {
    if (isOpen) {
      if (tempRange?.from && tempRange?.to) {
        return `${formatDisplayDate(tempRange.from)} - ${formatDisplayDate(tempRange.to)}`;
      }
      if (tempRange?.from) {
        return `À partir du ${formatDisplayDate(tempRange.from)}`;
      }
    }
    
    if (startDate && endDate) {
      // Pour l'affichage, on convertit l'ISO en français
      return `${formatDisplayDate(new Date(startDate))} - ${formatDisplayDate(new Date(endDate))}`;
    }
    return "Sélectionner une période";
  };

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {getButtonText()}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="w-36 border-r p-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                Périodes
              </p>
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePreset(preset)}
                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            <div>
              <Calendar
                mode="range"
                selected={tempRange}
                onSelect={handleSelect}
                numberOfMonths={2}
                locale={fr}
                initialFocus
              />
              <div className="flex items-center justify-between gap-2 p-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  Effacer
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleApply}
                    disabled={!tempRange?.from || !tempRange?.to}
                  >
                    Appliquer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}