/**
 * ============================================================================
 * LegalCheck 360: Mongoose HTTP Web Server Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "server.h"
#include "routes/dashboard_routes.h"
#include "routes/scan_routes.h"
#include "routes/rule_routes.h"
#include "routes/review_routes.h"
#include "utils/error_handler.h"
#include "../lib/mongoose.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>

static bool s_running = true;

void server_stop(void) {
    s_running = false;
}

static void handle_cors(struct mg_connection *c) {
    mg_http_reply(c, 204, 
        "Access-Control-Allow-Origin: *\r\n"
        "Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS\r\n"
        "Access-Control-Allow-Headers: Content-Type, Authorization\r\n"
        "Access-Control-Max-Age: 86400\r\n", "");
}

static void http_event_handler(struct mg_connection *c, int ev, void *ev_data) {
    if (ev != MG_EV_HTTP_MSG) return;

    struct mg_http_message *hm = (struct mg_http_message *)ev_data;

    // Handle preflight CORS OPTIONS requests
    if (mg_strcmp(hm->method, mg_str("OPTIONS")) == 0) {
        handle_cors(c);
        return;
    }

    // 1. Health endpoint
    if (mg_match(hm->uri, mg_str("/api/health"), NULL)) {
        handle_api_health(c, hm);
        return;
    }

    // 2. Dashboard analytics
    if (mg_match(hm->uri, mg_str("/api/dashboard/stats"), NULL)) {
        handle_api_dashboard_stats(c, hm);
        return;
    }

    // 3. Scans creation (POST /api/scans)
    if (mg_match(hm->uri, mg_str("/api/scans"), NULL) && mg_strcmp(hm->method, mg_str("POST")) == 0) {
        handle_api_create_scan(c, hm);
        return;
    }

    // 4. Scans listing (GET /api/scans)
    if (mg_match(hm->uri, mg_str("/api/scans"), NULL) && mg_strcmp(hm->method, mg_str("GET")) == 0) {
        handle_api_list_scans(c, hm);
        return;
    }

    // 5. PDF report download (GET /api/scans/:id/pdf)
    struct mg_str scan_id_match;
    if (mg_match(hm->uri, mg_str("/api/scans/*/pdf"), &scan_id_match)) {
        char scan_id[64];
        snprintf(scan_id, sizeof(scan_id), "%.*s", (int)scan_id_match.len, scan_id_match.buf);
        handle_api_get_scan_pdf(c, hm, scan_id);
        return;
    }

    // 6. Scan details by ID (GET /api/scans/:id)
    if (mg_match(hm->uri, mg_str("/api/scans/*"), &scan_id_match) && mg_strcmp(hm->method, mg_str("GET")) == 0) {
        char scan_id[64];
        snprintf(scan_id, sizeof(scan_id), "%.*s", (int)scan_id_match.len, scan_id_match.buf);
        handle_api_get_scan(c, hm, scan_id);
        return;
    }

    // 7. Human review submission (POST /api/reviews/:id)
    if (mg_match(hm->uri, mg_str("/api/reviews/*"), &scan_id_match) && mg_strcmp(hm->method, mg_str("POST")) == 0) {
        char scan_id[64];
        snprintf(scan_id, sizeof(scan_id), "%.*s", (int)scan_id_match.len, scan_id_match.buf);
        handle_api_save_review(c, hm, scan_id);
        return;
    }

    // 8. Legal rules listing (GET /api/rules)
    if (mg_match(hm->uri, mg_str("/api/rules"), NULL) && mg_strcmp(hm->method, mg_str("GET")) == 0) {
        handle_api_get_rules(c, hm);
        return;
    }

    // 9. Admin add/update rule (POST /api/admin/rules)
    if (mg_match(hm->uri, mg_str("/api/admin/rules"), NULL) && mg_strcmp(hm->method, mg_str("POST")) == 0) {
        handle_api_admin_add_rule(c, hm);
        return;
    }

    // 10. Admin toggle rule status (POST /api/admin/rules/:id/toggle)
    struct mg_str rule_id_match;
    if (mg_match(hm->uri, mg_str("/api/admin/rules/*/toggle"), &rule_id_match)) {
        char rule_id[64];
        snprintf(rule_id, sizeof(rule_id), "%.*s", (int)rule_id_match.len, rule_id_match.buf);
        handle_api_admin_toggle_rule(c, hm, rule_id);
        return;
    }

    // 11. Serve uploaded packaging images directly from disk
    if (mg_match(hm->uri, mg_str("/backend/uploads/*"), NULL) || mg_match(hm->uri, mg_str("/uploads/*"), NULL)) {
        struct mg_http_serve_opts upload_opts = { .root_dir = "." };
        mg_http_serve_dir(c, hm, &upload_opts);
        return;
    }

    // 12. Static Frontend file serving from frontend/
    struct mg_http_serve_opts opts = { 
        .root_dir = "frontend",
        .extra_headers = "Access-Control-Allow-Origin: *\r\nCache-Control: no-cache\r\n"
    };
    mg_http_serve_dir(c, hm, &opts);
}

bool server_start(int port) {
    struct mg_mgr mgr;
    mg_mgr_init(&mgr);

    char listen_addr[64];
    snprintf(listen_addr, sizeof(listen_addr), "http://0.0.0.0:%d", port);

    struct mg_connection *c = mg_http_listen(&mgr, listen_addr, http_event_handler, NULL);
    if (!c) {
        LOG_ERROR("Failed to bind Mongoose HTTP server to %s. Check if port %d is already in use.", listen_addr, port);
        mg_mgr_free(&mgr);
        return false;
    }

    LOG_INFO("====================================================================");
    LOG_INFO(" LegalCheck 360: AI-Based Legal Metrology Compliance Checker");
    LOG_INFO(" Tagline: Smart Packaging. Smarter Compliance.");
    LOG_INFO(" HTTP C Server listening at: http://localhost:%d", port);
    LOG_INFO(" Serving Frontend Web App from: ./frontend/");
    LOG_INFO("====================================================================");

    while (s_running) {
        mg_mgr_poll(&mgr, 100);
    }

    LOG_INFO("Shutting down Mongoose server...");
    mg_mgr_free(&mgr);
    return true;
}

