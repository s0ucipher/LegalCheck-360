/**
 * ============================================================================
 * LegalCheck 360: OCR Service Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef OCR_SERVICE_H
#define OCR_SERVICE_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Perform optical character recognition on an uploaded packaging image.
 * Uses Tesseract CLI if installed; if Tesseract is not found on the system,
 * seamlessly uses multimodal AI text extraction or returns extracted text.
 * 
 * @param image_path Path to image file on disk
 * @param out_text Output buffer to store extracted text
 * @param max_len Maximum length of output buffer
 * @return true if text was extracted successfully, false otherwise
 */
bool ocr_extract_text_from_image(const char *image_path, char *out_text, size_t max_len);

/**
 * Check if Tesseract OCR executable is available on system
 */
bool ocr_is_tesseract_available(void);

#endif /* OCR_SERVICE_H */

