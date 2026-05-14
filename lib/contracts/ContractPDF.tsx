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
        {/* HEADER */}
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
          CONTRAT DE LOCATION
        </Text>

        {/* PREMIERE PARTIE - TEXTE DES IMAGES */}
        <Text style={styles.paragraph}>
          Par le présent acte sous seing privé
        </Text>
        <Text style={styles.paragraph}>
          Entre M. {data.owner.firstName} {data.owner.lastName} d'une part,
        </Text>
        <Text style={styles.paragraph}>
          Et M. {data.tenant.firstName} {data.tenant.lastName} d'autre part,
        </Text>
        <Text style={styles.paragraph}>
          Il a été convenu et arrêté ce qui suit :
        </Text>

        {/* Article Premier */}
        <Text style={styles.paragraphBold}>
          Article Premier. — M. {data.owner.firstName} {data.owner.lastName}
        </Text>
        <Text style={styles.paragraph}>
          loue à M. {data.tenant.firstName} {data.tenant.lastName}
        </Text>
        <Text style={styles.paragraph}>
          qui accepte.
        </Text>

        {/* Art. 2 */}
        <Text style={styles.paragraphBold}>
          Art. 2. — La présente location est consentie pour la durée d'{data.dates.nights} nuit(s)
        </Text>
        <Text style={styles.paragraph}>
          et finissant le {checkOutDate}.
        </Text>
        <Text style={styles.paragraph}>
          Faute de congé donné par écrit au moins trois mois à l'avance, le contrat sera prorogé un an aux mêmes conditions, et ainsi de suite jusqu'à ce qu'un congé soit signifié. Le congé doit être signifié par exploit d'huissier ou par lettre recommandée.
        </Text>

        {/* Art. 3 */}
        <Text style={styles.paragraphBold}>
          Art. 3. — Le loyer est fixé à {formatPrice(data.price.totalPrice)}
        </Text>
        <Text style={styles.paragraph}>
          payable avant l'entrée dans les lieux.
        </Text>

        {/* Art. 4 */}
        <Text style={styles.paragraphBold}>
          Art. 4. — L'abonnement d'eau est à la charge du propriétaire, mais sur l'excédent de consommation le locataire payera.
        </Text>
        <Text style={styles.paragraph}>
          En aucun cas, une interruption dans le service, le manque d'eau par accident ou pour une cause quelconque étrangère au propriétaire, ne pourra donner lieu à aucun recours contre ce dernier.
        </Text>

        {/* Art. 5 */}
        <Text style={styles.paragraphBold}>
          Art. 5. — Le locataire ne pourra faire sans autorisation du propriétaire aucune modification dans les lieux loués, qui doivent, de condition expresse, être rendus à la fin du bail en bon état de réparations locatives.
        </Text>
        <Text style={styles.paragraph}>
          Le locataire devra souffrir sans indemnité ni diminution de loyer, l'exécution de grosses réparations qui seraient nécessaires dans l'intérêt de l'immeuble, quelle que soit la durée ou l'époque des travaux. Enfin, le propriétaire se réserve le droit d'inspecter ou de faire inspecter le local loué, lorsqu'il le jugera nécessaire.
        </Text>
        <Text style={styles.paragraph}>
          Toutes les améliorations qui pourront avoir été faites durant le bail par le locataire resteront gratuitement acquises au propriétaire, à moins que ce dernier préfère le rétablissement des lieux dans leur état primitif.
        </Text>

        {/* Art. 6 */}
        <Text style={styles.paragraphBold}>
          Art. 6. — En cas de troubles ou de dommages causés par des tiers, le locataire n'aura aucun droit ni recours contre le propriétaire.
        </Text>

        {/* Art. 7 */}
        <Text style={styles.paragraphBold}>
          Art. 7. — Le propriétaire ne sera jamais responsable des infiltrations d'eau provenant des canalisations, terrasses ou étages supérieurs.
        </Text>

        {/* Art. 8 */}
        <Text style={styles.paragraphBold}>
          Art. 8. — Le locataire reconnaît avoir reçu les locaux loués en parfait et complet état. Il devra les rendre à la fin du bail dans le même état et par conséquent de l'essentiel. La réparation des opérations prévues par l'art. 1754 du Code Civil est en outre :
        </Text>
        <Text style={styles.paragraph}>
          L'entretien des serrures, clefs, grilles de cheminées ou fourneaux, des sièges des W.C., des planches de placards, des carreaux en ciment, en marbre, céramique, des robinets d'eau, des appareils de chasse : des conduites de toute nature dans les parties non communes avec d'autres locataires : du débouchage, s'il y a lieu, des évier et W. C. Le locataire sera responsable des dégâts qui pourraient être causés par son manque de surveillance à cet égard.
        </Text>

        {/* Art. 9 */}
        <Text style={styles.paragraphBold}>
          Art. 9. — Il est interdit au locataire de céder ses droits au présent bail, de sous louer ou même de prêter momentanément tout ou partie des locaux loués.
        </Text>
        <Text style={styles.paragraph}>
          Il lui est également interdit : 1) d'étendre ou d'accrocher du linge, des effets ou objets quelconques aux fenêtres et aux balcons. — 2) de se servir du mortier ou des objets quelconques dans les cours des escaliers ou sur les terrasses. — 3) d'entrepôser des matériaux, cendres ou d'huile dans le local loué des personnes d'une mauvaise conduite. — 4) d'introduire les choses ou les objets dans l'appartement.
        </Text>

        {/* Art. 10 */}
        <Text style={styles.paragraphBold}>
          Art. 10. — Le propriétaire ne répond pas du linge entreposé sur les terrasses ; chaque locataire doit en assurer lui-même la garde.
        </Text>
        <Text style={styles.paragraph}>
          Les portes donnant sur les piliers devront toujours être fermées.
        </Text>

        {/* Art. 11 */}
        <Text style={styles.paragraphBold}>
          Art. 11. — Il est absolument défendu au locataire d'introduire dans le local qui lui est cédé des matières inflammables, explosives ou dangereuses pour la sécurité et la salubrité des immeubles ou des voisins.
        </Text>

        {/* Art. 12 */}
        <Text style={styles.paragraphBold}>
          Art. 12. — A défaut de paiement d'un seul terme à son échéance comme en cas d'inexécution des conditions ci-dessus, le présent bail sera de plein droit résilié quinze jours après une simple mise en demeure restée sans effet et par le seul fait de l'expiration du délai. La résiliation étant ainsi acquise, l'expulsion du locataire aura lieu sans délai, à la requête du propriétaire sur ordonnance du référendum rendue par le Président du Tribunal.
        </Text>
        <Text style={styles.paragraph}>
          Dans ce cas, les loyers payés d'avance seront acquis au propriétaire à titre de dommages et intérêts, sans que cela nuise aux droits qu'il pourrait avoir d'en réclamer de plus étendus.
        </Text>

        {/* Art. 13 */}
        <Text style={styles.paragraphBold}>
          Art. 13. — Les frais du présent contrat et les droits d'enregistrement sont à la charge du locataire.
        </Text>

        {/* Signature */}
        <Text style={styles.paragraph}>
          Fait à Tunis, le {today}.
        </Text>

        {/* SIGNATURES */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Propriétaire</Text>
              <Text style={styles.signatureSubLabel}>
                {data.owner.firstName} {data.owner.lastName}
              </Text>
              <Text style={styles.signatureLine}>
                Signature
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Le Locataire</Text>
              <Text style={styles.signatureSubLabel}>
                {data.tenant.firstName} {data.tenant.lastName}
              </Text>
              <Text style={styles.signatureLine}>
                Signature
              </Text>
            </View>
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>
              NESTHUB Tunisie
            </Text>
            <Text style={styles.footerText}>Contrat N° {data.reference}</Text>
          </View>
          <Text style={styles.footerCenter}>
            Document généré le {today}
          </Text>
        </View>
      </Page>
    </Document>
  );
}