/**
 * ============================================================================
 * LegalCheck 360: JSON Helpers & Encoding Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "json_utils.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

const char* json_get_string(const cJSON *obj, const char *key, const char *default_val) {
    if (!obj || !key) return default_val;
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsString(item) && (item->valuestring != NULL)) {
        return item->valuestring;
    }
    return default_val;
}

int json_get_int(const cJSON *obj, const char *key, int default_val) {
    if (!obj || !key) return default_val;
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsNumber(item)) {
        return item->valueint;
    }
    return default_val;
}

double json_get_double(const cJSON *obj, const char *key, double default_val) {
    if (!obj || !key) return default_val;
    cJSON *item = cJSON_GetObjectItemCaseSensitive(obj, key);
    if (cJSON_IsNumber(item)) {
        return item->valuedouble;
    }
    return default_val;
}

char* json_create_success_response(cJSON *data_node, const char *message) {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddBoolToObject(root, "success", true);
    if (message) {
        cJSON_AddStringToObject(root, "message", message);
    }
    if (data_node) {
        cJSON_AddItemToObject(root, "data", data_node);
    } else {
        cJSON_AddNullToObject(root, "data");
    }
    char *rendered = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return rendered;
}

char* json_create_error_response(const char *error_msg, int status_code) {
    cJSON *root = cJSON_CreateObject();
    cJSON_AddBoolToObject(root, "success", false);
    cJSON_AddStringToObject(root, "error", error_msg ? error_msg : "Unknown internal error");
    cJSON_AddNumberToObject(root, "code", status_code);
    char *rendered = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    return rendered;
}

/* Base64 encoding table */
static const char b64_table[] = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

char* base64_encode(const unsigned char *data, size_t input_length) {
    if (!data) return NULL;

    size_t output_length = 4 * ((input_length + 2) / 3);
    char *encoded_data = (char*)malloc(output_length + 1);
    if (!encoded_data) return NULL;

    size_t i = 0, j = 0;
    while (i < input_length) {
        unsigned int octet_a = (unsigned char)data[i++];
        unsigned int octet_b = (i < input_length) ? (unsigned char)data[i++] : 0;
        unsigned int octet_c = (i < input_length) ? (unsigned char)data[i++] : 0;

        unsigned int triple = (octet_a << 16) + (octet_b << 8) + octet_c;

        encoded_data[j++] = b64_table[(triple >> 18) & 0x3F];
        encoded_data[j++] = b64_table[(triple >> 12) & 0x3F];
        encoded_data[j++] = (i > input_length + 1) ? '=' : b64_table[(triple >> 6) & 0x3F];
        encoded_data[j++] = (i > input_length) ? '=' : b64_table[triple & 0x3F];
    }

    encoded_data[output_length] = '\0';
    return encoded_data;
}

static int b64_char_value(char c) {
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

unsigned char* base64_decode(const char *data, size_t input_length, size_t *out_len) {
    if (!data || !out_len) return NULL;
    *out_len = 0;

    // Skip possible data URL prefix (e.g. "data:image/jpeg;base64,")
    const char *comma = strchr(data, ',');
    if (comma && (comma - data) < 100) {
        size_t prefix_len = (size_t)(comma - data + 1);
        data += prefix_len;
        if (input_length >= prefix_len) {
            input_length -= prefix_len;
        } else {
            input_length = strlen(data);
        }
    }

    if (input_length == 0) input_length = strlen(data);
    if (input_length % 4 != 0) return NULL;

    size_t output_length = (input_length / 4) * 3;
    if (input_length >= 1 && data[input_length - 1] == '=') output_length--;
    if (input_length >= 2 && data[input_length - 2] == '=') output_length--;

    unsigned char *decoded_data = (unsigned char *)malloc(output_length + 1);
    if (!decoded_data) return NULL;

    size_t i = 0, j = 0;
    while (i < input_length && j < output_length) {
        int a = b64_char_value(data[i++]);
        int b = b64_char_value(data[i++]);
        int c = (data[i] == '=') ? 0 : b64_char_value(data[i]);
        i++;
        int d = (data[i] == '=') ? 0 : b64_char_value(data[i]);
        i++;

        if (a < 0 || b < 0) {
            free(decoded_data);
            return NULL;
        }

        unsigned int triple = (a << 18) + (b << 12) + (c << 6) + d;

        if (j < output_length) decoded_data[j++] = (triple >> 16) & 0xFF;
        if (j < output_length && c >= 0) decoded_data[j++] = (triple >> 8) & 0xFF;
        if (j < output_length && d >= 0) decoded_data[j++] = triple & 0xFF;
    }

    decoded_data[output_length] = '\0';
    *out_len = output_length;
    return decoded_data;
}

