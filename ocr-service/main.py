from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import numpy as np
from PIL import Image
import io
import re

app = FastAPI()

# Autoriser les requêtes depuis Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialiser EasyOCR (arabe + français)
reader = easyocr.Reader(['ar', 'en'], gpu=False)

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        # Lire l'image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image_np = np.array(image)

        # Extraire le texte
        results = reader.readtext(image_np)
        texts = [text for (_, text, confidence) in results if confidence > 0.3]
        full_text = " ".join(texts)

        print("📄 Texte extrait:", full_text)
        print("📄 Lignes:", texts)

        # Parser les infos de la CIN tunisienne
        parsed = parse_cin(texts, full_text)

        return {
            "success": True,
            "raw_text": full_text,
            "lines": texts,
            "parsed": parsed
        }

    except Exception as e:
        return {"success": False, "error": str(e)}


def parse_cin(lines: list, full_text: str):
    result = {
        "firstName": None,
        "lastName": None,
        "birthDate": None,
        "cinNumber": None,
    }

    # Chercher le numéro CIN (8 chiffres)
    cin_match = re.search(r'\b\d{8}\b', full_text)
    if cin_match:
        result["cinNumber"] = cin_match.group()

    # Chercher la date de naissance
    date_match = re.search(r'\b(\d{2})[./\-](\d{2})[./\-](\d{4})\b', full_text)
    if date_match:
        result["birthDate"] = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"

    # Chercher nom/prénom (lettres majuscules)
    name_lines = [l for l in lines if re.match(r'^[A-ZÀ-Ü\s]{3,}$', l.strip())]
    if len(name_lines) >= 2:
        result["lastName"] = name_lines[0].strip()
        result["firstName"] = name_lines[1].strip()
    elif len(name_lines) == 1:
        result["lastName"] = name_lines[0].strip()

    return result


@app.get("/health")
def health():
    return {"status": "ok"}