/**
 * ============================================================================
 * LegalCheck 360: Legal Rule Routes Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "rule_routes.h"
#include "../database/database.h"
#include "../utils/json_utils.h"
#include "../utils/error_handler.h"
#include "../../lib/cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_api_get_rules(struct mg_connection *c, struct mg_http_message *hm) {
    char category[64] = "all";
    mg_http_get_var(&hm->query, "category", category, sizeof(category));

    LegalRule rules[64];
    int count = 0;
    if (!db_get_legal_rules(rules, 64, &count, category)) {
        char *err = json_create_error_response("Failed to retrieve legal rules", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *list = cJSON_CreateArray();
    for (int i = 0; i < count; i++) {
        cJSON *item = cJSON_CreateObject();
        cJSON_AddNumberToObject(item, "id", rules[i].id);
        cJSON_AddStringToObject(item, "rule_id", rules[i].rule_id);
        cJSON_AddStringToObject(item, "rule_name", rules[i].rule_name);
        cJSON_AddStringToObject(item, "version", rules[i].version);
        cJSON_AddStringToObject(item, "category", rules[i].category);
        cJSON_AddStringToObject(item, "requirement", rules[i].requirement);
        cJSON_AddStringToObject(item, "legal_reference", rules[i].legal_reference);
        cJSON_AddStringToObject(item, "applicable_conditions", rules[i].applicable_conditions);
        cJSON_AddStringToObject(item, "exemptions", rules[i].exemptions);
        cJSON_AddStringToObject(item, "effective_from", rules[i].effective_from);
        cJSON_AddStringToObject(item, "source_url", rules[i].source_url);
        cJSON_AddStringToObject(item, "verified_at", rules[i].verified_at);
        cJSON_AddNumberToObject(item, "active_status", rules[i].active_status);
        cJSON_AddItemToArray(list, item);
    }

    char *resp = json_create_success_response(list, "Legal rules retrieved");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_admin_add_rule(struct mg_connection *c, struct mg_http_message *hm) {
    char body[4096];
    size_t len = hm->body.len < sizeof(body) - 1 ? hm->body.len : sizeof(body) - 1;
    memcpy(body, hm->body.buf, len);
    body[len] = '\0';

    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = json_create_error_response("Invalid JSON in request body", 400);
        mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    const char *rule_id = json_get_string(json, "rule_id", NULL);
    const char *rule_name = json_get_string(json, "rule_name", NULL);
    const char *req = json_get_string(json, "requirement", NULL);
    const char *ref = json_get_string(json, "legal_reference", NULL);

    if (!rule_id || !rule_name || !req || !ref) {
        cJSON_Delete(json);
        char *err = json_create_error_response("Missing mandatory fields: rule_id, rule_name, requirement, legal_reference", 400);
        mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    LegalRule rule;
    memset(&rule, 0, sizeof(LegalRule));
    snprintf(rule.rule_id, MAX_ID_LEN, "%s", rule_id);
    snprintf(rule.rule_name, MAX_NAME_LEN, "%s", rule_name);
    snprintf(rule.version, 32, "%s", json_get_string(json, "version", "2026.1"));
    snprintf(rule.category, 64, "%s", json_get_string(json, "category", "all"));
    snprintf(rule.requirement, MAX_LONG_TEXT_LEN, "%s", req);
    snprintf(rule.legal_reference, MAX_NAME_LEN, "%s", ref);
    snprintf(rule.applicable_conditions, MAX_TEXT_LEN, "%s", json_get_string(json, "applicable_conditions", ""));
    snprintf(rule.exemptions, MAX_TEXT_LEN, "%s", json_get_string(json, "exemptions", ""));
    snprintf(rule.effective_from, 32, "%s", json_get_string(json, "effective_from", "2026-01-01"));
    snprintf(rule.source_url, MAX_TEXT_LEN, "%s", json_get_string(json, "source_url", "https://consumeraffairs.nic.in"));
    snprintf(rule.verified_at, 32, "%s", json_get_string(json, "verified_at", "2026-01-15"));
    rule.active_status = json_get_int(json, "active_status", 1);

    cJSON_Delete(json);

    if (!db_add_or_update_legal_rule(&rule)) {
        char *err = json_create_error_response("Database failure while saving legal rule", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *data = cJSON_CreateObject();
    cJSON_AddStringToObject(data, "rule_id", rule.rule_id);
    char *resp = json_create_success_response(data, "Legal rule saved successfully");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_admin_toggle_rule(struct mg_connection *c, struct mg_http_message *hm, const char *rule_id) {
    (void)hm;
    LegalRule rule;
    if (!db_get_legal_rule_by_id(rule_id, &rule)) {
        char *err = json_create_error_response("Rule ID not found", 404);
        mg_http_reply(c, 404, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    int new_status = (rule.active_status == 1) ? 0 : 1;
    if (!db_set_rule_active_status(rule_id, new_status)) {
        char *err = json_create_error_response("Failed to update rule status", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *data = cJSON_CreateObject();
    cJSON_AddStringToObject(data, "rule_id", rule_id);
    cJSON_AddNumberToObject(data, "new_active_status", new_status);

    char *resp = json_create_success_response(data, "Rule status updated");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

