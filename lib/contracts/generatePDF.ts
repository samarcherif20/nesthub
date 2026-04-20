import { renderToStream } from "@react-pdf/renderer";
import { ContractPDF } from "./ContractPDF";

export async function generateContractPDF(contractData: any): Promise<string> {
  // Créer le composant PDF avec les données
  const pdfComponent = ContractPDF({ data: contractData });
  
  // Générer le stream PDF
  const pdfStream = await renderToStream(pdfComponent);
  
  // Convertir en buffer
  const chunks: Buffer[] = [];
  for await (const chunk of pdfStream as any) {
    chunks.push(Buffer.from(chunk));
  }
  const pdfBuffer = Buffer.concat(chunks);
  
  // Retourner en base64
  return pdfBuffer.toString('base64');
}