import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 80,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    lineHeight: 1.6,
  },
  // ── Header ──
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  brandName: {
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerRight: {
    textAlign: "right",
    fontSize: 8,
    color: "#888",
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    marginBottom: 6,
  },
  headerLineThin: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    marginBottom: 25,
  },
  contractTitle: {
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 9,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  // ── Sections ──
  section: {
    marginBottom: 16,
  },
  articleTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 4,
  },
  paragraphBold: {
    fontSize: 10,
    fontWeight: "bold",
    lineHeight: 1.65,
    textAlign: "justify",
    marginBottom: 4,
  },
  indent: {
    paddingLeft: 15,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 10,
  },
  bullet: {
    width: 12,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: "justify",
  },
  // ── Price table ──
  priceTable: {
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  priceRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  priceRowTotal: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f5f5f5",
  },
  priceLabel: {
    flex: 1,
    fontSize: 10,
  },
  priceLabelBold: {
    flex: 1,
    fontSize: 10,
    fontWeight: "bold",
  },
  priceValue: {
    width: 120,
    textAlign: "right",
    fontSize: 10,
  },
  priceValueBold: {
    width: 120,
    textAlign: "right",
    fontSize: 10,
    fontWeight: "bold",
  },
  // ── Cancellation table ──
  cancelTable: {
    marginTop: 6,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  cancelHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
  },
  cancelHeaderText: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  cancelRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  cancelCell: {
    flex: 1,
    fontSize: 9,
  },
  // ── Signature ──
  signatureSection: {
    marginTop: 35,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  signatureBox: {
    width: "44%",
  },
  signatureLabel: {
    fontSize: 9,
    fontWeight: "bold",
    marginBottom: 3,
  },
  signatureSubLabel: {
    fontSize: 8,
    color: "#666",
    marginBottom: 25,
  },
  signatureLine: {
    borderTopWidth: 0.5,
    borderTopColor: "#999",
    paddingTop: 4,
    fontSize: 8,
    color: "#999",
  },
  // ── Footer ──
  footer: {
    position: "absolute",
    bottom: 30,
    left: 50,
    right: 50,
    borderTopWidth: 0.5,
    borderTopColor: "#ccc",
    paddingTop: 8,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#aaa",
  },
  footerCenter: {
    fontSize: 7,
    color: "#aaa",
    textAlign: "center",
    marginTop: 3,
  },
});

interface ContractData {
  reference: string;
  bookingId: string;
  listing: {
    title: string;
    address: string;
    type: string;
    rooms: number;
    maxGuests: number;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    cinNumber?: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    cinNumber?: string;
  };
  dates: {
    checkIn: Date;
    checkOut: Date;
    nights: number;
  };
  price: {
    pricePerNight: number;
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    totalPrice: number;
  };
  deposit?: {
    amount: number;
    status: string;
  };
  cancellationPolicy: string;
  createdAt: Date;
}

export function ContractPDF({ data }: { data: ContractData }) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString("fr-FR")} TND`;
  };

  const today = formatDate(new Date());
  const checkInDate = formatDate(data.dates.checkIn);
  const checkOutDate = formatDate(data.dates.checkOut);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ══════════════ HEADER ══════════════ */}
        <View style={styles.headerBar}>
          <Text style={styles.brandName}>NESTHUB</Text>
          <View style={styles.headerRight}>
            <Text>Contrat N° {data.reference}</Text>
            <Text>Établi le {today}</Text>
          </View>
        </View>
        <View style={styles.headerLine} />
        <View style={styles.headerLineThin} />

        <Text style={styles.contractTitle}>
          Contrat de Location Saisonnière
        </Text>
        <Text style={styles.contractSubtitle}>
          Conclu conformément aux dispositions du Code des Obligations et des
          Contrats tunisien
        </Text>

        {/* ══════════════ ARTICLE 1 — PARTIES ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 1 — Désignation des parties
          </Text>
          <Text style={styles.paragraph}>
            Le présent contrat est conclu entre les deux parties suivantes :
          </Text>

          <Text style={styles.paragraphBold}>Le Propriétaire (Bailleur) :</Text>
          <View style={styles.indent}>
            <Text style={styles.paragraph}>
              {data.owner.firstName} {data.owner.lastName}, joignable à
              l'adresse e-mail {data.owner.email}
              {data.owner.phone ? `, téléphone : ${data.owner.phone}` : ""}
              {data.owner.cinNumber
                ? `, titulaire de la CIN n° ${data.owner.cinNumber}`
                : ""}
              , ci-après désigné « le Propriétaire ».
            </Text>
          </View>

          <Text style={styles.paragraphBold}>Le Locataire (Preneur) :</Text>
          <View style={styles.indent}>
            <Text style={styles.paragraph}>
              {data.tenant.firstName} {data.tenant.lastName}, joignable à
              l'adresse e-mail {data.tenant.email}
              {data.tenant.phone ? `, téléphone : ${data.tenant.phone}` : ""}
              {data.tenant.cinNumber
                ? `, titulaire de la CIN n° ${data.tenant.cinNumber}`
                : ""}
              , ci-après désigné « le Locataire ».
            </Text>
          </View>
        </View>

        {/* ══════════════ ARTICLE 2 — OBJET ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>Article 2 — Objet du contrat</Text>
          <Text style={styles.paragraph}>
            Le Propriétaire met à la disposition du Locataire, qui accepte, le
            bien immobilier suivant aux fins d'habitation saisonnière :
          </Text>
          <Text style={styles.paragraph}>
            Le bien dénommé « {data.listing.title} », de type{" "}
            {data.listing.type}, comprenant {data.listing.rooms} pièce(s) et
            pouvant accueillir un maximum de {data.listing.maxGuests}{" "}
            personne(s), situé à l'adresse suivante :
          </Text>
          <Text style={styles.paragraphBold}>{data.listing.address}</Text>
          <Text style={styles.paragraph}>
            Le logement est loué meublé et en l'état, avec l'ensemble des
            équipements et du mobilier décrits dans l'inventaire annexé au
            présent contrat. Le Locataire reconnaît avoir pris connaissance de
            la description et des photographies du bien sur la plateforme
            NestHub avant la réservation.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 3 — DURÉE ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 3 — Durée de la location
          </Text>
          <Text style={styles.paragraph}>
            La présente location est consentie pour une durée de{" "}
            {data.dates.nights} nuit(s), à compter du {checkInDate} (date
            d'arrivée) jusqu'au {checkOutDate} (date de départ).
          </Text>
          <Text style={styles.paragraph}>
            L'arrivée (check-in) est possible à partir de 15h00 le jour
            d'arrivée. Le départ (check-out) devra intervenir au plus tard à
            11h00 le jour de départ. Toute demande de prolongation de séjour
            devra faire l'objet d'un accord écrit préalable du Propriétaire et
            donnera lieu à un avenant au présent contrat ainsi qu'au paiement
            des nuitées supplémentaires.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 4 — PRIX ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 4 — Conditions financières
          </Text>
          <Text style={styles.paragraph}>
            Le loyer est fixé d'un commun accord entre les parties selon les
            modalités détaillées ci-dessous. Le paiement intégral a été effectué
            par le Locataire via la plateforme sécurisée NestHub au moment de la
            réservation.
          </Text>

          <View style={styles.priceTable}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Prix par nuit</Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.price.pricePerNight)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Sous-total ({data.dates.nights} nuit
                {data.dates.nights > 1 ? "s" : ""})
              </Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.price.basePrice)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Frais de ménage</Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.price.cleaningFee)}
              </Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>
                Frais de service NestHub (5%)
              </Text>
              <Text style={styles.priceValue}>
                {formatPrice(data.price.serviceFee)}
              </Text>
            </View>
            <View style={styles.priceRowTotal}>
              <Text style={styles.priceLabelBold}>TOTAL TTC</Text>
              <Text style={styles.priceValueBold}>
                {formatPrice(data.price.totalPrice)}
              </Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            Le montant total de la location s'élève à{" "}
            {formatPrice(data.price.totalPrice)}, comprenant le loyer de base,
            les frais de ménage et les frais de service de la plateforme. Ce
            montant est ferme et définitif sauf application des conditions
            d'annulation prévues à l'article 6.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 5 — DÉPÔT ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>Article 5 — Dépôt de garantie</Text>
          {data.deposit ? (
            <Text style={styles.paragraph}>
              Un dépôt de garantie d'un montant de{" "}
              {formatPrice(data.deposit.amount)} a été pré-autorisé sur le moyen
              de paiement du Locataire. Ce montant n'est pas débité du compte du
              Locataire et constitue une simple empreinte bancaire. Il sera
              automatiquement libéré dans un délai de sept (7) jours ouvrés
              suivant la date de départ, sous réserve de l'absence de
              dégradation ou de non-respect des conditions du présent contrat.
              En cas de dommage constaté, le Propriétaire dispose d'un délai de
              48 heures après le départ pour signaler le préjudice via la
              plateforme NestHub, pièces justificatives à l'appui.
            </Text>
          ) : (
            <Text style={styles.paragraph}>
              Aucun dépôt de garantie n'est requis pour la présente location.
              Toutefois, le Locataire reste responsable de tout dommage causé au
              bien et à son contenu pendant la durée du séjour, conformément aux
              dispositions légales en vigueur.
            </Text>
          )}
        </View>

        {/* ══════════════ ARTICLE 6 — ANNULATION ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 6 — Conditions d'annulation
          </Text>
          <Text style={styles.paragraph}>
            En cas d'annulation de la réservation par le Locataire, les
            conditions de remboursement suivantes s'appliquent, calculées en
            fonction du délai entre la date d'annulation et la date d'arrivée
            prévue :
          </Text>

          <View style={styles.cancelTable}>
            <View style={styles.cancelHeader}>
              <Text style={styles.cancelHeaderText}>Délai avant l'arrivée</Text>
              <Text style={styles.cancelHeaderText}>Remboursement</Text>
              <Text style={styles.cancelHeaderText}>Retenue</Text>
            </View>
            <View style={styles.cancelRow}>
              <Text style={styles.cancelCell}>Plus de 30 jours</Text>
              <Text style={styles.cancelCell}>100% du montant total</Text>
              <Text style={styles.cancelCell}>Aucune retenue</Text>
            </View>
            <View style={styles.cancelRow}>
              <Text style={styles.cancelCell}>Entre 7 et 30 jours</Text>
              <Text style={styles.cancelCell}>50% du montant total</Text>
              <Text style={styles.cancelCell}>50% retenus</Text>
            </View>
            <View style={styles.cancelRow}>
              <Text style={styles.cancelCell}>Moins de 7 jours</Text>
              <Text style={styles.cancelCell}>Aucun remboursement</Text>
              <Text style={styles.cancelCell}>100% retenus</Text>
            </View>
          </View>

          <Text style={styles.paragraph}>
            En cas d'annulation par le Propriétaire, quelle que soit la date, le
            Locataire bénéficie d'un remboursement intégral du montant payé. Le
            Propriétaire pourra en outre être tenu de verser une indemnité
            compensatoire au Locataire, selon les conditions générales de la
            plateforme NestHub.
          </Text>
          <Text style={styles.paragraph}>
            Les frais de service NestHub sont remboursables uniquement en cas
            d'annulation effectuée plus de 30 jours avant la date d'arrivée.
            Dans tous les autres cas, ils restent acquis à la plateforme.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 7 — OBLIGATIONS ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 7 — Obligations du Locataire
          </Text>
          <Text style={styles.paragraph}>
            Le Locataire s'engage à respecter les obligations suivantes pendant
            toute la durée de son séjour :
          </Text>
          {[
            "Jouir paisiblement des lieux loués et les entretenir en bon père de famille, conformément aux dispositions de l'article 764 du Code des Obligations et des Contrats.",
            "Restituer le logement dans l'état de propreté dans lequel il lui a été remis à l'arrivée, un état des lieux étant réputé conforme sauf contestation signalée dans les deux heures suivant l'arrivée.",
            "Ne pas fumer à l'intérieur du logement. Tout manquement à cette obligation pourra donner lieu à des frais de nettoyage supplémentaires prélevés sur le dépôt de garantie.",
            "Ne pas organiser de fêtes, soirées ou événements rassemblant un nombre de personnes supérieur à la capacité maximale du logement sans l'autorisation écrite et préalable du Propriétaire.",
            "Respecter le voisinage et observer le calme entre 22h00 et 08h00, conformément aux règlements de copropriété et aux arrêtés municipaux en vigueur.",
            "Ne pas sous-louer le logement, en tout ou en partie, ni céder les droits du présent contrat à un tiers.",
            "Signaler immédiatement au Propriétaire, via la messagerie sécurisée NestHub, tout dysfonctionnement, panne ou dégât survenant dans le logement.",
          ].map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════ ARTICLE 8 — OBLIGATIONS PROPRIÉTAIRE ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 8 — Obligations du Propriétaire
          </Text>
          <Text style={styles.paragraph}>Le Propriétaire s'engage à :</Text>
          {[
            "Délivrer le logement en bon état de réparation, conforme à la description publiée sur la plateforme NestHub, et équipé de l'ensemble du mobilier et des commodités annoncés.",
            "Communiquer au Locataire, au plus tard 24 heures avant l'arrivée, les informations d'accès au logement (code d'entrée, adresse exacte, instructions particulières).",
            "Garantir la jouissance paisible du logement pendant toute la durée du séjour et ne pas pénétrer dans les lieux sans l'accord du Locataire, sauf cas de force majeure.",
            "Assurer le logement contre les risques locatifs (incendie, dégât des eaux, catastrophes naturelles) et en fournir la preuve sur demande du Locataire.",
            "Rester joignable pendant toute la durée du séjour via la messagerie NestHub ou par téléphone pour répondre à toute demande urgente du Locataire.",
          ].map((text, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* ══════════════ ARTICLE 9 — RESPONSABILITÉ ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 9 — Responsabilité et assurance
          </Text>
          <Text style={styles.paragraph}>
            Le Locataire est responsable des dommages causés au logement, à son
            mobilier et à ses équipements pendant la durée du séjour, ainsi que
            des dommages causés aux tiers (voisins, copropriété). Il est
            vivement recommandé au Locataire de souscrire une assurance
            villégiature couvrant sa responsabilité civile pendant la durée de
            la location.
          </Text>
          <Text style={styles.paragraph}>
            La plateforme NestHub agit en qualité d'intermédiaire et ne peut
            être tenue responsable des litiges directs entre le Propriétaire et
            le Locataire, ni des vices cachés du logement, ni des événements
            survenant dans les lieux loués. NestHub met toutefois à disposition
            un service de médiation accessible depuis l'espace utilisateur.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 10 — LITIGES ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 10 — Règlement des litiges
          </Text>
          <Text style={styles.paragraph}>
            En cas de différend relatif à l'exécution ou à l'interprétation du
            présent contrat, les parties s'engagent à rechercher un accord
            amiable, notamment par l'intermédiaire du service de médiation de
            NestHub. À défaut de résolution amiable dans un délai de trente (30)
            jours, le litige sera soumis aux tribunaux compétents de la
            République Tunisienne, conformément aux règles de compétence
            territoriale en vigueur.
          </Text>
        </View>

        {/* ══════════════ ARTICLE 11 — DISPOSITIONS FINALES ══════════════ */}
        <View style={styles.section}>
          <Text style={styles.articleTitle}>
            Article 11 — Dispositions finales
          </Text>
          <Text style={styles.paragraph}>
            Le présent contrat constitue l'intégralité de l'accord entre les
            parties et annule tout engagement verbal ou écrit antérieur relatif
            à la même location. Toute modification du présent contrat devra
            faire l'objet d'un avenant écrit signé par les deux parties.
          </Text>
          <Text style={styles.paragraph}>
            Le fait pour l'une des parties de ne pas se prévaloir d'une clause
            du présent contrat ne saurait constituer une renonciation à
            l'exercice de ses droits au titre de ladite clause.
          </Text>
          <Text style={styles.paragraph}>
            Le présent contrat est établi en deux exemplaires numériques, un
            pour chaque partie, et prend effet à la date de validation du
            paiement par le Locataire sur la plateforme NestHub, soit le{" "}
            {formatDate(data.createdAt)}.
          </Text>
        </View>

        {/* ══════════════ SIGNATURES ══════════════ */}
        <View style={styles.signatureSection}>
          <Text style={styles.paragraph}>
            Fait à Tunis, le {today}, en deux exemplaires numériques.
          </Text>

          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Propriétaire</Text>
              <Text style={styles.signatureSubLabel}>
                {data.owner.firstName} {data.owner.lastName}
                {data.owner.cinNumber ? ` — CIN ${data.owner.cinNumber}` : ""}
              </Text>
              <Text style={styles.signatureLine}>
                Signature électronique en attente
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Locataire</Text>
              <Text style={styles.signatureSubLabel}>
                {data.tenant.firstName} {data.tenant.lastName}
                {data.tenant.cinNumber ? ` — CIN ${data.tenant.cinNumber}` : ""}
              </Text>
              <Text style={styles.signatureLine}>
                Signé électroniquement le {formatDate(data.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* ══════════════ FOOTER ══════════════ */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              NestHub Tunisie — Plateforme de location entre particuliers
            </Text>
            <Text style={styles.footerText}>Contrat N° {data.reference}</Text>
          </View>
          <Text style={styles.footerCenter}>
            Document généré automatiquement le {today} · En cas de litige,
            contactez le support NESTHUB  : support@nesthub.tn
          </Text>
        </View>
      </Page>
    </Document>
  );
}
