/**
 * ============================================================================
 * LegalCheck 360: JSON Helpers & Encoding Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef JSON_UTILS_H
#define JSON_UTILS_H

#include "../../lib/cJSON.h"
#include <stdbool.h>

/**
 * Safely extract string value from cJSON object
 */
const char* json_get_string(const cJSON *obj, const char *key, const char *default_val);

/**
 * Safely extract integer value from cJSON object
 */
int json_get_int(const cJSON *obj, const char *key, int default_val);

/**
 * Safely extract double value from cJSON object
 */
double json_get_double(const cJSON *obj, const char *key, double default_val);

/**
 * Create a standardized API success JSON response
 * { "success": true, "message": "...", "data": ... }
 */
char* json_create_success_response(cJSON *data_node, const char *message);

/**
 * Create a standardized API error JSON response
 * { "success": false, "error": "...", "code": ... }
 */
char* json_create_error_response(const char *error_msg, int status_code);

/**
 * Base64 encode binary buffer (useful for sending image bytes to Gemini API)
 * Caller must free the returned string.
 */
char* base64_encode(const unsigned char *data, size_t input_length);

/**
 * Base64 decode string to binary buffer
 * Caller must free returned buffer.
 */
unsigned char* base64_decode(const char *data, size_t input_length, size_t *out_len);

#endif /* JSON_UTILS_H */
