/**
 * ============================================================================
 * LegalCheck 360: Mongoose HTTP Web Server Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef SERVER_H
#define SERVER_H

#include <stdbool.h>

/**
 * Initialize and start the Mongoose HTTP server on the specified port.
 * 
 * @param port TCP port to bind (e.g. 8080)
 * @return true if server ran and stopped cleanly, false on startup error
 */
bool server_start(int port);

/**
 * Signal the server to stop the event loop cleanly
 */
void server_stop(void);

#endif /* SERVER_H */

