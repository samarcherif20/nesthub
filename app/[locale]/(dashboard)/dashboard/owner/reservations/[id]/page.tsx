// app/[locale]/(dashboard)/guest/reservations/[id]/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  IoChevronForward, 
  IoStar, 
  IoLocationOutline, 
  IoCalendarOutline, 
  IoPeopleOutline,
  IoChatbubbleOutline,
  IoCallOutline,
  IoSearchOutline,
  IoHeartOutline,
  IoPersonOutline,
  IoNotificationsOutline,
  IoCalendarClearOutline,
  IoChatbubble,
  IoPerson,
  IoHeart,
  IoSearch
} from "react-icons/io5";
import { 
  MdOutlineGavel, 
  MdOutlineSmokeFree, 
  MdOutlinePets, 
  MdOutlineVolumeOff, 
  MdOutlineGroups, 
  MdOutlineAccountBalanceWallet, 
  MdOutlineReceiptLong, 
  MdOutlineVerified, 
  MdOutlineKeyboardArrowDown 
} from "react-icons/md";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { FaRegStar, FaStar } from "react-icons/fa";

// Mock data for a single reservation
const reservationDetails = {
  id: 1,
  title: "The Sapphire Waterfront Villa",
  type: "Luxury Escape",
  location: "Sidi Bou Said, Tunisia",
  rating: 4.98,
  price: 450,
  currency: "USD",
  nights: 6,
  cleaningFee: 120,
  serviceFee: 385,
  taxes: 145.5,
  total: 3350.5,
  status: "confirmed",
  statusText: "Confirmed",
  checkIn: "Jun 12, 2024",
  checkOut: "Jun 18, 2024",
  checkInTime: "After 3:00 PM",
  checkOutTime: "Before 11:00 AM",
  guests: "4 Adults, 1 Child",
  image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQblxKPsk5w75XMLsY4w-CvNRYyDOW6dYJOUogglMNd3FS2oNEi4186aBDXzNCCMra7nDxa-D4BPIVTkAvHCl6bROzPSCM0WiswQ4YGjt8uZ6Du0EW0GPWaNb3RZbVjFmaiqx2xLax_jftWMuc6XDk5jyEbvahFgk_W74bPIjQrP-PzS19VRKzYwXr607qyzYXereIlVlsswCsafNOKOowUhYWEfypAym8CjZB-hQfzIEZ1bog-nDftQm0sHOSD80K2CuXiskA2X0",
  host: {
    name: "Amine Mansouri",
    role: "Superhost",
    verified: true,
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMKH7ap1xGiqyQdgSYj55j35kBgdUihrWZNi6vWXLdlg07Iyfxh3gRLRYKsurM3Ubdsr8ngb0Ufhc0aZa5yvOV5lpWYzXdJTWbbUuQsykNtmOd0ELQmy3sAz3ahUqnISk_YW4pLqiyrFHZ2kyVo3ZBYnZW-WsJxMVLEt1h0VlHKGvQkzuwj0SAK7mFo_1KaE3LHAKlMIqy2KULoiqmQWsgnD3jcaWUVoaCMzmW4c6BPadlslqSkCvqeTcEC0c0E-jL2xgRO8UlM6M",
  },
  paymentMethod: "Visa ending in 4242",
  paid: true,
};

export default function ReservationDetailsPage() {
  const params = useParams();
  const id = params.id;

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-['Inter'] antialiased">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl flex justify-between items-center px-6 h-16 shadow-[0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-['Plus_Jakarta_Sans'] tracking-tight">
            DarLuxury
          </span>
          <div className="hidden md:flex gap-6">
            <a href="#" className="text-slate-600 hover:text-blue-600 font-['Inter']">
              Explore
            </a>
            <a href="/reservations" className="text-blue-600 font-semibold border-b-2 border-blue-600 font-['Inter']">
              Reservations
            </a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-['Inter']">
              Messages
            </a>
            <a href="#" className="text-slate-600 hover:text-blue-600 font-['Inter']">
              Saved
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <IoNotificationsOutline className="text-[#404753] cursor-pointer w-5 h-5" />
          <IoPersonOutline className="text-[#404753] cursor-pointer w-5 h-5" />
        </div>
      </nav>

      <main className="pt-24 pb-32 max-w-6xl mx-auto px-6">
        {/* Breadcrumb & Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[#404753] text-sm mb-4">
            <Link href="/reservations" className="cursor-pointer hover:underline">
              Reservations
            </Link>
            <IoChevronForward className="text-xs" />
            <span className="font-medium text-[#005cab]">Booking details</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-['Plus_Jakarta_Sans'] font-extrabold tracking-tight text-[#181c22]">
              Reservation Details
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {reservationDetails.statusText}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Summary & Rules */}
          <div className="lg:col-span-7 space-y-8">
            {/* Property Summary Card */}
            <section className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(24,28,34,0.07)]">
              <div className="relative h-64 overflow-hidden">
                <img
                  src={reservationDetails.image}
                  alt={reservationDetails.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold text-[#005cab] flex items-center gap-1">
                  <IoStar className="text-sm" />
                  {reservationDetails.rating}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[#712ae2] font-bold uppercase tracking-widest text-[10px] mb-1">
                      {reservationDetails.type}
                    </p>
                    <h2 className="text-2xl font-['Plus_Jakarta_Sans'] font-bold text-[#181c22]">
                      {reservationDetails.title}
                    </h2>
                    <p className="text-[#404753] flex items-center gap-1 mt-1">
                      <HiOutlineLocationMarker className="text-lg" />
                      {reservationDetails.location}
                    </p>
                  </div>
                </div>

                {/* Stay Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-6 bg-[#f1f3fd] rounded-xl">
                  <div>
                    <p className="text-xs font-['Inter'] text-[#707785] uppercase tracking-wider mb-1">Check-in</p>
                    <p className="font-bold text-[#181c22]">{reservationDetails.checkIn}</p>
                    <p className="text-xs text-[#404753]">{reservationDetails.checkInTime}</p>
                  </div>
                  <div>
                    <p className="text-xs font-['Inter'] text-[#707785] uppercase tracking-wider mb-1">Check-out</p>
                    <p className="font-bold text-[#181c22]">{reservationDetails.checkOut}</p>
                    <p className="text-xs text-[#404753]">{reservationDetails.checkOutTime}</p>
                  </div>
                  <div className="col-span-2 md:col-span-1 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-[#c0c7d6]/30 md:pl-6">
                    <p className="text-xs font-['Inter'] text-[#707785] uppercase tracking-wider mb-1">Guests</p>
                    <p className="font-bold text-[#181c22]">{reservationDetails.guests}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* House Rules Section */}
            <section className="bg-[#f1f3fd] p-8 rounded-2xl">
              <h3 className="text-xl font-['Plus_Jakarta_Sans'] font-bold mb-6 flex items-center gap-2">
                <MdOutlineGavel className="text-[#005cab]" />
                House Rules
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                <div className="flex items-start gap-3">
                  <MdOutlineSmokeFree className="text-[#707785]" />
                  <div>
                    <p className="font-semibold text-[#181c22]">No Smoking</p>
                    <p className="text-sm text-[#404753]">Inside the property area.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MdOutlinePets className="text-[#707785]" />
                  <div>
                    <p className="font-semibold text-[#181c22]">No Pets</p>
                    <p className="text-sm text-[#404753]">Service animals allowed with notice.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MdOutlineVolumeOff className="text-[#707785]" />
                  <div>
                    <p className="font-semibold text-[#181c22]">Quiet Hours</p>
                    <p className="text-sm text-[#404753]">10:00 PM – 8:00 AM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MdOutlineGroups className="text-[#707785]" />
                  <div>
                    <p className="font-semibold text-[#181c22]">No Parties</p>
                    <p className="text-sm text-[#404753]">Small gatherings up to 8 guests.</p>
                  </div>
                </div>
              </div>
              <button className="mt-8 text-[#005cab] font-bold text-sm flex items-center gap-1 hover:underline">
                Show more rules <MdOutlineKeyboardArrowDown className="text-sm" />
              </button>
            </section>
          </div>

          {/* Right Column: Payment & Host */}
          <div className="lg:col-span-5 space-y-8">
            {/* Price Breakdown Card */}
            <section className="bg-white p-8 rounded-2xl shadow-[0_8px_16px_-4px_rgba(24,28,34,0.07)] sticky top-24">
              <h3 className="text-xl font-['Plus_Jakarta_Sans'] font-bold mb-6">Price Details</h3>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-[#404753]">
                  <span>{reservationDetails.nights} nights × ${reservationDetails.price}</span>
                  <span className="font-medium text-[#181c22]">
                    ${(reservationDetails.nights * reservationDetails.price).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-[#404753]">
                  <span>Cleaning fee</span>
                  <span className="font-medium text-[#181c22]">${reservationDetails.cleaningFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#404753]">
                  <span>Service fee</span>
                  <span className="font-medium text-[#181c22]">${reservationDetails.serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#404753]">
                  <span>Taxes</span>
                  <span className="font-medium text-[#181c22]">${reservationDetails.taxes.toFixed(2)}</span>
                </div>
                <div className="pt-4 border-t border-[#c0c7d6]/30 flex justify-between items-center">
                  <span className="text-lg font-bold text-[#181c22]">Total (USD)</span>
                  <span className="text-2xl font-['Plus_Jakarta_Sans'] font-extrabold text-[#005cab]">
                    ${reservationDetails.total.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="bg-[#005cab]/5 p-4 rounded-xl mb-8 flex items-center gap-3">
                <MdOutlineAccountBalanceWallet className="text-[#005cab]" />
                <div className="text-sm">
                  <p className="font-bold text-[#005cab]">Fully Paid</p>
                  <p className="text-[#404753] text-xs">
                    Payment processed via {reservationDetails.paymentMethod}
                  </p>
                </div>
              </div>
              <button className="w-full py-4 bg-gradient-to-r from-[#005cab] to-[#712ae2] text-white rounded-full font-bold shadow-lg shadow-[#005cab]/20 hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <MdOutlineReceiptLong />
                Get PDF Invoice
              </button>
            </section>

            {/* Host Contact Card */}
            <section className="bg-white p-6 rounded-2xl border border-[#c0c7d6]/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full overflow-hidden">
                  <img
                    src={reservationDetails.host.image}
                    alt={reservationDetails.host.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-xs font-['Inter'] text-[#707785] uppercase tracking-wider">Property Host</p>
                  <h4