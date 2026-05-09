
"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BedDouble,
  Building2,
  Camera,
  Castle,
  CheckCircle2,
  ChevronRight,
  Compass,
  Gem,
  Heart,
  Home,
  Hotel,
  MapPin,
  Moon,
  Palmtree,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  Users,
  Waves,
} from "lucide-react";

type HeroSlide = {
  image: string;
  title: string;
  subtitle: string;
  caption: string;
};

type Filter = {
  id: string;
  label: string;
  type: "ALL" | "VILLA" | "HOUSE" | "APARTMENT";
  icon: React.ReactNode;
};

type Listing = {
  id: number;
  title: string;
  type: "VILLA" | "HOUSE" | "APARTMENT";
  location: string;
  region: string;
  price: number;
  guests: number;
  bedrooms: number;
  rating: number;
  score: number;
  image: string;
  badge: string;
  story: string;
  loved: boolean;
};

type Review = {
  id: number;
  name: string;
  city: string;
  avatar: string;
  rating: number;
  quote: string;
  stay: string;
};

const GRAD_TEXT =
  "bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent";

const HERO_SLIDES: HeroSlide[] = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaT7XwAF-hcanUDn9CPBqTm-McBZAvRuAXRrubpsRZdj1-FTcTbSDqHG8hqv10BxHPmTYkKktf5hBDqFZnyjRMDkqd6TCF_c6wSSWiTX8CTDI267XzfySBTrEyddy8H1N2od4155aVb1f-b9wREDz7Nq4KananDtIcbbXc-6Ax2JtVgFOUluR6OyIBPFYD2NZzNNgmfDGB5thaH2iPgNda5Ozdq_7E1Z3P6aFzwe1Qm-aysG347qU4l_-Qs_QczTsAcVkMXEqpVL5G",
    title: "L'Art de vivre méditerranéen, réinventé.",
    subtitle:
      "Des villas signatures, des dars confidentiels et des séjours qui semblent sortis d’un magazine.",
    caption: "Sidi Bou Saïd • Hammamet • Djerba • Carthage",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsHm15UAFGBMD65nt7HCvZz-I2HdVEpo5ITZ6ymycXn4C_v_9--N9CN-iAQlxWtXDd13S3SJPQG6va6XNKq737OdAHhOpaEdZaZ-0Bacy6sHo58u9fwVeeSq7VTdR2DiOvviRwblVmop5z9Y58Aj64xlklQ7OgPbuKqDE77w_nqaJAggVdq2GrxxKw55fQn0UY-lClVP11zx_MjPG8uMqhEt9RJ5Ag-z8iJ7bPdzH7Ei5ddpwdkJ4EY9ACMbM3RndjRD7dNppjZ38x",
    title: "Des propriétés qui ne se visitent pas. Elles se ressentent.",
    subtitle:
      "Chaque annonce est pensée comme une histoire visuelle : lumière, matière, silence, mer, architecture.",
    caption: "Curated stays for modern travelers",
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCM98mCpyu-vG2JnyhR_lSUcwtFbt1ijmfp_Igx8N1Mv_Vdnj__A-TTHxhCJE4wMG10RTFRKyMllJgXQTl7AXazeBtHhCK6v_FohcHB_hRMh1BF4cfH5vCRZhifMnGTfUfAbPS9NCmicjvsU5JjUY9SJ_ikNWNCqKPDP6ZCKd54e5YmECWcxXZZ256UwwgbEX6R7nQGlCtp6Ys6kjdz6Ju4dgTEXzI3khGC98SJevhwLxjcLkHreFoQraeX6EB6Y3Byis6UoSDAx7NO",
    title: "La Tunisie la plus désirable, à portée d’un clic.",
    subtitle:
      "Des expériences premium pour les voyageurs exigeants et les propriétaires qui veulent rayonner.",
    caption: "Premium homes • Trusted hosts • Concierge mindset",
  },
];

const QUICK_FILTERS: Filter[] = [
  { id: "all", label: "Tout explorer", type: "ALL", icon: <Compass className="h-5 w-5" /> },
  { id: "villa", label: "Villas signature", type: "VILLA", icon: <Home className="h-5 w-5" /> },
  { id: "dar", label: "Dars de charme", type: "HOUSE", icon: <Castle className="h-5 w-5" /> },
  { id: "sea", label: "Bord de mer", type: "VILLA", icon: <Waves className="h-5 w-5" /> },
  { id: "apartment", label: "Appartements design", type: "APARTMENT", icon: <Building2 className="h-5 w-5" /> },
  { id: "resort", label: "Suites & resorts", type: "HOUSE", icon: <Hotel className="h-5 w-5" /> },
];

const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Villa Azure Horizon",
    type: "VILLA",
    location: "Sidi Bou Saïd",
    region: "Tunis",
    price: 980,
    guests: 6,
    bedrooms: 3,
    rating: 4.9,
    score: 97,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCaT7XwAF-hcanUDn9CPBqTm-McBZAvRuAXRrubpsRZdj1-FTcTbSDqHG8hqv10BxHPmTYkKktf5hBDqFZnyjRMDkqd6TCF_c6wSSWiTX8CTDI267XzfySBTrEyddy8H1N2od4155aVb1f-b9wREDz7Nq4KananDtIcbbXc-6Ax2JtVgFOUluR6OyIBPFYD2NZzNNgmfDGB5thaH2iPgNda5Ozdq_7E1Z3P6aFzwe1Qm-aysG347qU4l_-Qs_QczTsAcVkMXEqpVL5G",
    badge: "Édition Signature",
    story: "Une villa lumineuse, sculptée entre ciel cobalt et terrasses blanches.",
    loved: true,
  },
  {
    id: 2,
    title: "Dar El Rêve",
    type: "HOUSE",
    location: "Médina de Tunis",
    region: "Tunis",
    price: 540,
    guests: 4,
    bedrooms: 2,
    rating: 4.8,
    score: 93,
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    badge: "Patrimoine vivant",
    story: "Patio central, zelliges, lumière douce : l’âme d’un dar contemporain.",
    loved: false,
  },
  {
    id: 3,
    title: "Penthouse Marina Vista",
    type: "APARTMENT",
    location: "Lac II",
    region: "Tunis",
    price: 420,
    guests: 3,
    bedrooms: 2,
    rating: 4.7,
    score: 91,
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80",
    badge: "Business & style",
    story: "Un refuge urbain ultramoderne avec terrasse panoramique et design minimal.",
    loved: false,
  },
  {
    id: 4,
    title: "Villa Palm Hammamet",
    type: "VILLA",
    location: "Hammamet Nord",
    region: "Nabeul",
    price: 1250,
    guests: 8,
    bedrooms: 4,
    rating: 5,
    score: 99,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCsHm15UAFGBMD65nt7HCvZz-I2HdVEpo5ITZ6ymycXn4C_v_9--N9CN-iAQlxWtXDd13S3SJPQG6va6XNKq737OdAHhOpaEdZaZ-0Bacy6sHo58u9fwVeeSq7VTdR2DiOvviRwblVmop5z9Y58Aj64xlklQ7OgPbuKqDE77w_nqaJAggVdq2GrxxKw55fQn0UY-lClVP11zx_MjPG8uMqhEt9RJ5Ag-z8iJ7bPdzH7Ei5ddpwdkJ4EY9ACMbM3RndjRD7dNppjZ38x",
    badge: "Piscine iconique",
    story: "L’adresse parfaite pour des vacances solaires, élégantes et photogéniques.",
    loved: true,
  },
  {
    id: 5,
    title: "Loft Marina Light",
    type: "APARTMENT",
    location: "La Marsa",
    region: "Tunis",
    price: 360,
    guests: 2,
    bedrooms: 1,
    rating: 4.6,
    score: 89,
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80",
    badge: "City escape",
    story: "Un loft délicat et lumineux pour un séjour à deux entre plage et cafés.",
    loved: false,
  },
  {
    id: 6,
    title: "Maison Dunes & Silence",
    type: "HOUSE",
    location: "Tozeur",
    region: "Sud tunisien",
    price: 690,
    guests: 5,
    bedrooms: 3,
    rating: 4.9,
    score: 95,
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    badge: "Évasion rare",
    story: "Des volumes minéraux, une lumière ocre, et la sensation d’un désert luxueux.",
    loved: false,
  },
];

const REVIEWS: Review[] = [
  {
    id: 1,
    name: "Amira B.",
    city: "Paris",
    avatar: "A",
    rating: 5,
    quote:
      "Enfin une plateforme qui donne envie de réserver dès la première seconde. L'annonce, le service, l'esthétique : tout est au niveau.",
    stay: "Villa Azure Horizon",
  },
  {
    id: 2,
    name: "Karim M.",
    city: "Montréal",
    avatar: "K",
    rating: 5,
    quote:
      "L’expérience est premium sans être compliquée. J’ai trouvé un bien exceptionnel en quelques clics seulement.",
    stay: "Villa Palm Hammamet",
  },
  {
    id: 3,
    name: "Sofia L.",
    city: "Lyon",
    avatar: "S",
    rating: 4,
    quote:
      "Très belle sélection. On sent une vraie direction artistique et une envie de sublimer la Tunisie.",
    stay: "Dar El Rêve",
  },
  {
    id: 4,
    name: "Yassine T.",
    city: "Dubaï",
    avatar: "Y",
    rating: 5,
    quote:
      "C’est plus qu’un site de location — c’est une vitrine lifestyle. Exactement ce qu’il fallait pour ce marché.",
    stay: "Maison Dunes & Silence",
  },
];

const FOOTER_LINKS = ["Privacy Policy", "Terms", "Support", "Press"];

const DESTINATION_SPOTLIGHTS = [
  {
    title: "Sidi Bou Saïd",
    mood: "Blue & white iconography",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1400&q=80",
    blurb: "Cliffside views, artful homes, iconic terraces and the most photogenic arrivals on the coast.",
  },
  {
    title: "Hammamet",
    mood: "Resort elegance",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    blurb: "Palm-lined villas, long golden afternoons and polished hospitality built for slow luxury.",
  },
  {
    title: "Djerba",
    mood: "Island serenity",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    blurb: "Sun-bleached textures, breezy courtyards and a softer rhythm that lingers long after checkout.",
  },
  {
    title: "Tozeur",
    mood: "Desert modernism",
    image:
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80",
    blurb: "Architectural retreats where silence, mineral tones and cinematic landscapes redefine escape.",
  },
];

const TRUST_BELT = [
  { label: "Verified premium homes", icon: BadgeCheck },
  { label: "Cinematic visual storytelling", icon: Camera },
  { label: "Local concierge mindset", icon: Gem },
  { label: "Seaside & heritage destinations", icon: Waves },
  { label: "Trusted hosts only", icon: ShieldCheck },
  { label: "Editorial collections", icon: Sparkles },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${i < rating ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`}
        />
      ))}
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: React.ReactNode;
  text: string;
}) {
  return (
    <div className="max-w-2xl">
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-indigo-600 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-slate-900/70 dark:text-indigo-300">
        <Sparkles className="h-3.5 w-3.5" />
        {eyebrow}
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400 md:text-base">
        {text}
      </p>
    </div>
  );
}

function ListingCard({
  listing,
  onToggle,
}: {
  listing: Listing;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_28px_80px_rgba(15,23,42,0.14)] dark:border-white/10 dark:bg-slate-900/75">
      <div className="relative h-72 overflow-hidden">
        <img
          src={listing.image}
          alt={listing.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />

        <button
          type="button"
          onClick={() => onToggle(listing.id)}
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg backdrop-blur-md transition-all hover:scale-105 dark:bg-slate-900/80 dark:text-white"
        >
          <Heart className={`h-5 w-5 ${listing.loved ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.16em] text-slate-800 shadow-md backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
          {listing.badge}
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
              <BadgeCheck className="h-3 w-3" /> Score {listing.score}/100
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">{listing.title}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/80">
              <MapPin className="h-4 w-4" /> {listing.location}
            </p>
          </div>
          <div className="rounded-2xl bg-white/90 px-4 py-3 text-right shadow-lg backdrop-blur-md dark:bg-slate-900/90">
            <p className="text-xl font-extrabold text-slate-900 dark:text-white">{listing.price}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">TND / nuit</p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {listing.bedrooms}</span>
            <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> {listing.guests}</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {listing.rating}
          </div>
        </div>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{listing.story}</p>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const gradients = [
    "from-sky-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-amber-500 to-orange-500",
  ];
  const grad = gradients[review.id % gradients.length];

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75">
      <div className="mb-4 flex items-start gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-lg font-bold text-white`}>
          {review.avatar}
        </div>
        <div className="flex-1">
          <p className="font-bold text-slate-900 dark:text-white">{review.name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{review.city}</p>
        </div>
        <Stars rating={review.rating} />
      </div>
      <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">“{review.quote}”</p>
      <div className="mt-5 border-t border-slate-100 pt-3 text-xs font-semibold text-indigo-600 dark:border-slate-800 dark:text-indigo-300">
        {review.stay}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [isDark, setIsDark] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [destination, setDestination] = useState("Sidi Bou Saïd");
  const [guests, setGuests] = useState(4);
  const [propertyType, setPropertyType] = useState<Filter["type"]>("ALL");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [listings, setListings] = useState(LISTINGS);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => setIsDark(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const filterMatch =
        activeFilter === "all"
          ? true
          : listing.type === QUICK_FILTERS.find((f) => f.id === activeFilter)?.type;

      const typeMatch = propertyType === "ALL" ? true : listing.type === propertyType;
      const destinationMatch =
        listing.location.toLowerCase().includes(destination.toLowerCase()) ||
        listing.region.toLowerCase().includes(destination.toLowerCase());
      const guestMatch = listing.guests >= guests;

      return filterMatch && typeMatch && destinationMatch && guestMatch;
    });
  }, [activeFilter, destination, guests, listings, propertyType]);

  const editorialListings = filteredListings.length > 0 ? filteredListings : listings;
  const featuredPrimary = editorialListings[0];
  const featuredSecondary = editorialListings.slice(1, 4);

  const stats = [
    { label: "biens premium", value: "1 200+" },
    { label: "hôtes vérifiés", value: "480" },
    { label: "voyageurs satisfaits", value: "24k" },
    { label: "temps moyen de réservation", value: "3 min" },
  ];

  const runSearch = () => {
    setToast(`${filteredListings.length || listings.length} propriété(s) correspondent à votre recherche.`);
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleListingLike = (id: number) => {
    setListings((prev) =>
      prev.map((listing) =>
        listing.id === id ? { ...listing, loved: !listing.loved } : listing,
      ),
    );
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="min-h-screen bg-[#f9f9ff] text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {toast && (
          <div className="fixed top-6 left-1/2 z-[80] -translate-x-1/2 rounded-full bg-slate-900/90 px-5 py-3 text-sm font-semibold text-white shadow-xl backdrop-blur-xl dark:bg-white/90 dark:text-slate-900">
            {toast}
          </div>
        )}

        <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/65">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <button className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 shadow-lg shadow-blue-500/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-sky-500 dark:text-sky-400">NESTHUB</p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Mediterranean Luxury Stays</p>
              </div>
            </button>

            <nav className="hidden items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400 md:flex">
              {[
                "Destinations",
                "Collections",
                "For Hosts",
                "Journal",
              ].map((item) => (
                <button key={item} className="transition-colors hover:text-slate-900 dark:hover:text-white">
                  {item}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:scale-105 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
              <button className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-gradient-to-r hover:from-sky-500 hover:via-indigo-500 hover:to-purple-600 dark:bg-white dark:text-slate-900">
                Commencer
              </button>
            </div>
          </div>
        </header>

        <section className="relative isolate overflow-hidden">
          <div className="absolute inset-0">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-opacity duration-1000 ${heroIndex === index ? "opacity-100" : "opacity-0"}`}
              >
                <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/75 via-slate-950/35 to-indigo-950/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.28),transparent_26%),radial-gradient(circle_at_center,rgba(56,189,248,0.18),transparent_34%)]" />
          <div className="absolute left-[-10%] top-20 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl animate-pulse-soft" />
          <div className="absolute right-[8%] top-[20%] h-56 w-56 rounded-full bg-purple-500/20 blur-3xl animate-pulse-soft" />

          <div className="relative mx-auto flex min-h-[92vh] max-w-7xl items-center px-4 py-16 sm:px-6">
            <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="max-w-3xl pt-10 lg:pt-0">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5" />
                  The face of Tunisia's premium hospitality
                </div>

                <h1 className="text-shadow-hero text-5xl font-extrabold tracking-tight text-white md:text-7xl">
                  Extraordinary stays for a <span className="text-sky-300">Mediterranean generation.</span>
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
                  NestHub transforms property search into desire: cinematic villas, editorial listings, trusted hosts and a digital experience designed to feel unforgettable from the first scroll.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={runSearch}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <Search className="h-4 w-4" />
                    Find your stay
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/15">
                    <Camera className="h-4 w-4" />
                    Explore visual collections
                  </button>
                </div>

                <div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md transition-transform hover:-translate-y-1"
                    >
                      <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/65">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-end lg:justify-end">
                <div className="relative w-full max-w-xl">
                  <div className="animate-float-slow absolute -left-12 top-12 hidden w-44 rounded-[26px] border border-white/20 bg-white/14 p-3 shadow-[0_25px_80px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:block">
                    <div className="rounded-[22px] bg-white/90 p-4 dark:bg-slate-950/85">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-500">Signature pick</span>
                        <BadgeCheck className="h-4 w-4 text-emerald-500" />
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Villa Palm Hammamet</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">8 invités • plage privée • sunset deck</p>
                      <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        4.98 / 5
                      </div>
                    </div>
                  </div>

                  <div className="animate-float-slower absolute -right-8 bottom-14 hidden w-52 rounded-[26px] border border-white/20 bg-slate-950/70 p-3 text-white shadow-[0_25px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl lg:block">
                    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">Today’s mood</p>
                      <p className="mt-2 text-lg font-bold">Sea, silence, stone.</p>
                      <p className="mt-1 text-xs leading-relaxed text-white/70">
                        Travelers don’t search for rooms. They search for a feeling. Build the homepage around that feeling.
                      </p>
                    </div>
                  </div>

                  <div className="w-full overflow-hidden rounded-[32px] border border-white/20 bg-white/14 p-3 shadow-[0_30px_120px_rgba(0,0,0,0.25)] backdrop-blur-2xl">
                    <div className="rounded-[28px] bg-white/90 p-6 dark:bg-slate-950/85">
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-500">Smart discovery</p>
                          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Design your perfect arrival</h2>
                        </div>
                        <div className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          AI assisted
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Destination</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              value={destination}
                              onChange={(e) => setDestination(e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                              placeholder="Sidi Bou Saïd, Hammamet, Djerba..."
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Type de séjour</label>
                          <select
                            value={propertyType}
                            onChange={(e) => setPropertyType(e.target.value as Filter["type"])}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                          >
                            <option value="ALL">Tout explorer</option>
                            <option value="VILLA">Villa</option>
                            <option value="HOUSE">Dar / Maison</option>
                            <option value="APARTMENT">Appartement</option>
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-500">Invités</label>
                          <div className="relative">
                            <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={guests}
                              onChange={(e) => setGuests(Number(e.target.value) || 1)}
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-sky-400 focus:ring-2 focus:ring-sky-400/15 dark:border-white/10 dark:bg-white/5 dark:text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-3">
                        {[
                          { label: "Instant booking", icon: CheckCircle2 },
                          { label: "Verified hosts", icon: ShieldCheck },
                          { label: "Editorial picks", icon: Gem },
                        ].map(({ label, icon: Icon }) => (
                          <div key={label} className="rounded-2xl bg-slate-50 p-3 text-center dark:bg-white/5">
                            <Icon className="mx-auto h-4 w-4 text-indigo-500" />
                            <p className="mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">{label}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={runSearch}
                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01]"
                      >
                        <Search className="h-4 w-4" />
                        Reveal extraordinary homes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto -mt-8 max-w-7xl px-4 pb-6 sm:px-6">
            <div className="overflow-hidden rounded-full border border-white/15 bg-white/10 py-3 backdrop-blur-xl">
              <div className="marquee-track flex items-center gap-10 px-6">
                {[...TRUST_BELT, ...TRUST_BELT].map(({ label, icon: Icon }, index) => (
                  <div key={`${label}-${index}`} className="flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Icon className="h-4 w-4 text-sky-300" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-8 sm:px-6">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: ShieldCheck,
                  title: "Every listing is staged to inspire trust",
                  text: "Verified visuals, premium curation and consistent storytelling across every property.",
                },
                {
                  icon: Camera,
                  title: "An editorial standard, not just a marketplace",
                  text: "Photography, copy and discovery all feel like a luxury magazine come to life.",
                },
                {
                  icon: Compass,
                  title: "Built to convert curiosity into booking desire",
                  text: "A homepage designed as the face of the platform — cinematic, confident and unforgettable.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div
                  key={title}
                  className="rounded-[28px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-all hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Quick collections"
              title={<>Browse with <span className={GRAD_TEXT}>desire, not filters.</span></>}
              text="We transformed property categories into collectible moods — so every click feels like a new chapter in a Mediterranean story."
            />
            <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition-all hover:border-indigo-200 hover:text-indigo-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:text-indigo-300">
              See all collections <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {QUICK_FILTERS.map((filter) => {
              const active = activeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`group rounded-[28px] border px-5 py-6 text-left transition-all ${
                    active
                      ? "border-transparent bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/20"
                      : "border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:border-indigo-100 dark:border-white/10 dark:bg-slate-900/75"
                  }`}
                >
                  <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-white/15" : "bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200"}`}>
                    {filter.icon}
                  </div>
                  <h3 className={`text-sm font-bold ${active ? "text-white" : "text-slate-900 dark:text-white"}`}>
                    {filter.label}
                  </h3>
                  <p className={`mt-2 text-xs ${active ? "text-white/80" : "text-slate-500 dark:text-slate-400"}`}>
                    {filter.id === "all"
                      ? "L’ensemble de la collection NestHub"
                      : "Une sélection au style très affirmé"}
                  </p>
                </button>
              );
            })}
          </div>
        </section>

        <section id="featured" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Editorial picks"
              title={<>The homepage that makes people <span className={GRAD_TEXT}>want to stay longer.</span></>}
              text="This is not a grid of listings. It’s a visual argument for taste, confidence and premium Tunisian hospitality."
            />
            <div className="rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow-sm dark:border-indigo-500/20 dark:bg-slate-900/75 dark:text-indigo-300">
              {editorialListings.length} résultats inspirants
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            {featuredPrimary && (
              <div className="lg:col-span-7">
                <div className="group overflow-hidden rounded-[36px] border border-white/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                  <div className="relative h-[520px] overflow-hidden">
                    <img
                      src={featuredPrimary.image}
                      alt={featuredPrimary.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/10 to-transparent" />
                    <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
                      Hero collection
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleListingLike(featuredPrimary.id)}
                      className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-white"
                    >
                      <Heart className={`h-5 w-5 ${featuredPrimary.loved ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                    <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                      <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="rounded-full bg-emerald-500/90 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                          Trust score {featuredPrimary.score}/100
                        </div>
                        <div className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                          {featuredPrimary.type}
                        </div>
                      </div>
                      <h3 className="max-w-2xl text-4xl font-extrabold tracking-tight text-white">
                        {featuredPrimary.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                        {featuredPrimary.story}
                      </p>
                      <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-white/85">
                        <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {featuredPrimary.location}</span>
                        <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {featuredPrimary.guests} invités</span>
                        <span className="inline-flex items-center gap-2"><BedDouble className="h-4 w-4" /> {featuredPrimary.bedrooms} chambres</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-5 lg:col-span-5">
              {featuredSecondary.map((listing) => (
                <div
                  key={listing.id}
                  className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80"
                >
                  <div className="grid md:grid-cols-[220px_1fr]">
                    <div className="relative h-56 overflow-hidden md:h-full">
                      <img src={listing.image} alt={listing.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent" />
                    </div>
                    <div className="p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="rounded-full bg-sky-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {listing.badge}
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleListingLike(listing.id)}
                          className="text-slate-400 transition-colors hover:text-rose-500"
                        >
                          <Heart className={`h-5 w-5 ${listing.loved ? "fill-rose-500 text-rose-500" : ""}`} />
                        </button>
                      </div>
                      <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{listing.title}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{listing.story}</p>
                      <div className="mt-5 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{listing.price} TND</p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">per night</p>
                        </div>
                        <div className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {listing.rating}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {editorialListings.slice(0, 3).map((listing) => (
              <ListingCard key={`grid-${listing.id}`} listing={listing} onToggle={toggleListingLike} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <SectionHeading
              eyebrow="Signature destinations"
              title={<>A homepage should feel like a <span className={GRAD_TEXT}>travel editorial.</span></>}
              text="So instead of stacking generic cards, we spotlight places like moods: sea, stone, palm, light and architecture — each one with its own emotional identity."
            />
            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-200">
              4 curated destination worlds
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-[36px] border border-white/70 bg-white/85 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 lg:col-span-5">
              <div className="relative h-full min-h-[540px] overflow-hidden rounded-[30px]">
                <img
                  src={DESTINATION_SPOTLIGHTS[0].image}
                  alt={DESTINATION_SPOTLIGHTS[0].title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
                <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
                  Editorial spotlight
                </div>
                <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
                    {DESTINATION_SPOTLIGHTS[0].mood}
                  </p>
                  <h3 className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                    {DESTINATION_SPOTLIGHTS[0].title}
                  </h3>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                    {DESTINATION_SPOTLIGHTS[0].blurb}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:col-span-7 md:grid-cols-2">
              {DESTINATION_SPOTLIGHTS.slice(1).map((item, index) => (
                <div
                  key={item.title}
                  className={`group overflow-hidden rounded-[32px] border border-white/70 bg-white/85 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/80 ${
                    index === 1 ? "md:translate-y-10" : ""
                  }`}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">
                        {item.mood}
                      </p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">{item.title}</h3>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{item.blurb}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {[
              { value: "72h", label: "editorial refresh cycle" },
              { value: "98%", label: "visual consistency score" },
              { value: "4x", label: "stronger hero impact" },
              { value: "∞", label: "brand memorability ambition" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/70 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-5 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]"
              >
                <p className="text-3xl font-extrabold tracking-tight">{item.value}</p>
                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/60">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 lg:col-span-5">
              <SectionHeading
                eyebrow="Platform DNA"
                title={<>Not just more listings. <span className={GRAD_TEXT}>A stronger point of view.</span></>}
                text="Every block on this homepage is designed to sell aspiration, trust and distinction — the three things a premium marketplace needs before a single click on search."
              />
              <div className="mt-8 space-y-4">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Verified by design",
                    text: "Profiles, stays and trust signals are embedded directly into the discovery flow.",
                  },
                  {
                    icon: Gem,
                    title: "Luxury without visual noise",
                    text: "A sharp editorial system that lets each image breathe and each listing feel desirable.",
                  },
                  {
                    icon: Palmtree,
                    title: "Built for destination emotion",
                    text: "More than utility: the platform should feel like arrival before booking ever happens.",
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-5 lg:col-span-7 md:grid-cols-2">
              {[
                {
                  title: "A homepage that feels like a cover story",
                  text: "Hero imagery, dramatic contrast, glass interfaces and layered motion cues make the platform feel premium from the first fold.",
                  icon: Camera,
                },
                {
                  title: "Property cards that sell desire",
                  text: "Large imagery, trust score, strong pricing hierarchy and human storytelling all work together to increase emotional engagement.",
                  icon: Home,
                },
                {
                  title: "Social proof with taste",
                  text: "Reviews, ratings and verification are surfaced in ways that feel elegant instead of transactional.",
                  icon: CheckCircle2,
                },
                {
                  title: "A visual system ready to scale",
                  text: "Collections, filters and featured editors picks can all evolve without losing cohesion or impact.",
                  icon: Compass,
                },
              ].map(({ title, text, icon: Icon }, index) => (
                <div
                  key={title}
                  className={`rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.07)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 ${index % 2 === 1 ? "md:translate-y-8" : ""}`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50/80 py-20 dark:bg-slate-900/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
              <SectionHeading
                eyebrow="Verified reviews"
                title={<>People remember how a platform <span className={GRAD_TEXT}>made them feel.</span></>}
                text="So the testimonials shouldn’t just reassure — they should amplify the brand narrative of confidence, beauty and simplicity."
              />
              <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                4.9 / 5 • 2 400+ verified reviews
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80">
                <p className="text-6xl font-extrabold leading-none text-sky-500/20">“</p>
                <p className="-mt-6 text-2xl font-semibold leading-relaxed text-slate-900 dark:text-white">
                  NestHub doesn’t look like a rental platform. It feels like the front page of a destination brand — and that changes everything.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-600 text-lg font-bold text-white">
                    W
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">Walid Ben Amor</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Founder’s editorial note</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-1">
                {REVIEWS.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-[36px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-[1px] shadow-[0_30px_120px_rgba(49,46,129,0.28)]">
            <div className="grid gap-8 rounded-[inherit] bg-slate-950/95 p-8 text-white md:grid-cols-[1.15fr_0.85fr] md:p-10">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
                  <Send className="h-3.5 w-3.5" /> Newsletter privée
                </div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-5xl">
                  Keep the platform unforgettable — <span className="text-sky-300">even after they leave.</span>
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-base">
                  Bring travelers back with insider drops, private collections, seasonal edits and property stories that feel collectible. A premium homepage deserves premium follow-up.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {[
                    "Curated launches",
                    "Private host selections",
                    "Editorial travel notes",
                  ].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm font-semibold text-white/90">
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
                <p className="text-sm font-bold uppercase tracking-[0.24em] text-sky-300">Get inspired</p>
                <p className="mt-2 text-2xl font-bold">Receive the most beautiful stays before everyone else.</p>
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-white/60">Adresse email</label>
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                      className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-sky-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!newsletterEmail.trim()) return;
                      setSubscribed(true);
                      setToast("Merci — vous êtes maintenant abonné à l’inspiration NestHub.");
                    }}
                    className="w-full rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.01]"
                  >
                    {subscribed ? "Déjà abonné" : "S'abonner à la sélection"}
                  </button>
                  <p className="text-xs leading-relaxed text-white/45">
                    Zéro spam. Seulement des adresses extraordinaires, des histoires visuelles et des opportunités premium.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-slate-200 bg-white/70 py-10 backdrop-blur-md dark:border-white/10 dark:bg-slate-950/70">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">NESTHUB</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">The face of extraordinary stays in Tunisia.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {FOOTER_LINKS.map((link) => (
                <button key={link} className="transition-colors hover:text-slate-700 dark:hover:text-white">
                  {link}
                </button>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
