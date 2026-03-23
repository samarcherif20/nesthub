// shared-content/terms-content.ts
// Ici on met TOUT le contenu texte qui pourra être modifié via l'admin

export const termsContent = {
  type: 'TERMS',
  title: "Conditions Générales d'Utilisation",
  slug: 'terms',

  // Métadonnées
  lastUpdate: new Date().toISOString(),
  version: '1.0',

  // Le contenu de chaque section
  sections: [
    {
      id: "introduction",
      title: "Introduction et acceptation",
      p1: "Les présentes Conditions Générales d'Utilisation (ci-après désignées « CGU ») ont pour objet de définir les modalités et conditions dans lesquelles la plateforme NESTHUB met à la disposition de ses utilisateurs les services de mise en relation immobilière en Tunisie.",
      p2: "En accédant ou en utilisant le site web NESTHUB, vous reconnaissez avoir lu, compris et accepté d'être lié par ces termes. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.",
      warning: "Ces CGU s'appliquent à tous les utilisateurs de la plateforme : locataires, propriétaires et visiteurs non connectés.",
      items: []
    },
    {
      id: "services",
      title: "Description des services",
      description: "NESTHUB est une plateforme technologique tunisienne facilitant la location de biens immobiliers entre particuliers. Nos services incluent, sans s'y limiter :",
      items: [
        { text: "La publication d'annonces de location avec photos, vidéos et descriptions détaillées." },
        { text: "Un système de messagerie sécurisée avec détection anti-fuite de données personnelles." },
        { text: "Un outil de gestion de réservations et de dossiers de location numérique." },
        { text: "Des solutions de paiement sécurisé via Konnect, avec gestion de caution en séquestre." },
        { text: "Un système de vérification d'identité par OCR (CIN / Passeport)." },
        { text: "Un score de fiabilité et des badges de confiance pour les utilisateurs vérifiés." },
        { text: "Des outils d'intelligence artificielle pour la détection de fraude et la recommandation." },
      ]
    },
    {
      id: "obligations",
      title: "Obligations de l'utilisateur",
      owners: {
        title: "Propriétaires",
        items: [
          { text: "Fournir des informations exactes et véridiques sur le bien." },
          { text: "Détenir légalement les droits de location sur le bien publié." },
          { text: "Respecter les normes de décence et la législation tunisienne." },
          { text: "Ne pas publier d'annonces fictives ou trompeuses." },
          { text: "Répondre aux demandes de réservation dans un délai raisonnable." },
        ]
      },
      tenants: {
        title: "Locataires",
        items: [
          { text: "Fournir des documents d'identité authentiques." },
          { text: "Utiliser la plateforme de manière loyale et honnête." },
          { text: "Effectuer tous les paiements exclusivement via NESTHUB." },
          { text: "Respecter le règlement intérieur du bien loué." },
          { text: "Signaler tout problème via les canaux officiels." },
        ]
      },
      prohibited: {
        title: "Comportements interdits",
        text: "Il est strictement interdit de partager des coordonnées personnelles (numéros, emails, IBAN) dans la messagerie, de contourner le système de paiement, de publier de fausses annonces ou de harceler d'autres utilisateurs. Tout manquement peut entraîner la suspension ou le bannissement définitif du compte.",
      },
      items: []
    },
    {
      id: "paiements",
      title: "Conditions Financières",
      quote: "La sécurité de vos transactions est notre priorité. Tous les paiements effectués sur NESTHUB sont traités par Konnect, prestataire de paiement agréé en Tunisie.",
      items: [
        {
          key: "commission",
          title: "Commissions de service",
          text: "NESTHUB prélève une commission de 20% sur chaque transaction. Elle est déduite automatiquement du montant versé au propriétaire et clairement affichée avant toute confirmation.",
        },
        {
          key: "deposit",
          title: "Caution (Séquestre)",
          text: "La caution est collectée lors du paiement et placée en séquestre. Elle est restituée automatiquement en fin de séjour sans litige, ou arbitrée par NESTHUB en cas de conflit avec justificatifs photos.",
        },
        {
          key: "payout",
          title: "Versements aux propriétaires",
          text: "Les versements sont effectués après confirmation du check-in, avec un seuil minimum de 50 DT. Un relevé détaillé est disponible dans le tableau de bord propriétaire.",
        },
        {
          key: "refund",
          title: "Remboursements",
          text: "Les remboursements sont calculés selon la politique d'annulation du propriétaire. Le délai est de 3 à 5 jours ouvrables. NESTHUB peut forcer un remboursement en cas de litige avéré.",
        },
      ]
    },
    {
      id: "responsabilite",
      title: "Limitation de Responsabilité",
      description: "NESTHUB agit en tant qu'hébergeur de contenu et intermédiaire technique. La plateforme ne peut être tenue responsable :",
      items: [
        { text: "Du contenu des annonces publiées par les utilisateurs." },
        { text: "De l'inexécution ou de la mauvaise exécution du bail conclu entre les parties." },
        { text: "Des dommages indirects résultant de l'utilisation du service." },
        { text: "Des interruptions temporaires du service pour maintenance ou force majeure." },
        { text: "De la qualité, de la conformité ou de l'état réel des biens mis en location." },
      ]
    },
    {
      id: "resiliation",
      title: "Résiliation",
      description: "L'utilisateur peut supprimer son compte à tout moment depuis ses paramètres. NESTHUB se réserve le droit de suspendre ou résilier tout compte en cas de :",
      process: "La résiliation suit le processus d'escalade progressive : avertissement → suspension temporaire → bannissement définitif, sauf fraude grave justifiant une action immédiate.",
      items: [
        { title: "Non-respect des CGU",    desc: "Violation des règles d'utilisation." },
        { title: "Activités frauduleuses", desc: "Fausses identités, arnaques, faux avis." },
        { title: "Contournement système",  desc: "Paiements ou partage de contacts hors NH." },
      ]
    },
    {
      id: "donnees",
      title: "Données personnelles",
      description: "NESTHUB s'engage à protéger vos données personnelles. Vos droits incluent :",
      footer: "Pour exercer vos droits, consultez notre",
      items: [
        { title: "Accès",        desc: "Consulter vos données" },
        { title: "Rectification", desc: "Corriger vos données" },
        { title: "Suppression",  desc: "Effacer votre compte" },
        { title: "Portabilité",  desc: "Exporter vos données" },
      ]
    },
  ]
};