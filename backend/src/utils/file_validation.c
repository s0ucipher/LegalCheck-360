/**
 * ============================================================================
 * LegalCheck 360: File Validation & Security Utilities Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "file_validation.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#include <time.h>
#include <sys/stat.h>
#include <sys/types.h>

ImageType validate_image_signature(const unsigned char *buffer, size_t length) {
    if (!buffer || length < 12) {
        return IMG_TYPE_UNKNOWN;
    }

    // JPEG signature: FF D8 FF
    if (buffer[0] == 0xFF && buffer[1] == 0xD8 && buffer[2] == 0xFF) {
        return IMG_TYPE_JPEG;
    }

    // PNG signature: 89 50 4E 47 0D 0A 1A 0A
    if (buffer[0] == 0x89 && buffer[1] == 0x50 && buffer[2] == 0x4E && buffer[3] == 0x47 &&
        buffer[4] == 0x0D && buffer[5] == 0x0A && buffer[6] == 0x1A && buffer[7] == 0x0A) {
        return IMG_TYPE_PNG;
    }

    // WEBP signature: "RIFF" .... "WEBP"
    if (buffer[0] == 'R' && buffer[1] == 'I' && buffer[2] == 'F' && buffer[3] == 'F' &&
        buffer[8] == 'W' && buffer[9] == 'E' && buffer[10] == 'B' && buffer[11] == 'P') {
        return IMG_TYPE_WEBP;
    }

    return IMG_TYPE_UNKNOWN;
}

bool is_valid_image_mime(const char *mime_type) {
    if (!mime_type) return false;
    if (strcasecmp(mime_type, "image/jpeg") == 0) return true;
    if (strcasecmp(mime_type, "image/jpg") == 0) return true;
    if (strcasecmp(mime_type, "image/png") == 0) return true;
    if (strcasecmp(mime_type, "image/webp") == 0) return true;
    return false;
}

void sanitize_filename(const char *input, char *output, size_t max_len) {
    if (!input || !output || max_len == 0) return;

    // Find the last slash/backslash to strip directory paths
    const char *last_slash = strrchr(input, '/');
    const char *last_backslash = strrchr(input, '\\');
    const char *base = input;

    if (last_slash && last_slash >= base) {
        base = last_slash + 1;
    }
    if (last_backslash && last_backslash >= base) {
        base = last_backslash + 1;
    }

    size_t out_idx = 0;
    for (size_t i = 0; base[i] != '\0' && out_idx < max_len - 1; i++) {
        char c = base[i];
        // Allow alphanumeric, dots, dashes, underscores
        if (isalnum((unsigned char)c) || c == '.' || c == '-' || c == '_') {
            output[out_idx++] = c;
        } else if (c == ' ') {
            output[out_idx++] = '_';
        }
    }
    output[out_idx] = '\0';

    if (out_idx == 0) {
        snprintf(output, max_len, "upload_%ld.img", (long)time(NULL));
    }
}

void generate_scan_id(char *out_id, size_t max_len) {
    if (!out_id || max_len < 16) return;
    
    // Generate format: LMC-YYYY-XXXXX where XXXXX is hex random
    time_t now = time(NULL);
    struct tm *tm_info = localtime(&now);
    int year = tm_info ? (tm_info->tm_year + 1900) : 2026;
    
    unsigned int r1 = (unsigned int)rand() % 0xFFFF;
    unsigned int r2 = (unsigned int)(clock() ^ now) % 0xFFFF;
    
    snprintf(out_id, max_len, "LMC-%04d-%04X%04X", year, r1, r2);
}

bool ensure_directory_exists(const char *dir_path) {
    if (!dir_path || dir_path[0] == '\0') return false;
    struct stat st;
    if (stat(dir_path, &st) == 0) {
        return S_ISDIR(st.st_mode);
    }
    // Attempt mkdir with 0755
    return (mkdir(dir_path, 0755) == 0);
}

unsigned char* read_file_to_buffer(const char *filepath, size_t *out_size) {
    if (!filepath || !out_size) return NULL;
    *out_size = 0;

    FILE *fp = fopen(filepath, "rb");
    if (!fp) return NULL;

    fseek(fp, 0, SEEK_END);
    long size = ftell(fp);
    fseek(fp, 0, SEEK_SET);

    if (size <= 0) {
        fclose(fp);
        return NULL;
    }

    unsigned char *buffer = (unsigned char*)malloc((size_t)size + 1);
    if (!buffer) {
        fclose(fp);
        return NULL;
    }

    size_t read_bytes = fread(buffer, 1, (size_t)size, fp);
    fclose(fp);

    buffer[read_bytes] = '\0';
    *out_size = read_bytes;
    return buffer;
}

