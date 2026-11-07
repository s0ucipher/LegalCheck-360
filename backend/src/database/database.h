/**
 * ============================================================================
 * LegalCheck 360: SQLite3 Database Layer Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef DATABASE_H
#define DATABASE_H

#include "../models/product.h"
#include <stdbool.h>

/**
 * Initialize SQLite database, create tables, and seed initial legal rules
 */
bool db_init(const char *db_path);

/**
 * Close database connection safely
 */
void db_close(void);

/**
 * Scan management operations
 */
bool db_create_scan(const char *scan_id, int user_id, const char *product_name, const char *category);
bool db_update_scan_summary(const char *scan_id, const char *product_name, const char *category, 
                            const char *brand_name, const char *overall_status, 
                            double compliance_score, const char *raw_ocr_text);
bool db_get_scan(const char *scan_id, ScanRecord *out_scan);
bool db_list_scans(ScanSummary *scans, int max_scans, int *out_count, const char *status_filter);

/**
 * Image operations
 */
bool db_add_uploaded_image(const UploadedImage *img, int *out_image_id);
bool db_get_scan_images(const char *scan_id, UploadedImage *images, int max_images, int *out_count);

/**
 * Extracted fields operations
 */
bool db_save_extracted_field(const ExtractedField *field);
bool db_get_extracted_fields(const char *scan_id, ExtractedField *fields, int max_fields, int *out_count);
bool db_update_extracted_field_override(int field_id, const char *new_value, int is_verified, int reviewer_id);

/**
 * Compliance results operations
 */
bool db_save_compliance_result(const ComplianceResult *res);
bool db_get_compliance_results(const char *scan_id, ComplianceResult *results, int max_results, int *out_count);

/**
 * Legal Rules operations (Admin & Rules Engine)
 */
bool db_get_legal_rules(LegalRule *rules, int max_rules, int *out_count, const char *category_filter);
bool db_get_legal_rule_by_id(const char *rule_id, LegalRule *out_rule);
bool db_add_or_update_legal_rule(const LegalRule *rule);
bool db_set_rule_active_status(const char *rule_id, int active_status);

/**
 * Human Review operations
 */
bool db_save_review(const char *scan_id, int reviewer_id, const char *reviewer_name, 
                    const char *decision, const char *comments);

/**
 * Dashboard & Analytics
 */
bool db_get_dashboard_stats(DashboardStats *stats);

#endif /* DATABASE_H */
