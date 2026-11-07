/**
 * ============================================================================
 * LegalCheck 360: Human Review Routes Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "review_routes.h"
#include "../database/database.h"
#include "../utils/json_utils.h"
#include "../utils/error_handler.h"
#include "../../lib/cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

void handle_api_save_review(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id) {
    char body[4096];
    size_t len = hm->body.len < sizeof(body) - 1 ? hm->body.len : sizeof(body) - 1;
    memcpy(body, hm->body.buf, len);
    body[len] = '\0';

    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = json_create_error_response("Invalid JSON payload", 400);
        mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    const char *decision = json_get_string(json, "decision", "APPROVED");
    const char *comments = json_get_string(json, "comments", "Reviewed and verified against packaging sample.");
    const char *rev_name = json_get_string(json, "reviewer_name", "Authorized Metrology Officer");
    int rev_id = json_get_int(json, "reviewer_id", 1);

    // Save field overrides if present
    cJSON *overrides = cJSON_GetObjectItem(json, "field_overrides");
    if (cJSON_IsArray(overrides)) {
        int arr_size = cJSON_GetArraySize(overrides);
        for (int i = 0; i < arr_size; i++) {
            cJSON *item = cJSON_GetArrayItem(overrides, i);
            int fid = json_get_int(item, "field_id", 0);
            const char *fval = json_get_string(item, "field_value", "");
            if (fid > 0 && strlen(fval) > 0) {
                db_update_extracted_field_override(fid, fval, 1, rev_id);
            }
        }
    }

    if (!db_save_review(scan_id, rev_id, rev_name, decision, comments)) {
        cJSON_Delete(json);
        char *err = json_create_error_response("Failed to save reviewer decision", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON_Delete(json);

    cJSON *data = cJSON_CreateObject();
    cJSON_AddStringToObject(data, "scan_id", scan_id);
    cJSON_AddStringToObject(data, "decision", decision);
    cJSON_AddStringToObject(data, "reviewer", rev_name);

    char *resp = json_create_success_response(data, "Inspector review submitted successfully");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

