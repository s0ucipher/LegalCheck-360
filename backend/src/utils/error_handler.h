/**
 * ============================================================================
 * LegalCheck 360: Error Handling & Logging Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef ERROR_HANDLER_H
#define ERROR_HANDLER_H

#include <stdbool.h>

typedef enum {
    LOG_LEVEL_DEBUG = 0,
    LOG_LEVEL_INFO,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR
} AppLogLevel;

void log_message(AppLogLevel level, const char *fmt, ...);

#define LOG_DEBUG(fmt, ...) log_message(LOG_LEVEL_DEBUG, fmt, ##__VA_ARGS__)
#define LOG_INFO(fmt, ...)  log_message(LOG_LEVEL_INFO,  fmt, ##__VA_ARGS__)
#define LOG_WARN(fmt, ...)  log_message(LOG_LEVEL_WARN,  fmt, ##__VA_ARGS__)
#define LOG_ERROR(fmt, ...) log_message(LOG_LEVEL_ERROR, fmt, ##__VA_ARGS__)

#endif /* ERROR_HANDLER_H */

