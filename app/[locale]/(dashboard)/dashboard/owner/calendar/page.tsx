// app/[locale]/(dashboard)/owner/calendar/page.tsx
'use client';

import * as React from 'react';
import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

// Types pour le calendrier
interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isAvailable: boolean;
  isBooked: boolean;
  isBlocked: boolean;
  customPrice?: number;
  minStay?: number;
}

export default function OwnerCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = React.use(params);
  const { user } = useUser();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [minStay, setMinStay] = useState(1);
  const [advanceNotice, setAdvanceNotice] = useState(0);

  // Générer les jours du mois
  const getDaysInMonth = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: CalendarDay[] = [];
    
    // Jours du mois précédent
    const startOffset = firstDay.getDay();
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({
        date: prevDate,
        isCurrentMonth: false,
        isAvailable: false,
        isBooked: false,
        isBlocked: true,
      });
    }
    
    // Jours du mois courant
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const currentDay = new Date(year, month, i);
      // Simuler quelques jours bloqués et réservés
      const isWeekend = currentDay.getDay() === 0 || currentDay.getDay() === 6;
      const isPast = currentDay < new Date();
      days.push({
        date: currentDay,
        isCurrentMonth: true,
        isAvailable: !isPast && !isWeekend,
        isBooked: currentDay.getDate() === 15 || currentDay.getDate() === 16,
        isBlocked: isPast || (currentDay.getDate() === 10 && currentDay.getMonth() === month),
        customPrice: isWeekend && !isPast ? 150 : undefined,
        minStay: currentDay.getDate() === 20 ? 3 : undefined,
      });
    }
    
    // Jours du mois suivant
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        date: nextDate,
        isCurrentMonth: false,
        isAvailable: false,
        isBooked: false,
        isBlocked: true,
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(currentDate);
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  
  // Naviguer entre les mois
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Formater le titre du mois
  const monthNames = locale === 'fr' 
    ? ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
    : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const monthTitle = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  
  // Couleurs des cellules
  const getDayClass = (day: CalendarDay) => {
    const isSelected = selectedDates.some(d => d.toDateString() === day.date.toDateString());
    const isToday = day.date.toDateString() === new Date().toDateString();
    
    if (day.isBooked) {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 cursor-not-allowed relative';
    }
    if (day.isBlocked) {
      return 'bg-gray-100 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 line-through cursor-not-allowed';
    }
    if (isSelected) {
      return 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md';
    }
    if (day.customPrice) {
      return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-pointer relative';
    }
    if (day.isAvailable) {
      return 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer';
    }
    return 'bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed';
  };
  
  const handleDayClick = (day: CalendarDay) => {
    if (!day.isAvailable && !day.isBlocked && !day.isBooked) return;
    if (day.isBooked || day.isBlocked) return;
    
    setSelectedDates(prev => {
      const exists = prev.some(d => d.toDateString() === day.date.toDateString());
      if (exists) {
        return prev.filter(d => d.toDateString() !== day.date.toDateString());
      }
      return [...prev, day.date];
    });
  };
  
  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  text-[#181c22] dark:text-white">
            Calendrier des disponibilités
          </h1>
          <p className="text-[#404753] dark:text-slate-400 mt-1">
            Gérez vos dates bloquées, prix spéciaux et durée minimum de séjour
          </p>
        </div>
        
        {/* Légende */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white border border-gray-300 dark:bg-slate-700 dark:border-slate-600"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Disponible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/50"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Réservé</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 line-through"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Bloqué</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Prix spécial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Sélectionné</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendrier */}
          <div className="lg:col-span-8">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] overflow-hidden">
              {/* Navigation */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <button
                    onClick={previousMonth}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    Aujourd'hui
                  </button>
                </div>
                <h2 className="text-xl font-bold  text-[#181c22] dark:text-white">
                  {monthTitle}
                </h2>
              </div>
              
              {/* Grille des jours */}
              <div className="p-6">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map((day, index) => (
                    <div key={index} className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendrier */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => (
                    <div
                      key={index}
                      onClick={() => handleDayClick(day)}
                      className={`
                        aspect-square p-2 rounded-xl transition-all duration-200 relative
                        ${getDayClass(day)}
                        ${!day.isCurrentMonth ? 'opacity-50' : ''}
                      `}
                    >
                      <span className="text-sm font-medium">
                        {day.date.getDate()}
                      </span>
                      {day.customPrice && day.isCurrentMonth && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                          {day.customPrice} TND
                        </div>
                      )}
                      {day.minStay && day.isCurrentMonth && (
                        <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-purple-600 dark:text-purple-400">{day.minStay}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Panneau latéral */}
          <div className="lg:col-span-4 space-y-6">
            {/* Sélection des dates */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
              <h3 className="text-lg font-bold text-[#181c22] dark:text-white mb-4">
                Dates sélectionnées
              </h3>
              {selectedDates.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {selectedDates.map((date, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-400">
                        {date.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US')}
                      </span>
                      <button
                        onClick={() => setSelectedDates(prev => prev.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-4">
                  Aucune date sélectionnée
                </p>
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBlockModal(true)}
                  disabled={selectedDates.length === 0}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                >
                  Bloquer
                </button>
                <button
                  onClick={() => setShowPriceModal(true)}
                  disabled={selectedDates.length === 0}
                  className="flex-1 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-xl text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-50"
                >
                  Prix spécial
                </button>
              </div>
            </div>
            
            {/* Paramètres */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
              <h3 className="text-lg font-bold  text-[#181c22] dark:text-white mb-4">
                Paramètres
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Durée minimum de séjour (nuits)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={minStay}
                    onChange={(e) => setMinStay(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Préavis d'arrivée
                  </label>
                  <select
                    value={advanceNotice}
                    onChange={(e) => setAdvanceNotice(parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value={0}>Même jour</option>
                    <option value={1}>1 jour</option>
                    <option value={2}>2 jours</option>
                    <option value={3}>3 jours</option>
                    <option value={7}>1 semaine</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Conseil */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">lightbulb</span>
                <h4 className="font-semibold text-slate-900 dark:text-white">Conseil</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Bloquer les dates entre deux réservations vous permet de préparer votre logement. 
                Utilisez les prix spéciaux pour les week-ends et les périodes de forte affluence.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-[#181c22] dark:text-white mb-2">
              Bloquer les dates
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {selectedDates.length} date(s) sélectionnée(s)
            </p>
            <textarea
              placeholder="Raison (optionnel)"
              className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all mb-4 resize-none"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  setSelectedDates([]);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                Confirmer le blocage
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold  text-[#181c22] dark:text-white mb-2">
              Prix spécial
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {selectedDates.length} date(s) sélectionnée(s)
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Prix par nuit (TND)
              </label>
              <input
                type="number"
                placeholder="Ex: 180"
                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  setShowPriceModal(false);
                  setSelectedDates([]);
                }}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-xl font-medium hover:bg-amber-700 transition-colors"
              >
                Appliquer le prix
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}