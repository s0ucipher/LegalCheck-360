-- ============================================================================
-- LegalCheck 360: Database Schema (SQLite3)
-- "Smart Packaging. Smarter Compliance."
-- ============================================================================

PRAGMA foreign_keys = ON;

-- 1. Users table (Auditors, Inspectors, Administrators)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'inspector', 'reviewer', 'user')) DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scans table (Master inspection records)
CREATE TABLE IF NOT EXISTS scans (
    id TEXT PRIMARY KEY,                       -- UUID or formatted ID (e.g. LMC-2026-XXXX)
    user_id INTEGER,
    user_uid TEXT,                             -- Firebase Auth UID
    user_email TEXT,                           -- Authenticated user email
    is_guest INTEGER DEFAULT 1,                -- 1 = Guest inspection, 0 = Authenticated permanent
    product_name TEXT DEFAULT 'Unknown Product',
    category TEXT DEFAULT 'general_packaged_goods',
    brand_name TEXT DEFAULT '',
    raw_ocr_text TEXT DEFAULT '',
    overall_status TEXT CHECK(overall_status IN ('PASS', 'FAIL', 'UNCLEAR', 'PENDING', 'REVIEW_REQUIRED')) DEFAULT 'PENDING',
    compliance_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Uploaded Images table (Front, Back, Side packaging views)
CREATE TABLE IF NOT EXISTS uploaded_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    view_type TEXT CHECK(view_type IN ('front', 'back', 'side', 'top', 'bottom', 'general')) DEFAULT 'general',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE
);

-- 4. Extracted Fields table (Normalized product declarations with evidence)
CREATE TABLE IF NOT EXISTS extracted_fields (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id TEXT NOT NULL,
    field_name TEXT NOT NULL,                  -- product_name, mrp, net_quantity, manufacturer, mfg_date, consumer_care, country_of_origin
    field_value TEXT,                          -- Extracted parsed value
    unit TEXT DEFAULT '',                      -- Unit for net quantity or currency for MRP
    confidence REAL DEFAULT 0.0,               -- 0.0 to 1.0 confidence score
    evidence_text TEXT DEFAULT '',             -- Exact packaging text snippet where field was found
    source_image_id INTEGER,                   -- Reference to uploaded_images
    extraction_source TEXT DEFAULT 'OCR+AI',   -- OCR, AI, MANUAL_REVIEW
    is_verified INTEGER DEFAULT 0,             -- 1 if verified by human reviewer
    verified_by INTEGER,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(source_image_id) REFERENCES uploaded_images(id) ON DELETE SET NULL,
    FOREIGN KEY(verified_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Legal Rules table (Versioned regulatory requirements)
CREATE TABLE IF NOT EXISTS legal_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_id TEXT UNIQUE NOT NULL,              -- e.g. LMR-RULE-6-1-A
    rule_name TEXT NOT NULL,                   -- Name of the rule
    version TEXT DEFAULT '2011.amended.2022',
    category TEXT DEFAULT 'all',               -- all, packaged_food, beverages, cosmetics, electronics, etc.
    requirement TEXT NOT NULL,                 -- Full legal requirement description
    legal_reference TEXT NOT NULL,             -- Legal citation (e.g. Rule 6(1)(a) PCR 2011)
    applicable_conditions TEXT DEFAULT '',     -- JSON/Text conditions
    exemptions TEXT DEFAULT '',                -- Package size < 10g/10ml, industrial packages, etc.
    effective_from TEXT DEFAULT '2011-03-01',
    effective_to TEXT DEFAULT NULL,
    source_url TEXT DEFAULT 'https://consumeraffairs.nic.in/acts-and-rules/legal-metrology',
    verified_at TEXT DEFAULT '2026-01-15',
    active_status INTEGER DEFAULT 1            -- 1 = Active, 0 = Inactive
);

-- 6. Compliance Results table (Rule-by-rule evaluation results)
CREATE TABLE IF NOT EXISTS compliance_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id TEXT NOT NULL,
    rule_id TEXT NOT NULL,
    rule_version TEXT NOT NULL,
    result TEXT CHECK(result IN ('PASS', 'FAIL', 'UNCLEAR', 'NOT_APPLICABLE')) NOT NULL,
    explanation TEXT NOT NULL,
    evidence TEXT DEFAULT '',
    recommendation TEXT DEFAULT '',
    reviewer_status TEXT CHECK(reviewer_status IN ('UNREVIEWED', 'VERIFIED', 'OVERRIDDEN')) DEFAULT 'UNREVIEWED',
    evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(rule_id) REFERENCES legal_rules(rule_id) ON DELETE CASCADE
);

-- 7. Reviews table (Auditor/Inspector manual review decisions)
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_id TEXT NOT NULL,
    reviewer_id INTEGER,
    reviewer_name TEXT NOT NULL,
    decision TEXT CHECK(decision IN ('APPROVED', 'REJECTED', 'NEEDS_CORRECTION', 'PASS_WITH_REMARKS')) NOT NULL,
    comments TEXT NOT NULL,
    reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(scan_id) REFERENCES scans(id) ON DELETE CASCADE,
    FOREIGN KEY(reviewer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes for fast query lookup
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_overall_status ON scans(overall_status);
CREATE INDEX IF NOT EXISTS idx_images_scan_id ON uploaded_images(scan_id);
CREATE INDEX IF NOT EXISTS idx_extracted_fields_scan_id ON extracted_fields(scan_id);
CREATE INDEX IF NOT EXISTS idx_compliance_results_scan_id ON compliance_results(scan_id);
CREATE INDEX IF NOT EXISTS idx_rules_category ON legal_rules(category);

