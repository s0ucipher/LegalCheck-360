/**
 * ============================================================================
 * LegalCheck 360: OCR Service Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "ocr_service.h"
#include "../utils/error_handler.h"
#include "../utils/file_validation.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

static int s_tesseract_checked = -1; // -1 = uncheck, 0 = false, 1 = true
static char s_tesseract_cmd[256] = "tesseract";

bool ocr_is_tesseract_available(void) {
    if (s_tesseract_checked != -1) {
        return (s_tesseract_checked == 1);
    }

    // Check custom environment variable first
    const char *env_cmd = getenv("TESSERACT_CMD");
    if (env_cmd && strlen(env_cmd) > 0) {
        snprintf(s_tesseract_cmd, sizeof(s_tesseract_cmd), "%s", env_cmd);
    }

    char test_cmd[512];
    snprintf(test_cmd, sizeof(test_cmd), "%s --version > /dev/null 2>&1", s_tesseract_cmd);
    int rc = system(test_cmd);

    if (rc == 0) {
        s_tesseract_checked = 1;
        LOG_INFO("Tesseract OCR engine detected on system (%s)", s_tesseract_cmd);
    } else {
        // Also test /opt/homebrew/bin/tesseract and /usr/local/bin/tesseract
        if (access("/opt/homebrew/bin/tesseract", X_OK) == 0) {
            snprintf(s_tesseract_cmd, sizeof(s_tesseract_cmd), "/opt/homebrew/bin/tesseract");
            s_tesseract_checked = 1;
            LOG_INFO("Tesseract OCR detected at /opt/homebrew/bin/tesseract");
        } else if (access("/usr/local/bin/tesseract", X_OK) == 0) {
            snprintf(s_tesseract_cmd, sizeof(s_tesseract_cmd), "/usr/local/bin/tesseract");
            s_tesseract_checked = 1;
            LOG_INFO("Tesseract OCR detected at /usr/local/bin/tesseract");
        } else {
            s_tesseract_checked = 0;
            LOG_WARN("Tesseract CLI not found. Multimodal Gemini Vision & optical fallback will handle text extraction.");
        }
    }

    return (s_tesseract_checked == 1);
}

bool ocr_extract_text_from_image(const char *image_path, char *out_text, size_t max_len) {
    if (!image_path || !out_text || max_len == 0) return false;
    out_text[0] = '\0';

    if (ocr_is_tesseract_available()) {
        char base_output[256];
        snprintf(base_output, sizeof(base_output), "/tmp/lmc_ocr_%ld_%d", (long)time(NULL), rand() % 10000);

        char cmd[1024];
        // Run tesseract with psm 1 (Automatic page segmentation with OSD) or psm 3
        snprintf(cmd, sizeof(cmd), "%s \"%s\" \"%s\" --psm 3 -l eng > /dev/null 2>&1", 
                 s_tesseract_cmd, image_path, base_output);

        LOG_INFO("Running Tesseract OCR on %s...", image_path);
        int rc = system(cmd);

        char txt_file[300];
        snprintf(txt_file, sizeof(txt_file), "%s.txt", base_output);

        if (rc == 0 && access(txt_file, R_OK) == 0) {
            size_t size = 0;
            unsigned char *buf = read_file_to_buffer(txt_file, &size);
            if (buf) {
                size_t copy_len = (size < max_len - 1) ? size : (max_len - 1);
                memcpy(out_text, buf, copy_len);
                out_text[copy_len] = '\0';
                free(buf);
                unlink(txt_file);
                LOG_INFO("OCR extracted %zu characters of packaging text via Tesseract", copy_len);
                return true;
            }
        }
        unlink(txt_file);
    }

    LOG_INFO("Using AI multimodal packaging reader for text extraction from %s", image_path);
    return false; // AI service will read the image directly via Gemini Multimodal Vision API
}

