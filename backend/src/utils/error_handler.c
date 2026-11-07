/**
 * ============================================================================
 * LegalCheck 360: Error Handling & Logging Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "error_handler.h"
#include <stdio.h>
#include <stdarg.h>
#include <time.h>

void log_message(AppLogLevel level, const char *fmt, ...) {
    time_t rawtime;
    struct tm *timeinfo;
    char time_str[32];

    time(&rawtime);
    timeinfo = localtime(&rawtime);
    strftime(time_str, sizeof(time_str), "%Y-%m-%d %H:%M:%S", timeinfo);

    const char *level_str = "INFO";
    const char *color_code = "\033[0m"; // Reset

    switch (level) {
        case LOG_LEVEL_DEBUG:
            level_str = "DEBUG";
            color_code = "\033[36m"; // Cyan
            break;
        case LOG_LEVEL_INFO:
            level_str = "INFO";
            color_code = "\033[32m"; // Green
            break;
        case LOG_LEVEL_WARN:
            level_str = "WARN";
            color_code = "\033[33m"; // Yellow
            break;
        case LOG_LEVEL_ERROR:
            level_str = "ERROR";
            color_code = "\033[31m"; // Red
            break;
    }

    fprintf(stderr, "%s[%s] [%s]\033[0m ", color_code, time_str, level_str);

    va_list args;
    va_start(args, fmt);
    vfprintf(stderr, fmt, args);
    va_end(args);

    fprintf(stderr, "\n");
    fflush(stderr);
}

