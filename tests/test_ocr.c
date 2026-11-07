/**
 * ============================================================================
 * LegalCheck 360: Unit Tests for OCR, File Signatures & Image Validation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "../backend/src/utils/file_validation.h"
#include "../backend/src/services/ocr_service.h"
#include "../backend/src/utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

int main(void) {
    LOG_INFO("==========================================================");
    LOG_INFO(" RUNNING LEGALCHECK 360 OCR & FILE SECURITY TESTS");
    LOG_INFO("==========================================================");

    // 1. Test JPEG Magic Bytes (FF D8 FF)
    unsigned char fake_jpeg[] = { 0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, 0x01 };
    ImageType t1 = validate_image_signature(fake_jpeg, sizeof(fake_jpeg));
    assert(t1 == IMG_TYPE_JPEG && "Expected IMG_TYPE_JPEG");
    LOG_INFO("[PASS] Test 1: JPEG signature (FF D8 FF) recognized.");

    // 2. Test PNG Magic Bytes (89 50 4E 47 0D 0A 1A 0A)
    unsigned char fake_png[] = { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D };
    ImageType t2 = validate_image_signature(fake_png, sizeof(fake_png));
    assert(t2 == IMG_TYPE_PNG && "Expected IMG_TYPE_PNG");
    LOG_INFO("[PASS] Test 2: PNG signature (89 50 4E 47) recognized.");

    // 3. Test Malicious Executable disguised as image (MZ header)
    unsigned char fake_exe[] = { 'M', 'Z', 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00 };
    ImageType t3 = validate_image_signature(fake_exe, sizeof(fake_exe));
    assert(t3 == IMG_TYPE_UNKNOWN && "Executable should be rejected as IMG_TYPE_UNKNOWN");
    LOG_INFO("[PASS] Test 3: Malicious file disguised as image successfully rejected.");

    // 4. Test Directory Traversal Sanitization
    char clean_name[128];
    sanitize_filename("../../etc/passwd", clean_name, sizeof(clean_name));
    assert(strcmp(clean_name, "passwd") == 0 && "Path traversal characters must be stripped");
    LOG_INFO("[PASS] Test 4: Directory traversal payload safely neutralized: '%s'", clean_name);

    // 5. Test Unique Scan ID Generation
    char scan_id[64];
    generate_scan_id(scan_id, sizeof(scan_id));
    assert(strncmp(scan_id, "LMC-", 4) == 0 && "Scan ID must begin with 'LMC-'");
    LOG_INFO("[PASS] Test 5: Scan ID format generated: %s", scan_id);

    // 6. Test Non-existent image handled gracefully
    char ocr_out[512] = "";
    bool ocr_err = ocr_extract_text_from_image("non_existent_file_xyz.jpg", ocr_out, sizeof(ocr_out));
    assert(!ocr_err && "Non-existent file should gracefully return false");
    LOG_INFO("[PASS] Test 6: Non-existent image file handled safely without crashing.");

    LOG_INFO("==========================================================");
    LOG_INFO(" ALL OCR & FILE SECURITY TESTS PASSED SUCCESSFULLY! (6/6)");
    LOG_INFO("==========================================================");
    return 0;
}

