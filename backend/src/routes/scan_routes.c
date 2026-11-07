/**
 * ============================================================================
 * LegalCheck 360: Scan Routes Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "scan_routes.h"
#include "../database/database.h"
#include "../models/product.h"
#include "../rules/rules_engine.h"
#include "../services/ocr_service.h"
#include "../services/ai_service.h"
#include "../services/pdf_generator.h"
#include "../utils/error_handler.h"
#include "../utils/file_validation.h"
#include "../utils/json_utils.h"
#include "../../lib/cJSON.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static cJSON* scan_record_to_json(const ScanRecord *scan) {
    cJSON *obj = cJSON_CreateObject();
    cJSON_AddStringToObject(obj, "id", scan->id);
    cJSON_AddNumberToObject(obj, "user_id", scan->user_id);
    cJSON_AddStringToObject(obj, "product_name", scan->product_name);
    cJSON_AddStringToObject(obj, "brand_name", scan->brand_name);
    cJSON_AddStringToObject(obj, "category", scan->category);
    cJSON_AddStringToObject(obj, "overall_status", scan->overall_status);
    cJSON_AddNumberToObject(obj, "compliance_score", scan->compliance_score);
    cJSON_AddStringToObject(obj, "raw_ocr_text", scan->raw_ocr_text);
    cJSON_AddStringToObject(obj, "created_at", scan->created_at);

    // Images array
    cJSON *img_arr = cJSON_CreateArray();
    for (int i = 0; i < scan->image_count; i++) {
        cJSON *im = cJSON_CreateObject();
        cJSON_AddNumberToObject(im, "id", scan->images[i].id);
        cJSON_AddStringToObject(im, "file_path", scan->images[i].file_path);
        cJSON_AddStringToObject(im, "original_filename", scan->images[i].original_filename);
        cJSON_AddNumberToObject(im, "file_size", (double)scan->images[i].file_size);
        cJSON_AddStringToObject(im, "mime_type", scan->images[i].mime_type);
        cJSON_AddStringToObject(im, "view_type", scan->images[i].view_type);
        cJSON_AddItemToArray(img_arr, im);
    }
    cJSON_AddItemToObject(obj, "images", img_arr);

    // Fields array
    cJSON *fld_arr = cJSON_CreateArray();
    for (int i = 0; i < scan->field_count; i++) {
        cJSON *f = cJSON_CreateObject();
        cJSON_AddNumberToObject(f, "id", scan->fields[i].id);
        cJSON_AddStringToObject(f, "field_name", scan->fields[i].field_name);
        cJSON_AddStringToObject(f, "field_value", scan->fields[i].field_value);
        cJSON_AddStringToObject(f, "unit", scan->fields[i].unit);
        cJSON_AddNumberToObject(f, "confidence", scan->fields[i].confidence);
        cJSON_AddStringToObject(f, "evidence_text", scan->fields[i].evidence_text);
        cJSON_AddStringToObject(f, "extraction_source", scan->fields[i].extraction_source);
        cJSON_AddNumberToObject(f, "is_verified", scan->fields[i].is_verified);
        cJSON_AddItemToArray(fld_arr, f);
    }
    cJSON_AddItemToObject(obj, "fields", fld_arr);

    // Compliance Results array
    cJSON *res_arr = cJSON_CreateArray();
    for (int i = 0; i < scan->result_count; i++) {
        cJSON *r = cJSON_CreateObject();
        cJSON_AddNumberToObject(r, "id", scan->results[i].id);
        cJSON_AddStringToObject(r, "rule_id", scan->results[i].rule_id);
        cJSON_AddStringToObject(r, "rule_version", scan->results[i].rule_version);
        cJSON_AddStringToObject(r, "result", compliance_status_to_string(scan->results[i].result));
        cJSON_AddStringToObject(r, "explanation", scan->results[i].explanation);
        cJSON_AddStringToObject(r, "evidence", scan->results[i].evidence);
        cJSON_AddStringToObject(r, "recommendation", scan->results[i].recommendation);
        cJSON_AddStringToObject(r, "reviewer_status", scan->results[i].reviewer_status);
        cJSON_AddItemToArray(res_arr, r);
    }
    cJSON_AddItemToObject(obj, "results", res_arr);

    return obj;
}

void handle_api_create_scan(struct mg_connection *c, struct mg_http_message *hm) {
    // 1. Allocate buffer and parse JSON
    char *body = (char *)malloc(hm->body.len + 1);
    if (!body) {
        char *err = json_create_error_response("Memory allocation error", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }
    memcpy(body, hm->body.buf, hm->body.len);
    body[hm->body.len] = '\0';

    cJSON *json = cJSON_Parse(body);
    free(body);

    if (!json) {
        char *err = json_create_error_response("Invalid JSON or empty payload", 400);
        mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *images_node = cJSON_GetObjectItem(json, "images");
    if (!cJSON_IsArray(images_node) || cJSON_GetArraySize(images_node) == 0) {
        cJSON_Delete(json);
        char *err = json_create_error_response("Please upload at least one packaging image (front, back, or side).", 400);
        mg_http_reply(c, 400, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    // 2. Initialize ScanRecord on heap
    ScanRecord *scan = (ScanRecord *)calloc(1, sizeof(ScanRecord));
    if (!scan) {
        cJSON_Delete(json);
        char *err = json_create_error_response("Memory allocation error", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    generate_scan_id(scan->id, sizeof(scan->id));
    scan->user_id = 1;

    const char *pname = json_get_string(json, "product_name", "Unknown Product");
    snprintf(scan->product_name, sizeof(scan->product_name), "%s", pname);

    const char *cat = json_get_string(json, "category", "packaged_food");
    snprintf(scan->category, sizeof(scan->category), "%s", cat);

    ensure_directory_exists("backend/uploads");
    ensure_directory_exists("backend/reports");

    // Create DB entry first
    db_create_scan(scan->id, scan->user_id, scan->product_name, scan->category);

    int img_count = cJSON_GetArraySize(images_node);
    if (img_count > MAX_IMAGES_PER_SCAN) img_count = MAX_IMAGES_PER_SCAN;

    LOG_INFO("Processing new packaging inspection scan %s (%d photographs submitted)...", scan->id, img_count);

    // 3. Process each image
    for (int i = 0; i < img_count; i++) {
        cJSON *img_item = cJSON_GetArrayItem(images_node, i);
        const char *data_b64 = json_get_string(img_item, "data", NULL);
        const char *orig_name = json_get_string(img_item, "filename", "packaging.jpg");
        const char *mime = json_get_string(img_item, "mime_type", "image/jpeg");
        const char *view = json_get_string(img_item, "view_type", "general");

        if (!data_b64 || strlen(data_b64) < 10) continue;

        size_t decoded_size = 0;
        unsigned char *img_bytes = base64_decode(data_b64, strlen(data_b64), &decoded_size);
        if (!img_bytes || decoded_size == 0) {
            LOG_WARN("Failed to decode base64 for image index %d", i);
            continue;
        }

        // Validate image magic bytes
        ImageType itype = validate_image_signature(img_bytes, decoded_size);
        if (itype == IMG_TYPE_UNKNOWN) {
            LOG_WARN("Rejected file %s: Invalid image signature (not JPEG/PNG/WEBP)", orig_name);
            free(img_bytes);
            continue;
        }

        // Sanitize filename & save to disk
        char safe_filename[128];
        sanitize_filename(orig_name, safe_filename, sizeof(safe_filename));

        char filepath[MAX_PATH_LEN];
        snprintf(filepath, sizeof(filepath), "backend/uploads/%s_%s_%s", scan->id, view, safe_filename);

        FILE *fp = fopen(filepath, "wb");
        if (fp) {
            fwrite(img_bytes, 1, decoded_size, fp);
            fclose(fp);
        }
        free(img_bytes);

        // Record in database
        UploadedImage uimg;
        memset(&uimg, 0, sizeof(UploadedImage));
        snprintf(uimg.scan_id, MAX_ID_LEN, "%s", scan->id);
        snprintf(uimg.file_path, MAX_PATH_LEN, "%s", filepath);
        snprintf(uimg.original_filename, MAX_NAME_LEN, "%s", orig_name);
        uimg.file_size = (long)decoded_size;
        snprintf(uimg.mime_type, 64, "%s", mime);
        snprintf(uimg.view_type, 32, "%s", view);

        int img_db_id = 0;
        db_add_uploaded_image(&uimg, &img_db_id);
        uimg.id = img_db_id;

        if (scan->image_count < MAX_IMAGES_PER_SCAN) {
            scan->images[scan->image_count++] = uimg;
        }

        // OCR text extraction
        char ocr_buf[4096] = "";
        ocr_extract_text_from_image(filepath, ocr_buf, sizeof(ocr_buf));
        if (strlen(ocr_buf) > 0) {
            strncat(scan->raw_ocr_text, ocr_buf, sizeof(scan->raw_ocr_text) - strlen(scan->raw_ocr_text) - 2);
            strncat(scan->raw_ocr_text, "\n", sizeof(scan->raw_ocr_text) - strlen(scan->raw_ocr_text) - 1);
        }

        // AI / Optical declaration extraction
        ai_analyze_packaging_image(filepath, mime, ocr_buf, scan);
    }

    cJSON_Delete(json);

    // If AI service was offline and fields are still empty, run local extraction fallback
    if (scan->field_count == 0 && strlen(scan->raw_ocr_text) > 0) {
        ai_extract_local_fallback(scan->raw_ocr_text, NULL, scan);
    }

    // 4. Run deterministic Legal Metrology Rules Engine
    rules_engine_evaluate_scan(scan);

    // 5. Save all extracted fields and compliance results to SQLite
    for (int i = 0; i < scan->field_count; i++) {
        db_save_extracted_field(&scan->fields[i]);
    }
    for (int i = 0; i < scan->result_count; i++) {
        db_save_compliance_result(&scan->results[i]);
    }

    // Update master scan record
    db_update_scan_summary(scan->id, scan->product_name, scan->category, scan->brand_name, 
                           scan->overall_status, scan->compliance_score, scan->raw_ocr_text);

    // 6. Generate Vector PDF compliance report
    char pdf_path[MAX_PATH_LEN];
    snprintf(pdf_path, sizeof(pdf_path), "backend/reports/%s.pdf", scan->id);
    pdf_generate_compliance_report(scan, pdf_path);

    // 7. Return complete inspection response
    cJSON *resp_data = scan_record_to_json(scan);
    free(scan);
    char *resp = json_create_success_response(resp_data, "Product packaging inspection completed");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_list_scans(struct mg_connection *c, struct mg_http_message *hm) {
    char status_filter[32] = "";
    mg_http_get_var(&hm->query, "status", status_filter, sizeof(status_filter));

    ScanSummary scans[50];
    int count = 0;
    if (!db_list_scans(scans, 50, &count, status_filter)) {
        char *err = json_create_error_response("Failed to fetch scans", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *list = cJSON_CreateArray();
    for (int i = 0; i < count; i++) {
        cJSON *item = cJSON_CreateObject();
        cJSON_AddStringToObject(item, "id", scans[i].id);
        cJSON_AddStringToObject(item, "product_name", scans[i].product_name);
        cJSON_AddStringToObject(item, "brand_name", scans[i].brand_name);
        cJSON_AddStringToObject(item, "category", scans[i].category);
        cJSON_AddStringToObject(item, "overall_status", scans[i].overall_status);
        cJSON_AddNumberToObject(item, "compliance_score", scans[i].compliance_score);
        cJSON_AddStringToObject(item, "created_at", scans[i].created_at);
        cJSON_AddItemToArray(list, item);
    }

    char *resp = json_create_success_response(list, "Scan records retrieved");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_get_scan(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id) {
    (void)hm;
    ScanRecord *scan = (ScanRecord *)calloc(1, sizeof(ScanRecord));
    if (!scan) {
        char *err = json_create_error_response("Memory error", 500);
        mg_http_reply(c, 500, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    if (!db_get_scan(scan_id, scan)) {
        free(scan);
        char *err = json_create_error_response("Scan not found", 404);
        mg_http_reply(c, 404, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
        free(err);
        return;
    }

    cJSON *data = scan_record_to_json(scan);
    free(scan);
    char *resp = json_create_success_response(data, "Scan details retrieved");
    mg_http_reply(c, 200, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", resp);
    free(resp);
}

void handle_api_get_scan_pdf(struct mg_connection *c, struct mg_http_message *hm, const char *scan_id) {
    char pdf_path[MAX_PATH_LEN];
    snprintf(pdf_path, sizeof(pdf_path), "backend/reports/%s.pdf", scan_id);

    // If PDF does not exist, try regenerating it from DB record
    FILE *fp = fopen(pdf_path, "rb");
    if (!fp) {
        ScanRecord *scan = (ScanRecord *)calloc(1, sizeof(ScanRecord));
        if (scan && db_get_scan(scan_id, scan)) {
            pdf_generate_compliance_report(scan, pdf_path);
            free(scan);
        } else {
            if (scan) free(scan);
            char *err = json_create_error_response("Report PDF not found for scan ID", 404);
            mg_http_reply(c, 404, "Content-Type: application/json\r\nAccess-Control-Allow-Origin: *\r\n", "%s", err);
            free(err);
            return;
        }
    } else {
        fclose(fp);
    }

    struct mg_http_serve_opts opts = { .extra_headers = "Content-Type: application/pdf\r\nAccess-Control-Allow-Origin: *\r\nContent-Disposition: inline; filename=\"LegalCheck360_Inspection_Report.pdf\"\r\n" };
    mg_http_serve_file(c, hm, pdf_path, &opts);
}
