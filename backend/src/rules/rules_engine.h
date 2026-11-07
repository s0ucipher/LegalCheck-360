/**
 * ============================================================================
 * LegalCheck 360: Legal Metrology Rules Engine Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef RULES_ENGINE_H
#define RULES_ENGINE_H

#include "../models/product.h"
#include <stdbool.h>

/**
 * Initialize rules engine and load packaged commodities rules
 */
bool rules_engine_init(void);

/**
 * Evaluate all applicable legal metrology rules against the extracted declarations.
 * Generates rule-by-rule results, evidence citations, recommendations, and
 * computes the final preliminary compliance classification.
 * 
 * @param scan_record Scan record containing extracted fields and images
 * @return true if evaluation completed successfully, false on error
 */
bool rules_engine_evaluate_scan(ScanRecord *scan_record);

/**
 * Get human-readable explanation for a rule evaluation
 */
void rules_engine_get_recommendation(const char *rule_id, ComplianceStatus status, 
                                     char *out_rec, size_t max_len);

#endif /* RULES_ENGINE_H */

