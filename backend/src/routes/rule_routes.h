/**
 * ============================================================================
 * LegalCheck 360: Legal Rule Routes Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef RULE_ROUTES_H
#define RULE_ROUTES_H

#include "../../lib/mongoose.h"

void handle_api_get_rules(struct mg_connection *c, struct mg_http_message *hm);
void handle_api_admin_add_rule(struct mg_connection *c, struct mg_http_message *hm);
void handle_api_admin_toggle_rule(struct mg_connection *c, struct mg_http_message *hm, const char *rule_id);

#endif /* RULE_ROUTES_H */

