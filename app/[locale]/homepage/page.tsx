// app/[locale]/page.tsx  (HomePage)
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useHomepage } from "./hooks/useHomepage";
import UserMenu from "@/components/ui/UserMenu";
import NotificationMenu from "@/components/ui/NotificationMenu";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  IoSearchOutline,
  IoHeartOutline,
  IoLocationOutline,
  IoStarSharp,
  IoStarOutline,
  IoChevronForwardOutline,
  IoMapOutline,
  IoTimeOutline,
  IoFlashOutline,
  IoBedOutline,
  IoPeopleOutline,
  IoCheckmarkCircleOutline,
  IoChatbubbleOutline,
  IoShieldCheckmarkOutline,
  IoArrowForwardOutline,
  IoMoonOutline,
  IoSunnyOutline,
  IoHomeOutline,
  IoMailOutline,
  IoHeartSharp,
  IoImageOutline,
  IoBoatOutline,
  IoSpeedometerOutline,
} from "react-icons/io5";
import {
  MdOutlineVilla,
  MdOutlineCastle,
  MdOutlineApartment,
  MdOutlineVerified,
} from "react-icons/md";
import { TbBuildingCommunity, TbSwimming, TbCamera } from "react-icons/tb";
import { FaHotel } from "react-icons/fa6";
import { useTheme } from "next-themes";
import { TenantHeader } from "@/components/ui/header/TenantHeader";

// ─── Design tokens ────────────────────────────────────────────────────────────
const GRAD = "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600";
const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";

// ─── Quick filters ─────────────────────────────────────────────────────────────
const QUICK_FILTERS = [
  {
    id: "villas",
    name: "Villas de luxe",
    icon: <MdOutlineVilla className="text-2xl" />,
    type: "VILLA",
  },
  {
    id: "charme",
    name: "Sud de charme",
    icon: <MdOutlineCastle className="text-2xl" />,
    type: "HOUSE",
  },
  {
    id: "bord-mer",
    name: "Bord de mer",
    icon: <IoBoatOutline className="text-2xl" />,
    type: "VILLA",
  },
  {
    id: "appart",
    name: "Appartements",
    icon: <TbBuildingCommunity className="text-2xl" />,
    type: "APARTMENT",
  },
  {
    id: "maisons",
    name: "Maisons d'hôtes",
    icon: <FaHotel className="text-2xl" />,
    type: "HOUSE",
  },
  {
    id: "piscine",
    name: "Avec piscine",
    icon: <TbSwimming className="text-2xl" />,
    type: "VILLA",
  },
];

// ─── Hero images ───────────────────────────────────────────────────────────────
const HERO_IMAGES = [
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaT7XwAF-hcanUDn9CPBqTm-McBZAvRuAXRrubpsRZdj1-FTcTbSDqHG8hqv10BxHPmTYkKktf5hBDqFZnyjRMDkqd6TCF_c6wSSWiTX8CTDI267XzfySBTrEyddy8H1N2od4155aVb1f-b9wREDz7Nq4KananDtIcbbXc-6Ax2JtVgFOUluR6OyIBPFYD2NZzNNgmfDGB5thaH2iPgNda5Ozdq_7E1Z3P6aFzwe1Qm-aysG347qU4l_-Qs_QczTsAcVkMXEqpVL5G",
    title: "Sidi Bou Saïd",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCsHm15UAFGBMD65nt7HCvZz-I2HdVEpo5ITZ6ymycXn4C_v_9--N9CN-iAQlxWtXDd13S3SJPQG6va6XNKq737OdAHhOpaEdZaZ-0Bacy6sHo58u9fwVeeSq7VTdR2DiOvviRwblVmop5z9Y58Aj64xlklQ7OgPbuKqDE77w_nqaJAggVdq2GrxxKw55fQn0UY-lClVP11zx_MjPG8uMqhEt9RJ5Ag-z8iJ7bPdzH7Ei5ddpwdkJ4EY9ACMbM3RndjRD7dNppjZ38x",
    title: "Villa Hammamet",
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCM98mCpyu-vG2JnyhR_lSUcwtFbt1ijmfp_Igx8N1Mv_Vdnj__A-TTHxhCJE4wMG10RTFRKyMllJgXQTl7AXazeBtHhCK6v_FohcHB_hRMh1BF4cfH5vCRZhifMnGTfUfAbPS9NCmicjvsU5JjUY9SJ_ikNWNCqKPDP6ZCKd54e5YmECWcxXZZ256UwwgbEX6R7nQGlCtp6Ys6kjdz6Ju4dgTEXzI3khGC98SJevhwLxjcLkHreFoQraeX6EB6Y3Byis6UoSDAx7NO",
    title: "Dar Traditionnel",
  },
];

// ─── Mock reviews (replace with real API data) ────────────────────────────────
const REVIEWS = [
  {
    id: 1,
    name: "Amira B.",
    location: "Paris, France",
    avatar: "A",
    rating: 5,
    text: "Une expérience inoubliable. La villa correspondait exactement aux photos et le propriétaire était aux petits soins. Je recommande vivement N E S T H U B  pour vos séjours en Tunisie.",
    listing: "Villa Azure, Sidi Bou Saïd",
    date: "Novembre 2024",
  },
  {
    id: 2,
    name: "Karim M.",
    location: "Montréal, Canada",
    avatar: "K",
    rating: 5,
    text: "La plateforme est intuitive et le processus de réservation très simple. Le logement était impeccable et les informations d'accès claires. Un 10/10.",
    listing: "Riad Essaada, Tunis",
    date: "Octobre 2024",
  },
  {
    id: 3,
    name: "Sofia L.",
    location: "Lyon, France",
    avatar: "S",
    rating: 4,
    text: "Très bonne expérience globale. Le dar était magnifique et bien placé. Petite suggestion : ajouter plus de photos intérieures dans les annonces.",
    listing: "Dar El Jeld, Médina",
    date: "Septembre 2024",
  },
  {
    id: 4,
    name: "Yassine T.",
    location: "Dubaï, EAU",
    avatar: "Y",
    rating: 5,
    text: "N E S T H U B  m'a permis de trouver en quelques clics la villa de mes rêves pour des vacances en famille. Service client réactif et professionnel.",
    listing: "Penthouse Vue Mer, Hammamet",
    date: "Août 2024",
  },
  {
    id: 5,
    name: "Nour K.",
    location: "Tunis, Tunisie",
    avatar: "N",
    rating: 5,
    text: "Je loue souvent via N E S T H U B  pour des séjours d'affaires. La qualité des biens et la fiabilité des hôtes sont toujours au rendez-vous.",
    listing: "Appartement Business, Lac II",
    date: "Décembre 2024",
  },
];

// ─── Star display ──────────────────────────────────────────────────────────────
function Stars({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  const sz = size === "md" ? "text-base" : "text-xs";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) =>
        s <= rating ? (
          <IoStarSharp key={s} className={`text-amber-400 ${sz}`} />
        ) : (
          <IoStarOutline
            key={s}
            className={`text-gray-300 dark:text-slate-700 ${sz}`}
          />
        ),
      )}
    </div>
  );
}

// ─── Listing card ──────────────────────────────────────────────────────────────
function ListingCard({
  listing,
  getImageUrl,
}: {
  listing: any;
  getImageUrl: (u: string) => string;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [fav, setFav] = useState(false);

  return (
    <Link
      href={`/fr/listings/${listing.id}`}
      className="group flex-shrink-0 w-72 sm:w-80"
    >
      <div className="relative overflow-hidden rounded-2xl mb-3 bg-gray-100 dark:bg-slate-800 h-72">
        {!imgErr && listing.image ? (
          <img
            src={getImageUrl(listing.image)}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}
          >
            <IoHomeOutline className="text-white text-5xl" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            setFav((p) => !p);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center hover:bg-white/90 dark:hover:bg-slate-900/90 transition-all"
        >
          {fav ? (
            <IoHeartSharp className="text-red-500 text-lg" />
          ) : (
            <IoHeartOutline className="text-white text-lg" />
          )}
        </button>
        {listing.isVerified && (
          <div className="absolute top-3 left-3 bg-emerald-500/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1">
            <IoCheckmarkCircleOutline className="text-white text-xs" />
            <span className="text-white text-[9px] font-bold uppercase">
              Vérifié
            </span>
          </div>
        )}
        <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-md">
          <IoStarSharp className="text-purple-500 text-xs" />
          <span className="text-xs font-bold text-gray-800 dark:text-white">
            Score: {listing.trustScore || 92}/100
          </span>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 mr-2">
          <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
            {listing.title}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
            <IoLocationOutline className="text-xs flex-shrink-0" />
            <span className="line-clamp-1">{listing.location}</span>
          </p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400 dark:text-gray-600">
            <span className="flex items-center gap-0.5">
              <IoBedOutline className="text-xs" />
              {listing.bedrooms || 2} ch.
            </span>
            <span className="flex items-center gap-0.5">
              <IoPeopleOutline className="text-xs" />
              {listing.maxGuests || 4} pers.
            </span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`text-xl font-extrabold ${GRAD_TEXT}`}>
            {listing.pricePerNight || 250}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase">
            TND/nuit
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Review card ───────────────────────────────────────────────────────────────
function ReviewCard({ review }: { review: (typeof REVIEWS)[0] }) {
  const colors = [
    "from-sky-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
    "from-indigo-500 to-purple-600",
  ];
  const grad = colors[review.id % colors.length];

  return (
    <div className="flex-shrink-0 w-80 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-11 h-11 rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold text-base flex-shrink-0`}
        >
          {review.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-gray-900 dark:text-white leading-none">
            {review.name}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5 flex items-center gap-1">
            <IoLocationOutline className="text-xs" />
            {review.location}
          </p>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 italic">
        "{review.text}"
      </p>
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800">
        <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 truncate">
          {review.listing}
        </p>
        <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-0.5">
          {review.date}
        </p>
      </div>
    </div>
  );
}

// ─── Main HomePage ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const t = useTranslations("HomePage");
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [heroIdx, setHeroIdx] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reviewScrollRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const {
    featuredListings = [],
    recommendations = [],
    recentlyViewed = [],
    loading,
    getImageUrl = (u: string) => u,
  } = useHomepage();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Hero carousel
  useEffect(() => {
    const t = setInterval(
      () => setHeroIdx((p) => (p + 1) % HERO_IMAGES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);

  // Auto-scroll featured listings
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || featuredListings.length === 0) return;
    let pos = 0;
    const id = setInterval(() => {
      pos += 0.6;
      if (pos >= el.scrollWidth / 2 - el.clientWidth + 8) {
        pos = 0;
        el.scrollLeft = 0;
      } else {
        el.scrollLeft = pos;
      }
    }, 30);
    return () => clearInterval(id);
  }, [featuredListings]);

  const isDark = mounted && resolvedTheme === "dark";

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950 flex items-center justify-center">
        <LoadingSpinner
          fullScreen={true}
          variant="spinner"
          size="lg"
          color="primary"
          text="Chargement de l'accueil..."
          speed="normal"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9ff] dark:bg-slate-950 text-gray-900 dark:text-gray-100 transition-colors duration-300">
     <TenantHeader></TenantHeader>

      {/* ── Hero ── */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center pt-16 overflow-hidden">
        {HERO_IMAGES.map((img, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${heroIdx === i ? "opacity-100" : "opacity-0"}`}
          >
            <img
              src={img.url}
              alt={img.title}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-[#f9f9ff] dark:to-slate-950" />

        {/* Dots */}
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all duration-300 ${heroIdx === i ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/50 hover:bg-white/80"}`}
            />
          ))}
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tighter drop-shadow-lg mb-4 leading-none">
            L'Art de Vivre
            <br />
            <span className="text-sky-300">Méditerranéen</span>
          </h1>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            Découvrez les plus belles demeures de Tunisie — villas, riads et
            appartements d'exception.
          </p>
          <Link href="/fr/search">
            <button
              className={`${GRAD} text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 mx-auto shadow-xl hover:opacity-90 active:scale-[.98] transition-all`}
            >
              <IoSearchOutline className="text-lg" />
              Rechercher un logement
            </button>
          </Link>
        </div>
      </section>

      {/* ── Quick filters ── */}
      <section className="py-10 bg-[#f9f9ff] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Explorer par catégorie
            </h2>
            <Link
              href="/fr/search"
              className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1"
            >
              Voir tout <IoChevronForwardOutline className="text-sm" />
            </Link>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-5 pb-2 min-w-max md:min-w-0 md:justify-between">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() =>
                    (window.location.href = `/fr/search?type=${f.type}`)
                  }
                  className="flex flex-col items-center gap-2 group min-w-[80px] transition-transform hover:scale-105"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                    {f.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-center leading-tight">
                    {f.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AI Recommendations ── */}
      {recommendations.length > 0 && (
        <section className="px-4 sm:px-6 mb-14">
          <div className="max-w-7xl mx-auto">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-sky-600 p-[1px] rounded-2xl shadow-xl">
              <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[inherit] flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 px-3 py-1 rounded-full text-xs font-bold mb-4">
                    <IoFlashOutline className="text-sm" />
                    Matching Intelligent IA
                  </div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-3">
                    Nous avons trouvé votre prochaine escale.
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm leading-relaxed max-w-lg">
                    Basé sur vos préférences, notre IA a sélectionné ces
                    propriétés exclusives pour votre prochain séjour en Tunisie.
                  </p>
                  <Link href="/fr/search">
                    <button className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:opacity-80 transition-opacity">
                      Découvrir ma sélection
                      <IoChevronForwardOutline className="text-sm" />
                    </button>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 flex-1 max-w-xs">
                  {recommendations.slice(0, 2).map((rec: any, i: number) => (
                    <Link
                      key={rec.id}
                      href={`/fr/listings/${rec.id}`}
                      className={i === 1 ? "mt-6" : ""}
                    >
                      <div className="relative rounded-xl overflow-hidden aspect-square">
                        <img
                          src={getImageUrl(rec.image)}
                          alt={rec.title}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "";
                          }}
                        />
                        {rec.reason && (
                          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-medium">
                            {rec.reason}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Featured listings infinite scroll ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <div className="flex justify-between items-end mb-7">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <IoHeartSharp className="text-indigo-500 text-2xl" />
              Coups de Cœur
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              La crème de l'immobilier tunisien sélectionnée par nos experts.
            </p>
          </div>
          <Link
            href="/fr/search"
            className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 hover:underline text-sm"
          >
            Voir tout <IoChevronForwardOutline />
          </Link>
        </div>
        {featuredListings.length > 0 ? (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {[...featuredListings, ...featuredListings].map(
              (l: any, i: number) => (
                <ListingCard
                  key={`${l.id}-${i}`}
                  listing={l}
                  getImageUrl={getImageUrl}
                />
              ),
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400 dark:text-slate-700">
            <IoHomeOutline className="text-5xl mx-auto mb-3" />
            <p className="text-sm">
              Aucune propriété disponible pour l'instant
            </p>
          </div>
        )}
      </section>

      {/* ── Recently viewed ── */}
      {recentlyViewed.length > 0 && (
        <section className="bg-gray-50 dark:bg-slate-900/50 py-12 mb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <IoTimeOutline className="text-indigo-500" />
                Récemment consultés
              </h2>
              <button
                onClick={() => {
                  localStorage.removeItem("recently_viewed");
                  window.location.reload();
                }}
                className="text-xs text-gray-400 dark:text-gray-600 hover:text-red-500 transition-colors"
              >
                Effacer l'historique
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              {recentlyViewed.map((l: any) => (
                <Link
                  key={l.id}
                  href={`/fr/listings/${l.id}`}
                  className="flex-shrink-0 w-60 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex gap-3 items-center hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-md transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-800 flex-shrink-0">
                    {l.image ? (
                      <img
                        src={l.image}
                        alt={l.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full ${GRAD} flex items-center justify-center opacity-60`}
                      >
                        <IoHomeOutline className="text-white text-lg" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {l.title}
                    </h4>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-0.5">
                      {l.pricePerNight} TND
                      <span className="text-[10px]"> /nuit</span>
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <IoStarSharp className="text-amber-400 text-[10px]" />
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                        {l.rating || 4.5}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Reviews section ── */}
      <section className="py-16 bg-[#f9f9ff] dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-xs font-bold mb-4">
              <IoStarSharp className="text-sm text-amber-400" />
              4.9 / 5 — Plus de 2 400 avis vérifiés
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              Ce que disent nos <span className={GRAD_TEXT}>voyageurs</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl mx-auto">
              Des milliers de séjours inoubliables partagés par notre
              communauté. La satisfaction de nos locataires est notre priorité.
            </p>
          </div>

          {/* Rating summary */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
            {[
              { label: "Qualité des logements", score: 4.9 },
              { label: "Communication", score: 4.8 },
              { label: "Rapport qualité-prix", score: 4.7 },
              { label: "Propreté", score: 4.9 },
            ].map(({ label, score }) => (
              <div key={label} className="text-center">
                <p className={`text-3xl font-extrabold ${GRAD_TEXT}`}>
                  {score}
                </p>
                <Stars rating={Math.round(score)} size="sm" />
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  {label}
                </p>
              </div>
            ))}
          </div>

          {/* Review cards horizontal scroll */}
          <div
            ref={reviewScrollRef}
            className="flex gap-5 overflow-x-auto pb-4 no-scrollbar"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {REVIEWS.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/fr/search">
              <button className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 px-5 py-2.5 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                <IoChatbubbleOutline className="text-base" />
                Voir tous les avis
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why N E S T H U B  ── */}
      <section className="py-16 bg-gray-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-2">
              L'Expérience <span className={GRAD_TEXT}>N E S T H U B </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-sm">
              Plus qu'une plateforme de location, une garantie de sérénité pour
              vos séjours d'exception en Tunisie.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: <TbCamera className="text-3xl" />,
                grad: "from-indigo-500 to-blue-500",
                title: "Visite 360° Immersive",
                desc: "Explorez chaque recoin de votre futur logement grâce à notre technologie de capture 4K.",
              },
              {
                icon: <MdOutlineVerified className="text-3xl" />,
                grad: "from-purple-500 to-violet-500",
                title: "Vérification Physique",
                desc: "100% de nos biens sont visités et certifiés par nos agents locaux. Zéro mauvaise surprise.",
              },
              {
                icon: <IoChatbubbleOutline className="text-3xl" />,
                grad: "from-sky-500 to-indigo-500",
                title: "Support 24/7 Premium",
                desc: "Une équipe dédiée vous accompagne avant, pendant et après votre séjour.",
              },
            ].map(({ icon, grad, title, desc }) => (
              <div
                key={title}
                className="text-center p-6 rounded-2xl bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 hover:shadow-lg transition-all group"
              >
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} text-white flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-md`}
                >
                  {icon}
                </div>
                <h3 className="font-extrabold text-base text-gray-900 dark:text-white mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 mb-8">
        <div
          className={`${GRAD} rounded-2xl p-8 md:p-10 text-center shadow-xl`}
        >
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
            <IoMailOutline className="text-white text-2xl" />
          </div>
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Inspiration Méditerranéenne
          </h3>
          <p className="text-white/80 mb-6 max-w-md mx-auto text-sm">
            Recevez nos sélections exclusives, offres spéciales et conseils de
            voyage.
          </p>
          {subscribed ? (
            <div className="flex items-center justify-center gap-2 text-white font-bold">
              <IoCheckmarkCircleOutline className="text-xl" />
              Merci ! Vous êtes abonné.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Votre adresse email"
                className="flex-1 px-4 py-3 rounded-xl text-gray-900 border-none outline-none text-sm focus:ring-2 focus:ring-white/50"
              />
              <button
                onClick={() => {
                  if (email) setSubscribed(true);
                }}
                className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors whitespace-nowrap flex items-center gap-2"
              >
                <IoMailOutline />
                S'abonner
              </button>
            </div>
          )}
          <p className="text-white/50 text-xs mt-3">
            Pas de spam. Désabonnement facile.
          </p>
        </div>
      </section>

      

      
    </div>
  );
}
