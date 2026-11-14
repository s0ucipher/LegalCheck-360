#!/usr/bin/env python3
"""
============================================================================
LegalCheck 360: Google Gemini AI Vision Integration Automated Test Suite
"Smart Packaging. Smarter Compliance."
============================================================================

Verifies:
1. Reusable singleton and environment variable loading
2. Multimodal packaging image decoder (base64, data URLs, bytes)
3. Safe error handling when GEMINI_API_KEY is not set (zero crash guarantee)
4. Field mapper from Gemini JSON schema to LegalCheck 360 fields format
5. Flask REST API routes (/api/gemini/status, /api/gemini/analyze, /api/scans)
6. Deterministic legal metrology rules engine integration with AI vision
7. Optional live API test if GEMINI_API_KEY is present
"""

import os
import sys
import json
import base64
import unittest
from pathlib import Path

# Add backend/python to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend" / "python"))

import gemini_service
from app import app


class TestGeminiIntegration(unittest.TestCase):

    def setUp(self):
        self.app = app
        self.client = self.app.test_client()

    def test_01_environment_and_config(self):
        """Test safe environment loading and config checks."""
        # Check function exists and returns boolean
        is_conf = gemini_service.is_gemini_configured()
        self.assertIsInstance(is_conf, bool)
        # Check supported models list
        self.assertIn("gemini-2.5-flash", gemini_service.SUPPORTED_MODELS)
        self.assertIn("gemini-2.0-flash", gemini_service.SUPPORTED_MODELS)
        print("[TEST 1 PASSED] Gemini environment loading and model hierarchy verified.")

    def test_02_image_decoder_formats(self):
        """Test multimodal image decoder with bytes, data URLs, and base64."""
        # 1. Raw bytes (PNG magic header)
        png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
        raw, mime = gemini_service._decode_image_bytes(png_bytes)
        self.assertEqual(mime, "image/png")
        self.assertEqual(raw, png_bytes)

        # 2. Data URL
        sample_b64 = base64.b64encode(b"fake-image-bytes-for-test-purposes").decode("ascii")
        data_url = f"data:image/jpeg;base64,{sample_b64}"
        raw, mime = gemini_service._decode_image_bytes(data_url)
        self.assertEqual(mime, "image/jpeg")
        self.assertEqual(raw, b"fake-image-bytes-for-test-purposes")

        # 3. Raw Base64 string
        raw, mime = gemini_service._decode_image_bytes(sample_b64)
        self.assertEqual(raw, b"fake-image-bytes-for-test-purposes")

        # 4. None / empty
        raw, mime = gemini_service._decode_image_bytes(None)
        self.assertIsNone(raw)
        print("[TEST 2 PASSED] Multimodal image decoder handles bytes, data URLs, and base64 flawlessly.")

    def test_03_missing_key_graceful_fallback(self):
        """Verify that when GEMINI_API_KEY is missing, no exceptions occur and safe response is returned."""
        # Temporarily mock empty key
        orig_key = os.environ.get("GEMINI_API_KEY")
        if "GEMINI_API_KEY" in os.environ:
            del os.environ["GEMINI_API_KEY"]

        try:
            res = gemini_service.analyze_packaging_with_gemini(
                images=[{"data": "data:image/jpeg;base64," + base64.b64encode(b"sample").decode("ascii")}],
                declared_name="Sample Biscuit",
                declared_category="packaged_food"
            )
            self.assertFalse(res["gemini_available"])
            self.assertEqual(res["error_type"], "MISSING_API_KEY")
            self.assertIn("resilient", res["message"].lower())
            self.assertIsNone(res["data"])
        finally:
            if orig_key is not None:
                os.environ["GEMINI_API_KEY"] = orig_key

        print("[TEST 3 PASSED] Safe fallback active when GEMINI_API_KEY is not configured.")

    def test_04_gemini_field_mapping(self):
        """Test mapping from Gemini structured JSON schema to LegalCheck 360 fields format."""
        mock_gemini_json = {
            "product_name": {"value": "Britannia 50-50 Maska Chaska", "evidence": "Britannia 50-50 Maska Chaska", "panel": "front", "confidence": 0.99},
            "net_quantity": {"value": "120 g", "evidence": "Net Weight: 120 g", "unit": "g", "is_metric": True, "panel": "front", "confidence": 0.98},
            "mrp": {"value": "30.00 INR (incl. of all taxes)", "raw_text": "MRP Rs. 30.00 (Incl. of all taxes)", "panel": "back", "confidence": 0.97},
            "manufacturing_date": {"value": "02/2026", "raw_text": "Mfg: 02/2026", "panel": "back", "confidence": 0.95},
            "manufacturer": {"name": "Britannia Industries Ltd", "complete_address": "Britannia Industries, Kolkata - 700017", "pin_code": "700017", "raw_text": "Mfd by: Britannia Industries, Kolkata 700017", "panel": "back", "confidence": 0.96},
            "consumer_care": {"phone": "1800-425-4449", "email": "feedback@britannia.co.in", "raw_text": "1800-425-4449 | feedback@britannia.co.in", "panel": "back", "confidence": 0.95},
            "country_of_origin": {"country": "India", "raw_text": "Country of Origin: India", "panel": "back", "confidence": 0.99},
            "unit_sale_price": {"value": "0.25 INR / g", "raw_text": "Unit Sale Price: Rs. 0.25/g", "panel": "back", "confidence": 0.93},
            "fssai_license": {"license_number": "10015043001129", "raw_text": "FSSAI Lic. No. 10015043001129", "panel": "back", "confidence": 0.98},
            "dietary_emblem": {"type": "VEGETARIAN", "description": "Green Dot in Green Square", "panel": "front", "confidence": 0.98},
            "batch_number": {"value": "B2602", "raw_text": "Batch: B2602", "panel": "side2", "confidence": 0.92}
        }

        fields = gemini_service.map_gemini_to_legalcheck_fields(mock_gemini_json, fallback_product_name="Fallback")
        self.assertTrue(len(fields) >= 10)
        field_dict = {f["field_name"]: f for f in fields}

        self.assertEqual(field_dict["product_name"]["field_value"], "Britannia 50-50 Maska Chaska")
        self.assertEqual(field_dict["net_quantity"]["field_value"], "120 g")
        self.assertEqual(field_dict["country_of_origin"]["field_value"], "India")
        self.assertEqual(field_dict["unit_sale_price"]["field_value"], "0.25 INR / g")
        self.assertEqual(field_dict["fssai_license"]["field_value"], "10015043001129")
        self.assertEqual(field_dict["veg_logo"]["field_value"], "VEGETARIAN")
        print("[TEST 4 PASSED] Gemini structured declarations mapped accurately to LegalCheck 360 fields format.")

    def test_05_flask_gemini_status_route(self):
        """Test GET /api/gemini/status route."""
        res = self.client.get("/api/gemini/status")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn("configured", data)
        self.assertIn("status", data)
        self.assertEqual(data["preferred_model"], "gemini-2.5-flash")
        print("[TEST 5 PASSED] GET /api/gemini/status returned operational metadata.")

    def test_06_flask_scan_creation_and_ai_metadata(self):
        """Test POST /api/scans attaches ai_analysis metadata and deterministic rules engine decisions."""
        payload = {
            "product_name": "Organic Almond Butter 350g",
            "category": "packaged_food",
            "custom_category": ""
        }
        res = self.client.post("/api/scans", json=payload)
        self.assertEqual(res.status_code, 201)
        body = res.get_json()
        self.assertTrue(body["success"])
        scan = body["data"]

        # Check fields and legal compliance
        self.assertTrue(scan["id"].startswith("LMC-"))
        self.assertEqual(scan["product_name"], "Organic Almond Butter 350g")
        self.assertIn(scan["overall_status"], ["PASS", "FAIL", "REVIEW_REQUIRED"])
        self.assertIsInstance(scan["compliance_score"], (int, float))

        # Check ai_analysis metadata
        self.assertIn("ai_analysis", scan)
        ai_meta = scan["ai_analysis"]
        self.assertIn("status", ai_meta)
        self.assertIn("observations", ai_meta)
        self.assertIsInstance(ai_meta["observations"], list)

        # Verify retrieval via GET /api/scans/<id>
        get_res = self.client.get(f"/api/scans/{scan['id']}")
        self.assertEqual(get_res.status_code, 200)
        retrieved = get_res.get_json()["data"]
        self.assertEqual(retrieved["id"], scan["id"])
        self.assertIn("ai_analysis", retrieved)
        print("[TEST 6 PASSED] Scan created and persisted with deterministic rules and AI metadata.")

    def test_07_demo_scan_gemini_metadata(self):
        """Verify academic demo scans return AI benchmark inspection analysis."""
        res = self.client.get("/api/scans/LMC-2026-PASS-001")
        self.assertEqual(res.status_code, 200)
        data = res.get_json()["data"]
        self.assertEqual(data["id"], "LMC-2026-PASS-001")
        self.assertEqual(data["overall_status"], "PASS")
        self.assertEqual(data["compliance_score"], 100.0)
        self.assertIn("ai_analysis", data)
        self.assertEqual(data["ai_analysis"]["status"], "SAMPLE_BENCHMARK")
        self.assertEqual(data["ai_analysis"]["model_used"], "gemini-2.5-flash")
        print("[TEST 7 PASSED] Academic benchmark scan returns complete regulatory vision metadata.")

    def test_08_live_gemini_api_if_key_available(self):
        """If GEMINI_API_KEY is available in the environment, verify SDK client configuration."""
        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            print("[TEST 8 SKIPPED] GEMINI_API_KEY not in environment; skipping live Google API network call.")
            return

        from google import genai
        client = genai.Client(api_key=api_key)
        self.assertIsNotNone(client)
        print("[TEST 8 PASSED] Google GenAI SDK client successfully initialized with GEMINI_API_KEY.")


if __name__ == "__main__":
    unittest.main(verbosity=2)
