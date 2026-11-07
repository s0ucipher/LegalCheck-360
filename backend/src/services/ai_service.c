/**
 * ============================================================================
 * LegalCheck 360: AI Integration Service Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "ai_service.h"
#include "../utils/error_handler.h"
#include "../utils/file_validation.h"
#include "../utils/json_utils.h"
#include "../../lib/cJSON.h"
#include <curl/curl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

typedef struct {
    char *data;
    size_t size;
} MemoryBuffer;

static size_t ai_curl_write_cb(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    MemoryBuffer *mem = (MemoryBuffer *)userp;

    char *ptr = (char *)realloc(mem->data, mem->size + realsize + 1);
    if (!ptr) {
        LOG_ERROR("Out of memory in curl write callback");
        return 0;
    }

    mem->data = ptr;
    memcpy(&(mem->data[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->data[mem->size] = 0;

    return realsize;
}

bool ai_service_init(void) {
    CURLcode rc = curl_global_init(CURL_GLOBAL_ALL);
    if (rc != CURLE_OK) {
        LOG_ERROR("curl_global_init() failed: %s", curl_easy_strerror(rc));
        return false;
    }
    LOG_INFO("AI Integration subsystem initialized with libcurl.");
    return true;
}

void ai_service_cleanup(void) {
    curl_global_cleanup();
}

static void add_or_update_field(ScanRecord *scan, const char *name, const char *value, 
                                const char *unit, double confidence, const char *evidence, 
                                const char *source, int img_id) {
    if (!value || strlen(value) == 0) return;

    for (int i = 0; i < scan->field_count; i++) {
        if (strcmp(scan->fields[i].field_name, name) == 0) {
            snprintf(scan->fields[i].field_value, MAX_TEXT_LEN, "%s", value);
            if (unit) snprintf(scan->fields[i].unit, 32, "%s", unit);
            scan->fields[i].confidence = confidence;
            if (evidence) snprintf(scan->fields[i].evidence_text, MAX_TEXT_LEN, "%s", evidence);
            return;
        }
    }

    if (scan->field_count < MAX_FIELDS_PER_SCAN) {
        ExtractedField *f = &scan->fields[scan->field_count];
        memset(f, 0, sizeof(ExtractedField));
        snprintf(f->scan_id, MAX_ID_LEN, "%s", scan->id);
        snprintf(f->field_name, 64, "%s", name);
        snprintf(f->field_value, MAX_TEXT_LEN, "%s", value);
        if (unit) snprintf(f->unit, 32, "%s", unit);
        f->confidence = confidence;
        if (evidence) snprintf(f->evidence_text, MAX_TEXT_LEN, "%s", evidence);
        snprintf(f->extraction_source, 32, "%s", source ? source : "AI");
        f->source_image_id = img_id;
        scan->field_count++;
    }
}

/**
 * Deterministic local packaging text parser
 * Acts as an offline fallback when API key is missing or offline
 */
bool ai_extract_local_fallback(const char *raw_text, const char *image_path, ScanRecord *scan_record) {
    (void)image_path;
    if (!raw_text || strlen(raw_text) == 0) {
        LOG_WARN("No text provided to local extraction fallback.");
        return false;
    }

    LOG_INFO("Executing high-accuracy local regex & keyword packaging extraction engine...");

    // 1. MRP Extraction
    const char *mrp_pos = strcasestr(raw_text, "MRP");
    if (!mrp_pos) mrp_pos = strstr(raw_text, "₹");
    if (!mrp_pos) mrp_pos = strcasestr(raw_text, "Rs");
    if (!mrp_pos) mrp_pos = strcasestr(raw_text, "Price");

    if (mrp_pos) {
        char mrp_val[64] = "";
        const char *p = mrp_pos;
        while (*p && !isdigit((unsigned char)*p)) p++;
        int idx = 0;
        while (*p && (isdigit((unsigned char)*p) || *p == '.' || *p == ',')) {
            if (*p != ',') mrp_val[idx++] = *p;
            p++;
            if (idx >= 60) break;
        }
        mrp_val[idx] = '\0';
        if (strlen(mrp_val) > 0) {
            char evid[128];
            snprintf(evid, sizeof(evid), "%.50s", mrp_pos);
            add_or_update_field(scan_record, "mrp", mrp_val, "INR", 0.90, evid, "LOCAL_ENGINE", 1);
        }
    }

    // 2. Net Quantity Extraction
    const char *qty_pos = strcasestr(raw_text, "Net Wt");
    if (!qty_pos) qty_pos = strcasestr(raw_text, "Net Weight");
    if (!qty_pos) qty_pos = strcasestr(raw_text, "Net Qty");
    if (!qty_pos) qty_pos = strcasestr(raw_text, "Net Quantity");

    if (qty_pos) {
        char val[64] = "";
        char unit[32] = "";
        const char *p = qty_pos;
        while (*p && !isdigit((unsigned char)*p)) p++;
        int idx = 0;
        while (*p && (isdigit((unsigned char)*p) || *p == '.')) {
            val[idx++] = *p++;
        }
        val[idx] = '\0';
        while (*p == ' ') p++;
        int uidx = 0;
        while (*p && isalpha((unsigned char)*p) && uidx < 10) {
            unit[uidx++] = *p++;
        }
        unit[uidx] = '\0';

        if (strlen(val) > 0) {
            char evid[128];
            snprintf(evid, sizeof(evid), "%.50s", qty_pos);
            add_or_update_field(scan_record, "net_quantity", val, unit[0] ? unit : "g", 0.88, evid, "LOCAL_ENGINE", 1);
        }
    }

    // 3. Manufacturer Extraction
    const char *mfg_pos = strcasestr(raw_text, "Manufactured by");
    if (!mfg_pos) mfg_pos = strcasestr(raw_text, "Mfd by");
    if (!mfg_pos) mfg_pos = strcasestr(raw_text, "Mfg by");
    if (!mfg_pos) mfg_pos = strcasestr(raw_text, "Marketed by");

    if (mfg_pos) {
        char mfg_text[MAX_TEXT_LEN] = "";
        strncpy(mfg_text, mfg_pos, 250);
        mfg_text[250] = '\0';
        char *nl = strchr(mfg_text, '\n');
        if (nl) *nl = '\0';
        add_or_update_field(scan_record, "manufacturer", mfg_text, "", 0.85, mfg_text, "LOCAL_ENGINE", 1);
    }

    // 4. Date of Manufacture / Expiry
    const char *date_pos = strcasestr(raw_text, "MFD");
    if (!date_pos) date_pos = strcasestr(raw_text, "Mfg Date");
    if (!date_pos) date_pos = strcasestr(raw_text, "PKD");
    if (!date_pos) date_pos = strcasestr(raw_text, "Best Before");

    if (date_pos) {
        char date_snippet[128] = "";
        strncpy(date_snippet, date_pos, 60);
        date_snippet[60] = '\0';
        char *nl = strchr(date_snippet, '\n');
        if (nl) *nl = '\0';
        add_or_update_field(scan_record, "mfg_date", date_snippet, "", 0.82, date_snippet, "LOCAL_ENGINE", 1);
    }

    // 5. Consumer Care
    const char *cc_pos = strcasestr(raw_text, "Consumer Care");
    if (!cc_pos) cc_pos = strcasestr(raw_text, "Customer Care");
    if (!cc_pos) cc_pos = strcasestr(raw_text, "Toll Free");
    if (!cc_pos) cc_pos = strcasestr(raw_text, "Helpline");

    if (cc_pos) {
        char cc_snippet[MAX_TEXT_LEN] = "";
        strncpy(cc_snippet, cc_pos, 150);
        cc_snippet[150] = '\0';
        char *nl = strchr(cc_snippet, '\n');
        if (nl) *nl = '\0';
        add_or_update_field(scan_record, "consumer_care", cc_snippet, "", 0.86, cc_snippet, "LOCAL_ENGINE", 1);
    }

    // 6. Country of Origin
    const char *origin_pos = strcasestr(raw_text, "Made in India");
    if (!origin_pos) origin_pos = strcasestr(raw_text, "Country of Origin");
    if (!origin_pos) origin_pos = strcasestr(raw_text, "Product of India");

    if (origin_pos) {
        add_or_update_field(scan_record, "country_of_origin", "India", "", 0.95, "Made in India / Product of India", "LOCAL_ENGINE", 1);
    }

    // Product Name identification
    if (strlen(scan_record->product_name) == 0 || strcmp(scan_record->product_name, "Unknown Product") == 0) {
        // Look at top 3 lines
        char temp[512];
        strncpy(temp, raw_text, 500);
        temp[500] = '\0';
        char *first_line = strtok(temp, "\r\n");
        if (first_line && strlen(first_line) > 3) {
            snprintf(scan_record->product_name, MAX_NAME_LEN, "%s", first_line);
            add_or_update_field(scan_record, "product_name", first_line, "", 0.80, first_line, "LOCAL_ENGINE", 1);
        }
    }

    return true;
}

bool ai_analyze_packaging_image(const char *image_path, const char *mime_type, 
                                const char *existing_ocr_text, ScanRecord *scan_record) {
    if (!scan_record) return false;

    const char *api_key = getenv("GEMINI_API_KEY");
    if (!api_key || strlen(api_key) == 0) {
        LOG_INFO("GEMINI_API_KEY not configured. Falling back to local OCR & regex rules engine.");
        if (existing_ocr_text && strlen(existing_ocr_text) > 0) {
            return ai_extract_local_fallback(existing_ocr_text, image_path, scan_record);
        }
        return false;
    }

    // Read image and encode to Base64
    size_t img_size = 0;
    unsigned char *img_bytes = read_file_to_buffer(image_path, &img_size);
    if (!img_bytes) {
        LOG_ERROR("Failed to read image file for AI analysis: %s", image_path);
        return false;
    }

    char *b64_image = base64_encode(img_bytes, img_size);
    free(img_bytes);
    if (!b64_image) {
        LOG_ERROR("Base64 encoding failed for %s", image_path);
        return false;
    }

    // Construct Gemini API request payload
    cJSON *root = cJSON_CreateObject();
    cJSON *contents = cJSON_AddArrayToObject(root, "contents");
    cJSON *content_item = cJSON_CreateObject();
    cJSON *parts = cJSON_AddArrayToObject(content_item, "parts");

    // System instruction prompt
    cJSON *prompt_part = cJSON_CreateObject();
    cJSON_AddStringToObject(prompt_part, "text", 
        "You are an expert Indian Legal Metrology Inspector under the Legal Metrology (Packaged Commodities) Rules, 2011. "
        "Carefully examine this package photograph. Extract all printed packaging declarations into a strict JSON object. "
        "Keys must be: category, product_name, brand_name, manufacturer_name, manufacturer_address, "
        "net_quantity_value, net_quantity_unit, mrp_value, mrp_currency, mrp_has_taxes_inclusive (boolean), "
        "mfg_date, expiry_date, consumer_care_details, country_of_origin, unit_sale_price, raw_extracted_text. "
        "If any field is blurry or not visible, set value to null. Output strictly valid JSON."
    );
    cJSON_AddItemToArray(parts, prompt_part);

    // Multimodal image part
    cJSON *image_part = cJSON_CreateObject();
    cJSON *inline_data = cJSON_CreateObject();
    cJSON_AddStringToObject(inline_data, "mime_type", mime_type ? mime_type : "image/jpeg");
    cJSON_AddStringToObject(inline_data, "data", b64_image);
    cJSON_AddItemToObject(image_part, "inline_data", inline_data);
    cJSON_AddItemToArray(parts, image_part);

    cJSON_AddItemToArray(contents, content_item);

    cJSON *gen_config = cJSON_CreateObject();
    cJSON_AddStringToObject(gen_config, "response_mime_type", "application/json");
    cJSON_AddNumberToObject(gen_config, "temperature", 0.1);
    cJSON_AddItemToObject(root, "generationConfig", gen_config);

    char *request_body = cJSON_PrintUnformatted(root);
    cJSON_Delete(root);
    free(b64_image);

    // Prepare HTTP request with curl
    char url[512];
    snprintf(url, sizeof(url), 
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=%s", 
        api_key);

    CURL *curl = curl_easy_init();
    if (!curl) {
        LOG_ERROR("curl_easy_init() failed");
        free(request_body);
        return false;
    }

    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, "Content-Type: application/json");

    MemoryBuffer response_buf = { .data = (char*)malloc(1), .size = 0 };

    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, request_body);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, ai_curl_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&response_buf);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 30L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 10L);

    LOG_INFO("Sending multimodal packaging analysis request to Google Gemini API...");
    CURLcode res = curl_easy_perform(curl);
    long http_code = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_code);

    free(request_body);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK || http_code != 200) {
        LOG_WARN("Gemini API request failed (HTTP %ld, curl error: %s). Falling back to local engine.", 
                 http_code, curl_easy_strerror(res));
        if (response_buf.data) free(response_buf.data);
        if (existing_ocr_text && strlen(existing_ocr_text) > 0) {
            return ai_extract_local_fallback(existing_ocr_text, image_path, scan_record);
        }
        return false;
    }

    // Parse Gemini API JSON response
    cJSON *resp_json = cJSON_Parse(response_buf.data);
    free(response_buf.data);

    if (!resp_json) {
        LOG_ERROR("Failed to parse Gemini response JSON");
        return false;
    }

    // Extract generated text from candidates[0].content.parts[0].text
    cJSON *candidates = cJSON_GetObjectItem(resp_json, "candidates");
    cJSON *first_cand = cJSON_GetArrayItem(candidates, 0);
    cJSON *cand_content = cJSON_GetObjectItem(first_cand, "content");
    cJSON *cand_parts = cJSON_GetObjectItem(cand_content, "parts");
    cJSON *cand_part0 = cJSON_GetArrayItem(cand_parts, 0);
    const char *json_text = json_get_string(cand_part0, "text", NULL);

    if (!json_text) {
        LOG_ERROR("No text part in Gemini response");
        cJSON_Delete(resp_json);
        return false;
    }

    cJSON *data = cJSON_Parse(json_text);
    if (!data) {
        LOG_ERROR("Gemini generated text was not valid JSON");
        cJSON_Delete(resp_json);
        return false;
    }

    // Populate scan_record fields
    const char *cat = json_get_string(data, "category", "packaged_food");
    if (cat) snprintf(scan_record->category, 64, "%s", cat);

    const char *pname = json_get_string(data, "product_name", NULL);
    if (pname) {
        snprintf(scan_record->product_name, MAX_NAME_LEN, "%s", pname);
        add_or_update_field(scan_record, "product_name", pname, "", 0.95, pname, "GEMINI_AI", 1);
    }

    const char *bname = json_get_string(data, "brand_name", NULL);
    if (bname) snprintf(scan_record->brand_name, MAX_NAME_LEN, "%s", bname);

    const char *mfg = json_get_string(data, "manufacturer_name", NULL);
    const char *addr = json_get_string(data, "manufacturer_address", NULL);
    char full_mfg[MAX_TEXT_LEN] = "";
    if (mfg && addr) snprintf(full_mfg, sizeof(full_mfg), "%s, %s", mfg, addr);
    else if (mfg) snprintf(full_mfg, sizeof(full_mfg), "%s", mfg);
    if (full_mfg[0]) add_or_update_field(scan_record, "manufacturer", full_mfg, "", 0.94, full_mfg, "GEMINI_AI", 1);

    const char *mrp_val = json_get_string(data, "mrp_value", NULL);
    if (mrp_val) {
        add_or_update_field(scan_record, "mrp", mrp_val, "INR", 0.96, mrp_val, "GEMINI_AI", 1);
    }

    const char *qty_val = json_get_string(data, "net_quantity_value", NULL);
    const char *qty_unit = json_get_string(data, "net_quantity_unit", "g");
    if (qty_val) {
        add_or_update_field(scan_record, "net_quantity", qty_val, qty_unit, 0.95, qty_val, "GEMINI_AI", 1);
    }

    const char *mfg_d = json_get_string(data, "mfg_date", NULL);
    if (mfg_d) add_or_update_field(scan_record, "mfg_date", mfg_d, "", 0.92, mfg_d, "GEMINI_AI", 1);

    const char *exp_d = json_get_string(data, "expiry_date", NULL);
    if (exp_d) add_or_update_field(scan_record, "expiry_date", exp_d, "", 0.92, exp_d, "GEMINI_AI", 1);

    const char *cc = json_get_string(data, "consumer_care_details", NULL);
    if (cc) add_or_update_field(scan_record, "consumer_care", cc, "", 0.93, cc, "GEMINI_AI", 1);

    const char *co = json_get_string(data, "country_of_origin", NULL);
    if (co) add_or_update_field(scan_record, "country_of_origin", co, "", 0.95, co, "GEMINI_AI", 1);

    const char *usp = json_get_string(data, "unit_sale_price", NULL);
    if (usp) add_or_update_field(scan_record, "unit_sale_price", usp, "", 0.91, usp, "GEMINI_AI", 1);

    const char *raw_packaging = json_get_string(data, "raw_extracted_text", NULL);
    if (raw_packaging && strlen(raw_packaging) > 0) {
        snprintf(scan_record->raw_ocr_text, sizeof(scan_record->raw_ocr_text), "%s", raw_packaging);
    }

    cJSON_Delete(data);
    cJSON_Delete(resp_json);

    LOG_INFO("Gemini AI structured extraction completed successfully for %s", scan_record->product_name);
    return true;
}
