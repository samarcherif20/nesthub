// app/[locale]/(dashboard)/guest/reservations/page.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  IoCalendarOutline, 
 IoLocationOutline, 
 IoPeopleOutline, 
 IoChatbubbleOutline,
 IoStar,
 IoSearchOutline,
 IoHeartOutline,
 IoPersonOutline,
 IoNotificationsOutline,
 IoHelpCircleOutline,
 IoCalendar,
 IoChatbubble,
 IoPerson,
 IoHeart,
 IoSearch,
 IoClose,
 IoChevronForward,
 IoCalendarClearOutline
} from "react-icons/io5";
import { MdOutlineEventBusy, MdOutlineGavel, MdOutlineSmokeFree, MdOutlinePets, MdOutlineVolumeOff, MdOutlineGroups, MdOutlineAccountBalanceWallet, MdOutlineReceiptLong, MdOutlineVerified, MdOutlineCall, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { FaRegStar, FaStar } from "react-icons/fa";
import { HiOutlineLocationMarker } from "react-icons/hi";

// Mock data for reservations
const reservations = [
  {
    id: 1,
    title: "Villa Azur & Spa",
    location: "Sidi Bou Saïd, Tunisie",
    price: 2450,
    currency: "TND",
    startDate: "15 Juil 2024",
    endDate: "22 Juil 2024",
    guests: 4,
    status: "confirmed",
    statusText: "Confirmé",
    statusColor: "green",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdxpBMuZDFJdPw2Hwal5YCPlmjns9g83ojQovfvWEOumc-9cxjDKYcwzlwqs-22nNyk-shiaIGQ1KL7UvHY0ci8_XOtswZjwS2HDxfd5dOlyyNZgIMesyaKZo0EF-W85B5wxWo9_jkJzrMJ9-WOO19Jnzb4NvBgOAo_p_9LSiDmx1anFhxpXU6-6xxFl4f4c2Znlh9kC0Hibfq-6v1toEfSeCDwTlk3pLemo0RrxSU4G33Zx0FgJed9Ppo0aCGjEF44zIS1hVkh2I",
  },
  {
    id: 2,
    title: "Le Loft des Artistes",
    location: "La Marsa, Tunisie",
    price: 1200,
    currency: "TND",
    startDate: "05 Août 2024",
    endDate: "10 Août 2024",
    guests: 2,
    status: "pending",
    statusText: "En attente",
    statusColor: "orange",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTmoJs2DiW0kkqp1E_eJgXv0COZVzNhPY53YaxhwNuGbtdArYf4qcmf_VrHhSp336wtCJ5FIPHc-ukUjtTl6lLp7SMRggASba9ZzgEz4x0Am-mZTlj0C0aQhHLerglFD8fNMQzdiQCXQqZZNPVoH_GHwmPEX94ljfdqBpGyJhy_IdCxwXLPFXsAjDZiHYgZ6XlHVrIxaS0xuaDd0V2Z2XUfWXJFwgqP67L46NvQfE60w04JNhhnykJXitcBZFhrJfZW3_IR8cV5LI",
  },
];

export default function ReservationsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  const filteredReservations = reservations.filter((r) => {
    if (activeTab === "upcoming") return r.status === "confirmed";
    if (activeTab === "past") return false;
    if (activeTab === "cancelled") return false;
    return true;
  });

  const getStatusColor = (color: string) => {
    switch (color) {
      case "green":
        return "text-green-600 bg-green-50";
      case "orange":
        return "text-orange-500 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff]">
   

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-[3.5rem] font-['Plus_Jakarta_Sans'] font-bold tracking-tight text-[#181c22] mb-2">
            Mes Réservations
          </h1>
          <p className="text-[#404753] max-w-2xl text-lg font-['Inter']">
            Gérez vos séjours à venir et retrouvez l'historique de vos expériences dans nos demeures d'exception.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-[#ebeef7] rounded-2xl w-fit mb-10">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-8 py-3 rounded-xl transition-all font-['Inter'] ${
              activeTab === "upcoming"
                ? "bg-white shadow-sm text-[#005cab] font-semibold"
                : "text-[#404753] hover:bg-[#e5e8f1]"
            }`}
          >
            À venir
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-8 py-3 rounded-xl transition-all font-['Inter'] ${
              activeTab === "past"
                ? "bg-white shadow-sm text-[#005cab] font-semibold"
                : "text-[#404753] hover:bg-[#e5e8f1]"
            }`}
          >
            Passées
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`px-8 py-3 rounded-xl transition-all font-['Inter'] ${
              activeTab === "cancelled"
                ? "bg-white shadow-sm text-[#005cab] font-semibold"
                : "text-[#404753] hover:bg-[#e5e8f1]"
            }`}
          >
            Annulées
          </button>
        </div>

        {/* Reservations Grid */}
        {filteredReservations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredReservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/reservations/${reservation.id}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)] transition-all hover:-translate-y-1"
              >
                <div className="flex flex-col md:flex-row h-full">
                  <div className="md:w-2/5 relative h-48 md:h-auto overflow-hidden">
                    <img
                      src={reservation.image}
                      alt={reservation.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-4 left-4">
                      <span
                        className={`px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-['Inter'] font-bold uppercase tracking-widest shadow-sm ${getStatusColor(
                          reservation.statusColor
                        )}`}
                      >
                        {reservation.statusText}
                      </span>
                    </div>
                  </div>
                  <div className="md:w-3/5 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-['Plus_Jakarta_Sans'] text-xl font-bold text-[#181c22]">
                          {reservation.title}
                        </h3>
                        <span className="text-[#005cab] font-bold text-lg">
                          {reservation.price.toLocaleString()} {reservation.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[#404753] text-sm mb-4">
                        <HiOutlineLocationMarker className="text-sm" />
                        {reservation.location}
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-[#404753]">
                          <IoCalendarOutline className="text-[#005cab]" />
                          <span className="text-sm font-medium">
                            {reservation.startDate} — {reservation.endDate}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[#404753]">
                          <IoPeopleOutline className="text-[#005cab]" />
                          <span className="text-sm font-medium">
                            {reservation.guests} voyageurs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 py-3 px-4 rounded-full bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white font-semibold text-sm transition-all active:scale-95 shadow-md">
                        Détails
                      </button>
                      <button className="p-3 rounded-full bg-[#e5e8f1] text-[#181c22] hover:bg-[#d7dae3] transition-colors">
                        <IoChatbubbleOutline className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-[#ebeef7] rounded-full flex items-center justify-center mb-6">
              <MdOutlineEventBusy className="text-5xl text-[#c0c7d6]" />
            </div>
            <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#181c22] mb-2">
              Aucune réservation trouvée
            </h2>
            <p className="text-[#404753] max-w-sm">
              Vous n'avez pas de réservations dans cette catégorie pour le moment.
            </p>
            <button className="mt-8 px-8 py-4 rounded-full bg-[#005cab] text-white font-bold hover:shadow-lg transition-all active:scale-95">
              Explorer nos résidences
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-8px_32px_rgba(0,0,0,0.08)] flex justify-around items-center px-4 pb-6 pt-3 z-50">
        <a href="#" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2.5 transition-transform active:scale-90">
          <IoSearchOutline className="w-5 h-5" />
          <span className="text-[10px] font-['Inter'] font-semibold uppercase tracking-wider mt-1">Explorer</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2.5 transition-transform active:scale-90">
          <IoCalendarClearOutline className="w-5 h-5" />
          <span className="text-[10px] font-['Inter'] font-semibold uppercase tracking-wider mt-1">Réservations</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center text-slate-400 px-5 py-2.5 transition-transform active:scale-90">
          <IoHeartOutline className="w-5 h-5" />
          <span className="text-[10px] font-['Inter'] font-semibold uppercase tracking-wider mt-1">Favoris</span>
        </a>
        <a href="#" className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-blue-600 rounded-2xl px-5 py-2.5 transition-transform active:scale-90">
          <IoPersonOutline className="w-5 h-5" />
          <span className="text-[10px] font-['Inter'] font-semibold uppercase tracking-wider mt-1">Profil</span>
        </a>
      </nav>

      {/* Footer Desktop */}
      <footer className="hidden md:block bg-[#f1f3fd] border-t border-[#c0c7d6]/10 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-['Plus_Jakarta_Sans'] tracking-tight mb-6 inline-block">
              Dar Luxury
            </span>
            <p className="text-[#404753] max-w-sm mb-6">
              L'excellence de l'immobilier de luxe en Tunisie. Des expériences sur mesure pour des voyageurs exigeants.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-[#e5e8f1] flex items-center justify-center hover:bg-[#005cab] hover:text-white transition-all">
                🌐
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#e5e8f1] flex items-center justify-center hover:bg-[#005cab] hover:text-white transition-all">
                📧
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-[#e5e8f1] flex items-center justify-center hover:bg-[#005cab] hover:text-white transition-all">
                📞
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[#181c22] mb-6 uppercase tracking-wider text-xs">Liens utiles</h4>
            <ul className="space-y-4 text-[#404753] text-sm">
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Comment ça marche</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Parrainer un hôte</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Garanties Dar Luxury</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-[#181c22] mb-6 uppercase tracking-wider text-xs">Légal</h4>
            <ul className="space-y-4 text-[#404753] text-sm">
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Conditions générales</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Politique de confidentialité</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Mentions légales</a></li>
              <li><a href="#" className="hover:text-[#005cab] transition-colors">Accessibilité</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-[#c0c7d6]/10 text-center text-sm text-[#404753]">
          © 2024 Dar Luxury Atlas. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}