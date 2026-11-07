/**
 * ============================================================================
 * LegalCheck 360: AI Integration Service Header (Google Gemini API & Fallback)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef AI_SERVICE_H
#define AI_SERVICE_H

#include "../models/product.h"
#include <stdbool.h>

/**
 * Initialize curl and AI service subsystem
 */
bool ai_service_init(void);

/**
 * Cleanup AI service resources
 */
void ai_service_cleanup(void);

/**
 * Analyze package image using Gemini Multimodal Vision API.
 * If API key is not configured or network request fails, seamlessly falls back
 * to deterministic local packaging text extraction.
 * 
 * @param image_path Path to uploaded image
 * @param mime_type MIME type of image (image/jpeg, image/png, etc.)
 * @param existing_ocr_text Optional raw OCR text already extracted
 * @param scan_record Scan record struct to populate with extracted fields
 * @return true if extraction succeeded, false otherwise
 */
bool ai_analyze_packaging_image(const char *image_path, const char *mime_type, 
                                const char *existing_ocr_text, ScanRecord *scan_record);

/**
 * Extract declarations from text using deterministic regex/keywords
 */
bool ai_extract_local_fallback(const char *raw_text, const char *image_path, ScanRecord *scan_record);

#endif /* AI_SERVICE_H */

