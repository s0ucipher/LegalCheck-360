/**
 * ============================================================================
 * LegalCheck 360: Scan Routes Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef SCAN_ROUTES_H
#define SCAN_ROUTES_H

#include "../../lib/mongoose.h"

void handle_api_create_scan(struct mg_connection *c, struct mg_http_message *hm);
void handle_api_list_scans(struct mg_connection *c, struct mg_http_message *hm);
void handle_api_get_scan(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id);
void handle_api_get_scan_pdf(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id);

#endif /* SCAN_ROUTES_H */

