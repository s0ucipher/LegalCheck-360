/**
 * ============================================================================
 * LegalCheck 360: Dashboard Routes Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "dashboard_routes.h"
#include "../database/database.h"
#include "../services/ocr_service.h"
#include "../utils/json_utils.h"
#include "../../lib/cJSON.h"
#include <stdio.h>
#include <stdlib.h>

void handle_api_health(struct mg_connection *c, struct mg_http_message *hm) {
    (void)hm;

    cJSON *data = cJSON_CreateObject();
    cJSON_AddStringToObject(data, "status", "healthy");
    cJSON_AddStringToObject(data, "service", "LegalCheck 360 Compliance Server");
    cJSON_AddStringToObject(data, "version", "1.0.0");
    cJSON_AddBoolToObject(data, "tesseract_ocr_available", ocr_is_tesseract_available());
    const char *key = getenv("GEMINI_API_KEY");
    cJSON_AddBoolToObject(data, "gemini_ai_configured", (key != NULL && strlen(key) > 0));

    char *resp = json_create_success_response(data, "Server operational");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_dashboard_stats(struct mg_connection *c, struct mg_http_message *hm) {
    (void)hm;

    DashboardStats stats;
    if (!db_get_dashboard_stats(&stats)) {
        char *err = json_create_error_response("Failed to fetch dashboard metrics", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *data = cJSON_CreateObject();
    cJSON_AddNumberToObject(data, "total_scans", stats.total_scans);
    cJSON_AddNumberToObject(data, "completed_inspections", stats.completed_inspections);
    cJSON_AddNumberToObject(data, "pending_reviews", stats.pending_reviews);
    cJSON_AddNumberToObject(data, "pass_count", stats.pass_count);
    cJSON_AddNumberToObject(data, "fail_count", stats.fail_count);
    cJSON_AddNumberToObject(data, "unclear_count", stats.unclear_count);
    cJSON_AddNumberToObject(data, "compliance_rate", stats.compliance_rate);

    char *resp = json_create_success_response(data, "Dashboard statistics retrieved");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

