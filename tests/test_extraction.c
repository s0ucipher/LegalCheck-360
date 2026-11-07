/**
 * ============================================================================
 * LegalCheck 360: Unit Tests for Packaging Information Extraction
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "../backend/src/models/product.h"
#include "../backend/src/services/ai_service.h"
#include "../backend/src/utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int main(void) {
    LOG_INFO("==========================================================");
    LOG_INFO(" RUNNING LEGALCHECK 360 EXTRACTION ENGINE TESTS");
    LOG_INFO("==========================================================");

    // 1. Test Packaging Text with MRP, Net Qty, Manufacturer, Helpline
    const char *packaging_text = 
        "BRITANNIA GOOD DAY BUTTER COOKIES\n"
        "Net Weight: 200 g\n"
        "MRP Rs. 40.00 (Inclusive of all taxes)\n"
        "Date of Manufacture: 11/2026\n"
        "Manufactured by: Britannia Industries Ltd., 5/1A Hungerford Street, Kolkata - 700017, West Bengal\n"
        "Consumer Care Cell Toll Free: 1800-425-4444\n"
        "Email: feedback@britindia.com\n"
        "Made in India\n";

    ScanRecord scan;
    memset(&scan, 0, sizeof(ScanRecord));
    strcpy(scan.id, "TEST-EXTRACT-001");

    bool ok = ai_extract_local_fallback(packaging_text, "dummy.jpg", &scan);
    assert(ok && "Local extraction fallback should succeed");

    // Verify Extracted Fields
    LOG_INFO("Extracted %d declarations from packaging text", scan.field_count);
    assert(scan.field_count >= 5 && "Expected at least 5 fields extracted");

    // Check MRP
    bool found_mrp = false;
    bool found_qty = false;
    bool found_mfg = false;
    bool found_origin = false;

    for (int i = 0; i < scan.field_count; i++) {
        if (strcmp(scan.fields[i].field_name, "mrp") == 0) {
            found_mrp = true;
            assert(atof(scan.fields[i].field_value) >= 39.0);
            LOG_INFO("[PASS] MRP parsed: %s %s", scan.fields[i].field_value, scan.fields[i].unit);
        }
        if (strcmp(scan.fields[i].field_name, "net_quantity") == 0) {
            found_qty = true;
            assert(strcmp(scan.fields[i].field_value, "200") == 0);
            assert(strcasecmp(scan.fields[i].unit, "g") == 0);
            LOG_INFO("[PASS] Net Quantity parsed: %s %s", scan.fields[i].field_value, scan.fields[i].unit);
        }
        if (strcmp(scan.fields[i].field_name, "manufacturer") == 0) {
            found_mfg = true;
            assert(strstr(scan.fields[i].field_value, "Britannia") != NULL);
            LOG_INFO("[PASS] Manufacturer parsed: %s", scan.fields[i].field_value);
        }
        if (strcmp(scan.fields[i].field_name, "country_of_origin") == 0) {
            found_origin = true;
            assert(strcmp(scan.fields[i].field_value, "India") == 0);
            LOG_INFO("[PASS] Country of Origin parsed: %s", scan.fields[i].field_value);
        }
    }

    assert(found_mrp && "MRP should be extracted");
    assert(found_qty && "Net Quantity should be extracted");
    assert(found_mfg && "Manufacturer should be extracted");
    assert(found_origin && "Country of origin should be extracted");

    LOG_INFO("==========================================================");
    LOG_INFO(" ALL EXTRACTION UNIT TESTS PASSED SUCCESSFULLY! (4/4)");
    LOG_INFO("==========================================================");
    return 0;
}

