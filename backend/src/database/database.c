/**
 * ============================================================================
 * LegalCheck 360: SQLite3 Database Layer Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "database.h"
#include "../utils/error_handler.h"
#include "../utils/file_validation.h"
#include <sqlite3.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

static sqlite3 *g_db = NULL;

static bool execute_sql_file(const char *filepath) {
    size_t size = 0;
    unsigned char *buffer = read_file_to_buffer(filepath, &size);
    if (!buffer) {
        LOG_WARN("Could not read SQL file: %s (might already be initialized)", filepath);
        return false;
    }

    char *errmsg = NULL;
    int rc = sqlite3_exec(g_db, (const char*)buffer, NULL, NULL, &errmsg);
    free(buffer);

    if (rc != SQLITE_OK) {
        LOG_ERROR("SQL execution failed for %s: %s", filepath, errmsg ? errmsg : "unknown");
        sqlite3_free(errmsg);
        return false;
    }

    return true;
}

bool db_init(const char *db_path) {
    if (g_db) return true; // already open

    int rc = sqlite3_open(db_path, &g_db);
    if (rc != SQLITE_OK) {
        LOG_ERROR("Cannot open SQLite database %s: %s", db_path, sqlite3_errmsg(g_db));
        return false;
    }

    // Enable foreign keys and WAL mode for high concurrency
    sqlite3_exec(g_db, "PRAGMA foreign_keys = ON;", NULL, NULL, NULL);
    sqlite3_exec(g_db, "PRAGMA journal_mode = WAL;", NULL, NULL, NULL);

    // Apply schema
    execute_sql_file("database/schema.sql");

    // Check if legal rules need seeding
    sqlite3_stmt *stmt;
    int count = 0;
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM legal_rules;", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) {
            count = sqlite3_column_int(stmt, 0);
        }
        sqlite3_finalize(stmt);
    }

    if (count == 0) {
        LOG_INFO("Seeding authentic Indian Legal Metrology Rules into database...");
        execute_sql_file("database/seed_rules.sql");
    }

    LOG_INFO("SQLite database initialized successfully at %s", db_path);
    return true;
}

void db_close(void) {
    if (g_db) {
        sqlite3_close(g_db);
        g_db = NULL;
        LOG_INFO("Database connection closed.");
    }
}

bool db_create_scan(const char *scan_id, int user_id, const char *product_name, const char *category) {
    if (!g_db || !scan_id) return false;

    const char *sql = "INSERT INTO scans (id, user_id, product_name, category, overall_status) VALUES (?, ?, ?, ?, 'PENDING');";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 2, user_id);
    sqlite3_bind_text(stmt, 3, product_name ? product_name : "Unknown Product", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, category ? category : "all", -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_update_scan_summary(const char *scan_id, const char *product_name, const char *category, 
                            const char *brand_name, const char *overall_status, 
                            double compliance_score, const char *raw_ocr_text) {
    if (!g_db || !scan_id) return false;

    const char *sql = "UPDATE scans SET product_name = ?, category = ?, brand_name = ?, "
                      "overall_status = ?, compliance_score = ?, raw_ocr_text = ?, updated_at = CURRENT_TIMESTAMP "
                      "WHERE id = ?;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, product_name ? product_name : "Unknown Product", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, category ? category : "all", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, brand_name ? brand_name : "", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, overall_status ? overall_status : "UNCLEAR", -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 5, compliance_score);
    sqlite3_bind_text(stmt, 6, raw_ocr_text ? raw_ocr_text : "", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 7, scan_id, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_add_uploaded_image(const UploadedImage *img, int *out_image_id) {
    if (!g_db || !img) return false;

    const char *sql = "INSERT INTO uploaded_images (scan_id, file_path, original_filename, file_size, mime_type, view_type) "
                      "VALUES (?, ?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, img->scan_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, img->file_path, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, img->original_filename, -1, SQLITE_STATIC);
    sqlite3_bind_int64(stmt, 4, img->file_size);
    sqlite3_bind_text(stmt, 5, img->mime_type, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 6, img->view_type, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    if (rc == SQLITE_DONE && out_image_id) {
        *out_image_id = (int)sqlite3_last_insert_rowid(g_db);
    }
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_get_scan_images(const char *scan_id, UploadedImage *images, int max_images, int *out_count) {
    if (!g_db || !scan_id || !images || !out_count) return false;
    *out_count = 0;

    const char *sql = "SELECT id, scan_id, file_path, original_filename, file_size, mime_type, view_type, uploaded_at "
                      "FROM uploaded_images WHERE scan_id = ? ORDER BY id ASC;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);

    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && count < max_images) {
        images[count].id = sqlite3_column_int(stmt, 0);
        snprintf(images[count].scan_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 1));
        snprintf(images[count].file_path, MAX_PATH_LEN, "%s", (const char*)sqlite3_column_text(stmt, 2));
        snprintf(images[count].original_filename, MAX_NAME_LEN, "%s", (const char*)sqlite3_column_text(stmt, 3));
        images[count].file_size = sqlite3_column_int64(stmt, 4);
        snprintf(images[count].mime_type, 64, "%s", (const char*)sqlite3_column_text(stmt, 5));
        snprintf(images[count].view_type, 32, "%s", (const char*)sqlite3_column_text(stmt, 6));
        snprintf(images[count].uploaded_at, 64, "%s", (const char*)sqlite3_column_text(stmt, 7));
        count++;
    }
    sqlite3_finalize(stmt);
    *out_count = count;
    return true;
}

bool db_save_extracted_field(const ExtractedField *field) {
    if (!g_db || !field) return false;

    const char *sql = "INSERT INTO extracted_fields (scan_id, field_name, field_value, unit, confidence, "
                      "evidence_text, source_image_id, extraction_source) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, field->scan_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, field->field_name, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, field->field_value, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, field->unit, -1, SQLITE_STATIC);
    sqlite3_bind_double(stmt, 5, field->confidence);
    sqlite3_bind_text(stmt, 6, field->evidence_text, -1, SQLITE_STATIC);
    if (field->source_image_id > 0) {
        sqlite3_bind_int(stmt, 7, field->source_image_id);
    } else {
        sqlite3_bind_null(stmt, 7);
    }
    sqlite3_bind_text(stmt, 8, field->extraction_source, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_get_extracted_fields(const char *scan_id, ExtractedField *fields, int max_fields, int *out_count) {
    if (!g_db || !scan_id || !fields || !out_count) return false;
    *out_count = 0;

    const char *sql = "SELECT id, scan_id, field_name, field_value, unit, confidence, evidence_text, "
                      "source_image_id, extraction_source, is_verified, verified_by "
                      "FROM extracted_fields WHERE scan_id = ? ORDER BY id ASC;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);

    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && count < max_fields) {
        fields[count].id = sqlite3_column_int(stmt, 0);
        snprintf(fields[count].scan_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 1));
        snprintf(fields[count].field_name, 64, "%s", (const char*)sqlite3_column_text(stmt, 2));
        const char *val = (const char*)sqlite3_column_text(stmt, 3);
        snprintf(fields[count].field_value, MAX_TEXT_LEN, "%s", val ? val : "");
        const char *unit = (const char*)sqlite3_column_text(stmt, 4);
        snprintf(fields[count].unit, 32, "%s", unit ? unit : "");
        fields[count].confidence = sqlite3_column_double(stmt, 5);
        const char *evid = (const char*)sqlite3_column_text(stmt, 6);
        snprintf(fields[count].evidence_text, MAX_TEXT_LEN, "%s", evid ? evid : "");
        fields[count].source_image_id = sqlite3_column_int(stmt, 7);
        const char *src = (const char*)sqlite3_column_text(stmt, 8);
        snprintf(fields[count].extraction_source, 32, "%s", src ? src : "OCR");
        fields[count].is_verified = sqlite3_column_int(stmt, 9);
        fields[count].verified_by = sqlite3_column_int(stmt, 10);
        count++;
    }
    sqlite3_finalize(stmt);
    *out_count = count;
    return true;
}

bool db_update_extracted_field_override(int field_id, const char *new_value, int is_verified, int reviewer_id) {
    if (!g_db || field_id <= 0) return false;

    const char *sql = "UPDATE extracted_fields SET field_value = ?, is_verified = ?, verified_by = ? WHERE id = ?;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, new_value ? new_value : "", -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 2, is_verified);
    sqlite3_bind_int(stmt, 3, reviewer_id);
    sqlite3_bind_int(stmt, 4, field_id);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_save_compliance_result(const ComplianceResult *res) {
    if (!g_db || !res) return false;

    const char *sql = "INSERT INTO compliance_results (scan_id, rule_id, rule_version, result, explanation, "
                      "evidence, recommendation, reviewer_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, res->scan_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, res->rule_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, res->rule_version, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, compliance_status_to_string(res->result), -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, res->explanation, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 6, res->evidence, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 7, res->recommendation, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 8, res->reviewer_status, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_get_compliance_results(const char *scan_id, ComplianceResult *results, int max_results, int *out_count) {
    if (!g_db || !scan_id || !results || !out_count) return false;
    *out_count = 0;

    const char *sql = "SELECT id, scan_id, rule_id, rule_version, result, explanation, evidence, recommendation, reviewer_status "
                      "FROM compliance_results WHERE scan_id = ? ORDER BY id ASC;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);

    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && count < max_results) {
        results[count].id = sqlite3_column_int(stmt, 0);
        snprintf(results[count].scan_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 1));
        snprintf(results[count].rule_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 2));
        snprintf(results[count].rule_version, 32, "%s", (const char*)sqlite3_column_text(stmt, 3));
        results[count].result = string_to_compliance_status((const char*)sqlite3_column_text(stmt, 4));
        const char *exp = (const char*)sqlite3_column_text(stmt, 5);
        snprintf(results[count].explanation, MAX_TEXT_LEN, "%s", exp ? exp : "");
        const char *evid = (const char*)sqlite3_column_text(stmt, 6);
        snprintf(results[count].evidence, MAX_TEXT_LEN, "%s", evid ? evid : "");
        const char *rec = (const char*)sqlite3_column_text(stmt, 7);
        snprintf(results[count].recommendation, MAX_TEXT_LEN, "%s", rec ? rec : "");
        const char *rev = (const char*)sqlite3_column_text(stmt, 8);
        snprintf(results[count].reviewer_status, 32, "%s", rev ? rev : "UNREVIEWED");
        count++;
    }
    sqlite3_finalize(stmt);
    *out_count = count;
    return true;
}

bool db_get_scan(const char *scan_id, ScanRecord *out_scan) {
    if (!g_db || !scan_id || !out_scan) return false;
    memset(out_scan, 0, sizeof(ScanRecord));

    const char *sql = "SELECT id, user_id, product_name, category, brand_name, overall_status, compliance_score, "
                      "raw_ocr_text, created_at, updated_at FROM scans WHERE id = ?;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return false;
    }

    snprintf(out_scan->id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 0));
    out_scan->user_id = sqlite3_column_int(stmt, 1);
    const char *pname = (const char*)sqlite3_column_text(stmt, 2);
    snprintf(out_scan->product_name, MAX_NAME_LEN, "%s", pname ? pname : "");
    const char *cat = (const char*)sqlite3_column_text(stmt, 3);
    snprintf(out_scan->category, 64, "%s", cat ? cat : "all");
    const char *bname = (const char*)sqlite3_column_text(stmt, 4);
    snprintf(out_scan->brand_name, MAX_NAME_LEN, "%s", bname ? bname : "");
    const char *status = (const char*)sqlite3_column_text(stmt, 5);
    snprintf(out_scan->overall_status, 32, "%s", status ? status : "UNCLEAR");
    out_scan->compliance_score = sqlite3_column_double(stmt, 6);
    const char *ocr = (const char*)sqlite3_column_text(stmt, 7);
    snprintf(out_scan->raw_ocr_text, sizeof(out_scan->raw_ocr_text), "%s", ocr ? ocr : "");
    const char *created = (const char*)sqlite3_column_text(stmt, 8);
    snprintf(out_scan->created_at, 64, "%s", created ? created : "");
    const char *updated = (const char*)sqlite3_column_text(stmt, 9);
    snprintf(out_scan->updated_at, 64, "%s", updated ? updated : "");
    sqlite3_finalize(stmt);

    // Fetch images, fields, and results
    db_get_scan_images(scan_id, out_scan->images, MAX_IMAGES_PER_SCAN, &out_scan->image_count);
    db_get_extracted_fields(scan_id, out_scan->fields, MAX_FIELDS_PER_SCAN, &out_scan->field_count);
    db_get_compliance_results(scan_id, out_scan->results, MAX_RULES_PER_SCAN, &out_scan->result_count);

    return true;
}

bool db_list_scans(ScanSummary *scans, int max_scans, int *out_count, const char *status_filter) {
    if (!g_db || !scans || !out_count) return false;
    *out_count = 0;

    char sql[512];
    if (status_filter && strlen(status_filter) > 0 && strcmp(status_filter, "ALL") != 0) {
        snprintf(sql, sizeof(sql), 
            "SELECT id, product_name, category, brand_name, overall_status, compliance_score, created_at "
            "FROM scans WHERE overall_status = '%s' ORDER BY created_at DESC LIMIT %d;", 
            status_filter, max_scans);
    } else {
        snprintf(sql, sizeof(sql), 
            "SELECT id, product_name, category, brand_name, overall_status, compliance_score, created_at "
            "FROM scans ORDER BY created_at DESC LIMIT %d;", max_scans);
    }

    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && count < max_scans) {
        memset(&scans[count], 0, sizeof(ScanSummary));
        snprintf(scans[count].id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 0));
        const char *pname = (const char*)sqlite3_column_text(stmt, 1);
        snprintf(scans[count].product_name, MAX_NAME_LEN, "%s", pname ? pname : "");
        const char *cat = (const char*)sqlite3_column_text(stmt, 2);
        snprintf(scans[count].category, 64, "%s", cat ? cat : "all");
        const char *bname = (const char*)sqlite3_column_text(stmt, 3);
        snprintf(scans[count].brand_name, MAX_NAME_LEN, "%s", bname ? bname : "");
        const char *stat = (const char*)sqlite3_column_text(stmt, 4);
        snprintf(scans[count].overall_status, 32, "%s", stat ? stat : "UNCLEAR");
        scans[count].compliance_score = sqlite3_column_double(stmt, 5);
        const char *dt = (const char*)sqlite3_column_text(stmt, 6);
        snprintf(scans[count].created_at, 64, "%s", dt ? dt : "");
        count++;
    }
    sqlite3_finalize(stmt);
    *out_count = count;
    return true;
}

bool db_get_legal_rules(LegalRule *rules, int max_rules, int *out_count, const char *category_filter) {
    if (!g_db || !rules || !out_count) return false;
    *out_count = 0;

    const char *sql;
    sqlite3_stmt *stmt;
    if (category_filter && strlen(category_filter) > 0 && strcmp(category_filter, "all") != 0) {
        sql = "SELECT id, rule_id, rule_name, version, category, requirement, legal_reference, "
              "applicable_conditions, exemptions, effective_from, source_url, verified_at, active_status "
              "FROM legal_rules WHERE active_status = 1 AND (category = 'all' OR category = ?) ORDER BY id ASC;";
        if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;
        sqlite3_bind_text(stmt, 1, category_filter, -1, SQLITE_STATIC);
    } else {
        sql = "SELECT id, rule_id, rule_name, version, category, requirement, legal_reference, "
              "applicable_conditions, exemptions, effective_from, source_url, verified_at, active_status "
              "FROM legal_rules WHERE active_status = 1 ORDER BY id ASC;";
        if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;
    }

    int count = 0;
    while (sqlite3_step(stmt) == SQLITE_ROW && count < max_rules) {
        rules[count].id = sqlite3_column_int(stmt, 0);
        snprintf(rules[count].rule_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 1));
        snprintf(rules[count].rule_name, MAX_NAME_LEN, "%s", (const char*)sqlite3_column_text(stmt, 2));
        snprintf(rules[count].version, 32, "%s", (const char*)sqlite3_column_text(stmt, 3));
        snprintf(rules[count].category, 64, "%s", (const char*)sqlite3_column_text(stmt, 4));
        snprintf(rules[count].requirement, MAX_LONG_TEXT_LEN, "%s", (const char*)sqlite3_column_text(stmt, 5));
        snprintf(rules[count].legal_reference, MAX_NAME_LEN, "%s", (const char*)sqlite3_column_text(stmt, 6));
        const char *cond = (const char*)sqlite3_column_text(stmt, 7);
        snprintf(rules[count].applicable_conditions, MAX_TEXT_LEN, "%s", cond ? cond : "");
        const char *exemp = (const char*)sqlite3_column_text(stmt, 8);
        snprintf(rules[count].exemptions, MAX_TEXT_LEN, "%s", exemp ? exemp : "");
        const char *eff = (const char*)sqlite3_column_text(stmt, 9);
        snprintf(rules[count].effective_from, 32, "%s", eff ? eff : "");
        const char *url = (const char*)sqlite3_column_text(stmt, 10);
        snprintf(rules[count].source_url, MAX_TEXT_LEN, "%s", url ? url : "");
        const char *vdate = (const char*)sqlite3_column_text(stmt, 11);
        snprintf(rules[count].verified_at, 32, "%s", vdate ? vdate : "");
        rules[count].active_status = sqlite3_column_int(stmt, 12);
        count++;
    }
    sqlite3_finalize(stmt);
    *out_count = count;
    return true;
}

bool db_get_legal_rule_by_id(const char *rule_id, LegalRule *out_rule) {
    if (!g_db || !rule_id || !out_rule) return false;

    const char *sql = "SELECT id, rule_id, rule_name, version, category, requirement, legal_reference, "
                      "applicable_conditions, exemptions, effective_from, source_url, verified_at, active_status "
                      "FROM legal_rules WHERE rule_id = ?;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, rule_id, -1, SQLITE_STATIC);

    if (sqlite3_step(stmt) != SQLITE_ROW) {
        sqlite3_finalize(stmt);
        return false;
    }

    out_rule->id = sqlite3_column_int(stmt, 0);
    snprintf(out_rule->rule_id, MAX_ID_LEN, "%s", (const char*)sqlite3_column_text(stmt, 1));
    snprintf(out_rule->rule_name, MAX_NAME_LEN, "%s", (const char*)sqlite3_column_text(stmt, 2));
    snprintf(out_rule->version, 32, "%s", (const char*)sqlite3_column_text(stmt, 3));
    snprintf(out_rule->category, 64, "%s", (const char*)sqlite3_column_text(stmt, 4));
    snprintf(out_rule->requirement, MAX_LONG_TEXT_LEN, "%s", (const char*)sqlite3_column_text(stmt, 5));
    snprintf(out_rule->legal_reference, MAX_NAME_LEN, "%s", (const char*)sqlite3_column_text(stmt, 6));
    const char *cond = (const char*)sqlite3_column_text(stmt, 7);
    snprintf(out_rule->applicable_conditions, MAX_TEXT_LEN, "%s", cond ? cond : "");
    const char *exemp = (const char*)sqlite3_column_text(stmt, 8);
    snprintf(out_rule->exemptions, MAX_TEXT_LEN, "%s", exemp ? exemp : "");
    const char *eff = (const char*)sqlite3_column_text(stmt, 9);
    snprintf(out_rule->effective_from, 32, "%s", eff ? eff : "");
    const char *url = (const char*)sqlite3_column_text(stmt, 10);
    snprintf(out_rule->source_url, MAX_TEXT_LEN, "%s", url ? url : "");
    const char *vdate = (const char*)sqlite3_column_text(stmt, 11);
    snprintf(out_rule->verified_at, 32, "%s", vdate ? vdate : "");
    out_rule->active_status = sqlite3_column_int(stmt, 12);

    sqlite3_finalize(stmt);
    return true;
}

bool db_add_or_update_legal_rule(const LegalRule *rule) {
    if (!g_db || !rule) return false;

    const char *sql = "INSERT OR REPLACE INTO legal_rules (rule_id, rule_name, version, category, requirement, "
                      "legal_reference, applicable_conditions, exemptions, effective_from, source_url, verified_at, active_status) "
                      "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_text(stmt, 1, rule->rule_id, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, rule->rule_name, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 3, rule->version, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, rule->category, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, rule->requirement, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 6, rule->legal_reference, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 7, rule->applicable_conditions, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 8, rule->exemptions, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 9, rule->effective_from, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 10, rule->source_url, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 11, rule->verified_at, -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 12, rule->active_status);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_set_rule_active_status(const char *rule_id, int active_status) {
    if (!g_db || !rule_id) return false;

    const char *sql = "UPDATE legal_rules SET active_status = ? WHERE rule_id = ?;";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) return false;

    sqlite3_bind_int(stmt, 1, active_status);
    sqlite3_bind_text(stmt, 2, rule_id, -1, SQLITE_STATIC);

    int rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    return (rc == SQLITE_DONE);
}

bool db_save_review(const char *scan_id, int reviewer_id, const char *reviewer_name, 
                    const char *decision, const char *comments) {
    if (!g_db || !scan_id) return false;

    // Begin transaction
    sqlite3_exec(g_db, "BEGIN TRANSACTION;", NULL, NULL, NULL);

    const char *sql = "INSERT INTO reviews (scan_id, reviewer_id, reviewer_name, decision, comments) VALUES (?, ?, ?, ?, ?);";
    sqlite3_stmt *stmt;
    if (sqlite3_prepare_v2(g_db, sql, -1, &stmt, NULL) != SQLITE_OK) {
        sqlite3_exec(g_db, "ROLLBACK;", NULL, NULL, NULL);
        return false;
    }

    sqlite3_bind_text(stmt, 1, scan_id, -1, SQLITE_STATIC);
    sqlite3_bind_int(stmt, 2, reviewer_id);
    sqlite3_bind_text(stmt, 3, reviewer_name ? reviewer_name : "Authorized Inspector", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 4, decision ? decision : "APPROVED", -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 5, comments ? comments : "", -1, SQLITE_STATIC);

    if (sqlite3_step(stmt) != SQLITE_DONE) {
        sqlite3_finalize(stmt);
        sqlite3_exec(g_db, "ROLLBACK;", NULL, NULL, NULL);
        return false;
    }
    sqlite3_finalize(stmt);

    // Update scan status based on decision
    const char *new_status = "PASS";
    if (strcmp(decision, "REJECTED") == 0) new_status = "FAIL";
    else if (strcmp(decision, "NEEDS_CORRECTION") == 0) new_status = "REVIEW_REQUIRED";

    const char *sql_update = "UPDATE scans SET overall_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;";
    if (sqlite3_prepare_v2(g_db, sql_update, -1, &stmt, NULL) == SQLITE_OK) {
        sqlite3_bind_text(stmt, 1, new_status, -1, SQLITE_STATIC);
        sqlite3_bind_text(stmt, 2, scan_id, -1, SQLITE_STATIC);
        sqlite3_step(stmt);
        sqlite3_finalize(stmt);
    }

    sqlite3_exec(g_db, "COMMIT;", NULL, NULL, NULL);
    return true;
}

bool db_get_dashboard_stats(DashboardStats *stats) {
    if (!g_db || !stats) return false;
    memset(stats, 0, sizeof(DashboardStats));

    sqlite3_stmt *stmt;
    // 1. Total scans
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM scans;", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) stats->total_scans = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    // 2. Completed inspections (non-pending)
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM scans WHERE overall_status != 'PENDING';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) stats->completed_inspections = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    // 3. Pending reviews
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM scans WHERE overall_status IN ('UNCLEAR', 'REVIEW_REQUIRED');", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) stats->pending_reviews = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    // 4. Pass count
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM scans WHERE overall_status = 'PASS';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) stats->pass_count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    // 5. Fail count
    if (sqlite3_prepare_v2(g_db, "SELECT COUNT(*) FROM scans WHERE overall_status = 'FAIL';", -1, &stmt, NULL) == SQLITE_OK) {
        if (sqlite3_step(stmt) == SQLITE_ROW) stats->fail_count = sqlite3_column_int(stmt, 0);
        sqlite3_finalize(stmt);
    }

    stats->unclear_count = stats->pending_reviews;
    if (stats->completed_inspections > 0) {
        stats->compliance_rate = ((double)stats->pass_count / (double)stats->completed_inspections) * 100.0;
    } else {
        stats->compliance_rate = 0.0;
    }

    return true;
}
