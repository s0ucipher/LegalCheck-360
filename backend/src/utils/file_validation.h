/**
 * ============================================================================
 * LegalCheck 360: File Validation & Security Utilities Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef FILE_VALIDATION_H
#define FILE_VALIDATION_H

#include <stdbool.h>
#include <stddef.h>

/**
 * Supported image types
 */
typedef enum {
    IMG_TYPE_UNKNOWN = 0,
    IMG_TYPE_JPEG,
    IMG_TYPE_PNG,
    IMG_TYPE_WEBP
} ImageType;

/**
 * Check file signature (magic bytes) to ensure the uploaded file is a valid image.
 * Prevents malicious executable uploads disguised as images.
 */
ImageType validate_image_signature(const unsigned char *buffer, size_t length);

/**
 * Check if the MIME type matches the validated image signature
 */
bool is_valid_image_mime(const char *mime_type);

/**
 * Sanitize a filename to prevent directory traversal attacks (removes ../, slashes, nulls)
 */
void sanitize_filename(const char *input, char *output, size_t max_len);

/**
 * Generate a cryptographically / timestamped unique ID (e.g. "LMC-2026-8A3F1")
 */
void generate_scan_id(char *out_id, size_t max_len);

/**
 * Ensure required application directories (uploads, reports, db) exist
 */
bool ensure_directory_exists(const char *dir_path);

/**
 * Read an entire file into memory buffer (caller must free buffer)
 */
unsigned char* read_file_to_buffer(const char *filepath, size_t *out_size);

#endif /* FILE_VALIDATION_H */

