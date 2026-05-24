// lib/receipt-pdf-generator.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { ReceiptPDF } from "./receipt/ReceiptPDF";

export async function generateReceiptPDF(receiptData: any): Promise<string> {
  try {
    const pdfComponent = ReceiptPDF({ data: receiptData });
    const pdfBuffer = await renderToBuffer(pdfComponent);
    return pdfBuffer.toString("base64");
  } catch (error) {
    console.error("Erreur génération reçu PDF:", error);
    throw new Error("Erreur lors de la génération du reçu");
  }
}
