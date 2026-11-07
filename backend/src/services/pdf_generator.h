/**
 * ============================================================================
 * LegalCheck 360: Pure C PDF Report Generator Header
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#ifndef PDF_GENERATOR_H
#define PDF_GENERATOR_H

#include "../models/product.h"
#include <stdbool.h>

/**
 * Generate a professional, multi-page vector PDF compliance inspection report.
 * Zero external library dependencies required. Strictly follows Adobe PDF 1.4 specification.
 * 
 * @param scan Complete scan record containing images, fields, and compliance evaluations
 * @param output_filepath Filepath where the PDF will be saved
 * @return true if PDF was generated successfully, false otherwise
 */
bool pdf_generate_compliance_report(const ScanRecord *scan, const char *output_filepath);

#endif /* PDF_GENERATOR_H */

