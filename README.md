# LegalCheck 360
### AI-Based Legal Metrology Compliance Checker
> **"Smart Packaging. Smarter Compliance."**

[![C99/C11](https://img.shields.io/badge/Language-C99%2FC11-blue.svg)](https://en.wikipedia.org/wiki/C_(programming_language))
[![Server](https://img.shields.io/badge/Server-Mongoose_Embedded_C-orange.svg)](https://mongoose.ws)
[![Database](https://img.shields.io/badge/Database-SQLite3-green.svg)](https://sqlite.org)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS-yellow.svg)](frontend/)
[![Compliance](https://img.shields.io/badge/Regulation-Legal_Metrology_Rules_2011-red.svg)](docs/legal_references.md)

---

## 1. Executive Summary

**LegalCheck 360** is an enterprise-grade, academically rigorous, full-stack regulatory compliance application designed to automate the inspection of packaged commodities under Indian law — specifically the **Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011)** and applicable amendments.

Packaged consumer commodities (biscuits, foods, beverages, cosmetics, household items) sold across India are legally mandated to display declarations including:
- Generic commodity name
- Net quantity in standard metric units
- Maximum Retail Price (MRP) inclusive of all taxes
- Manufacturer, packer, or importer name and complete physical address
- Month and year of manufacture or pre-packing
- Consumer care grievance contact details
- Country of origin
- Unit Sale Price (USP) where applicable

Manual inspection of millions of packaging SKUs creates substantial enforcement bottlenecks. **LegalCheck 360** provides an automated, evidence-based preliminary screening platform where users upload packaging photographs (front, back, and side views), optical character recognition reads printed packaging typography, AI assists with structured declaration extraction, and a **deterministic C-based rules engine** cross-references every extracted field against statutory requirements.

---

## 2. Technology Stack — Strict Academic Architecture

| Subsystem | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Core** | **C Programming Language (C11/C99)** | Mandatory academic backend logic, high performance, low latency, and memory safety. |
| **HTTP Web Server** | **Mongoose Embedded Web Engine** | High-concurrency C HTTP server, REST API routing, and static file serving. |
| **Database** | **SQLite3 (`-lsqlite3`)** | Relational data persistence with foreign keys, WAL mode, and prepared statements. |
| **JSON Processing** | **cJSON** | Ultra-portable C library for parsing and emitting structured API JSON payloads. |
| **HTTP Client** | **libcurl (`-lcurl`)** | Backend HTTPS communication with external AI endpoints. |
| **OCR Engine** | **Tesseract OCR & Optical Parser** | Optical character recognition for printed packaging typography. |
| **AI Intelligence** | **Google Gemini Multimodal API** | Structured packaging information parsing from packaging imagery. |
| **PDF Generation** | **Pure C Vector PDF Generator** | Dependency-free native C generation of Adobe PDF 1.4 compliance reports. |
| **Frontend** | **HTML5, CSS3, Vanilla JavaScript** | Responsive SaaS interface without external framework dependencies. |

---

## 3. Project Directory Structure

```
LegalCheck 360/
├── backend/
│   ├── src/
│   │   ├── main.c                   # Application entry point & signal handling
│   │   ├── server.c / server.h      # Mongoose HTTP server & API routing
│   │   ├── database/
│   │   │   ├── database.c / .h      # SQLite3 CRUD operations & prepared statements
│   │   ├── models/
│   │   │   └── product.h            # Core C structures (ScanRecord, ExtractedField, LegalRule)
│   │   ├── routes/
│   │   │   ├── dashboard_routes.c   # Dashboard analytics & health endpoints
│   │   │   ├── scan_routes.c        # Upload, inspection & report retrieval routes
│   │   │   ├── rule_routes.c        # Legal rules management API
│   │   │   └── review_routes.c      # Human reviewer decision & override routes
│   │   ├── rules/
│   │   │   ├── rules_engine.c / .h  # Deterministic Indian Legal Metrology Rules Engine
│   │   │   └── packaged_commodity_rules.json # Statutory rules seed data
│   │   ├── services/
│   │   │   ├── ocr_service.c / .h   # Tesseract OCR & image text reader
│   │   │   ├── ai_service.c / .h    # libcurl Gemini API integration & offline fallback
│   │   │   └── pdf_generator.c / .h # Pure C vector PDF compliance report compiler
│   │   └── utils/
│   │       ├── file_validation.c    # Magic byte checks (JPEG/PNG/WEBP) & security
│   │       ├── json_utils.c         # cJSON helpers & Base64 encoder/decoder
│   │       └── error_handler.c      # Thread-safe logging with timestamps
│   ├── lib/
│   │   ├── mongoose.c / mongoose.h  # Embedded C web server library
│   │   └── cJSON.c / cJSON.h        # C JSON parser library
│   ├── uploads/                     # Storage for uploaded packaging photographs
│   ├── reports/                     # Storage for compiled PDF compliance reports
│   └── .env.example                 # Environment configuration template
│
├── frontend/
│   ├── index.html                   # Public landing page with problem statement & features
│   ├── dashboard.html               # Inspector metrics dashboard with live stats
│   ├── upload.html                  # Multi-panel packaging upload & live scanning engine
│   ├── results.html                 # Comprehensive compliance matrix & report viewer
│   ├── history.html                 # Searchable inspection registry & audit log
│   ├── admin.html                   # Statutory legal rules management interface
│   ├── review.html                  # Side-by-side human inspector verification interface
│   ├── css/
│   │   ├── style.css                # Master design tokens, typography, and buttons
│   │   ├── dashboard.css            # Stat cards, tables, drag-and-drop, and badges
│   │   └── responsive.css           # Desktop, tablet, and mobile breakpoints
│   └── js/
│       ├── api.js                   # Centralized API fetch client
│       ├── main.js                  # Shared utilities & toast notifications
│       ├── dashboard.js             # Dashboard metrics aggregator
│       ├── upload.js                # Drag & drop, base64 encoder, and scanning stepper
│       ├── results.js               # Field breakdown, rule matrix, and PDF exporter
│       ├── history.js               # Filter & search audit trail
│       ├── admin.js                 # Rule management & status toggling
│       └── review.js                # Human review overrides & decision submission
│
├── database/
│   ├── schema.sql                   # SQLite schema with foreign keys and indexes
│   └── seed_rules.sql               # Authentic Indian Legal Metrology rules seed data
│
├── tests/
│   ├── test_compliance.c           # Automated C unit tests for rules engine & PDF
│   └── samples/                     # Sample packaging test photographs
│       ├── biscuit_front.jpg        # Compliant front packaging sample
│       ├── biscuit_back.jpg         # Compliant back panel with all Rule 6 declarations
│       └── noncompliant_snack.jpg   # Non-compliant sample with illegal units (oz) & missing MRP
│
├── docs/
│   ├── architecture.md              # System architecture & Mermaid flowcharts
│   ├── api_documentation.md         # Complete REST API reference with JSON payloads
│   ├── legal_references.md          # Official statutory legal references & citations
│   └── academic_explanation.md      # B.Tech CSE guide explaining C concepts to examiners
│
├── Makefile                         # Compilation, build, run, and test automation
└── README.md                        # Master documentation
```

---

## 4. Setup & Compilation Instructions

### Prerequisites
- macOS or Linux with a C compiler (`clang` or `gcc`)
- `make` utility
- `sqlite3` and `curl` libraries (standard on macOS and Linux)

### Step 1: Clone or Navigate to Directory
```bash
cd "LegalCheck 360"
```

### Step 2: Configure Environment (Optional)
```bash
cp backend/.env.example backend/.env
```
> **Note:** If you have a Google Gemini API Key, add it to `GEMINI_API_KEY=your_key_here` in `backend/.env`. If left empty, LegalCheck 360 automatically executes its high-accuracy local regex & keyword packaging extraction engine, functioning **100% offline without errors**.

### Step 3: Run Automated Unit Tests
Verify that the C rules engine, SQLite database, and PDF generator compile and pass all tests:
```bash
make test
```
**Expected Output:**
```
[PASS] Test 1: SQLite Database initialization and rule seeding verified.
[PASS] Test 2: Compliant packaged product successfully evaluated as PASS.
[PASS] Test 3: Non-compliant product correctly identified as FAIL.
[PASS] Test 4: Blurry/incomplete photo properly flagged as REVIEW_REQUIRED.
[PASS] Test 5: Vector PDF inspection report generated successfully.
ALL UNIT TESTS PASSED SUCCESSFULLY! (5/5)
```

### Step 4: Build and Start the Full-Stack Server
```bash
make all
./legalcheck360_server 8080
```
or simply:
```bash
make run
```

### Step 5: Open in Web Browser
Open your browser and navigate to:
```
http://localhost:8080
```

---

## 5. Academic Demonstration Walkthrough for Judges

To present **LegalCheck 360** before academic evaluators and judges, follow this step-by-step demonstration:

1. **Introduce the Real-World Problem:**
   - Open `http://localhost:8080` (Landing Page).
   - Explain that Indian Legal Metrology laws mandate 8+ declarations on pre-packaged goods, but manual checking is slow and prone to errors.
2. **Open the Dashboard:**
   - Click **"Dashboard"** to display real SQLite inspection statistics, pass/fail ratios, and historical scans.
3. **Inspect a Compliant Product:**
   - Click **"Upload & Inspect"**.
   - Select category `Packaged Food`.
   - In the panel tag, select **Front Panel** and upload `tests/samples/biscuit_front.jpg`.
   - Select **Back Panel** and upload `tests/samples/biscuit_back.jpg`.
   - Click **"Run Compliance Inspection"**.
   - Watch the interactive scanning pipeline animate through the 6 stages.
4. **Explain the Results & Compliance Matrix:**
   - Observe the overall status: **PASS (Score: 100%)**.
   - Show the extracted fields table (MRP ₹30, Net Qty 150g, Manufacturer Delight Foods, Consumer Care 1800-425-9999).
   - Switch to the **Statutory Compliance Matrix** tab to show Rule 6(1)(a), Rule 6(1)(c), Rule 6(1)(da) citations.
5. **Download the Official PDF Report:**
   - Click **"Download Official PDF Report"** to open the vector PDF compiled in pure C.
6. **Inspect a Non-Compliant Product:**
   - Click **"New Scan"** and upload `tests/samples/noncompliant_snack.jpg`.
   - Run the inspection and demonstrate how the rules engine catches violations:
     - Illegal non-metric unit (`16 oz` instead of `g/kg`)
     - Missing MRP in INR
     - Missing Indian manufacturer/importer address
   - Observe the outcome: **FAIL**.
7. **Demonstrate Human Review:**
   - Click **"Human Review Override"**. Show how an inspector can compare the physical packaging photo side-by-side, correct any OCR misreads, add auditor comments, and record a formal statutory review decision.

---

## 6. Regulatory Disclaimer

> **IMPORTANT STATUTORY NOTICE:**  
> **LegalCheck 360** is an automated educational and preliminary compliance audit platform designed for academic evaluation and pre-market compliance screening under the Legal Metrology (Packaged Commodities) Rules, 2011. This application does NOT issue official government certification, statutory approval, or legally binding determinations. In case of ambiguous or disputed markings, physical inspection by an authorized Legal Metrology Officer is mandatory.

---
*Developed for B.Tech Computer Science & Engineering (CSE) Academic Project Demonstration.*

