/**
 * ============================================================================
 * LegalCheck 360: Human Review Routes Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef REVIEW_ROUTES_H
#define REVIEW_ROUTES_H

#include "../../lib/mongoose.h"

void handle_api_save_review(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id);

#endif /* REVIEW_ROUTES_H */

