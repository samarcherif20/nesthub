// components/pdf/ReceiptPDF.tsx
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Police simple
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "https://fonts.gstatic.com/s/helvetica-neue/v1/HelveticaNeue.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/helvetica-neue/v1/HelveticaNeue-Bold.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: "#ffffff",
  },
  
  header: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  brandName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 7,
    color: "#666666",
    letterSpacing: 1,
  },
  receiptBadge: {
    borderWidth: 1,
    borderColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  receiptBadgeText: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#000000",
    letterSpacing: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "center",
    marginTop: 5,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 8,
    color: "#666666",
    textAlign: "center",
    marginBottom: 10,
  },
  
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 8,
  },
  infoItem: {
    width: "50%",
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 1,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
  },
  
  section: {
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 5,
    paddingBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  
  propertyCard: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 8,
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  propertyAddress: {
    fontSize: 7,
    color: "#666666",
    marginBottom: 4,
  },
  
  datesGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  dateCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 6,
    marginHorizontal: 3,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 3,
  },
  dateValue: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 1,
  },
  dateSub: {
    fontSize: 6,
    color: "#666666",
  },
  
  table: {
    marginTop: 3,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingVertical: 4,
    marginBottom: 3,
  },
  tableHeaderDesc: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  tableHeaderAmount: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "right",
    width: 80,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  tableRowDesc: {
    fontSize: 8,
    color: "#000000",
  },
  tableRowAmount: {
    fontSize: 8,
    color: "#000000",
    textAlign: "right",
    width: 80,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#000000",
    paddingTop: 5,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
  },
  totalAmount: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    textAlign: "right",
    width: 80,
  },
  
  participantsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  participantCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    padding: 6,
  },
  participantRole: {
    fontSize: 6,
    fontWeight: "bold",
    color: "#666666",
    letterSpacing: 1,
    marginBottom: 4,
  },
  participantName: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 2,
  },
  participantEmail: {
    fontSize: 6,
    color: "#666666",
  },
  
  statusConfirmed: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  statusPending: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#666666",
  },
  statusPaid: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#000000",
  },
  statusUnpaid: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#666666",
  },
  
  footer: {
    position: "absolute",
    bottom: 25,
    left: 30,
    right: 30,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 6,
    color: "#666666",
    textAlign: "center",
    marginBottom: 1,
  },
});

interface ReceiptData {
  reference: string;
  bookingId: string;
  status: string;
  paymentStatus: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalPrice: number;
  cleaningFee: number;
  serviceFee: number;
  pricePerNight: number;
  listing: {
    title: string;
    governorate: string;
    delegation: string;
  };
  tenant: {
    firstName: string;
    lastName: string;
    email: string;
  };
  owner: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payment: {
    status: string;
    providerTransactionId?: string;
    paidAt?: Date;
  };
  createdAt: Date;
}

export function ReceiptPDF({ data }: { data: ReceiptData }) {
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
  const subtotal = data.pricePerNight * data.nights;
  const totalWithFees = data.totalPrice + data.cleaningFee + data.serviceFee;
  const isPaid = data.payment?.status === "PAID";

  const getStatusStyle = () => {
    if (data.status === "CONFIRMED") return styles.statusConfirmed;
    return styles.statusPending;
  };

  const getPaymentStyle = () => {
    if (isPaid) return styles.statusPaid;
    return styles.statusUnpaid;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brandName}>NESTHUB</Text>
              <Text style={styles.brandSub}>PLATEFORME DE LOCATION</Text>
            </View>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>REÇU OFFICIEL</Text>
            </View>
          </View>
          <Text style={styles.title}>CONFIRMATION DE RÉSERVATION</Text>
          <Text style={styles.subtitle}>Document faisant office de reçu</Text>
        </View>

        {/* INFORMATIONS */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>RÉFÉRENCE</Text>
            <Text style={styles.infoValue}>#{data.reference || data.bookingId.slice(-8)}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>DATE D'ÉMISSION</Text>
            <Text style={styles.infoValue}>{today}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>STATUT</Text>
            <Text style={getStatusStyle()}>
              {data.status === "CONFIRMED" ? "CONFIRMÉE" : data.status === "PENDING" ? "EN ATTENTE" : "ANNULÉE"}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>PAIEMENT</Text>
            <Text style={getPaymentStyle()}>
              {isPaid ? "PAYÉ" : "EN ATTENTE"}
            </Text>
          </View>
        </View>

        {/* PROPRIÉTÉ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROPRIÉTÉ</Text>
          <View style={styles.propertyCard}>
            <Text style={styles.propertyTitle}>{data.listing.title}</Text>
            <Text style={styles.propertyAddress}>
              {data.listing.governorate} {data.listing.delegation}
            </Text>
          </View>
        </View>

        {/* CALENDRIER */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CALENDRIER</Text>
          <View style={styles.datesGrid}>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>ARRIVÉE</Text>
              <Text style={styles.dateValue}>{formatDate(data.checkIn)}</Text>
              <Text style={styles.dateSub}>15:00 - 18:00</Text>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>DÉPART</Text>
              <Text style={styles.dateValue}>{formatDate(data.checkOut)}</Text>
              <Text style={styles.dateSub}>Avant 11:00</Text>
            </View>
            <View style={styles.dateCard}>
              <Text style={styles.dateLabel}>DURÉE</Text>
              <Text style={styles.dateValue}>{data.nights} nuits</Text>
              <Text style={styles.dateSub}>{data.guests} voyageur{data.guests > 1 ? "s" : ""}</Text>
            </View>
          </View>
        </View>

        {/* DÉTAILS FINANCIERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DÉTAILS FINANCIERS</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderDesc}>DESCRIPTION</Text>
              <Text style={styles.tableHeaderAmount}>MONTANT (TND)</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableRowDesc}>Séjour ({data.nights} nuits × {data.pricePerNight} TND)</Text>
              <Text style={styles.tableRowAmount}>{subtotal.toLocaleString("fr-FR")}</Text>
            </View>
            
            {data.cleaningFee > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableRowDesc}>Frais de ménage</Text>
                <Text style={styles.tableRowAmount}>{data.cleaningFee.toLocaleString("fr-FR")}</Text>
              </View>
            )}
            
            {data.serviceFee > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableRowDesc}>Frais de service</Text>
                <Text style={styles.tableRowAmount}>{data.serviceFee.toLocaleString("fr-FR")}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalAmount}>{totalWithFees.toLocaleString("fr-FR")} TND</Text>
            </View>
          </View>
        </View>

        {/* PARTICIPANTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PARTICIPANTS</Text>
          <View style={styles.participantsGrid}>
            <View style={styles.participantCard}>
              <Text style={styles.participantRole}>VOYAGEUR</Text>
              <Text style={styles.participantName}>{data.tenant.firstName} {data.tenant.lastName}</Text>
              <Text style={styles.participantEmail}>{data.tenant.email}</Text>
            </View>
            <View style={styles.participantCard}>
              <Text style={styles.participantRole}>HÔTE</Text>
              <Text style={styles.participantName}>{data.owner.firstName} {data.owner.lastName}</Text>
              <Text style={styles.participantEmail}>{data.owner.email}</Text>
            </View>
          </View>
        </View>

        {/* PAIEMENT */}
        {data.payment?.providerTransactionId && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PAIEMENT</Text>
            <View style={[styles.propertyCard, { flexDirection: "row", justifyContent: "space-between" }]}>
              <Text style={styles.participantName}>Transaction</Text>
              <Text style={[styles.participantName, { fontWeight: "bold" }]}>
                ****{data.payment.providerTransactionId.slice(-4)}
              </Text>
            </View>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NESTHUB Tunisie</Text>
          <Text style={styles.footerText}>Généré le {today}</Text>
          <Text style={styles.footerText}>Ce document fait office de reçu officiel</Text>
        </View>
        
      </Page>
    </Document>
  );
}