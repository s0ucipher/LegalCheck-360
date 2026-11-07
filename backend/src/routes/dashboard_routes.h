/**
 * ============================================================================
 * LegalCheck 360: Dashboard Routes Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef DASHBOARD_ROUTES_H
#define DASHBOARD_ROUTES_H

#include "../../lib/mongoose.h"

void handle_api_health(struct mg_connection *c, struct mg_http_message *hm);
void handle_api_dashboard_stats(struct mg_connection *c, struct mg_http_message *hm);

#endif /* DASHBOARD_ROUTES_H */

