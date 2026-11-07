# LegalCheck 360: REST API Documentation

**Application:** LegalCheck 360  
**Tagline:** Smart Packaging. Smarter Compliance.  
**Server Protocol:** HTTP/1.1 REST JSON API  
**C Server Implementation:** Mongoose High-Concurrency Embedded Web Engine  
**Default Base URL:** `http://localhost:8080`

---

## 1. System Health Check

### `GET /api/health`
Returns the operational health of the C server, database, OCR engine, and AI integration subsystem.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Server operational",
  "data": {
    "status": "healthy",
    "service": "LegalCheck 360 Compliance Server",
    "version": "1.0.0",
    "tesseract_ocr_available": true,
    "gemini_ai_configured": true
  }
}
```

---

## 2. Dashboard Analytics

### `GET /api/dashboard/stats`
Returns aggregated inspection metrics from the SQLite database.

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Dashboard statistics retrieved",
  "data": {
    "total_scans": 24,
    "completed_inspections": 21,
    "pending_reviews": 3,
    "pass_count": 18,
    "fail_count": 3,
    "unclear_count": 3,
    "compliance_rate": 85.7
  }
}
```

---

## 3. Product Packaging Inspection

### `POST /api/scans`
Submit packaging panel images (front, back, and side views) for automated OCR, multimodal AI extraction, and Legal Metrology compliance classification.

**Request Body (`application/json`):**
```json
{
  "product_name": "Royal Butter Delights Biscuits",
  "category": "packaged_food",
  "images": [
    {
      "view_type": "front",
      "filename": "biscuit_front.jpg",
      "mime_type": "image/jpeg",
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    },
    {
      "view_type": "back",
      "filename": "biscuit_back.jpg",
      "mime_type": "image/jpeg",
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    }
  ]
}
```

**Sample Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Product packaging inspection completed",
  "data": {
    "id": "LMC-2026-8A3F1",
    "product_name": "Royal Butter Delights Biscuits",
    "category": "packaged_food",
    "overall_status": "PASS",
    "compliance_score": 100.0,
    "fields": [
      {
        "id": 1,
        "field_name": "mrp",
        "field_value": "30.00",
        "unit": "INR",
        "confidence": 0.95,
        "evidence_text": "MRP Rs. 30.00 incl. of all taxes",
        "extraction_source": "GEMINI_AI"
      },
      {
        "id": 2,
        "field_name": "net_quantity",
        "field_value": "150",
        "unit": "g",
        "confidence": 0.96,
        "evidence_text": "Net Weight: 150 g",
        "extraction_source": "GEMINI_AI"
      }
    ],
    "results": [
      {
        "rule_id": "LMR-RULE-6-1-E",
        "rule_version": "2011.amended.2022",
        "result": "PASS",
        "explanation": "Maximum Retail Price declared as ₹30.00 inclusive of all taxes. Complies with Rule 6(1)(da).",
        "evidence": "₹30.00 (incl. of all taxes)",
        "recommendation": "Declaration satisfies statutory requirements under PCR 2011."
      }
    ]
  }
}
```

---

## 4. Scan Retrieval & PDF Report

### `GET /api/scans`
List past inspections with optional `status` filter (`PASS`, `FAIL`, `REVIEW_REQUIRED`, `ALL`).

### `GET /api/scans/:id`
Fetch complete inspection record, declaration fields, and compliance evaluations for a specific scan ID.

### `GET /api/scans/:id/pdf`
Directly download the vector PDF inspection report compiled by the C engine.

---

## 5. Regulatory Rules Management

### `GET /api/rules`
Fetch all active Legal Metrology rules with optional `category` query parameter.

### `POST /api/admin/rules`
Add or update a legal rule (requires JSON body with `rule_id`, `rule_name`, `category`, `requirement`, `legal_reference`).

### `POST /api/admin/rules/:id/toggle`
Toggle the active status of a rule (active = 1, inactive = 0).

---

## 6. Human Review & Overrides

### `POST /api/reviews/:id`
Submit human auditor verification decision, comments, and field overrides.

**Request Body (`application/json`):**
```json
{
  "reviewer_name": "Senior Metrology Auditor",
  "decision": "APPROVED",
  "comments": "Packaging physical sample examined. All declarations verified.",
  "field_overrides": [
    {
      "field_id": 1,
      "field_value": "30.00"
    }
  ]
}
```

