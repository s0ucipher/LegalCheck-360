#!/usr/bin/env python3
"""
============================================================================
LegalCheck 360: Google Gemini AI Multimodal Packaging Analysis Service
"Smart Packaging. Smarter Compliance."
============================================================================

Authoritative Integration using Google's official Python SDK: `google-genai`
Preferred Model: `gemini-2.5-flash` (with automated fallback to `gemini-2.0-flash` / `gemini-1.5-flash`)
Environment Variable: `GEMINI_API_KEY`

Capabilities:
1. Multimodal Packaging Vision Analysis (Front/PDP, Back, Side Panels)
2. High-precision extraction of 13 statutory declarations under PCR 2011 & GSR 779(E)
3. Transcription of printed packaging typography (OCR)
4. AI-generated observations on packaging legibility, layout, and contrast
5. Identification of missing, ambiguous, or unreadable declarations
6. Reusable singleton client with safe error handling (timeouts, rate limits, quota)
"""

import os
import re
import json
import base64
import mimetypes
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

# --------------------------------------------------------------------------
# 1. Environment Variable Loading (.env support for Local & Render)
# --------------------------------------------------------------------------
def _load_env_files():
    """
    Loads GEMINI_API_KEY from candidate .env locations without overwriting
    existing system or Render environment variables.
    """
    candidates = [
        Path.cwd() / ".env",
        Path.cwd() / "backend" / ".env",
        Path.cwd() / "backend" / "python" / ".env",
        Path(__file__).parent / ".env",
        Path(__file__).parent.parent / ".env",
        Path(__file__).parent.parent.parent / ".env",
    ]
    for env_path in candidates:
        if env_path.is_file():
            try:
                from dotenv import load_dotenv
                load_dotenv(env_path, override=False)
            except ImportError:
                # Native fallback parser if python-dotenv is not installed
                try:
                    with open(env_path, "r", encoding="utf-8") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("#") and "=" in line:
                                k, v = line.split("=", 1)
                                k = k.strip()
                                v = v.strip().strip("'\"")
                                if k and not os.environ.get(k):
                                    os.environ[k] = v
                except Exception:
                    pass
            break

_load_env_files()

# --------------------------------------------------------------------------
# 2. Reusable Gemini Client Singleton
# --------------------------------------------------------------------------
_gemini_client = None
_client_init_attempted = False

def get_api_key() -> str:
    """Returns the configured GEMINI_API_KEY from the environment."""
    return os.environ.get("GEMINI_API_KEY", "").strip()

def is_gemini_configured() -> bool:
    """Checks whether a non-empty GEMINI_API_KEY is available."""
    key = get_api_key()
    return bool(key and len(key) > 5)

def get_gemini_client():
    """
    Returns a cached, properly configured Google GenAI client instance.
    Reuses the client across requests rather than creating a new one each time.
    """
    global _gemini_client, _client_init_attempted
    api_key = get_api_key()
    if not api_key:
        return None

    if _gemini_client is not None:
        return _gemini_client

    try:
        from google import genai
        _gemini_client = genai.Client(api_key=api_key)
        _client_init_attempted = True
        return _gemini_client
    except Exception as e:
        print(f"[Gemini Service] Warning initializing google-genai client: {e}")
        return None

# --------------------------------------------------------------------------
# 3. Model Fallback Hierarchy
# --------------------------------------------------------------------------
SUPPORTED_MODELS = [
    os.environ.get("GEMINI_MODEL", "gemini-2.5-flash"),
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
]
# Remove duplicates while preserving order
SUPPORTED_MODELS = list(dict.fromkeys([m for m in SUPPORTED_MODELS if m]))

# --------------------------------------------------------------------------
# 4. Packaging Analysis Prompt Definition
# --------------------------------------------------------------------------
LEGAL_PACKAGING_PROMPT = """
You are an expert Legal Metrology packaging auditor specializing in the Indian Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011) with all amendments including GSR 779(E) (Unit Sale Price) and FSSAI Packaging Regulations.

Analyze the attached packaging image(s) carefully. You may receive one or multiple views of a consumer packaged commodity (Front/PDP, Back, Side panels).

Extract all visible printed statutory packaging declarations and return a valid JSON object matching the exact schema below.

CRITICAL INSTRUCTIONS:
1. EVIDENTIARY ACCURACY: Only extract text that is visibly printed on the provided image(s). Do not guess or assume.
2. MISSING VS NOT VISIBLE: If a mandatory declaration is not visible on the provided panel(s), DO NOT assume it is absent from the actual product unless all packaging panels are clearly presented. Label its presence_status as "NOT_VISIBLE_ON_PROVIDED_PANELS" or "MISSING".
3. UNREADABLE / UNCERTAIN: If text is blurry, tiny, distorted, or cropped, mark its presence_status as "UNREADABLE" or "UNCLEAR" and set confidence < 0.5.
4. NON-METRIC UNITS: Check net quantity units. Under PCR 2011, standard metric units (g, kg, ml, l, count) are mandatory. Non-metric imperial units (e.g., oz, lbs, fl oz) are non-compliant under Rule 12 & 13.
5. MRP DECLARATION: Check if Maximum Retail Price has the statutory "inclusive of all taxes" or "incl. of all taxes" phrase.
6. UNIT SALE PRICE (USP): Check if Unit Sale Price is declared (e.g. per g, per 100g, per kg, per ml, per 100ml, per l) as mandated under GSR 779(E).
7. DATE OF PACKING: Identify month and year of manufacture, packing, or import (Rule 6(1)(d)).
8. COMPLETE ADDRESS: Identify complete physical address of manufacturer/packer/importer with postal PIN code.
9. CONSUMER CARE: Identify consumer helpline (telephone number, email, address) under Rule 6(1)(n).
10. COUNTRY OF ORIGIN: Mandatory country of origin statement (e.g. "Made in India", "Country of Origin: India").
11. OBSERVATIONS: Provide 2-4 professional AI visual observations on image clarity, typography, packaging integrity, and prominent claims.
12. POTENTIAL ISSUES: List any potential non-compliance warning flags for the human auditor to verify.

SCHEMA:
{
  "product_name": {"value": string or null, "evidence": string, "panel": string, "confidence": float},
  "generic_commodity_name": {"value": string or null, "evidence": string, "panel": string, "confidence": float},
  "net_quantity": {"value": string or null, "evidence": string, "unit": string, "is_metric": boolean, "panel": string, "confidence": float},
  "mrp": {"value": string or null, "raw_text": string, "includes_taxes_phrase": boolean, "panel": string, "confidence": float},
  "manufacturing_date": {"value": string or null, "raw_text": string, "panel": string, "confidence": float},
  "expiry_or_best_before": {"value": string or null, "raw_text": string, "panel": string, "confidence": float},
  "manufacturer": {"name": string or null, "complete_address": string or null, "pin_code": string or null, "raw_text": string, "panel": string, "confidence": float},
  "consumer_care": {"phone": string or null, "email": string or null, "address": string or null, "raw_text": string, "panel": string, "confidence": float},
  "country_of_origin": {"country": string or null, "raw_text": string, "panel": string, "confidence": float},
  "unit_sale_price": {"value": string or null, "raw_text": string, "panel": string, "confidence": float},
  "batch_number": {"value": string or null, "raw_text": string, "panel": string, "confidence": float},
  "fssai_license": {"license_number": string or null, "raw_text": string, "panel": string, "confidence": float},
  "dietary_emblem": {"type": "VEGETARIAN"|"NON_VEGETARIAN"|"NOT_APPLICABLE"|"NOT_FOUND", "description": string, "panel": string, "confidence": float},
  "raw_ocr_text": string,
  "ai_observations": [string],
  "potential_compliance_issues": [string],
  "uncertain_declarations": [string]
}
"""

# --------------------------------------------------------------------------
# 5. Image Processing & Multimodal Payload Builder
# --------------------------------------------------------------------------
def _decode_image_bytes(image_data: Any) -> Tuple[Optional[bytes], str]:
    """
    Accepts base64 string, data URL, bytes, or file path and returns (raw_bytes, mime_type).
    """
    if not image_data:
        return None, "image/jpeg"

    # Case A: Already bytes
    if isinstance(image_data, bytes):
        mime = "image/png" if image_data.startswith(b"\x89PNG") else "image/jpeg"
        return image_data, mime

    # Case B: String
    if isinstance(image_data, str):
        # 1. File path on disk
        if os.path.isfile(image_data):
            try:
                mime, _ = mimetypes.guess_type(image_data)
                with open(image_data, "rb") as f:
                    data = f.read()
                return data, mime or "image/jpeg"
            except Exception:
                pass

        # 2. Data URL (e.g. data:image/jpeg;base64,....)
        if image_data.startswith("data:"):
            try:
                header, b64 = image_data.split(",", 1)
                mime = header.split(";")[0].replace("data:", "").strip()
                raw = base64.b64decode(b64)
                return raw, mime or "image/jpeg"
            except Exception:
                pass

        # 3. Raw Base64 string
        try:
            raw = base64.b64decode(image_data)
            mime = "image/png" if raw.startswith(b"\x89PNG") else "image/jpeg"
            return raw, mime
        except Exception:
            pass

    return None, "image/jpeg"

# --------------------------------------------------------------------------
# 6. Core Gemini Analysis Function
# --------------------------------------------------------------------------
def analyze_packaging_with_gemini(
    images: List[Dict[str, Any]],
    declared_name: str = "",
    declared_category: str = "packaged_food",
    declared_custom_category: str = ""
) -> Dict[str, Any]:
    """
    Executes multimodal packaging inspection using Google's official GenAI SDK.
    Returns structured analysis or falls back safely if API key is not configured.
    """
    if not is_gemini_configured():
        return {
            "gemini_available": False,
            "error_type": "MISSING_API_KEY",
            "message": "GEMINI_API_KEY is not configured in environment. Operating in resilient local rules engine mode.",
            "data": None
        }

    client = get_gemini_client()
    if not client:
        return {
            "gemini_available": False,
            "error_type": "CLIENT_INIT_FAILED",
            "message": "Failed to initialize Google GenAI client.",
            "data": None
        }

    try:
        from google.genai import types
    except ImportError:
        return {
            "gemini_available": False,
            "error_type": "SDK_IMPORT_ERROR",
            "message": "google-genai SDK is not installed.",
            "data": None
        }

    # Prepare multimodal content parts
    contents = []

    # Add contextual inspection metadata
    context_note = f"Declared Commodity Name: {declared_name or 'Not Specified'}\n"
    context_note += f"Commodity Category: {declared_category}\n"
    if declared_custom_category:
        context_note += f"Custom Category: {declared_custom_category}\n"
    contents.append(context_note)

    # Convert uploaded images into Gemini Part objects
    valid_images_count = 0
    for idx, img in enumerate(images[:6]):  # Cap at 6 panels
        img_data = img.get("data") or img.get("file_path") or img.get("url")
        view_type = img.get("view_type") or f"panel_{idx+1}"
        filename = img.get("filename") or f"panel_{idx+1}.jpg"

        raw_bytes, mime = _decode_image_bytes(img_data)
        if raw_bytes and len(raw_bytes) > 100:
            # Enforce 15MB file size limit per image
            if len(raw_bytes) > 15 * 1024 * 1024:
                continue
            
            # Panel context header before each image
            contents.append(f"--- Packaging View: {view_type.upper()} ({filename}) ---")
            contents.append(types.Part.from_bytes(data=raw_bytes, mime_type=mime))
            valid_images_count += 1

    if valid_images_count == 0:
        return {
            "gemini_available": False,
            "error_type": "NO_VALID_IMAGES",
            "message": "No valid packaging photograph bytes could be decoded for Gemini vision analysis.",
            "data": None
        }

    # Add the statutory prompt
    contents.append(LEGAL_PACKAGING_PROMPT)

    # Configure Gemini Generation
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        temperature=0.1,  # Low temperature for deterministic factual extraction
    )

    last_error = None
    for model_name in SUPPORTED_MODELS:
        try:
            print(f"[Gemini Service] Sending packaging inspection request to model: {model_name}...")
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )

            if response and response.text:
                raw_json_str = response.text.strip()
                # Clean possible markdown fences
                if raw_json_str.startswith("```"):
                    raw_json_str = re.sub(r"^```(?:json)?\s*", "", raw_json_str)
                    raw_json_str = re.sub(r"\s*```$", "", raw_json_str)
                
                parsed_data = json.loads(raw_json_str)
                return {
                    "gemini_available": True,
                    "model_used": model_name,
                    "message": f"Successfully analyzed packaging using Google Gemini ({model_name}).",
                    "data": parsed_data
                }

        except Exception as e:
            err_msg = str(e)
            print(f"[Gemini Service] Model {model_name} encountered an issue: {err_msg}")
            last_error = err_msg
            # If it's a rate limit, quota, or 404 model not found, try next model in hierarchy
            continue

    # All model attempts exhausted
    error_summary = "Gemini API request failed. "
    if "RESOURCE_EXHAUSTED" in str(last_error) or "quota" in str(last_error).lower():
        error_summary += "API quota or rate limit reached. Please check your Gemini API quota."
    elif "API_KEY_INVALID" in str(last_error) or "UNAUTHENTICATED" in str(last_error):
        error_summary += "The configured GEMINI_API_KEY was rejected by Google Gemini API."
    else:
        error_summary += "Unable to complete visual inspection at this moment."

    return {
        "gemini_available": False,
        "error_type": "API_EXECUTION_FAILURE",
        "message": error_summary,
        "data": None
    }

# --------------------------------------------------------------------------
# 7. Convert Gemini Structured Output to LegalCheck 360 Fields Format
# --------------------------------------------------------------------------
def map_gemini_to_legalcheck_fields(gemini_data: Dict[str, Any], fallback_product_name: str = "") -> List[Dict[str, Any]]:
    """
    Transforms Gemini's structured JSON dictionary into the standard
    LegalCheck 360 fields array expected by the rules engine and UI.
    """
    if not gemini_data:
        return []

    fields = []
    field_id = 1

    def add_f(field_name, val, conf, evid, source):
        nonlocal field_id
        if val is not None and str(val).strip():
            fields.append({
                "id": field_id,
                "field_name": field_name,
                "field_value": str(val).strip(),
                "confidence": round(float(conf or 0.95), 2),
                "evidence_text": str(evid or val).strip(),
                "source_view": str(source or "front").lower(),
                "is_verified": 1 if (conf or 0.95) >= 0.7 else 0
            })
            field_id += 1

    # 1. Product Name
    pname_obj = gemini_data.get("product_name") or {}
    p_val = pname_obj.get("value") or fallback_product_name
    add_f("product_name", p_val, pname_obj.get("confidence", 0.98), pname_obj.get("evidence", p_val), pname_obj.get("panel", "front"))

    # 2. Net Quantity
    net_obj = gemini_data.get("net_quantity") or {}
    if net_obj.get("value"):
        add_f("net_quantity", net_obj.get("value"), net_obj.get("confidence", 0.96), net_obj.get("evidence", net_obj.get("value")), net_obj.get("panel", "front"))

    # 3. Maximum Retail Price (MRP)
    mrp_obj = gemini_data.get("mrp") or {}
    mrp_val = mrp_obj.get("value") or mrp_obj.get("raw_text")
    if mrp_val:
        add_f("mrp", mrp_val, mrp_obj.get("confidence", 0.95), mrp_obj.get("raw_text", mrp_val), mrp_obj.get("panel", "back"))

    # 4. Manufacturing / Packing Date
    mfg_obj = gemini_data.get("manufacturing_date") or {}
    mfg_val = mfg_obj.get("value") or mfg_obj.get("raw_text")
    if mfg_val:
        add_f("manufacturing_date", mfg_val, mfg_obj.get("confidence", 0.94), mfg_obj.get("raw_text", mfg_val), mfg_obj.get("panel", "back"))

    # 5. Manufacturer Name & Complete Address
    mfr_obj = gemini_data.get("manufacturer") or {}
    mfr_addr = mfr_obj.get("complete_address") or mfr_obj.get("name") or mfr_obj.get("raw_text")
    if mfr_addr:
        add_f("manufacturer_name_address", mfr_addr, mfr_obj.get("confidence", 0.95), mfr_obj.get("raw_text", mfr_addr), mfr_obj.get("panel", "back"))

    # 6. Consumer Care Helpline & Email
    care_obj = gemini_data.get("consumer_care") or {}
    care_parts = []
    if care_obj.get("phone"): care_parts.append(f"Phone: {care_obj.get('phone')}")
    if care_obj.get("email"): care_parts.append(f"Email: {care_obj.get('email')}")
    care_val = " | ".join(care_parts) if care_parts else (care_obj.get("raw_text") or "")
    if care_val:
        add_f("consumer_care", care_val, care_obj.get("confidence", 0.93), care_obj.get("raw_text", care_val), care_obj.get("panel", "back"))

    # 7. Country of Origin
    origin_obj = gemini_data.get("country_of_origin") or {}
    origin_val = origin_obj.get("country") or origin_obj.get("raw_text")
    if origin_val:
        add_f("country_of_origin", origin_val, origin_obj.get("confidence", 0.99), origin_obj.get("raw_text", origin_val), origin_obj.get("panel", "back"))

    # 8. Unit Sale Price (USP)
    usp_obj = gemini_data.get("unit_sale_price") or {}
    usp_val = usp_obj.get("value") or usp_obj.get("raw_text")
    if usp_val:
        add_f("unit_sale_price", usp_val, usp_obj.get("confidence", 0.92), usp_obj.get("raw_text", usp_val), usp_obj.get("panel", "back"))

    # 9. FSSAI License Number (Food safety)
    fssai_obj = gemini_data.get("fssai_license") or {}
    fssai_val = fssai_obj.get("license_number") or fssai_obj.get("raw_text")
    if fssai_val:
        add_f("fssai_license", fssai_val, fssai_obj.get("confidence", 0.97), fssai_obj.get("raw_text", fssai_val), fssai_obj.get("panel", "back"))

    # 10. Dietary Emblem (Veg / Non-Veg)
    diet_obj = gemini_data.get("dietary_emblem") or {}
    diet_val = diet_obj.get("type") or diet_obj.get("description")
    if diet_val and diet_val != "NOT_FOUND":
        add_f("veg_logo", diet_val, diet_obj.get("confidence", 0.96), diet_obj.get("description", diet_val), diet_obj.get("panel", "front"))

    # 11. Batch / Lot Number
    batch_obj = gemini_data.get("batch_number") or {}
    batch_val = batch_obj.get("value") or batch_obj.get("raw_text")
    if batch_val:
        add_f("batch_number", batch_val, batch_obj.get("confidence", 0.90), batch_obj.get("raw_text", batch_val), batch_obj.get("panel", "side2"))

    return fields
