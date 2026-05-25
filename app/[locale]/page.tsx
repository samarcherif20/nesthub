"use client";
import { useEffect, useState, useRef } from "react";
import { useUser, SignUpButton, SignInButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { GrMapLocation } from "react-icons/gr";
import { TbFilterSearch, TbRocket } from "react-icons/tb";
import { MdOutlineSmartToy } from "react-icons/md";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Clock,
  Compass,
  CreditCard,
  FileText,
  Gem,
  Headphones,
  Home,
  Layout,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Rocket as RocketIcon,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
  Search,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import ThemeSwitcher from "@/components/ui/themeSwitcher";
import LanguageSelector from "@/components/ui/LanguageSelector";

// ============================================================
// COMPOSANTS RÉUTILISABLES
// ============================================================

function FeaturedPropertyCard({
  image,
  title,
  location,
  price,
  type,
  onClick,
}: any) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-slate-800 dark:text-white">
          {price} TND
        </div>
        <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-[10px] font-semibold text-white">
          {type}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {location}
        </p>
      </div>
    </div>
  );
}

function Counter({
  target,
  suffix,
  label,
}: {
  target: number;
  suffix: string;
  label: string;
}) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const duration = 2000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [target, hasStarted]);

  const displayValue = target >= 1000 ? (count / 1000).toFixed(0) : count;
  const displaySuffix = target >= 1000 ? "k" : suffix;

  return (
    <div
      ref={ref}
      className="rounded-2xl bg-white/10 dark:bg-slate-900/50 backdrop-blur-md p-4 text-center border border-white/20 dark:border-white/10 transition-all hover:scale-105 hover:bg-white/20 dark:hover:bg-slate-800/70"
    >
      <p className="text-3xl font-extrabold text-white dark:text-white">
        {hasStarted ? (target >= 1000 ? displayValue : count) : 0}
        {displaySuffix}
      </p>
      <p className="mt-1 text-xs uppercase tracking-wide text-white/80 dark:text-white/70">
        {label}
      </p>
    </div>
  );
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function HomePage() {
  // Ajoute ces states avec les autres useState
const [formData, setFormData] = useState({
  fullName: "",
  email: "",
  phone: "",
  message: "",
});
const [errors, setErrors] = useState<{
  fullName?: string;
  email?: string;
  phone?: string;
  message?: string;
}>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

// Ajoute ces fonctions
const showToast = (type: "success" | "error", message: string) => {
  setToast({ type, message });
  setTimeout(() => setToast(null), 5000);
};

const validateForm = (): boolean => {
  const newErrors: typeof errors = {};
  let isValid = true;

  if (!formData.fullName.trim()) {
    newErrors.fullName = "Le nom complet est requis";
    isValid = false;
  } else if (formData.fullName.length < 2) {
    newErrors.fullName = "Le nom doit contenir au moins 2 caractères";
    isValid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!formData.email.trim()) {
    newErrors.email = "L'email est requis";
    isValid = false;
  } else if (!emailRegex.test(formData.email)) {
    newErrors.email = "Veuillez entrer un email valide";
    isValid = false;
  }

  if (formData.phone && !/^[0-9+\-\s]{8,}$/.test(formData.phone)) {
    newErrors.phone = "Veuillez entrer un numéro valide";
    isValid = false;
  }

  if (!formData.message.trim()) {
    newErrors.message = "Le message est requis";
    isValid = false;
  } else if (formData.message.length < 10) {
    newErrors.message = "Le message doit contenir au moins 10 caractères";
    isValid = false;
  }

  setErrors(newErrors);
  return isValid;
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
  if (errors[name as keyof typeof errors]) {
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  }
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    showToast("error", "Veuillez corriger les erreurs dans le formulaire");
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      showToast("success", " Message envoyé avec succès ! Nous vous répondrons rapidement.");
      setFormData({ fullName: "", email: "", phone: "", message: "" });
      setErrors({});
    } else {
      showToast("error", data.error || "Une erreur est survenue");
    }
  } catch (error) {
    showToast("error", "Erreur réseau. Veuillez réessayer.");
  } finally {
    setIsSubmitting(false);
  }
};
  const t = useTranslations();
  const [heroIndex, setHeroIndex] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const { isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "fr";
  const heroSectionRef = useRef<HTMLElement>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  // ====== DONNÉES STATIQUES ======

  const featuredProperties = [
    {
      id: 1,
      image:
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop",
      title: "Villa Azure",
      location: "Sidi Bou Saïd",
      price: "980",
      type: "VILLA",
    },
    {
      id: 2,
      image:
        "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&h=400&fit=crop",
      title: "Dar El Rêve",
      location: "Médina de Tunis",
      price: "540",
      type: "DAR",
    },
    {
      id: 3,
      image:
        "https://images.unsplash.com/photo-1494526585095-c41746248156?w=600&h=400&fit=crop",
      title: "Penthouse Marina",
      location: "Lac II",
      price: "420",
      type: "APPARTEMENT",
    },
    {
      id: 4,
      image:
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop",
      title: "Villa Palm",
      location: "Hammamet",
      price: "1250",
      type: "VILLA",
    },
    {
      id: 5,
      image:
        "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600&h=400&fit=crop",
      title: "Loft Marina",
      location: "La Marsa",
      price: "360",
      type: "LOFT",
    },
  ];

  const servicesData = [
    {
      icon: ShieldCheck,
      title: t("services.verification.title"),
      description: t("services.verification.desc"),
      badge: t("services.verification.badge"),
    },
    {
      icon: MessageSquare,
      title: t("services.detection.title"),
      description: t("services.detection.desc"),
      badge: t("services.detection.badge"),
    },
    {
      icon: CreditCard,
      title: t("services.payment.title"),
      description: t("services.payment.desc"),
      badge: t("services.payment.badge"),
    },
    {
      icon: Sparkles,
      title: t("services.ai.title"),
      description: t("services.ai.desc"),
      badge: t("services.ai.badge"),
    },
    {
      icon: Star,
      title: t("services.reviews.title"),
      description: t("services.reviews.desc"),
      badge: t("services.reviews.badge"),
    },
    {
      icon: Layout,
      title: t("services.dashboard.title"),
      description: t("services.dashboard.desc"),
      badge: t("services.dashboard.badge"),
    },
  ];

  const whyWorkWithUs = [
    {
      icon: FileText,
      title: t("whyUs.listings.title"),
      description: t("whyUs.listings.desc"),
    },
    {
      icon: ShieldCheck,
      title: t("whyUs.expert.title"),
      description: t("whyUs.expert.desc"),
    },
    {
      icon: BadgeCheck,
      title: t("whyUs.verified.title"),
      description: t("whyUs.verified.desc"),
    },
    {
      icon: RocketIcon,
      title: t("whyUs.fast.title"),
      description: t("whyUs.fast.desc"),
    },
  ];

  const featuresData = [
    {
      icon: Compass,
      title: t("features.geolocation.title"),
      desc: t("features.geolocation.desc"),
    },
    {
      icon: Sparkles,
      title: t("features.recommendations.title"),
      desc: t("features.recommendations.desc"),
    },
    {
      icon: Search,
      title: t("features.filters.title"),
      desc: t("features.filters.desc"),
    },
    {
      icon: RocketIcon,
      title: t("features.booking.title"),
      desc: t("features.booking.desc"),
    },
  ];

  const statsServices = [
    { value: "5-10h", label: t("serviceStats.searchTime"), icon: Clock },
    { value: "100%", label: t("serviceStats.verified"), icon: BadgeCheck },
    { value: "0", label: t("serviceStats.risk"), icon: ShieldCheck },
    { value: "24/7", label: t("serviceStats.support"), icon: Headphones },
  ];

  const citiesData = [
    {
      name: t("city.tunis.name"),
      title: t("city.tunis.title"),
      desc: t("city.tunis.desc"),
      count: 124,
      image: "/cities/tunis.jpg",
    },
    {
      name: t("city.sousse.name"),
      title: t("city.sousse.title"),
      desc: t("city.sousse.desc"),
      count: 98,
      image: "/cities/sousse.jpg",
      offset: true,
    },
    {
      name: t("city.djerba.name"),
      title: t("city.djerba.title"),
      desc: t("city.djerba.desc"),
      count: 67,
      image: "/cities/djerba.jpg",
    },
    {
      name: t("city.hammamet.name"),
      title: t("city.hammamet.title"),
      desc: t("city.hammamet.desc"),
      count: 75,
      image: "/cities/hammamet.jpg",
      offset: true,
    },
    {
      name: t("city.mahdia.name"),
      title: t("city.mahdia.title"),
      desc: t("city.mahdia.desc"),
      count: 45,
      image: "/cities/mahdia.jpg",
    },
    {
      name: t("city.monastir.name"),
      title: t("city.monastir.title"),
      desc: t("city.monastir.desc"),
      count: 52,
      image: "/cities/monastir.jpg",
      offset: true,
    },
  ];

  const testimonialsData = [
    {
      name: t("testimonials.amira.name"),
      city: t("testimonials.amira.city"),
      quote: t("testimonials.amira.quote"),
      rating: 5,
      avatar: "A",
      gradient: "from-sky-500 to-indigo-600",
    },
    {
      name: t("testimonials.karim.name"),
      city: t("testimonials.karim.city"),
      quote: t("testimonials.karim.quote"),
      rating: 5,
      avatar: "K",
      gradient: "from-purple-500 to-pink-600",
    },
    {
      name: t("testimonials.sofia.name"),
      city: t("testimonials.sofia.city"),
      quote: t("testimonials.sofia.quote"),
      rating: 4,
      avatar: "S",
      gradient: "from-emerald-500 to-teal-600",
    },
    {
      name: t("testimonials.yassine.name"),
      city: t("testimonials.yassine.city"),
      quote: t("testimonials.yassine.quote"),
      rating: 5,
      avatar: "Y",
      gradient: "from-amber-500 to-orange-600",
    },
  ];

  const statsData = [
    { label: t("stats.premium"), value: 1200, suffix: "+" },
    { label: t("stats.verified_hosts"), value: 480, suffix: "" },
    { label: t("stats.travelers"), value: 24000, suffix: "k" },
    { label: t("stats.booking_time"), value: 3, suffix: " min" },
  ];

  const trustBelt = [
    { label: t("trust.premium"), icon: BadgeCheck },
    { label: t("trust.photography"), icon: Camera },
    { label: t("trust.concierge"), icon: Gem },
    { label: t("trust.destinations"), icon: Waves },
    { label: t("trust.verified"), icon: ShieldCheck },
    { label: t("trust.editorial"), icon: Sparkles },
  ];

  // ====== EFFETS ======

  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const hero = heroSectionRef.current;
    if (!hero) return;
    const handleParallax = () => {
      const offset = window.scrollY;
      const imgs =
        hero.querySelectorAll<HTMLImageElement>(".hero-parallax-img");
      imgs.forEach((img, i) => {
        if (heroIndex === i) {
          img.style.transform = `scale(1.1) translateY(${offset * 0.15}px)`;
        }
      });
    };
    window.addEventListener("scroll", handleParallax, { passive: true });
    return () => window.removeEventListener("scroll", handleParallax);
  }, [heroIndex]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    const prevBtn = prevBtnRef.current;
    const nextBtn = nextBtnRef.current;

    if (!container || !prevBtn || !nextBtn) return;

    const updateButtons = () => {
      const scrollLeft = container.scrollLeft;
      const maxScroll = container.scrollWidth - container.clientWidth;
      prevBtn.disabled = scrollLeft <= 10;
      nextBtn.disabled = maxScroll - scrollLeft <= 10;
    };

    const handlePrev = () => {
      container.scrollBy({ left: -320, behavior: "smooth" });
      setTimeout(updateButtons, 300);
    };

    const handleNext = () => {
      container.scrollBy({ left: 320, behavior: "smooth" });
      setTimeout(updateButtons, 300);
    };

    prevBtn.addEventListener("click", handlePrev);
    nextBtn.addEventListener("click", handleNext);
    container.addEventListener("scroll", updateButtons);
    updateButtons();

    return () => {
      prevBtn.removeEventListener("click", handlePrev);
      nextBtn.removeEventListener("click", handleNext);
      container.removeEventListener("scroll", updateButtons);
    };
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let interval: NodeJS.Timeout;

    const startAutoScroll = () => {
      interval = setInterval(() => {
        if (!container.matches(":hover")) {
          const maxScroll = container.scrollWidth - container.clientWidth;
          if (container.scrollLeft + 350 >= maxScroll) {
            container.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            container.scrollBy({ left: 350, behavior: "smooth" });
          }
        }
      }, 4000);
    };

    const stopAutoScroll = () => {
      if (interval) clearInterval(interval);
    };

    container.addEventListener("mouseenter", stopAutoScroll);
    container.addEventListener("mouseleave", startAutoScroll);
    startAutoScroll();

    return () => {
      container.removeEventListener("mouseenter", stopAutoScroll);
      container.removeEventListener("mouseleave", startAutoScroll);
      stopAutoScroll();
    };
  }, []);

  // ====== FONCTIONS ======

  const openPropertyModal = (property: any) => {
    setSelectedProperty(property);
    setShowModal(true);
  };

  const openModalWithMessage = (message: string) => {
    setSelectedProperty({
      id: 0,
      image:
        "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600&h=400&fit=crop",
      title: "Bienvenue sur NESTHUB",
      location: "Tunisie",
      price: "0",
      type: "PREMIUM",
    });
    setShowModal(true);
  };

  const handleLogin = () => {
    router.push(`/${locale}/login`);
  };

  const handleDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // ====== HERO SLIDES ======

  const HERO_SLIDES = [
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCaT7XwAF-hcanUDn9CPBqTm-McBZAvRuAXRrubpsRZdj1-FTcTbSDqHG8hqv10BxHPmTYkKktf5hBDqFZnyjRMDkqd6TCF_c6wSSWiTX8CTDI267XzfySBTrEyddy8H1N2od4155aVb1f-b9wREDz7Nq4KananDtIcbbXc-6Ax2JtVgFOUluR6OyIBPFYD2NZzNNgmfDGB5thaH2iPgNda5Ozdq_7E1Z3P6aFzwe1Qm-aysG347qU4l_-Qs_QczTsAcVkMXEqpVL5G",
      title: "L'Art de vivre méditerranéen",
      titleHighlight: "réinventé.",
      subtitle:
        "Des villas signatures, des dars confidentiels et des séjours d'exception.",
      caption: "",
      gradient: "from-sky-900/70 via-indigo-900/50 to-slate-900/60",
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCsHm15UAFGBMD65nt7HCvZz-I2HdVEpo5ITZ6ymycXn4C_v_9--N9CN-iAQlxWtXDd13S3SJPQG6va6XNKq737OdAHhOpaEdZaZ-0Bacy6sHo58u9fwVeeSq7VTdR2DiOvviRwblVmop5z9Y58Aj64xlklQ7OgPbuKqDE77w_nqaJAggVdq2GrxxKw55fQn0UY-lClVP11zx_MjPG8uMqhEt9RJ5Ag-z8iJ7bPdzH7Ei5ddpwdkJ4EY9ACMbM3RndjRD7dNppjZ38x",
      title: "Des propriétés qui ne se visitent pas.",
      titleHighlight: "Elles se ressentent.",
      subtitle:
        "Chaque annonce est pensée comme une histoire visuelle : lumière, matière, silence, mer.",
      caption: "Sélections premium pour voyageurs exigeants",
      gradient: "from-amber-900/70 via-rose-900/50 to-slate-900/60",
    },
    {
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuCM98mCpyu-vG2JnyhR_lSUcwtFbt1ijmfp_Igx8N1Mv_Vdnj__A-TTHxhCJE4wMG10RTFRKyMllJgXQTl7AXazeBtHhCK6v_FohcHB_hRMh1BF4cfH5vCRZhifMnGTfUfAbPS9NCmicjvsU5JjUY9SJ_ikNWNCqKPDP6ZCKd54e5YmECWcxXZZ256UwwgbEX6R7nQGlCtp6Ys6kjdz6Ju4dgTEXzI3khGC98SJevhwLxjcLkHreFoQraeX6EB6Y3Byis6UoSDAx7NO",
      title: "La Tunisie la plus désirable,",
      titleHighlight: "à portée d'un clic.",
      subtitle:
        "Des expériences premium pour les voyageurs exigeants et les propriétaires d'exception.",
      caption: "",
      gradient: "from-indigo-900/70 via-purple-900/50 to-slate-900/60",
    },
  ];

  // ====== RENDU ======

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
      {/* SVG Gradients */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* ====== HEADER ====== */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 flex justify-center px-4 py-5 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`}
      >
        <header
          className={`w-full max-w-7xl mx-auto transition-all duration-500 ${scrolled ? "bg-sky-100/50 dark:bg-slate-900/80 backdrop-blur-2xl rounded-4xl shadow-2xl shadow-black/5 px-4 py-2" : "bg-transparent px-0 py-0"}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo/logo.png"
                  alt="NestHub Logo"
                  fill
                  className="object-contain scale-420"
                />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent tracking-tight">
                NESTHUB
              </span>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              <button
                onClick={() => scrollToSection("hero")}
                className={`text-sm font-medium transition-all duration-300 hover:text-sky-600 dark:hover:text-white ${scrolled ? "text-slate-700 dark:text-white/80" : "text-white dark:text-white/80"}`}
              >
                {t("header.home")}
              </button>
              <button
                onClick={() => scrollToSection("services")}
                className={`text-sm font-medium transition-all duration-300 hover:text-sky-600 dark:hover:text-white ${scrolled ? "text-slate-700 dark:text-white/80" : "text-white dark:text-white/80"}`}
              >
                {t("header.services")}
              </button>
              <button
                onClick={() => scrollToSection("properties")}
                className={`text-sm font-medium transition-all duration-300 hover:text-sky-600 dark:hover:text-white ${scrolled ? "text-slate-700 dark:text-white/80" : "text-white dark:text-white/80"}`}
              >
                {t("header.properties")}
              </button>
              <button
                onClick={() => scrollToSection("contact-section")}
                className={`text-sm font-medium transition-all duration-300 hover:text-sky-600 dark:hover:text-white ${scrolled ? "text-slate-700 dark:text-white/80" : "text-white dark:text-white/80"}`}
              >
                {t("header.contact")}
              </button>
              <button
                onClick={() => scrollToSection("about")}
                className={`text-sm font-medium transition-all duration-300 hover:text-sky-600 dark:hover:text-white ${scrolled ? "text-slate-700 dark:text-white/80" : "text-white dark:text-white/80"}`}
              >
                {t("header.about")}
              </button>
            </nav>
            <div className="flex items-center gap-3">
              <LanguageSelector />
              <ThemeSwitcher />
              {!isSignedIn ? (
                <button
                  onClick={handleLogin}
                  className="rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
                >
                  {t("header.login")}
                </button>
              ) : (
                <button
                  onClick={handleDashboard}
                  className="rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:scale-105"
                >
                  {t("header.dashboard")}
                </button>
              )}
            </div>
          </div>
        </header>
      </div>
{/* Toast Notification */}
{toast && (
  <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
      toast.type === "success" 
        ? "bg-green-500 text-white" 
        : "bg-red-500 text-white"
    }`}>
      {toast.type === "success" ? (
        <CheckCircle className="w-5 h-5" />
      ) : (
        <AlertCircle className="w-5 h-5" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
        <X className="w-4 h-4" />
      </button>
    </div>
  </div>
)}
      {/* ====== SECTION HERO ====== */}
      <section
        id="hero"
        ref={heroSectionRef}
        className="relative isolate overflow-hidden"
        style={{ height: "90vh" }}
      >
        <div className="absolute inset-0">
          {HERO_SLIDES.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-1500 ease-in-out ${
                heroIndex === index
                  ? "opacity-100 scale-100 visible"
                  : "opacity-0 scale-105 invisible"
              }`}
              style={{ transitionProperty: "opacity, transform, visibility" }}
            >
              <img
                src={slide.image}
                alt={slide.title}
                className="hero-parallax-img h-full w-full object-cover"
                style={{ willChange: "transform" }}
              />
              <div
                className={`absolute inset-0 bg-gradient-to-br ${slide.gradient}`}
              />
            </div>
          ))}
        </div>

        <div className="relative mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mt-10">
           

            <h1
              key={`title-${heroIndex}`}
              className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight text-white leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100 fill-mode-forwards"
            >
              {t("hero.title")}{" "}
              <span className="bg-gradient-to-r from-sky-300 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                {t("hero.titleHighlight")}
              </span>
            </h1>

            <p
              key={`subtitle-${heroIndex}`}
              className="mt-6 text-base sm:text-lg leading-relaxed text-white/80 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 fill-mode-forwards"
            >
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300 fill-mode-forwards">
              {statsData.map((stat) => (
                <Counter
                  key={stat.label}
                  target={stat.value}
                  suffix={stat.suffix}
                  label={stat.label}
                />
              ))}
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                    heroIndex === i
                      ? "w-8 bg-white"
                      : "w-1.5 bg-white/40 hover:bg-white/60 hover:w-3"
                  }`}
                />
              ))}
            </div>

            <p
              key={`caption-${heroIndex}`}
              className="mt-6 text-xs text-white/50 tracking-wide animate-in fade-in duration-1000 delay-500 fill-mode-forwards"
            >
              {HERO_SLIDES[heroIndex].caption}
            </p>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            {t("hero.scroll")}
          </span>
          <svg
            className="w-4 h-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </section>

      {/* ====== BANDE DE CONFIANCE ====== */}
      <div className="relative z-20 mx-auto -mt-8 max-w-7xl px-4 pb-6 sm:px-6">
        <div className="overflow-hidden rounded-full bg-white/40 dark:bg-slate-900/50 py-3 shadow-lg backdrop-blur-xl border border-white/20">
          <div className="animate-marquee flex items-center gap-10 px-6 whitespace-nowrap">
            {[...trustBelt, ...trustBelt].map(
              ({ label, icon: Icon }, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300"
                >
                  <Icon className="h-4 w-4 text-sky-500 dark:text-sky-400" />
                  <span>{label}</span>
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* ====== SECTION SERVICES ====== */}
      <section
        id="services"
        className="relative z-20 max-w-7xl mx-auto px-4 py-20 sm:px-6"
      >
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-3">
            {t("services.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {t("services.title")}{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("services.titleHighlight")}
            </span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("services.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {servicesData.map((service, index) => (
            <div
              key={service.title}
className="group border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl p-6"            >
              <div className="mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <service.icon
                    className="w-6 h-6"
                    style={{
                      stroke: "url(#iconGradient)",
                      fill: "none",
                      strokeWidth: 1.5,
                    }}
                  />
                </div>
              </div>
              <div className="inline-block px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                {service.badge}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                {service.title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsServices.map((stat) => (
            <div
              key={stat.label}
              className="text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl group hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <stat.icon className="w-5 h-5 mx-auto mb-2 text-sky-500" />
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ====== SECTION FEATURES ====== */}
      <section className="relative z-20 mx-auto max-w-7xl px-4 py-20 sm:px-6 -mt-25">
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-3">
            {t("features.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {t("features.title")}{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("features.titleHighlight")}
            </span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="w-full bg-white dark:bg-slate-800/50 shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-2">
            <div className="p-6 md:p-8 pb-4">
              {featuresData.map(({ icon: Icon, title, desc }, i) => (
                <div
                  key={title}
                  className={`group flex gap-5 py-5 transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:pl-4 rounded-xl px-2 -mx-2 ${i < featuresData.length - 1 ? "border-b border-slate-100 dark:border-slate-800" : ""}`}
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                    <Icon
                      className="w-6 h-6"
                      style={{
                        stroke: "url(#iconGradient)",
                        fill: "none",
                        strokeWidth: 1.5,
                      }}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                      {title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative min-h-[400px]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaT7XwAF-hcanUDn9CPBqTm-McBZAvRuAXRrubpsRZdj1-FTcTbSDqHG8hqv10BxHPmTYkKktf5hBDqFZnyjRMDkqd6TCF_c6wSSWiTX8CTDI267XzfySBTrEyddy8H1N2od4155aVb1f-b9wREDz7Nq4KananDtIcbbXc-6Ax2JtVgFOUluR6OyIBPFYD2NZzNNgmfDGB5thaH2iPgNda5Ozdq_7E1Z3P6aFzwe1Qm-aysG347qU4l_-Qs_QczTsAcVkMXEqpVL5G"
                alt="Villa de luxe Tunisie"
                className="w-full h-full object-cover absolute inset-0"
              />
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-2xl z-10">
                <p className="text-xs text-white">Sidi Bou Saïd - Tunisie</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== SECTION PROPRIÉTÉS EN VEDETTE ====== */}
      <section
        id="properties"
        className="relative z-20 w-full px-4 py-20 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-600/10"
      >
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-2 block">
              {t("featured.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              {t("featured.title")}{" "}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                {t("featured.titleHighlight")}
              </span>
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t("featured.subtitle")}
            </p>
          </div>

          <div className="relative">
            <button
              ref={prevBtnRef}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-6 pb-6 px-2 scroll-smooth"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {featuredProperties.map((property) => (
                <div
                  key={property.id}
                  onClick={() => openPropertyModal(property)}
className="flex-shrink-0 w-[280px] md:w-[340px] group cursor-pointer bg-white dark:bg-slate-800/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={property.image}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSignedIn)
                          openModalWithMessage(
                            "Connectez-vous pour ajouter aux favoris",
                          );
                      }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 dark:bg-slate-800/80 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                    </button>
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                      {property.type}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-0.5">
                      {property.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                      {property.location}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-3.5 h-3.5 text-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          4.9
                        </span>
                        <span className="text-xs text-slate-400">(124)</span>
                      </div>
                      <button className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1">
                        {t("featured.details")}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              ref={nextBtnRef}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-xl hover:shadow-2xl transition-all flex items-center justify-center cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <svg
                className="w-5 h-5 text-slate-600 dark:text-slate-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ====== MODAL ====== */}
      {showModal && selectedProperty && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-200"
          onClick={() => setShowModal(false)}
        >
          <div
            className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52">
              <img
                src={selectedProperty.image}
                alt={selectedProperty.title}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 text-white hover:bg-black/70 flex items-center justify-center transition"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <div className="absolute bottom-3 left-3">
                <p className="text-white font-bold text-xl drop-shadow-md">
                  {selectedProperty.title}
                </p>
                <p className="text-white/80 text-sm">
                  {selectedProperty.location}
                </p>
              </div>
            </div>

            <div className="p-6 text-center">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                {t("modal.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed mb-6">
                {t("modal.subtitle")}
              </p>
              <div className="space-y-3">
                <a
                  href={`/${locale}/inscription`}
                  className="block w-full py-3 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-semibold hover:opacity-90 transition text-center"
                >
                  {t("modal.signup")}
                </a>
                <a
                  href={`/${locale}/login`}
                  className="block w-full py-3 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition text-center"
                >
                  {t("modal.login")}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====== SECTION WHY WORK WITH US ====== */}
      <section
        id="about"
        className="relative z-20 max-w-7xl mx-auto px-4 py-20 sm:px-6"
      >
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-3">
            {t("whyUs.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {t("whyUs.title")}{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("whyUs.titleHighlight")}
            </span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("whyUs.subtitle")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {whyWorkWithUs.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex gap-5 p-7 bg-white dark:bg-slate-900 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-sky-500/10 via-indigo-500/10 to-purple-500/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                <Icon
                  className="w-7 h-7"
                  style={{
                    stroke: "url(#iconGradient)",
                    fill: "none",
                    strokeWidth: 1.5,
                  }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== SECTION CTA IMAGE ====== */}
      <section className="relative isolate overflow-hidden py-28">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&h=900&fit=crop"
            alt="NestHub Luxury Property"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              {t("cta.title")}
              <span className="block bg-gradient-to-r from-sky-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {t("cta.titleHighlight")}
              </span>
            </h2>
            <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <button
              onClick={() =>
                !isSignedIn && openModalWithMessage("Découvrez NestHub")
              }
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-indigo-500/25"
            >
              {t("cta.button")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ====== SECTION PAR VILLE ====== */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-3">
            {t("city.badge")}
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
            {t("city.title")}{" "}
            <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
              {t("city.titleHighlight")}
            </span>
          </h2>
          <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            {t("city.subtitle")}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          <div className="relative overflow-hidden border border-white/70 bg-white/85 p-3 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 lg:col-span-5">
            <div className="relative h-full min-h-[540px] overflow-hidden">
              <img
                src="/cities/sidi-bou-said.jpg"
                alt="Sidi Bou Saïd"
                className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/15 to-transparent" />
              <div className="absolute left-6 top-6 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-800 shadow-lg backdrop-blur-md dark:bg-slate-900/90 dark:text-slate-100">
                {t("city.sidibousaid.badge")}
              </div>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-300">
                  {t("city.sidibousaid.mood")}
                </p>
                <h3 className="mt-2 text-4xl font-extrabold tracking-tight text-white">
                  {t("city.sidibousaid.name")}
                </h3>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                  {t("city.sidibousaid.desc")}
                </p>
                <p className="mt-4 text-sm font-bold text-white/90">
                  86 {t("city.properties")} — {t("city.selection")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:col-span-7 md:grid-cols-2">
            {citiesData.map((city, idx) => (
              <div
                key={city.name}
                className={`group overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-md transition-all hover:-translate-y-1 ${city.offset ? "md:translate-y-10" : ""}`}
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={city.image}
                    alt={city.name}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-sky-300">
                      {city.title}
                    </p>
                    <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
                      {city.name}
                    </h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    {city.desc}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-300">
                    {city.count} {t("city.properties")} — {t("city.selection")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SECTION TÉMOIGNAGES ====== */}
      <section className="relative z-20 w-full px-4 py-20 bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-purple-600/10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-14">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-sky-500 mb-2 block">
              {t("testimonials.badge")}
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight">
              {t("testimonials.title")}{" "}
              <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
                {t("testimonials.titleHighlight")}
              </span>
            </h2>
            <p className="text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
              {t("testimonials.subtitle")}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonialsData.map((t, i) => (
              <div
                key={i}
                className="h-full border border-white/70 bg-white/85 shadow-[0_16px_40px_rgba(15,23,42,0.07)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 dark:border-white/10 dark:bg-slate-900/75"
              >
                <div className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${s < t.rating ? "text-amber-500 fill-amber-500" : "text-slate-300 dark:text-slate-600"}`}
                      />
                    ))}
                  </div>
                  <svg
                    className="w-8 h-8 text-sky-500/30 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== SECTION CONTACT ====== */}
<section
  id="contact-section"
  className="relative py-20 px-6 md:px-20 overflow-hidden bg-white dark:bg-slate-900"
>
  <div className="relative z-10 max-w-7xl mx-auto">
    <div className="grid lg:grid-cols-2 gap-12 items-center">
      <div>
        <span className="inline-block text-sky-500 font-bold tracking-[0.2em] uppercase text-xs mb-6">
          {t("contact.badge")}
        </span>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white mb-4 leading-tight whitespace-nowrap">
          {t("contact.title")}{" "}
          <span className="bg-gradient-to-r from-sky-500 to-indigo-600 bg-clip-text text-transparent">
            {t("contact.titleHighlight")}
          </span>
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
          {t("contact.subtitle")}
        </p>

        <div className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/30 shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("contact.fullname")} <span className="text-red-500">*</span>
                </label>
                <input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${
                    errors.fullName ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
                  } px-4 py-3 focus:ring-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all`}
                  placeholder={t("contact.placeholder.fullname")}
                  type="text"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {t("contact.email")} <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${
                    errors.email ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
                  } px-4 py-3 focus:ring-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all`}
                  placeholder={t("contact.placeholder.email")}
                  type="email"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("contact.phone")} <span className="text-slate-400 text-[9px]">(optionnel)</span>
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${
                  errors.phone ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
                } px-4 py-3 focus:ring-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all`}
                placeholder={t("contact.placeholder.phone")}
                type="tel"
              />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {t("contact.message")} <span className="text-red-500">*</span>
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                className={`w-full bg-slate-50 dark:bg-slate-800/50 border ${
                  errors.message ? "border-red-500 focus:ring-red-500" : "border-slate-200 dark:border-slate-700 focus:ring-sky-500"
                } px-4 py-3 focus:ring-2 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none transition-all resize-none`}
                placeholder={t("contact.placeholder.message")}
                rows={4}
              ></textarea>
              {errors.message && (
                <p className="text-xs text-red-500 mt-1">{errors.message}</p>
              )}
              <p className="text-right text-[10px] text-slate-400">
                {formData.message.length}/500 caractères
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white px-6 py-3 font-bold hover:shadow-2xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  {t("contact.submit")}
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="hidden lg:block relative left-25">
        <img
          src="/images/support.png"
          alt="Support Team"
          className="w-full h-auto object-cover translate-y-28"
        />
      </div>
    </div>
  </div>
</section>

     {/* ====== FOOTER ====== */}
<footer className="bg-indigo-200/80 dark:bg-indigo-900/70 backdrop-blur-sm border-t border-indigo-300/50 dark:border-slate-800 pt-16 pb-8 px-6 md:px-20">
  <div className="max-w-7xl mx-auto">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
      {/* Brand & Social */}
      <div>
        <div className="flex items-center gap-2.5 mb-6">
          <div className="relative w-10 h-10">
            <Image
              src="/logo/logo.png"
              alt="NestHub Logo"
              fill
              className="object-contain scale-350"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {t("footer.brand")}
          </span>
        </div>
        <p className="text-slate-700 dark:text-slate-400 mb-6 leading-relaxed text-sm">
          {t("footer.description")}
        </p>
        <div className="flex space-x-3">
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-[#1877F2] hover:text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#d62976] hover:to-[#962fbf] hover:text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z" />
            </svg>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-black hover:text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-[#0077B5] hover:text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C0.792 0 0 0.774 0 1.729v20.542C0 23.227 0.792 24 1.771 24h20.451c0.979 0 1.771-0.773 1.771-1.729V1.729C24 0.774 23.208 0 22.225 0z" />
            </svg>
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-[#FF0000] hover:text-white transition-all duration-300 hover:scale-110"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.073 0 12 0 12s0 3.927.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.927 24 12 24 12s0-3.927-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>
      </div>

      {/* Contact */}
      <div>
        <h5 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">
          {t("footer.contact")}
        </h5>
        <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm">
          <li className="flex items-center space-x-3 group">
            <Phone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition">
              {t("footer.phone")}
            </span>
          </li>
          <li className="flex items-center space-x-3 group">
            <Mail className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <a
              href="mailto:contact@nesthub.tn"
              className="group-hover:text-slate-900 dark:group-hover:text-white transition"
            >
              {t("footer.email")}
            </a>
          </li>
          <li className="flex items-start space-x-3 group">
            <MapPin className="w-4 h-4 text-sky-600 dark:text-sky-400 mt-0.5" />
            <span className="group-hover:text-slate-900 dark:group-hover:text-white transition whitespace-pre-line text-sm">
              {t("footer.address")}
            </span>
          </li>
        </ul>
        <button
          onClick={() => scrollToSection("contact-section")}
          className="w-full py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-semibold text-sm hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 mt-3"
        >              
          {t("header.contact")}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Navigation */}
      <div>
        <h5 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">
          {t("footer.navigation")}
        </h5>
        <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
          <li>
            <button
              onClick={() => scrollToSection("hero")}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              {t("header.home")}
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("services")}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              {t("header.services")}
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("properties")}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              {t("header.properties")}
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("about")}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              {t("header.about")}
            </button>
          </li>
          <li>
            <button
              onClick={() => scrollToSection("contact-section")}
              className="hover:text-slate-900 dark:hover:text-white transition"
            >
              {t("header.contact")}
            </button>
          </li>
        </ul>
      </div>

      {/* Compte */}
      <div>
        <h5 className="text-lg font-bold mb-6 text-slate-800 dark:text-white">
          {t("footer.account")}
        </h5>
        <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">
          {t("footer.newsletter")}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleLogin}
            className="w-full py-2.5 border border-sky-500 text-sky-600 dark:text-sky-400 font-semibold text-sm hover:bg-sky-500 hover:text-white transition-all duration-300"
          >
            {t("footer.login")}
          </button>
          <button
            onClick={handleDashboard}
            className="w-full py-2.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white font-semibold text-sm hover:scale-[1.02] transition-all duration-300 shadow-lg shadow-indigo-500/25"
          >
            {t("footer.signup")}
          </button>
        </div>
      </div>
    </div>

    <div className="border-t border-indigo-300/50 dark:border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center text-slate-500 dark:text-slate-500 text-xs">
      <p>© 2026 NESTHUB. {t("footer.rights")}</p>
      <div className="flex space-x-5 mt-4 md:mt-0">
        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
          {t("footer.privacy")}
        </a>
        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
          {t("footer.security")}
        </a>
        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
          {t("footer.cookies")}
        </a>
        <a href="#" className="hover:text-slate-900 dark:hover:text-white transition">
          {t("footer.terms")}
        </a>
      </div>
    </div>
  </div>
</footer>

      {/* ====== BOUTON RETOUR EN HAUT ====== */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-xl"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      )}

      {/* ====== STYLES ====== */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
        .fade-in {
          animation-name: fadeIn;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .slide-in-from-bottom-4 {
          animation-name: fadeInUp;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .slide-in-from-bottom-6 {
          animation-name: fadeInUp;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .slide-in-from-bottom-8 {
          animation-name: fadeInUp;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
        }
        .slide-in-from-bottom-10 {
          animation-name: fadeInUp;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }
        .duration-700 {
          animation-duration: 0.7s;
        }
        .duration-1000 {
          animation-duration: 1s;
        }
        .duration-1500 {
          transition-duration: 1500ms;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
        .fill-mode-forwards {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
