// lib/pdf-generator.ts
import { renderToBuffer } from "@react-pdf/renderer";
import { ContractPDF } from "@/lib/contracts/ContractPDF";

export async function generateContractPDF(contractData: any): Promise<string> {
  try {
    // Créer le composant PDF avec les données
    const pdfComponent = ContractPDF({ data: contractData });

    // Générer le buffer PDF
    const pdfBuffer = await renderToBuffer(pdfComponent);

    // Retourner en base64
    return pdfBuffer.toString("base64");
  } catch (error) {
    console.error("Erreur génération PDF:", error);
    throw new Error("Erreur lors de la génération du PDF");
  }
}
