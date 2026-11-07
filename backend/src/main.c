/**
 * ============================================================================
 * LegalCheck 360: Main Application Entry Point (C Backend)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Academic Purpose:
 * Demonstrates structured C programming, modular services, dynamic configuration,
 * signal handling, and clean subsystem lifecycle management for B.Tech CSE.
 */

#include "server.h"
#include "database/database.h"
#include "services/ai_service.h"
#include "rules/rules_engine.h"
#include "utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>

static void handle_sigint(int sig) {
    (void)sig;
    LOG_INFO("Received interrupt signal. Initiating graceful shutdown...");
    server_stop();
}

/**
 * Basic .env file loader for C backend
 */
static void load_env_file(const char *filepath) {
    FILE *fp = fopen(filepath, "r");
    if (!fp) return;

    char line[512];
    while (fgets(line, sizeof(line), fp)) {
        // Strip whitespace and newlines
        char *p = line;
        while (*p == ' ' || *p == '\t') p++;
        if (*p == '#' || *p == '\0' || *p == '\r' || *p == '\n') continue;

        char *eq = strchr(p, '=');
        if (eq) {
            *eq = '\0';
            char *key = p;
            char *val = eq + 1;

            // Trim newline
            char *nl = strchr(val, '\r');
            if (nl) *nl = '\0';
            nl = strchr(val, '\n');
            if (nl) *nl = '\0';

            // Set environment variable only if not already set
            if (!getenv(key)) {
                setenv(key, val, 1);
            }
        }
    }
    fclose(fp);
}

int main(int argc, char *argv[]) {
    // 1. Setup Signal Handlers
    signal(SIGINT, handle_sigint);
    signal(SIGTERM, handle_sigint);

    // 2. Load Configuration
    load_env_file("backend/.env");
    load_env_file(".env");

    int port = 8080;
    const char *port_env = getenv("SERVER_PORT");
    if (port_env && atoi(port_env) > 0) {
        port = atoi(port_env);
    }
    if (argc > 1 && atoi(argv[1]) > 0) {
        port = atoi(argv[1]);
    }

    const char *db_path = getenv("DB_PATH");
    if (!db_path || strlen(db_path) == 0) {
        db_path = "database/legalcheck360.db";
    }

    LOG_INFO("Starting LegalCheck 360 Core Engine...");

    // 3. Initialize Database
    if (!db_init(db_path)) {
        LOG_ERROR("Fatal: Could not initialize database at %s. Exiting.", db_path);
        return 1;
    }

    // 4. Initialize AI Services & libcurl
    if (!ai_service_init()) {
        LOG_ERROR("Fatal: Failed to initialize AI service layer.");
        db_close();
        return 1;
    }

    // 5. Initialize Legal Metrology Rules Engine
    if (!rules_engine_init()) {
        LOG_ERROR("Fatal: Failed to initialize Legal Rules Engine.");
        ai_service_cleanup();
        db_close();
        return 1;
    }

    // 6. Launch Mongoose Web Server
    server_start(port);

    // 7. Cleanup on exit
    ai_service_cleanup();
    db_close();

    LOG_INFO("LegalCheck 360 backend stopped cleanly. Goodbye!");
    return 0;
}

