import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Fichier requis" },
        { status: 400 }
      );
    }

    // Envoyer l'image au service Python
    const pythonFormData = new FormData();
    pythonFormData.append("file", file);

    const response = await fetch("http://localhost:8000/ocr", {
      method: "POST",
      body: pythonFormData,
    });

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("❌ Erreur OCR:", error);
    return NextResponse.json(
      { error: error.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}