/**
 * ============================================================================
 * LegalCheck 360: Unit Tests for Legal Rules Engine & Compliance Classifier
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "../backend/src/models/product.h"
#include "../backend/src/database/database.h"
#include "../backend/src/rules/rules_engine.h"
#include "../backend/src/services/pdf_generator.h"
#include "../backend/src/utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>
#include <unistd.h>

static void add_field(ScanRecord *scan, const char *name, const char *val, const char *unit, double conf, const char *evid) {
    ExtractedField *f = &scan->fields[scan->field_count++];
    memset(f, 0, sizeof(ExtractedField));
    snprintf(f->scan_id, MAX_ID_LEN, "%s", scan->id);
    snprintf(f->field_name, 64, "%s", name);
    snprintf(f->field_value, MAX_TEXT_LEN, "%s", val);
    if (unit) snprintf(f->unit, 32, "%s", unit);
    f->confidence = conf;
    if (evid) snprintf(f->evidence_text, MAX_TEXT_LEN, "%s", evid);
    snprintf(f->extraction_source, 32, "TEST_FIXTURE");
}

int main(void) {
    LOG_INFO("==========================================================");
    LOG_INFO(" RUNNING LEGALCHECK 360 AUTOMATED COMPLIANCE TESTS");
    LOG_INFO("==========================================================");

    // 1. Initialize DB with test database
    unlink("database/test_legalcheck.db");
    bool db_ok = db_init("database/test_legalcheck.db");
    assert(db_ok && "Database initialization failed");
    LOG_INFO("[PASS] Test 1: SQLite Database initialization and rule seeding verified.");

    rules_engine_init();

    // 2. Test Compliant Product (e.g. Parle-G / Britannia Biscuits)
    ScanRecord pass_scan;
    memset(&pass_scan, 0, sizeof(ScanRecord));
    strcpy(pass_scan.id, "TEST-SCAN-PASS-001");
    strcpy(pass_scan.product_name, "Royal Butter Delights Biscuits");
    strcpy(pass_scan.category, "packaged_food");
    pass_scan.image_count = 2;

    add_field(&pass_scan, "product_name", "Royal Butter Delights", "", 0.98, "Royal Butter Delights");
    add_field(&pass_scan, "mrp", "30.00", "INR", 0.95, "MRP Rs. 30.00 incl. of all taxes");
    add_field(&pass_scan, "net_quantity", "150", "g", 0.96, "Net Weight: 150 g");
    add_field(&pass_scan, "manufacturer", "Delight Bakers Pvt Ltd, Plot 14, Industrial Area, Bangalore 560099, Karnataka", "", 0.92, "Mfd by: Delight Bakers Pvt Ltd, Bangalore");
    add_field(&pass_scan, "mfg_date", "10/2026", "", 0.90, "PKD 10/2026");
    add_field(&pass_scan, "expiry_date", "04/2027", "", 0.90, "Best Before 6 months from packaging");
    add_field(&pass_scan, "consumer_care", "Helpdesk: 1800-425-9999, Email: care@delightbakers.in", "", 0.94, "Consumer Care Toll Free 1800-425-9999");
    add_field(&pass_scan, "country_of_origin", "India", "", 0.98, "Made in India");

    bool eval_pass = rules_engine_evaluate_scan(&pass_scan);
    assert(eval_pass && "Rules evaluation failed");
    LOG_INFO("Pass Scan Result: %s (Compliance Score: %.1f%%)", pass_scan.overall_status, pass_scan.compliance_score);
    assert(strcmp(pass_scan.overall_status, "PASS") == 0 && "Expected PASS status for fully compliant product");
    LOG_INFO("[PASS] Test 2: Compliant packaged product successfully evaluated as PASS.");

    // 3. Test Non-Compliant Product (Illegal non-metric units, missing MRP, missing consumer care)
    ScanRecord fail_scan;
    memset(&fail_scan, 0, sizeof(ScanRecord));
    strcpy(fail_scan.id, "TEST-SCAN-FAIL-002");
    strcpy(fail_scan.product_name, "Imported Caramel Fudge");
    strcpy(fail_scan.category, "packaged_food");
    fail_scan.image_count = 2; // Both front and back scanned

    add_field(&fail_scan, "product_name", "Imported Caramel Fudge", "", 0.95, "Caramel Fudge");
    // Net quantity declared in non-metric "oz" (Illegal under Rule 12 PCR 2011)
    add_field(&fail_scan, "net_quantity", "16", "oz", 0.90, "Net Wt. 16 oz");
    // Missing MRP completely
    // Missing Consumer Care completely

    rules_engine_evaluate_scan(&fail_scan);
    LOG_INFO("Fail Scan Result: %s (Compliance Score: %.1f%%)", fail_scan.overall_status, fail_scan.compliance_score);
    assert(strcmp(fail_scan.overall_status, "FAIL") == 0 && "Expected FAIL status for non-compliant product");
    LOG_INFO("[PASS] Test 3: Non-compliant product correctly identified as FAIL.");

    // 4. Test Unclear Case (Single blurry photo, declarations uncertain)
    ScanRecord unclear_scan;
    memset(&unclear_scan, 0, sizeof(ScanRecord));
    strcpy(unclear_scan.id, "TEST-SCAN-UNCLEAR-003");
    strcpy(unclear_scan.product_name, "Unknown Product");
    strcpy(unclear_scan.category, "all");
    unclear_scan.image_count = 1; // Only 1 photo, incomplete

    rules_engine_evaluate_scan(&unclear_scan);
    LOG_INFO("Unclear Scan Result: %s (Compliance Score: %.1f%%)", unclear_scan.overall_status, unclear_scan.compliance_score);
    assert(strcmp(unclear_scan.overall_status, "REVIEW_REQUIRED") == 0 && "Expected REVIEW_REQUIRED for blurry/partial scan");
    LOG_INFO("[PASS] Test 4: Blurry/incomplete photo properly flagged as REVIEW_REQUIRED.");

    // 5. Test PDF Report Generation
    bool pdf_ok = pdf_generate_compliance_report(&pass_scan, "build/test_compliance_report.pdf");
    assert(pdf_ok && "PDF generation failed");
    assert(access("build/test_compliance_report.pdf", R_OK) == 0 && "PDF file does not exist on disk");
    LOG_INFO("[PASS] Test 5: Vector PDF inspection report generated successfully at build/test_compliance_report.pdf");

    db_close();
    unlink("database/test_legalcheck.db");

    LOG_INFO("==========================================================");
    LOG_INFO(" ALL UNIT TESTS PASSED SUCCESSFULLY! (5/5)");
    LOG_INFO("==========================================================");
    return 0;
}

