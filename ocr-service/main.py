from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import easyocr
import numpy as np
from PIL import Image, ImageEnhance
import io
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

reader = easyocr.Reader(['ar', 'en'], gpu=False)

@app.post("/ocr")
async def extract_text(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        image = image.convert("RGB")

        # Améliorer la qualité de l'image
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(2.0)
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(2.0)

        image_np = np.array(image)

        results = reader.readtext(image_np)
        texts = [text for (_, text, confidence) in results if confidence > 0.3]
        full_text = " ".join(texts)

        print("📄 Texte extrait:", full_text)
        print("📄 Lignes:", texts)

        parsed = parse_cin(texts, full_text)
        print("✅ Parsed:", parsed)

        return {
            "success": True,
            "raw_text": full_text,
            "lines": texts,
            "parsed": parsed
        }

    except Exception as e:
        print("❌ Erreur OCR:", str(e))
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

    # Chercher l'année de naissance (4 chiffres commençant par 19 ou 20)
    year_match = re.search(r'\b(19|20)\d{2}\b', full_text)
    if year_match:
        result["birthDate"] = year_match.group()

    # Chercher les lignes arabes pour nom/prénom
    arabic_lines = [l for l in lines if re.search(r'[\u0600-\u06FF]', l) and len(l) > 3]
    if len(arabic_lines) >= 2:
        result["lastName"] = arabic_lines[0].strip()
        result["firstName"] = arabic_lines[1].strip()
    elif len(arabic_lines) == 1:
        result["lastName"] = arabic_lines[0].strip()

    return result


@app.get("/health")
def health():
    return {"status": "ok"}