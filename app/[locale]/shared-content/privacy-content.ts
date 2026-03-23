// shared-content/privacy-content.ts
// Ici on met TOUT le contenu texte qui pourra être modifié via l'admin

export const privacyContent = {
  type: 'PRIVACY',
  title: 'Politique de Confidentialité',
  slug: 'privacy',
  
  // Métadonnées
  lastUpdate: new Date().toISOString(),
  version: '1.0',
  
  // Description en haut
  description: "Nous accordons une grande importance à la protection de vos données personnelles. Cette politique détaille comment nous collectons, utilisons et protégeons vos informations.",
  
  // Le contenu de chaque section
  sections: [
    {
      id: "collecte",
      title: "Collecte des données",
      description: "Nous collectons les données suivantes pour assurer le fonctionnement de notre plateforme :",
      items: [
        { label: "Identité", text: "Nom, prénom, date de naissance, pièce d'identité" },
        { label: "Coordonnées", text: "Email, numéro de téléphone, adresse" },
        { label: "Profil", text: "Photo, biographie, préférences" },
        { label: "Documents", text: "Justificatifs d'identité, documents légaux" },
        { label: "Financières", text: "Coordonnées bancaires, historique de paiements" },
        { label: "Comportementales", text: "Navigation, interactions, préférences" },
        { label: "Messagerie", text: "Conversations avec les autres utilisateurs" }
      ]
    },
    {
      id: "utilisation",
      title: "Utilisation des données",
      description: "Vos données sont utilisées pour les finalités suivantes :",
      items: [
        { title: "Gestion des comptes", text: "Création et gestion de votre profil utilisateur" },
        { title: "Vérification d'identité", text: "Sécurisation de la plateforme contre la fraude" },
        { title: "Système de confiance", text: "Calcul des scores de fiabilité des utilisateurs" },
        { title: "Personnalisation", text: "Recommandations d'annonces adaptées à vos préférences" },
        { title: "Amélioration du service", text: "Analyse des données pour optimiser la plateforme" },
        { title: "Transactions", text: "Traitement des paiements et des réservations" },
        { title: "Sécurité", text: "Détection et prévention des activités frauduleuses" },
        { title: "Support client", text: "Réponse à vos demandes et assistance" }
      ]
    },
    {
      id: "cookies",
      title: "Cookies",
      description: "Nous utilisons des cookies pour améliorer votre expérience sur notre plateforme.",
      items: [
        { name: "Cookies essentiels", desc: "Nécessaires au fonctionnement de base du site", badge: "Obligatoire", badgeColor: "green" },
        { name: "Cookies analytiques", desc: "Nous aident à comprendre comment vous utilisez le site", badge: "Optionnel", badgeColor: "slate" },
        { name: "Cookies de personnalisation", desc: "Mémorisent vos préférences", badge: "Optionnel", badgeColor: "slate" }
      ]
    },
    {
      id: "droits",
      title: "Vos droits",
      description: "Conformément à la loi tunisienne n° 2004-63 et au RGPD, vous disposez des droits suivants sur vos données :",
      items: [
        { title: "Droit d'accès", desc: "Consulter l'ensemble de vos données", icon: "eye" },
        { title: "Droit de rectification", desc: "Modifier vos données si elles sont inexactes", icon: "edit" },
        { title: "Droit à l'effacement", desc: "Supprimer vos données dans certains cas", icon: "trash" },
        { title: "Droit à la portabilité", desc: "Récupérer vos données dans un format lisible", icon: "download" },
        { title: "Droit d'opposition", desc: "Vous opposer au traitement de vos données", icon: "pause" },
        { title: "Droit à la limitation", desc: "Limiter temporairement le traitement", icon: "key" }
      ]
    },
    {
      id: "securite",
      title: "Sécurité des données",
      description: "Nous mettons en œuvre des mesures de sécurité robustes pour protéger vos informations :",
      items: [
        { title: "Chiffrement", desc: "Toutes les données sont chiffrées en transit et au repos" },
        { title: "Authentification", desc: "Authentification à deux facteurs disponible" },
        { title: "Documents", desc: "Stockage sécurisé des pièces d'identité" },
        { title: "Audits", desc: "Audits de sécurité réguliers" },
        { title: "Messagerie", desc: "Messages chiffrés de bout en bout" },
        { title: "Paiements", desc: "Conformité PCI DSS pour les transactions" }
      ]
    },
    {
      id: "ia",
      title: "Intelligence Artificielle",
      warning: "Notre plateforme utilise l'intelligence artificielle pour améliorer vos expériences",
      items: [
        { title: "Détection des fraudes", desc: "Nos algorithmes analysent les comportements suspects", badge: "Automatisé", badgeColor: "red" },
        { title: "Score de confiance", desc: "Un score de fiabilité est calculé pour chaque utilisateur", badge: "Automatisé", badgeColor: "blue" },
        { title: "Vérification documents", desc: "Analyse automatisée des pièces d'identité", badge: "Automatisé", badgeColor: "blue" },
        { title: "Recommandations", desc: "Suggestions personnalisées d'annonces", badge: "Optionnel", badgeColor: "slate" }
      ]
    },
    {
      id: "contact",
      title: "Contactez notre DPO",
      description: "Pour toute question concernant vos données personnelles ou pour exercer vos droits, contactez notre Délégué à la Protection des Données.",
      email: "privacy@nesthub.tn",
      helpLink: "/aide"
    }
  ]
};