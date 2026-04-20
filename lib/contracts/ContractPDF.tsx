import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
    borderBottom: 1,
    paddingBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: "#666",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: "bold",
  },
  value: {
    flex: 1,
  },
  signature: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
  },
  signatureLine: {
    borderTop: 1,
    marginTop: 30,
    paddingTop: 8,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    borderTop: 1,
    paddingTop: 10,
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
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>CONTRAT DE LOCATION SAISONNIÈRE</Text>
          <Text style={styles.subtitle}>
            NestHub Tunisie - Location entre particuliers
          </Text>
          <Text style={[styles.subtitle, { fontSize: 9, marginTop: 5 }]}>
            Référence: {data.reference}
          </Text>
        </View>

        {/* Article 1: Parties */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 1 : LES PARTIES</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Le Propriétaire :</Text>
            <Text style={styles.value}>
              {data.owner.firstName} {data.owner.lastName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email :</Text>
            <Text style={styles.value}>{data.owner.email}</Text>
          </View>
          {data.owner.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone :</Text>
              <Text style={styles.value}>{data.owner.phone}</Text>
            </View>
          )}

          <Text style={{ marginTop: 10 }}>ET</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Le Locataire :</Text>
            <Text style={styles.value}>
              {data.tenant.firstName} {data.tenant.lastName}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email :</Text>
            <Text style={styles.value}>{data.tenant.email}</Text>
          </View>
          {data.tenant.phone && (
            <View style={styles.row}>
              <Text style={styles.label}>Téléphone :</Text>
              <Text style={styles.value}>{data.tenant.phone}</Text>
            </View>
          )}
        </View>

        {/* Article 2: Objet */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 2 : OBJET</Text>
          <Text>
            Le Propriétaire donne en location saisonnière au Locataire le bien
            situé à :
          </Text>
          <Text style={{ marginTop: 5, fontWeight: "bold" }}>
            {data.listing.address}
          </Text>
          <Text style={{ marginTop: 5 }}>
            Type de bien : {data.listing.type} · {data.listing.rooms} pièce(s) ·
            {data.listing.maxGuests} personne(s) maximum
          </Text>
        </View>

        {/* Article 3: Durée */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ARTICLE 3 : DURÉE DU SÉJOUR</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Date d'arrivée :</Text>
            <Text style={styles.value}>
              {formatDate(data.dates.checkIn)} (à partir de 15h)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date de départ :</Text>
            <Text style={styles.value}>
              {formatDate(data.dates.checkOut)} (avant 11h)
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nombre de nuits :</Text>
            <Text style={styles.value}>{data.dates.nights} nuit(s)</Text>
          </View>
        </View>

        {/* Article 4: Prix */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ARTICLE 4 : PRIX ET MODALITÉS DE PAIEMENT
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>Prix par nuit :</Text>
            <Text style={styles.value}>
              {formatPrice(data.price.pricePerNight)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              Sous-total ({data.dates.nights} nuits) :
            </Text>
            <Text style={styles.value}>
              {formatPrice(data.price.basePrice)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frais de ménage :</Text>
            <Text style={styles.value}>
              {formatPrice(data.price.cleaningFee)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Frais de service (5%) :</Text>
            <Text style={styles.value}>
              {formatPrice(data.price.serviceFee)}
            </Text>
          </View>
          <View
            style={[styles.row, { marginTop: 5, borderTop: 1, paddingTop: 5 }]}
          >
            <Text style={[styles.label, { fontWeight: "bold" }]}>
              TOTAL À PAYER :
            </Text>
            <Text style={[styles.value, { fontWeight: "bold" }]}>
              {formatPrice(data.price.totalPrice)}
            </Text>
          </View>
        </View>

        {/* Article 5: Dépôt de garantie */}
        {data.deposit && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ARTICLE 5 : DÉPÔT DE GARANTIE
            </Text>
            <Text>
              Un dépôt de garantie de {formatPrice(data.deposit.amount)} a été
              pré-autorisé sur la carte bancaire du Locataire. Ce montant n'est
              pas débité et sera libéré automatiquement dans les 7 jours suivant
              le départ, sauf dégradation constatée.
            </Text>
          </View>
        )}

        {/* Article 6: Annulation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ARTICLE 6 : POLITIQUE D'ANNULATION
          </Text>
          <Text>{data.cancellationPolicy}</Text>
        </View>

        {/* Article 7: Règlement intérieur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            ARTICLE 7 : RÈGLEMENT INTÉRIEUR
          </Text>
          <Text>
            - Le logement doit être rendu dans l'état de propreté initial
          </Text>
          <Text>- Il est interdit de fumer à l'intérieur du logement</Text>
          <Text>
            - Les fêtes et événements sont interdits sans autorisation préalable
          </Text>
          <Text>- Le respect du voisinage est exigé (calme après 22h)</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
              Signé par le Locataire
            </Text>
            <Text style={styles.signatureLine}>
              (Paiement validé le {formatDate(data.createdAt)})
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
              Signé par le Propriétaire
            </Text>
            <Text style={styles.signatureLine}>
              (Signature électronique requise)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Contrat généré par NestHub Tunisie - {formatDate(new Date())}
          </Text>
          <Text>En cas de litige, veuillez contacter le support NestHub</Text>
        </View>
      </Page>
    </Document>
  );
}
