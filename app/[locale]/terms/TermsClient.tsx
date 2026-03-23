"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import {
  FiHome,
  FiFileText,
  FiShield,
  FiCreditCard,
  FiAlertCircle,
  FiXCircle,
  FiLock,
  FiUser,
  FiUsers,
  FiCheckCircle,
  FiArrowRight,
  FiStar,
  FiShieldOff,
} from "react-icons/fi";
import { TiArrowUpOutline } from "react-icons/ti";

// ═══════════════════════════════════════════════════════════════
// TYPES — same pattern as PrivacyClient
// ═══════════════════════════════════════════════════════════════

interface IntroductionData {
  title: string;
  p1: string;
  p2: string;
  warning: string;
}

interface ServicesData {
  title: string;
  description: string;
  items: string[]; // 7 items
}

interface ObligationsData {
  title: string;
  owners: { title: string; items: string[] };
  tenants: { title: string; items: string[] };
  prohibited: { title: string; text: string };
}

interface PaiementsData {
  title: string;
  quote: string;
  items: { key: string; title: string; text: string }[];
}

interface ResponsabiliteData {
  title: string;
  description: string;
  items: string[];
}

interface ResiliationData {
  title: string;
  description: string;
  reasons: { title: string; desc: string }[];
  process: string;
}

interface DonneesData {
  title: string;
  description: string;
  rights: { title: string; desc: string }[];
  footer: string;
}

interface TermsContentData {
  version: string;
  lastUpdate: string;
  introduction: IntroductionData;
  services: ServicesData;
  obligations: ObligationsData;
  paiements: PaiementsData;
  responsabilite: ResponsabiliteData;
  resiliation: ResiliationData;
  donnees: DonneesData;
}

interface TermsPageData {
  title: string;
  content: TermsContentData;
  updatedAt: Date | string;
  status?: string;
}

interface TermsClientProps {
  pageData?: TermsPageData;
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT CONTENT — used when no DB data available
// Same role as defaultContent in PrivacyClient
// ═══════════════════════════════════════════════════════════════

const defaultContent: TermsContentData = {
  version: "1.0",
  lastUpdate: new Date().toISOString(),

  introduction: {
    title: "Introduction",
    p1: "Bienvenue sur NestHub. En utilisant notre plateforme, vous acceptez les présentes Conditions Générales d'Utilisation (CGU). Veuillez les lire attentivement avant d'utiliser nos services.",
    p2: "NestHub est une plateforme de mise en relation entre propriétaires et locataires pour des locations saisonnières en Tunisie. Nous nous réservons le droit de modifier ces CGU à tout moment.",
    warning:
      "L'utilisation de la plateforme implique l'acceptation pleine et entière des présentes conditions. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.",
  },

  services: {
    title: "Accès & Services",
    description:
      "NestHub propose une gamme complète de services pour faciliter la location entre particuliers :",
    items: [
      "Publication et gestion d'annonces de location",
      "Système de réservation en ligne sécurisé",
      "Messagerie intégrée entre propriétaires et locataires",
      "Système de paiement sécurisé via Konnect",
      "Vérification d'identité et système de confiance",
      "Gestion des contrats de location numériques",
      "Support client et résolution des litiges",
    ],
  },

  obligations: {
    title: "Obligations des utilisateurs",
    owners: {
      title: "Propriétaires",
      items: [
        "Fournir des informations exactes et à jour sur les biens",
        "Respecter les disponibilités du calendrier publié",
        "Maintenir les logements en bon état de propreté",
        "Remettre les clés dans les délais convenus",
        "Respecter la vie privée des locataires",
      ],
    },
    tenants: {
      title: "Locataires",
      items: [
        "Utiliser le logement conformément à sa destination",
        "Respecter le règlement intérieur du logement",
        "Signaler tout dommage immédiatement au propriétaire",
        "Quitter les lieux à l'heure convenue",
        "Ne pas sous-louer sans autorisation préalable",
      ],
    },
    prohibited: {
      title: "Activités interdites",
      text: "Il est strictement interdit d'utiliser la plateforme pour des activités illégales, frauduleuses ou contraires aux bonnes mœurs. Tout manquement entraînera la suspension immédiate du compte.",
    },
  },

  paiements: {
    title: "Paiements & Commissions",
    quote:
      "La sécurité de vos transactions est notre priorité absolue. Tous les paiements sont traités via notre partenaire Konnect.",
    items: [
      {
        key: "commission",
        title: "Commission plateforme",
        text: "NestHub perçoit une commission de 20% sur chaque transaction réalisée via la plateforme pour couvrir les frais de service.",
      },
      {
        key: "deposit",
        title: "Caution",
        text: "Une caution peut être demandée par le propriétaire. Elle est conservée en séquestre et restituée dans les 48h après la fin du séjour.",
      },
      {
        key: "payout",
        title: "Versement propriétaire",
        text: "Le versement est effectué 24h après l'arrivée du locataire, déduction faite de la commission NestHub.",
      },
      {
        key: "refund",
        title: "Politique de remboursement",
        text: "Les conditions de remboursement dépendent de la politique d'annulation choisie par le propriétaire lors de la publication.",
      },
    ],
  },

  responsabilite: {
    title: "Responsabilité",
    description:
      "NestHub agit en tant qu'intermédiaire et ne peut être tenu responsable des agissements des utilisateurs. Notre responsabilité est limitée aux services directement fournis par la plateforme.",
    items: [
      "NestHub n'est pas responsable des dommages causés au logement par le locataire",
      "NestHub ne garantit pas la disponibilité permanente de la plateforme",
      "Les descriptions et photos des annonces sont sous la responsabilité des propriétaires",
      "NestHub n'intervient pas dans les litiges relatifs à la qualité des logements",
      "La responsabilité de NestHub est limitée au montant des frais de service perçus",
    ],
  },

  resiliation: {
    title: "Résiliation & Sanctions",
    description:
      "NestHub se réserve le droit de suspendre ou de résilier tout compte en cas de manquement aux présentes CGU.",
    reasons: [
      {
        title: "Résiliation à l'initiative de l'utilisateur",
        desc: "Vous pouvez clôturer votre compte à tout moment depuis les paramètres.",
      },
      {
        title: "Suspension administrative",
        desc: "En cas de signalement ou de comportement suspect, le compte peut être suspendu provisoirement.",
      },
      {
        title: "Résiliation pour violation grave",
        desc: "Toute fraude avérée entraîne une résiliation immédiate et définitive sans préavis.",
      },
    ],
    process:
      "En cas de résiliation, les réservations en cours seront honorées. Les fonds éventuellement détenus seront reversés selon les conditions en vigueur.",
  },

  donnees: {
    title: "Données personnelles",
    description:
      "Le traitement de vos données personnelles est régi par notre Politique de Confidentialité, conforme à la loi tunisienne n°2004-63 et au RGPD.",
    rights: [
      { title: "Droit d'accès", desc: "Consultez vos données à tout moment" },
      { title: "Rectification", desc: "Corrigez vos informations inexactes" },
      { title: "Effacement", desc: "Demandez la suppression de vos données" },
      {
        title: "Portabilité",
        desc: "Exportez vos données dans un format lisible",
      },
    ],
    footer:
      "Pour exercer vos droits ou pour toute question relative à vos données, consultez notre",
  },
};

// ═══════════════════════════════════════════════════════════════
// SIDEBAR SECTIONS
// ═══════════════════════════════════════════════════════════════

const NAV_SECTIONS = [
  { id: "introduction", label: "Introduction", icon: FiHome },
  { id: "services", label: "Accès & Services", icon: FiFileText },
  { id: "obligations", label: "Obligations", icon: FiShield },
  { id: "paiements", label: "Paiements", icon: FiCreditCard },
  { id: "responsabilite", label: "Responsabilité", icon: FiAlertCircle },
  { id: "resiliation", label: "Résiliation", icon: FiXCircle },
  { id: "donnees", label: "Données personnelles", icon: FiLock },
];

const primaryColor = {
  light: "bg-blue-400 dark:bg-blue-600",
  text: "text-blue-400 dark:text-blue-400",
  bg: "bg-blue-50 dark:bg-blue-900/20",
  border: "border-blue-200 dark:border-blue-800",
  gradient: "from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600",
  darkText: "text-blue-600 dark:text-blue-400",
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function TermsClient({ pageData }: TermsClientProps) {
  const t = useTranslations("Terms");
  const locale = useLocale();
  const [activeSection, setActiveSection] = useState("introduction");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // SAME PATTERN AS PRIVACYCLIENT:
  // Use DB data if available, otherwise use defaultContent
  const content = pageData?.content || defaultContent;
  const title = pageData?.title || t("title");
  const lastUpdate = pageData?.updatedAt
    ? new Date(pageData.updatedAt).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(content.lastUpdate).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const els = NAV_SECTIONS.map((s) => document.getElementById(s.id));
      for (let i = els.length - 1; i >= 0; i--) {
        const el = els[i];
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(NAV_SECTIONS[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  // ─────────────────────────────────────────────────────────────
  // RENDER — EXACT SAME UI AS ORIGINAL, only content is dynamic
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 dark:from-blue-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-700/20 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-400 via-sky-600 to-purple-500 dark:from-blue-400 dark:via-sky-500 dark:to-purple-400 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
              <FiStar className="w-3 h-3 mr-1" />
              {t("version")} {content.version}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t("lastUpdate")} {lastUpdate}
            </span>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                  {t("navigation")}
                </p>
                <nav className="space-y-1">
                  {NAV_SECTIONS.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollTo(section.id)}
                      className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                        activeSection === section.id
                          ? `${primaryColor.bg} ${primaryColor.darkText} font-medium`
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <section.icon
                        className={`w-4 h-4 ${activeSection === section.id ? primaryColor.text : "text-gray-400 dark:text-gray-500"}`}
                      />
                      <span className="flex-1">{section.label}</span>
                      {activeSection === section.id && (
                        <FiArrowRight
                          className={`w-3 h-3 ${primaryColor.text}`}
                        />
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Help card */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 via-blue-200 to-blue-100 dark:from-blue-800 dark:via-blue-800 dark:to-blue-700 rounded-xl blur-md opacity-75" />
                <div className="relative bg-gradient-to-br from-blue-400 via-sky-500 to-purple-500 dark:from-blue-600 dark:via-sky-600 dark:to-purple-600 rounded-xl p-5 shadow-xl text-white">
                  <p className="font-semibold text-white text-base mb-1">
                    {t("needHelp")}
                  </p>
                  <p className="text-xs text-white/80 mb-4">{t("helpText")}</p>
                  <Link
                    href={`/${locale}/contact`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-white underline hover:text-white/80 transition-all"
                  >
                    {t("contactUs")}
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* 1 ─ Introduction */}
            <section
              id="introduction"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  1
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.introduction.title}
                </h2>
              </div>
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <p>{content.introduction.p1}</p>
                <p>{content.introduction.p2}</p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-amber-800 dark:text-amber-300 text-sm font-medium flex items-start gap-2">
                    <FiAlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <span>{content.introduction.warning}</span>
                  </p>
                </div>
              </div>
            </section>

            {/* 2 ─ Services */}
            <section
              id="services"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  2
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.services.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {content.services.description}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {content.services.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <FiCheckCircle
                      className={`w-4 h-4 ${primaryColor.text} mt-0.5 shrink-0`}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3 ─ Obligations */}
            <section
              id="obligations"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  3
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.obligations.title}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Owners */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
                  <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transform transition-transform duration-300 shadow-md hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FiUser className={`w-5 h-5 ${primaryColor.text}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {content.obligations.owners.title}
                      </h3>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      {content.obligations.owners.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            className={`w-1 h-1 rounded-full ${primaryColor.light} mt-2 shrink-0`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Tenants */}
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
                  <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transform transition-transform duration-300 shadow-md hover:shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <FiUsers className={`w-5 h-5 ${primaryColor.text}`} />
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {content.obligations.tenants.title}
                      </h3>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                      {content.obligations.tenants.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span
                            className={`w-1 h-1 rounded-full ${primaryColor.light} mt-2 shrink-0`}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Prohibited */}
              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-rose-800 dark:text-rose-300 mb-1 flex items-center gap-2">
                  <FiShieldOff className="w-4 h-4" />
                  {content.obligations.prohibited.title}
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-400">
                  {content.obligations.prohibited.text}
                </p>
              </div>
            </section>

            {/* 4 ─ Paiements */}
            <section
              id="paiements"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  4
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.paiements.title}
                </h2>
              </div>
              <div
                className={`${primaryColor.bg} ${primaryColor.border} border-l-4 rounded-r-lg p-4 mb-4`}
              >
                <p className="text-sm italic text-gray-700 dark:text-gray-300 flex items-start gap-2">
                  <FiCreditCard
                    className={`w-5 h-5 ${primaryColor.text} shrink-0 mt-0.5`}
                  />
                  <span>&quot;{content.paiements.quote}&quot;</span>
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.paiements.items.map((item, i) => (
                  <div
                    key={item.key}
                    className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`w-5 h-5 rounded-full ${primaryColor.light} flex items-center justify-center text-xs font-bold text-black dark:text-white`}
                      >
                        {i + 1}
                      </span>
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* 5 ─ Responsabilité */}
            <section
              id="responsabilite"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  5
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.responsabilite.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                {content.responsabilite.description}
              </p>
              <div className="space-y-2">
                {content.responsabilite.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                  >
                    <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-600 dark:text-gray-400 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 6 ─ Résiliation */}
            <section
              id="resiliation"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  6
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.resiliation.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {content.resiliation.description}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {content.resiliation.reasons.map((reason, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute -inset-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
                    <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center transform transition-transform duration-300 shadow-md hover:shadow-xl">
                      <FiXCircle
                        className={`w-6 h-6 mx-auto mb-2 ${i === 0 ? "text-rose-500 dark:text-rose-400" : i === 1 ? "text-amber-500 dark:text-amber-400" : "text-rose-600 dark:text-rose-500"}`}
                      />
                      <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1">
                        {reason.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {reason.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                {content.resiliation.process}
              </p>
            </section>

            {/* 7 ─ Données personnelles */}
            <section
              id="donnees"
              className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
            >
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
              />
              <div className="flex items-center gap-4 mb-6">
                <span
                  className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black dark:text-white text-base font-bold shrink-0`}
                >
                  7
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {content.donnees.title}
                </h2>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {content.donnees.description}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {content.donnees.rights.map((right, i) => (
                  <div key={i} className="group relative">
                    <div className="absolute -inset-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg blur opacity-50 group-hover:opacity-75 transition" />
                    <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center transform transition-transform duration-300 shadow-md hover:shadow-xl">
                      <FiLock
                        className={`w-5 h-5 ${primaryColor.text} mx-auto mb-1`}
                      />
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {right.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {right.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 text-center border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {content.donnees.footer}{" "}
                  <Link
                    href={`/${locale}/privacy`}
                    className="text-purple-800 dark:text-primary hover:underline font-medium"
                  >
                    {t("privacyPolicy")}
                  </Link>{" "}
                  {t("or")}{" "}
                  <a
                    href="mailto:privacy@nesthub.tn"
                    className="text-purple-800 dark:text-primary hover:underline font-medium"
                  >
                    privacy@nesthub.tn
                  </a>
                </p>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-6 right-6 w-10 h-10 bg-gradient-to-r from-blue-400 via-sky-600 to-purple-500 dark:from-blue-500 dark:via-sky-500 dark:to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center hover:from-blue-500 hover:via-purple-500 hover:to-sky-500 dark:hover:from-blue-600 dark:hover:via-purple-600 dark:hover:to-sky-600 transition-all duration-300 z-50"
        >
          <TiArrowUpOutline className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
