"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  FiDatabase,
  FiSettings,
  FiAlertCircle,
  FiLock,
  FiMail,
  FiArrowRight,
  FiStar,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiDownloadCloud,
  FiPauseCircle,
  FiKey,
  FiFileText,
  FiUsers,
  FiMessageCircle,
  FiCreditCard,
  FiCpu,
  FiHelpCircle,
} from "react-icons/fi";
import {
  RiUserLine,
  RiShieldCheckLine,
  RiFileShieldLine,
  RiSpyLine,
  RiChatPrivateLine,
  RiBankCardLine,
} from "react-icons/ri";
import { TiArrowUpOutline } from "react-icons/ti";
import { GiCookie, GiRobotAntennas } from "react-icons/gi";
import { MdOutlineGavel, MdOutlineSecurity } from "react-icons/md";

// ========== TYPES ==========
interface CollecteItem {
  label: string;
  text: string;
}

interface UtilisationItem {
  title: string;
  text: string;
}

interface CookieItem {
  name: string;
  desc: string;
  badge: string;
  badgeColor: string;
}

interface DroitItem {
  title: string;
  desc: string;
  icon: string;
}

interface SecuriteItem {
  title: string;
  desc: string;
}

interface IAItem {
  title: string;
  desc: string;
  badge: string;
  badgeColor: string;
}

interface SectionCollecte {
  id: "collecte";
  title: string;
  description: string;
  items: CollecteItem[];
}

interface SectionUtilisation {
  id: "utilisation";
  title: string;
  description: string;
  items: UtilisationItem[];
}

interface SectionCookies {
  id: "cookies";
  title: string;
  description: string;
  items: CookieItem[];
}

interface SectionDroits {
  id: "droits";
  title: string;
  description: string;
  items: DroitItem[];
}

interface SectionSecurite {
  id: "securite";
  title: string;
  description: string;
  items: SecuriteItem[];
}

interface SectionIA {
  id: "ia";
  title: string;
  warning: string;
  items: IAItem[];
}

type Section =
  | SectionCollecte
  | SectionUtilisation
  | SectionCookies
  | SectionDroits
  | SectionSecurite
  | SectionIA;

interface ContentData {
  description: string;
  sections: Section[];
  lastUpdate: string;
  version: string;
}

interface PageData {
  title: string;
  htmlContent?: string; // nouveau : HTML libre de TipTap
  content?: ContentData; // ancien : structure sections (optionnel maintenant)
  updatedAt: Date | string;
  status?: string;
}

interface PolitiqueConfidentialitePageProps {
  pageData?: PageData;
}

// ========== CONTENU PAR DÉFAUT (TOUJOURS DISPONIBLE) ==========
const defaultContent: ContentData = {
  description:
    "Nous accordons une grande importance à la protection de vos données personnelles. Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.",
  lastUpdate: new Date().toISOString(),
  version: "1.0",
  sections: [
    {
      id: "collecte",
      title: "Collecte des données",
      description:
        "Nous collectons les données suivantes pour assurer le fonctionnement de notre plateforme :",
      items: [
        {
          label: "Identité",
          text: "Nom, prénom, date de naissance, pièce d'identité",
        },
        { label: "Coordonnées", text: "Email, numéro de téléphone, adresse" },
        { label: "Profil", text: "Photo, biographie, préférences" },
        {
          label: "Documents",
          text: "Justificatifs d'identité, documents légaux",
        },
        {
          label: "Financières",
          text: "Coordonnées bancaires, historique de paiements",
        },
        {
          label: "Comportementales",
          text: "Navigation, interactions, préférences",
        },
        {
          label: "Messagerie",
          text: "Conversations avec les autres utilisateurs",
        },
      ],
    },
    {
      id: "utilisation",
      title: "Utilisation des données",
      description: "Vos données sont utilisées pour les finalités suivantes :",
      items: [
        {
          title: "Gestion des comptes",
          text: "Création et gestion de votre profil utilisateur",
        },
        {
          title: "Vérification d'identité",
          text: "Sécurisation de la plateforme contre la fraude",
        },
        {
          title: "Système de confiance",
          text: "Calcul des scores de fiabilité des utilisateurs",
        },
        {
          title: "Personnalisation",
          text: "Recommandations d'annonces adaptées à vos préférences",
        },
        {
          title: "Amélioration du service",
          text: "Analyse des données pour optimiser la plateforme",
        },
        {
          title: "Transactions",
          text: "Traitement des paiements et des réservations",
        },
        {
          title: "Sécurité",
          text: "Détection et prévention des activités frauduleuses",
        },
        {
          title: "Support client",
          text: "Réponse à vos demandes et assistance",
        },
      ],
    },
    {
      id: "cookies",
      title: "Cookies",
      description:
        "Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme.",
      items: [
        {
          name: "Cookies essentiels",
          desc: "Nécessaires au fonctionnement de base du site",
          badge: "Obligatoire",
          badgeColor: "green",
        },
        {
          name: "Cookies analytiques",
          desc: "Nous aident à comprendre comment vous utilisez le site",
          badge: "Optionnel",
          badgeColor: "slate",
        },
        {
          name: "Cookies de personnalisation",
          desc: "Mémorisent vos préférences",
          badge: "Optionnel",
          badgeColor: "slate",
        },
      ],
    },
    {
      id: "droits",
      title: "Vos droits",
      description:
        "Conformément à la loi tunisienne n° 2004-63 et au RGPD, vous disposez des droits suivants sur vos données :",
      items: [
        {
          title: "Droit d'accès",
          desc: "Consulter l'ensemble de vos données",
          icon: "eye",
        },
        {
          title: "Droit de rectification",
          desc: "Modifier vos données si elles sont inexactes",
          icon: "edit",
        },
        {
          title: "Droit à l'effacement",
          desc: "Supprimer vos données dans certains cas",
          icon: "trash",
        },
        {
          title: "Droit à la portabilité",
          desc: "Récupérer vos données dans un format lisible",
          icon: "download",
        },
        {
          title: "Droit d'opposition",
          desc: "Vous opposer au traitement de vos données",
          icon: "pause",
        },
        {
          title: "Droit à la limitation",
          desc: "Limiter temporairement le traitement",
          icon: "key",
        },
      ],
    },
    {
      id: "securite",
      title: "Sécurité des données",
      description:
        "Nous mettons en œuvre des mesures de sécurité robustes pour protéger vos informations :",
      items: [
        {
          title: "Chiffrement",
          desc: "Toutes les données sont chiffrées en transit et au repos",
        },
        {
          title: "Authentification",
          desc: "Authentification à deux facteurs disponible",
        },
        { title: "Documents", desc: "Stockage sécurisé des pièces d'identité" },
        { title: "Audits", desc: "Audits de sécurité réguliers" },
        { title: "Messagerie", desc: "Messages chiffrés de bout en bout" },
        {
          title: "Paiements",
          desc: "Conformité PCI DSS pour les transactions",
        },
      ],
    },
    {
      id: "ia",
      title: "Intelligence Artificielle",
      warning:
        "Notre plateforme utilise l'intelligence artificielle pour améliorer vos expériences",
      items: [
        {
          title: "Détection des fraudes",
          desc: "Nos algorithmes analysent les comportements suspects",
          badge: "Automatisé",
          badgeColor: "red",
        },
        {
          title: "Score de confiance",
          desc: "Un score de fiabilité est calculé pour chaque utilisateur",
          badge: "Automatisé",
          badgeColor: "blue",
        },
        {
          title: "Vérification documents",
          desc: "Analyse automatisée des pièces d'identité",
          badge: "Automatisé",
          badgeColor: "blue",
        },
        {
          title: "Recommandations",
          desc: "Suggestions personnalisées d'annonces",
          badge: "Optionnel",
          badgeColor: "slate",
        },
      ],
    },
  ],
};

// ========== CONSTANTES ==========
const sections = [
  { id: "collecte" as const, labelKey: "sections.collecte", icon: FiDatabase },
  {
    id: "utilisation" as const,
    labelKey: "sections.utilisation",
    icon: FiSettings,
  },
  { id: "cookies" as const, labelKey: "sections.cookies", icon: GiCookie },
  { id: "droits" as const, labelKey: "sections.droits", icon: MdOutlineGavel },
  {
    id: "securite" as const,
    labelKey: "sections.securite",
    icon: MdOutlineSecurity,
  },
  { id: "ia" as const, labelKey: "sections.ia", icon: GiRobotAntennas },
  { id: "contact" as const, labelKey: "sections.contact", icon: FiMail },
];

const primaryColor = {
  light: "bg-blue-400",
  medium: "bg-blue-500",
  text: "text-blue-400",
  bg: "bg-blue-50 dark:bg-blue-900/20",
  border: "border-blue-200 dark:border-blue-800",
  icon: "text-blue-400",
  gradient: "from-blue-400 to-blue-500",
  darkText: "text-blue-600 dark:text-blue-400",
} as const;

// ========== COMPOSANT ==========
export default function PolitiqueConfidentialitePage({
  pageData,
}: PolitiqueConfidentialitePageProps) {
  console.log("📥 pageData reçu:", pageData);
  console.log("📦 content:", pageData?.content);
  console.log("📚 sections:", pageData?.content?.sections);

  const t = useTranslations("Privacy");
  const [activeSection, setActiveSection] = useState<string>("collecte");
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  // Si pageData.htmlContent existe → affichage HTML libre (nouveau format éditeur)
  // Sinon → pageData.content.sections (ancien format structuré) ou défaut
  const hasHtmlContent = !!pageData?.htmlContent;
  const content = pageData?.content || defaultContent;
  const title = pageData?.title || "Politique de Confidentialité";

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
      const sectionEls = sections.map((s) => document.getElementById(s.id));
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i];
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(sections[i].id);
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

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ElementType> = {
      eye: FiEye,
      edit: FiEdit3,
      trash: FiTrash2,
      download: FiDownloadCloud,
      pause: FiPauseCircle,
      key: FiKey,
      users: FiUsers,
      mail: FiMail,
      file: FiFileText,
      lock: FiLock,
      credit: FiCreditCard,
      message: FiMessageCircle,
      user: RiUserLine,
      shield: RiShieldCheckLine,
      fileShield: RiFileShieldLine,
      spy: RiSpyLine,
      chat: RiChatPrivateLine,
      bank: RiBankCardLine,
      star: FiStar,
      alert: FiAlertCircle,
      cpu: FiCpu,
      help: FiHelpCircle,
      settings: FiSettings,
    };
    return icons[iconName] || FiEye;
  };

  const getBadgeColor = (color: string): string => {
    const colors: Record<string, string> = {
      green:
        "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
      slate: "bg-slate-100 dark:bg-slate-800 text-slate-500",
      red: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
    };
    return colors[color] || colors.slate;
  };

  // ── Mode HTML libre (contenu édité via TipTap) ──
  if (hasHtmlContent) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
            {title}
          </h1>
          {pageData?.updatedAt && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Dernière mise à jour :{" "}
              {new Date(pageData.updatedAt).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          )}
          <div
            className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: pageData!.htmlContent! }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-r from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <div className="relative overflow-hidden bg-linear-to-r from-purple-50 via-purple-50 to-indigo-50 dark:from-purple-950/30 dark:via-purple-950/30 dark:to-indigo-950/30 border-b border-gray-200 dark:border-gray-800">
        <div className="absolute inset-0 bg-grid-gray-200/50 dark:bg-grid-gray-700/20 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-linear-to-r from-purple-400/20 via-purple-400/20 to-indigo-400/20 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                  Dernière mise à jour :{" "}
                  {new Date(content.lastUpdate).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                <span className="bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 bg-clip-text text-transparent">
                  {title}
                </span>
              </h1>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 max-w-3xl">
            {content.description}
          </p>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Sommaire
                </p>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const IconComponent = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollTo(section.id)}
                        className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                          activeSection === section.id
                            ? `${primaryColor.bg} ${primaryColor.darkText} font-medium`
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800"
                        }`}
                      >
                        <IconComponent
                          className={`w-4 h-4 ${activeSection === section.id ? primaryColor.text : "text-gray-400"}`}
                        />
                        <span className="flex-1">
                          {section.labelKey === "sections.collecte"
                            ? "Collecte"
                            : section.labelKey === "sections.utilisation"
                              ? "Utilisation"
                              : section.labelKey === "sections.cookies"
                                ? "Cookies"
                                : section.labelKey === "sections.droits"
                                  ? "Vos droits"
                                  : section.labelKey === "sections.securite"
                                    ? "Sécurité"
                                    : section.labelKey === "sections.ia"
                                      ? "IA"
                                      : "Contact"}
                        </span>
                        {activeSection === section.id && (
                          <FiArrowRight
                            className={`w-3 h-3 ${primaryColor.text}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0 space-y-8">
            {content.sections.map((section, index) => {
              // SECTION 1: COLLECTE
              if (section.id === "collecte") {
                const collecteSection = section as SectionCollecte;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {collecteSection.title}
                      </h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {collecteSection.description}
                    </p>

                    <ul className="space-y-3">
                      {collecteSection.items.map((item, i) => {
                        const IconComponent =
                          item.label === "Identité"
                            ? FiUsers
                            : item.label === "Coordonnées"
                              ? FiMail
                              : item.label === "Profil"
                                ? FiFileText
                                : item.label === "Documents"
                                  ? FiLock
                                  : item.label === "Financières"
                                    ? FiCreditCard
                                    : item.label === "Comportementales"
                                      ? FiEye
                                      : FiMessageCircle;

                        return (
                          <li
                            key={i}
                            className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                          >
                            <IconComponent
                              className={`w-5 h-5 ${primaryColor.text} mt-0.5 shrink-0`}
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              <strong className="text-gray-900 dark:text-white font-semibold">
                                {item.label} :
                              </strong>{" "}
                              {item.text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              }

              // SECTION 2: UTILISATION
              if (section.id === "utilisation") {
                const utilisationSection = section as SectionUtilisation;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {utilisationSection.title}
                      </h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                      {utilisationSection.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {utilisationSection.items.map((item, i) => {
                        const IconComponent =
                          item.title === "Gestion des comptes"
                            ? FiUsers
                            : item.title === "Vérification d'identité"
                              ? RiShieldCheckLine
                              : item.title === "Système de confiance"
                                ? FiStar
                                : item.title === "Personnalisation"
                                  ? RiUserLine
                                  : item.title === "Amélioration du service"
                                    ? FiSettings
                                    : item.title === "Transactions"
                                      ? FiCreditCard
                                      : item.title === "Sécurité"
                                        ? FiAlertCircle
                                        : FiHelpCircle;

                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <IconComponent
                              className={`w-5 h-5 ${primaryColor.text} mt-0.5 shrink-0`}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {item.text}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // SECTION 3: COOKIES
              if (section.id === "cookies") {
                const cookiesSection = section as SectionCookies;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {cookiesSection.title}
                      </h2>
                    </div>

                    <div
                      className={`${primaryColor.bg} ${primaryColor.border} border-l-4 rounded-r-lg p-4 mb-6`}
                    >
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {cookiesSection.description}
                      </p>
                    </div>

                    <div className="space-y-4">
                      {cookiesSection.items.map((item, i) => {
                        const IconComponent =
                          item.name === "Cookies essentiels"
                            ? FiLock
                            : item.name === "Cookies analytiques"
                              ? FiEye
                              : FiSettings;

                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-3 pb-4 ${i < cookiesSection.items.length - 1 ? "border-b border-gray-200 dark:border-gray-800" : ""}`}
                          >
                            <IconComponent
                              className={`w-5 h-5 ${primaryColor.text} mt-0.5 shrink-0`}
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                  {item.name}
                                </h4>
                                <span
                                  className={`shrink-0 ml-4 px-2 py-1 text-xs font-bold rounded ${getBadgeColor(item.badgeColor)}`}
                                >
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // SECTION 4: DROITS
              if (section.id === "droits") {
                const droitsSection = section as SectionDroits;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {droitsSection.title}
                      </h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                      {droitsSection.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {droitsSection.items.map((item, i) => {
                        const IconComponent = getIconComponent(item.icon);

                        return (
                          <div key={i} className="group relative">
                            <div className="absolute -inset-0.5 bg-gray-200 dark:bg-gray-700 rounded-lg blur opacity-50 group-hover:opacity-75 transition"></div>
                            <div className="relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center transform transition-transform duration-300 shadow-md hover:shadow-xl">
                              <IconComponent
                                className={`w-6 h-6 ${primaryColor.text} mx-auto mb-2`}
                              />
                              <h5 className="font-bold text-sm mb-1 text-gray-900 dark:text-white">
                                {item.title}
                              </h5>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // SECTION 5: SÉCURITÉ
              if (section.id === "securite") {
                const securiteSection = section as SectionSecurite;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {securiteSection.title}
                      </h2>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      {securiteSection.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {securiteSection.items.map((item, i) => {
                        const IconComponent =
                          item.title === "Chiffrement"
                            ? RiUserLine
                            : item.title === "Authentification"
                              ? RiShieldCheckLine
                              : item.title === "Documents"
                                ? RiFileShieldLine
                                : item.title === "Audits"
                                  ? RiSpyLine
                                  : item.title === "Messagerie"
                                    ? RiChatPrivateLine
                                    : RiBankCardLine;

                        return (
                          <div
                            key={i}
                            className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <IconComponent
                              className={`w-6 h-6 ${primaryColor.text} shrink-0`}
                            />
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                {item.title}
                              </h4>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              // SECTION 6: IA
              if (section.id === "ia") {
                const iaSection = section as SectionIA;
                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border-l-4 ${primaryColor.border} p-6 sm:p-8 scroll-mt-20 hover:shadow-lg transition-shadow relative overflow-hidden`}
                  >
                    <div
                      className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${primaryColor.gradient} opacity-5 rounded-bl-full`}
                    ></div>

                    <div className="flex items-center gap-4 mb-6">
                      <span
                        className={`flex items-center justify-center w-10 h-10 rounded-lg ${primaryColor.light} text-black text-base font-bold shrink-0`}
                      >
                        {index + 1}
                      </span>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {iaSection.title}
                      </h2>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                      <p className="text-sm text-amber-800 dark:text-amber-300 font-medium flex items-start gap-2">
                        <FiAlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                        <span>{iaSection.warning}</span>
                      </p>
                    </div>

                    <div className="space-y-4">
                      {iaSection.items.map((item, i) => {
                        const IconComponent =
                          item.title === "Détection des fraudes"
                            ? RiSpyLine
                            : item.title === "Score de confiance"
                              ? FiStar
                              : item.title === "Vérification documents"
                                ? FiAlertCircle
                                : FiCpu;

                        return (
                          <div
                            key={i}
                            className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <IconComponent
                                  className={`w-5 h-5 ${primaryColor.text}`}
                                />
                                <h4 className="font-bold text-gray-900 dark:text-white text-sm">
                                  {item.title}
                                </h4>
                              </div>
                              <span
                                className={`shrink-0 ml-3 px-2 py-0.5 text-xs font-bold rounded ${getBadgeColor(item.badgeColor)}`}
                              >
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-7">
                              {item.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              }

              return null;
            })}

            {/* SECTION 7: CONTACT */}
            <section id="contact" className="scroll-mt-20">
              <div className="relative">
                <div className="absolute -inset-1 bg-linear-to-r from-blue-200 via-blue-200 to-blue-100 rounded-2xl blur-md opacity-75"></div>
                <div className="relative bg-linear-to-br from-blue-400 to-purple-400 rounded-2xl p-8 md:p-12 shadow-xl text-white overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                  <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

                  <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-4">
                      Contactez notre DPO
                    </h2>
                    <p className="text-white/90 mb-8 max-w-lg leading-relaxed text-sm">
                      Pour toute question concernant vos données personnelles ou
                      pour exercer vos droits, contactez notre Délégué à la
                      Protection des Données.
                    </p>

                    <div className="flex flex-wrap gap-4">
                      <a
                        href="mailto:privacy@nesthub.tn"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-500 font-bold rounded-lg hover:bg-white/90 transition-all text-sm shadow-lg"
                      >
                        <FiMail className="w-4 h-4" />
                        privacy@nesthub.tn
                      </a>
                      <Link
                        href="/aide"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-all border border-white/30 backdrop-blur-sm text-sm"
                      >
                        Centre d'aide
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-6 right-6 w-10 h-10 bg-linear-to-r from-blue-400 via-sky-600 to-purple-500 text-white rounded-full shadow-lg flex items-center justify-center hover:from-blue-500 hover:via-purple-500 hover:to-sky-500 transition-all duration-300 z-50"
        >
          <TiArrowUpOutline className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
