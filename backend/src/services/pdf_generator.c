/**
 * ============================================================================
 * LegalCheck 360: Pure C Vector PDF Generator Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "pdf_generator.h"
#include "../utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdarg.h>
#include <time.h>

typedef struct {
    char *data;
    size_t size;
    size_t capacity;
} PDFStream;

static void stream_init(PDFStream *s) {
    s->capacity = 16384;
    s->size = 0;
    s->data = (char *)malloc(s->capacity);
    if (s->data) s->data[0] = '\0';
}

static void stream_append(PDFStream *s, const char *fmt, ...) {
    if (!s || !s->data) return;
    va_list args;
    va_start(args, fmt);
    char buf[2048];
    int len = vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);

    if (len <= 0) return;

    if (s->size + (size_t)len + 1 >= s->capacity) {
        s->capacity = (s->capacity + (size_t)len + 8192) * 2;
        s->data = (char *)realloc(s->data, s->capacity);
    }
    memcpy(s->data + s->size, buf, (size_t)len);
    s->size += (size_t)len;
    s->data[s->size] = '\0';
}

static void sanitize_pdf_string(const char *input, char *output, size_t max_len) {
    if (!input || !output || max_len == 0) return;
    size_t j = 0;
    for (size_t i = 0; input[i] != '\0' && j < max_len - 2; i++) {
        char c = input[i];
        if (c == '(' || c == ')' || c == '\\') {
            output[j++] = '\\';
            output[j++] = c;
        } else if ((unsigned char)c >= 32 && (unsigned char)c <= 126) {
            output[j++] = c;
        } else {
            output[j++] = ' ';
        }
    }
    output[j] = '\0';
}

bool pdf_generate_compliance_report(const ScanRecord *scan, const char *output_filepath) {
    if (!scan || !output_filepath) return false;

    FILE *fp = fopen(output_filepath, "wb");
    if (!fp) {
        LOG_ERROR("Cannot open file for writing PDF: %s", output_filepath);
        return false;
    }

    PDFStream stream;
    stream_init(&stream);

    // Coordinate space: A4 is 595.28 x 841.89 points
    float y = 800.0f;

    // 1. Header Banner (Dark Slate Blue rectangle)
    stream_append(&stream, "0.08 0.13 0.24 rg\n"); // #14213d
    stream_append(&stream, "0 740 595.28 102 re f\n");

    // Brand Name: LegalCheck 360
    stream_append(&stream, "1.0 1.0 1.0 rg\n"); // White
    stream_append(&stream, "BT /F2 22 Tf 40 795 Td (LEGALCHECK 360) ET\n");
    stream_append(&stream, "0.38 0.73 0.98 rg\n"); // Cyan accent
    stream_append(&stream, "BT /F1 11 Tf 40 778 Td (Smart Packaging. Smarter Compliance. | Indian Legal Metrology Auditor) ET\n");
    stream_append(&stream, "0.8 0.8 0.8 rg\n");
    stream_append(&stream, "BT /F1 9 Tf 40 758 Td (Statutory Framework: Legal Metrology \\(Packaged Commodities\\) Rules, 2011) ET\n");

    y = 715.0f;

    // 2. Inspection Metadata Box
    stream_append(&stream, "0.96 0.97 0.98 rg\n"); // Light gray background
    stream_append(&stream, "35 %f 525 80 re f\n", y - 75.0f);
    stream_append(&stream, "0.8 0.85 0.90 RG 1 w\n"); // Border
    stream_append(&stream, "35 %f 525 80 re s\n", y - 75.0f);

    stream_append(&stream, "0.15 0.2 0.3 rg\n");
    stream_append(&stream, "BT /F2 11 Tf 50 %f Td (Inspection ID:) ET\n", y - 20.0f);
    stream_append(&stream, "BT /F1 11 Tf 140 %f Td (%s) ET\n", y - 20.0f, scan->id);

    stream_append(&stream, "BT /F2 11 Tf 320 %f Td (Inspection Date:) ET\n", y - 20.0f);
    char safe_date[64];
    sanitize_pdf_string(scan->created_at, safe_date, sizeof(safe_date));
    stream_append(&stream, "BT /F1 11 Tf 420 %f Td (%s) ET\n", y - 20.0f, safe_date);

    char safe_pname[128];
    sanitize_pdf_string(scan->product_name[0] ? scan->product_name : "General Packaged Commodity", safe_pname, sizeof(safe_pname));
    stream_append(&stream, "BT /F2 11 Tf 50 %f Td (Product Name:) ET\n", y - 40.0f);
    stream_append(&stream, "BT /F1 11 Tf 140 %f Td (%s) ET\n", y - 40.0f, safe_pname);

    stream_append(&stream, "BT /F2 11 Tf 320 %f Td (Category:) ET\n", y - 40.0f);
    stream_append(&stream, "BT /F1 11 Tf 420 %f Td (%s) ET\n", y - 40.0f, scan->category);

    // Overall Status Badge
    stream_append(&stream, "BT /F2 11 Tf 50 %f Td (Compliance Result:) ET\n", y - 60.0f);
    if (strcmp(scan->overall_status, "PASS") == 0) {
        stream_append(&stream, "0.06 0.65 0.35 rg\n"); // Green
        stream_append(&stream, "BT /F2 12 Tf 165 %f Td (PASS - COMPLIANT \\(Score: %.1f%%\\)) ET\n", y - 60.0f, scan->compliance_score);
    } else if (strcmp(scan->overall_status, "FAIL") == 0) {
        stream_append(&stream, "0.85 0.15 0.15 rg\n"); // Red
        stream_append(&stream, "BT /F2 12 Tf 165 %f Td (FAIL - NON-COMPLIANT \\(Score: %.1f%%\\)) ET\n", y - 60.0f, scan->compliance_score);
    } else {
        stream_append(&stream, "0.85 0.55 0.05 rg\n"); // Amber
        stream_append(&stream, "BT /F2 12 Tf 165 %f Td (UNCLEAR - HUMAN REVIEW REQUIRED) ET\n", y - 60.0f);
    }

    y -= 105.0f;

    // 3. Section Title: Extracted Packaging Declarations
    stream_append(&stream, "0.1 0.15 0.25 rg\n");
    stream_append(&stream, "BT /F2 13 Tf 35 %f Td (1. EXTRACTED PACKAGING DECLARATIONS) ET\n", y);
    stream_append(&stream, "0.2 0.4 0.8 RG 1.5 w\n");
    stream_append(&stream, "35 %f 525 %f m 560 %f l s\n", y - 4.0f, y - 4.0f, y - 4.0f);

    y -= 22.0f;

    // Table Header
    stream_append(&stream, "0.92 0.94 0.97 rg\n");
    stream_append(&stream, "35 %f 525 18 re f\n", y - 14.0f);
    stream_append(&stream, "0.1 0.2 0.3 rg\n");
    stream_append(&stream, "BT /F2 9 Tf 42 %f Td (MANDATORY DECLARATION) ET\n", y - 10.0f);
    stream_append(&stream, "BT /F2 9 Tf 180 %f Td (EXTRACTED VALUE & EVIDENCE) ET\n", y - 10.0f);
    stream_append(&stream, "BT /F2 9 Tf 440 %f Td (SOURCE / CONFIDENCE) ET\n", y - 10.0f);

    y -= 22.0f;

    for (int i = 0; i < scan->field_count && y > 380.0f; i++) {
        char safe_field[64];
        char safe_val[128];
        char safe_evid[128];
        sanitize_pdf_string(scan->fields[i].field_name, safe_field, sizeof(safe_field));
        sanitize_pdf_string(scan->fields[i].field_value, safe_val, sizeof(safe_val));
        sanitize_pdf_string(scan->fields[i].evidence_text, safe_evid, sizeof(safe_evid));

        // Row background alternating
        if (i % 2 == 1) {
            stream_append(&stream, "0.98 0.98 0.99 rg\n");
            stream_append(&stream, "35 %f 525 16 re f\n", y - 12.0f);
        }

        stream_append(&stream, "0.2 0.25 0.3 rg\n");
        stream_append(&stream, "BT /F2 8 Tf 42 %f Td (%s) ET\n", y - 9.0f, safe_field);

        char display_val[120];
        if (scan->fields[i].unit[0]) {
            snprintf(display_val, sizeof(display_val), "%s %s", safe_val, scan->fields[i].unit);
        } else {
            snprintf(display_val, sizeof(display_val), "%.45s", safe_val);
        }
        stream_append(&stream, "BT /F1 8 Tf 180 %f Td (%s) ET\n", y - 9.0f, display_val);

        stream_append(&stream, "BT /F1 8 Tf 440 %f Td (%s | %.0f%%) ET\n", 
                      y - 9.0f, scan->fields[i].extraction_source, scan->fields[i].confidence * 100.0);

        y -= 17.0f;
    }

    y -= 12.0f;

    // 4. Section Title: Legal Metrology Compliance Matrix
    stream_append(&stream, "0.1 0.15 0.25 rg\n");
    stream_append(&stream, "BT /F2 13 Tf 35 %f Td (2. STATUTORY COMPLIANCE EVALUATION MATRIX) ET\n", y);
    stream_append(&stream, "0.2 0.4 0.8 RG 1.5 w\n");
    stream_append(&stream, "35 %f 525 %f m 560 %f l s\n", y - 4.0f, y - 4.0f, y - 4.0f);

    y -= 22.0f;

    // Compliance Table Header
    stream_append(&stream, "0.92 0.94 0.97 rg\n");
    stream_append(&stream, "35 %f 525 18 re f\n", y - 14.0f);
    stream_append(&stream, "0.1 0.2 0.3 rg\n");
    stream_append(&stream, "BT /F2 9 Tf 42 %f Td (RULE ID) ET\n", y - 10.0f);
    stream_append(&stream, "BT /F2 9 Tf 135 %f Td (LEGAL REQUIREMENT / FINDINGS) ET\n", y - 10.0f);
    stream_append(&stream, "BT /F2 9 Tf 470 %f Td (STATUS) ET\n", y - 10.0f);

    y -= 20.0f;

    for (int i = 0; i < scan->result_count && y > 140.0f; i++) {
        const ComplianceResult *r = &scan->results[i];
        char safe_exp[140];
        sanitize_pdf_string(r->explanation, safe_exp, sizeof(safe_exp));

        // Status pill color
        if (r->result == COMPLIANCE_PASS) {
            stream_append(&stream, "0.85 0.97 0.90 rg\n"); // Light green
            stream_append(&stream, "465 %f 65 14 re f\n", y - 11.0f);
            stream_append(&stream, "0.06 0.60 0.30 rg\n"); // Dark green
            stream_append(&stream, "BT /F2 8 Tf 480 %f Td (PASS) ET\n", y - 8.0f);
        } else if (r->result == COMPLIANCE_FAIL) {
            stream_append(&stream, "0.98 0.88 0.88 rg\n"); // Light red
            stream_append(&stream, "465 %f 65 14 re f\n", y - 11.0f);
            stream_append(&stream, "0.80 0.15 0.15 rg\n"); // Dark red
            stream_append(&stream, "BT /F2 8 Tf 480 %f Td (FAIL) ET\n", y - 8.0f);
        } else if (r->result == COMPLIANCE_NOT_APPLICABLE) {
            stream_append(&stream, "0.93 0.93 0.95 rg\n"); // Light gray
            stream_append(&stream, "465 %f 65 14 re f\n", y - 11.0f);
            stream_append(&stream, "0.4 0.4 0.45 rg\n");
            stream_append(&stream, "BT /F2 8 Tf 485 %f Td (N/A) ET\n", y - 8.0f);
        } else {
            stream_append(&stream, "0.99 0.94 0.85 rg\n"); // Light amber
            stream_append(&stream, "465 %f 65 14 re f\n", y - 11.0f);
            stream_append(&stream, "0.75 0.45 0.05 rg\n");
            stream_append(&stream, "BT /F2 8 Tf 472 %f Td (UNCLEAR) ET\n", y - 8.0f);
        }

        stream_append(&stream, "0.15 0.20 0.28 rg\n");
        stream_append(&stream, "BT /F2 8 Tf 42 %f Td (%s) ET\n", y - 8.0f, r->rule_id);
        stream_append(&stream, "BT /F1 7.5 Tf 135 %f Td (%.68s) ET\n", y - 8.0f, safe_exp);

        y -= 19.0f;
    }

    // 5. Official Statutory Disclaimer (Bottom Box)
    stream_append(&stream, "0.97 0.97 0.98 rg\n");
    stream_append(&stream, "35 35 525 55 re f\n");
    stream_append(&stream, "0.85 0.85 0.90 RG 0.8 w\n");
    stream_append(&stream, "35 35 525 55 re s\n");

    stream_append(&stream, "0.5 0.1 0.1 rg\n");
    stream_append(&stream, "BT /F2 8 Tf 42 75 Td (IMPORTANT REGULATORY DISCLAIMER:) ET\n");
    stream_append(&stream, "0.3 0.3 0.35 rg\n");
    stream_append(&stream, "BT /F1 7 Tf 42 63 Td (LegalCheck 360 provides automated preliminary compliance screening under the Legal Metrology \\(Packaged) ET\n");
    stream_append(&stream, "BT /F1 7 Tf 42 53 Td (Commodities\\) Rules, 2011. This report does NOT constitute official government certification, statutory) ET\n");
    stream_append(&stream, "BT /F1 7 Tf 42 43 Td (clearance, or final legal determination. In case of ambiguous or disputed markings, physical inspection is required.) ET\n");

    // Output PDF Objects
    long offsets[10];

    fprintf(fp, "%%PDF-1.4\n%%\xE2\xE3\xCF\xD3\n");

    // Obj 1: Catalog
    offsets[1] = ftell(fp);
    fprintf(fp, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    // Obj 2: Pages
    offsets[2] = ftell(fp);
    fprintf(fp, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

    // Obj 3: Page
    offsets[3] = ftell(fp);
    fprintf(fp, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] "
                "/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n");

    // Obj 4: Helvetica regular
    offsets[4] = ftell(fp);
    fprintf(fp, "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

    // Obj 5: Helvetica bold
    offsets[5] = ftell(fp);
    fprintf(fp, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n");

    // Obj 6: Stream contents
    offsets[6] = ftell(fp);
    fprintf(fp, "6 0 obj\n<< /Length %zu >>\nstream\n%sendstream\nendobj\n", stream.size, stream.data);

    // Cross-reference table
    long xref_pos = ftell(fp);
    fprintf(fp, "xref\n0 7\n0000000000 65535 f \n");
    for (int i = 1; i <= 6; i++) {
        fprintf(fp, "%010ld 00000 n \n", offsets[i]);
    }

    fprintf(fp, "trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n%ld\n%%%%EOF\n", xref_pos);
    fclose(fp);

    free(stream.data);
    LOG_INFO("Vector PDF report generated successfully: %s", output_filepath);
    return true;
}
