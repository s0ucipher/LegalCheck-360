/**
 * ============================================================================
 * LegalCheck 360: Product Models & Core Data Structures
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Academic Purpose:
 * Demonstrates C structs, typedefs, enums, fixed-size buffers, and memory
 * layouts suitable for a first-year B.Tech CSE project.
 */

#ifndef PRODUCT_MODELS_H
#define PRODUCT_MODELS_H

#include <stddef.h>
#include <stdbool.h>
#include <string.h>

#define MAX_ID_LEN 64
#define MAX_NAME_LEN 256
#define MAX_TEXT_LEN 1024
#define MAX_LONG_TEXT_LEN 4096
#define MAX_PATH_LEN 512
#define MAX_FIELDS_PER_SCAN 32
#define MAX_RULES_PER_SCAN 32
#define MAX_IMAGES_PER_SCAN 8

/**
 * Result Classification according to Legal Metrology compliance standard
 */
typedef enum {
    COMPLIANCE_PASS = 0,
    COMPLIANCE_FAIL,
    COMPLIANCE_UNCLEAR,
    COMPLIANCE_NOT_APPLICABLE
} ComplianceStatus;

/**
 * Convert ComplianceStatus enum to human-readable string
 */
static inline const char* compliance_status_to_string(ComplianceStatus status) {
    switch (status) {
        case COMPLIANCE_PASS: return "PASS";
        case COMPLIANCE_FAIL: return "FAIL";
        case COMPLIANCE_UNCLEAR: return "UNCLEAR";
        case COMPLIANCE_NOT_APPLICABLE: return "NOT_APPLICABLE";
        default: return "UNCLEAR";
    }
}

/**
 * Convert string to ComplianceStatus enum
 */
static inline ComplianceStatus string_to_compliance_status(const char* str) {
    if (!str) return COMPLIANCE_UNCLEAR;
    if (strcmp(str, "PASS") == 0) return COMPLIANCE_PASS;
    if (strcmp(str, "FAIL") == 0) return COMPLIANCE_FAIL;
    if (strcmp(str, "NOT_APPLICABLE") == 0) return COMPLIANCE_NOT_APPLICABLE;
    return COMPLIANCE_UNCLEAR;
}

/**
 * Structure representing an uploaded packaging image
 */
typedef struct {
    int id;
    char scan_id[MAX_ID_LEN];
    char file_path[MAX_PATH_LEN];
    char original_filename[MAX_NAME_LEN];
    long file_size;
    char mime_type[64];
    char view_type[32]; // "front", "back", "side", "top", "bottom", "general"
    char uploaded_at[64];
} UploadedImage;

/**
 * Structure representing an extracted product declaration field
 */
typedef struct {
    int id;
    char scan_id[MAX_ID_LEN];
    char field_name[64];       // "product_name", "mrp", "net_quantity", "manufacturer", etc.
    char field_value[MAX_TEXT_LEN];
    char unit[32];             // "g", "ml", "INR", "count", etc.
    double confidence;         // 0.0 to 1.0
    char evidence_text[MAX_TEXT_LEN]; // Exact snippet extracted from packaging
    int source_image_id;
    char extraction_source[32]; // "OCR", "GEMINI_AI", "REGEX", "MANUAL_REVIEW"
    int is_verified;           // 1 if reviewed/overridden by human inspector
    int verified_by;
} ExtractedField;

/**
 * Structure representing a legal rule requirement
 */
typedef struct {
    int id;
    char rule_id[MAX_ID_LEN];           // e.g. "LMR-RULE-6-1-A"
    char rule_name[MAX_NAME_LEN];
    char version[32];
    char category[64];                  // "all", "packaged_food", "beverages", etc.
    char requirement[MAX_LONG_TEXT_LEN];
    char legal_reference[MAX_NAME_LEN];
    char applicable_conditions[MAX_TEXT_LEN];
    char exemptions[MAX_TEXT_LEN];
    char effective_from[32];
    char effective_to[32];
    char source_url[MAX_TEXT_LEN];
    char verified_at[32];
    int active_status;                  // 1 = Active, 0 = Inactive
} LegalRule;

/**
 * Structure representing the evaluation of a specific legal rule
 */
typedef struct {
    int id;
    char scan_id[MAX_ID_LEN];
    char rule_id[MAX_ID_LEN];
    char rule_version[32];
    ComplianceStatus result;
    char explanation[MAX_TEXT_LEN];
    char evidence[MAX_TEXT_LEN];
    char recommendation[MAX_TEXT_LEN];
    char reviewer_status[32];           // "UNREVIEWED", "VERIFIED", "OVERRIDDEN"
} ComplianceResult;

/**
 * Lightweight scan summary structure for listings
 */
typedef struct {
    char id[MAX_ID_LEN];
    char product_name[MAX_NAME_LEN];
    char brand_name[MAX_NAME_LEN];
    char category[64];
    char overall_status[32];
    double compliance_score;
    char created_at[64];
} ScanSummary;

/**
 * Master scan record aggregating all details
 */
typedef struct {
    char id[MAX_ID_LEN];
    int user_id;
    char product_name[MAX_NAME_LEN];
    char brand_name[MAX_NAME_LEN];
    char category[64];
    char raw_ocr_text[MAX_LONG_TEXT_LEN * 4];
    char overall_status[32];            // "PASS", "FAIL", "UNCLEAR", "REVIEW_REQUIRED"
    double compliance_score;            // 0.0 to 100.0 %
    char created_at[64];
    char updated_at[64];

    // Associated arrays
    int image_count;
    UploadedImage images[MAX_IMAGES_PER_SCAN];

    int field_count;
    ExtractedField fields[MAX_FIELDS_PER_SCAN];

    int result_count;
    ComplianceResult results[MAX_RULES_PER_SCAN];
} ScanRecord;

/**
 * Dashboard aggregation statistics
 */
typedef struct {
    int total_scans;
    int completed_inspections;
    int pending_reviews;
    int pass_count;
    int fail_count;
    int unclear_count;
    double compliance_rate;
} DashboardStats;

#endif /* PRODUCT_MODELS_H */
