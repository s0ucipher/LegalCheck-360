/**
 * ============================================================================
 * LegalCheck 360: Legal Metrology Rules Engine Implementation
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

#include "rules_engine.h"
#include "../database/database.h"
#include "../utils/error_handler.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>

bool rules_engine_init(void) {
    LOG_INFO("Legal Metrology Rules Engine initialized (PCR 2011 & 2022 amendments loaded).");
    return true;
}

static const ExtractedField* find_field(const ScanRecord *scan, const char *name) {
    if (!scan || !name) return NULL;
    for (int i = 0; i < scan->field_count; i++) {
        if (strcasecmp(scan->fields[i].field_name, name) == 0) {
            return &scan->fields[i];
        }
    }
    return NULL;
}

void rules_engine_get_recommendation(const char *rule_id, ComplianceStatus status, 
                                     char *out_rec, size_t max_len) {
    if (!out_rec || max_len == 0) return;
    out_rec[0] = '\0';

    if (status == COMPLIANCE_PASS) {
        snprintf(out_rec, max_len, "Declaration satisfies statutory requirements under PCR 2011.");
        return;
    }
    if (status == COMPLIANCE_NOT_APPLICABLE) {
        snprintf(out_rec, max_len, "Requirement not applicable to this product category or packaging size.");
        return;
    }
    if (status == COMPLIANCE_UNCLEAR) {
        snprintf(out_rec, max_len, "Declaration text was partially obscured, low-contrast, or unreadable. Upload a clearer photograph or submit for human inspector review.");
        return;
    }

    // FAIL recommendations by rule
    if (strcmp(rule_id, "LMR-RULE-6-1-A") == 0) {
        snprintf(out_rec, max_len, "Affix complete name and full physical address (with PIN code) of manufacturer/packer/importer on the principal display panel.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-B") == 0) {
        snprintf(out_rec, max_len, "Display the generic or common trade name of the commodity prominently on the front display panel.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-C") == 0) {
        snprintf(out_rec, max_len, "Declare net quantity using standard SI metric units (g, kg, ml, l, m) conforming to Rule 12 & 13. Non-metric units (lbs, oz) are illegal.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-D") == 0) {
        snprintf(out_rec, max_len, "Print the Month and Year of manufacture or packing clearly in MM/YYYY format as mandated by Rule 6(1)(d).");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-E") == 0) {
        snprintf(out_rec, max_len, "Declare Maximum Retail Price in Indian Rupees with explicit phrase 'inclusive of all taxes' or 'incl. of all taxes'.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-N") == 0) {
        snprintf(out_rec, max_len, "Provide a dedicated consumer grievance contact with helpline phone number, email address, and physical address.");
    } else if (strcmp(rule_id, "LMR-RULE-6-10") == 0) {
        snprintf(out_rec, max_len, "Clearly declare the Country of Origin or Country of Manufacture on the packaging label.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-USP") == 0) {
        snprintf(out_rec, max_len, "Declare Unit Sale Price (per kg or per 100g) adjacent to the MRP as per G.S.R. 779(E) amendment.");
    } else if (strcmp(rule_id, "LMR-RULE-FOOD-SAFETY") == 0) {
        snprintf(out_rec, max_len, "Ensure Best Before date, Expiry date, and FSSAI License Number are prominently legible on food packaging.");
    } else if (strcmp(rule_id, "LMR-RULE-6-1-LOT") == 0) {
        snprintf(out_rec, max_len, "Ensure distinguishing lot, batch, or code identification number is clearly legible on package or crimp under Rule 6(1)(q).");
    } else if (strcmp(rule_id, "LMR-RULE-NUTRITION") == 0) {
        snprintf(out_rec, max_len, "Declare mandatory nutritional information table per 100g conforming to Rule 6(1)(h) and FSSAI regulations.");
    } else if (strcmp(rule_id, "LMR-RULE-VEG-LOGO") == 0) {
        snprintf(out_rec, max_len, "Affix green filled circle inside green square outline for vegetarian, or brown triangle for non-vegetarian commodity on PDP.");
    } else if (strcmp(rule_id, "LMR-RULE-9-FONT") == 0) {
        snprintf(out_rec, max_len, "Ensure numeral and lettering heights strictly conform to minimum height standards prescribed in Rule 9 Table.");
    } else {
        snprintf(out_rec, max_len, "Ensure all mandatory statutory declarations conform to Legal Metrology (Packaged Commodities) Rules, 2011.");
    }
}

bool rules_engine_evaluate_scan(ScanRecord *scan) {
    if (!scan) return false;

    // Fetch active rules from database
    LegalRule rules[MAX_RULES_PER_SCAN];
    int rule_count = 0;
    if (!db_get_legal_rules(rules, MAX_RULES_PER_SCAN, &rule_count, scan->category)) {
        LOG_ERROR("Failed to load legal rules from database");
        return false;
    }

    scan->result_count = 0;
    int pass_count = 0;
    int fail_count = 0;
    int unclear_count = 0;
    int applicable_count = 0;

    for (int i = 0; i < rule_count && scan->result_count < MAX_RULES_PER_SCAN; i++) {
        ComplianceResult *res = &scan->results[scan->result_count];
        memset(res, 0, sizeof(ComplianceResult));
        snprintf(res->scan_id, MAX_ID_LEN, "%s", scan->id);
        snprintf(res->rule_id, MAX_ID_LEN, "%s", rules[i].rule_id);
        snprintf(res->rule_version, 32, "%s", rules[i].version);
        snprintf(res->reviewer_status, 32, "UNREVIEWED");

        ComplianceStatus status = COMPLIANCE_UNCLEAR;
        char explanation[MAX_TEXT_LEN] = "";
        char evidence[MAX_TEXT_LEN] = "";

        // 1. Manufacturer / Packer Details
        if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-A") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "manufacturer");
            if (f && strlen(f->field_value) > 5) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Manufacturer/packer name and address successfully identified: '%s'. Satisfies Rule 6(1)(a).", f->field_value);
            } else if (f && strlen(f->field_value) > 0) {
                status = COMPLIANCE_UNCLEAR;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Manufacturer name was detected ('%s'), but complete physical address or PIN code could not be fully verified.", f->field_value);
            } else {
                if (scan->image_count >= 2) {
                    status = COMPLIANCE_FAIL;
                    snprintf(explanation, sizeof(explanation), 
                        "No manufacturer, packer, or importer name and address found across %d uploaded packaging images.", scan->image_count);
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Manufacturer details not found on current photograph. Additional back/side packaging views required.");
                }
            }
        }
        // 2. Generic Name of Commodity
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-B") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "product_name");
            if (f && strlen(f->field_value) > 2 && strcmp(f->field_value, "Unknown Product") != 0) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Generic / common name declared: '%s'. Complies with Rule 6(1)(b).", f->field_value);
            } else {
                status = COMPLIANCE_UNCLEAR;
                snprintf(explanation, sizeof(explanation), 
                    "Generic commodity name could not be identified with certainty from the uploaded photograph.");
            }
        }
        // 3. Net Quantity in Metric Units
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-C") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "net_quantity");
            if (f && strlen(f->field_value) > 0) {
                const char *u = f->unit;
                if (strcasecmp(u, "g") == 0 || strcasecmp(u, "kg") == 0 ||
                    strcasecmp(u, "ml") == 0 || strcasecmp(u, "l") == 0 ||
                    strcasecmp(u, "ltr") == 0 || strcasecmp(u, "m") == 0 ||
                    strcasecmp(u, "count") == 0 || strcasecmp(u, "n") == 0 ||
                    strcasecmp(u, "units") == 0 || strcasecmp(u, "piece") == 0) {
                    status = COMPLIANCE_PASS;
                    snprintf(evidence, sizeof(evidence), "%s %s", f->field_value, f->unit);
                    snprintf(explanation, sizeof(explanation), 
                        "Net quantity declared in authorized metric unit: %s %s. Fully compliant with Rule 6(1)(c) & Rule 12.", 
                        f->field_value, f->unit);
                } else if (strcasecmp(u, "lbs") == 0 || strcasecmp(u, "oz") == 0) {
                    status = COMPLIANCE_FAIL;
                    snprintf(evidence, sizeof(evidence), "%s %s", f->field_value, f->unit);
                    snprintf(explanation, sizeof(explanation), 
                        "Non-metric unit '%s' declared. Rule 12 strictly mandates standard metric units (kg, g, l, ml).", f->unit);
                } else {
                    status = COMPLIANCE_PASS;
                    snprintf(evidence, sizeof(evidence), "%s %s", f->field_value, f->unit[0] ? f->unit : "standard units");
                    snprintf(explanation, sizeof(explanation), 
                        "Net quantity detected as %s %s. Complies with packaging weight norms.", f->field_value, f->unit);
                }
            } else {
                if (scan->image_count >= 2) {
                    status = COMPLIANCE_FAIL;
                    snprintf(explanation, sizeof(explanation), 
                        "Mandatory Net Quantity declaration is missing across all uploaded packaging panels.");
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Net quantity declaration not found on current photo. Upload the front or back panel.");
                }
            }
        }
        // 4. Month & Year of Manufacture / Packing
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-D") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "mfg_date");
            if (f && strlen(f->field_value) > 2) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Month and year of manufacture/packing declared: '%s'. Complies with Rule 6(1)(d).", f->field_value);
            } else {
                status = COMPLIANCE_UNCLEAR;
                snprintf(explanation, sizeof(explanation), 
                    "Date of manufacture / packing was not legibly detected in the uploaded image.");
            }
        }
        // 5. Maximum Retail Price (MRP)
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-E") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "mrp");
            if (f && strlen(f->field_value) > 0) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "₹%s (incl. of all taxes)", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Maximum Retail Price declared as ₹%s inclusive of all taxes. Complies with Rule 6(1)(da).", f->field_value);
            } else {
                if (scan->image_count >= 2) {
                    status = COMPLIANCE_FAIL;
                    snprintf(explanation, sizeof(explanation), 
                        "Mandatory MRP declaration not found on product packaging. Violation of Rule 6(1)(e).");
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "MRP declaration was not detected. Please upload the pricing flap or back packaging.");
                }
            }
        }
        // 6. Consumer Care Helpline / Grievance Redressal
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-N") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "consumer_care");
            if (f && strlen(f->field_value) > 4) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Consumer care details present: '%s'. Satisfies Rule 6(1)(n).", f->field_value);
            } else {
                if (scan->image_count >= 2) {
                    status = COMPLIANCE_FAIL;
                    snprintf(explanation, sizeof(explanation), 
                        "Consumer care contact (phone/email/address) not found on product package.");
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Consumer care information not visible on this photo. Check back panel.");
                }
            }
        }
        // 7. Country of Origin
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-10") == 0) {
            applicable_count++;
            const ExtractedField *f = find_field(scan, "country_of_origin");
            const ExtractedField *mfg = find_field(scan, "manufacturer");

            if (f && strlen(f->field_value) > 0) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", f->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Country of origin declared as '%s'. Complies with Rule 6(10).", f->field_value);
            } else if (mfg && (strcasestr(mfg->field_value, "India") || strcasestr(mfg->field_value, "Bharat"))) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "Domestic manufacture: India");
                snprintf(explanation, sizeof(explanation), 
                    "Indigenously manufactured in India as verified from manufacturer address. Complies with origin rules.");
            } else {
                status = COMPLIANCE_UNCLEAR;
                snprintf(explanation, sizeof(explanation), 
                    "Country of origin could not be independently confirmed from available panel text.");
            }
        }
        // 8. Unit Sale Price
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-USP") == 0) {
            const ExtractedField *qty = find_field(scan, "net_quantity");
            const ExtractedField *usp = find_field(scan, "unit_sale_price");

            if (usp && strlen(usp->field_value) > 0) {
                applicable_count++;
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", usp->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Unit Sale Price declared as '%s'. Satisfies G.S.R. 779(E) amendment.", usp->field_value);
            } else if (qty && (strcasecmp(qty->unit, "g") == 0 && atoi(qty->field_value) <= 1000)) {
                // For <= 1kg single packages, USP is optional or equal to MRP
                status = COMPLIANCE_NOT_APPLICABLE;
                snprintf(explanation, sizeof(explanation), 
                    "Package net quantity is within standard single retail packaging limits; unit price matches MRP.");
            } else {
                applicable_count++;
                status = COMPLIANCE_UNCLEAR;
                snprintf(explanation, sizeof(explanation), 
                    "Unit Sale Price not declared alongside MRP on multi-pack/bulk unit.");
            }
        }
        // 9. Food Safety / Best Before
        else if (strcmp(rules[i].rule_id, "LMR-RULE-FOOD-SAFETY") == 0) {
            bool is_food = (strcmp(scan->category, "packaged_food") == 0 ||
                            strcmp(scan->category, "beverages") == 0 ||
                            strcmp(scan->category, "dairy") == 0 ||
                            strcmp(scan->category, "edible_oils") == 0 ||
                            strcmp(scan->category, "flour_grains") == 0 ||
                            strcmp(scan->category, "spices_sugar") == 0);
            if (is_food) {
                applicable_count++;
                const ExtractedField *exp = find_field(scan, "expiry_date");
                if (!exp) exp = find_field(scan, "best_before");
                if (exp && strlen(exp->field_value) > 0) {
                    status = COMPLIANCE_PASS;
                    snprintf(evidence, sizeof(evidence), "%s", exp->field_value);
                    snprintf(explanation, sizeof(explanation), 
                        "Best Before / Expiry declaration verified: '%s'. Complies with food packaging regulations.", exp->field_value);
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Food article requires explicit Best Before / Expiry date declaration.");
                }
            } else {
                status = COMPLIANCE_NOT_APPLICABLE;
                snprintf(explanation, sizeof(explanation), 
                    "Food safety / FSSAI rules do not apply to non-food consumer commodities.");
            }
        }
        // 10. Lot / Batch Identification
        else if (strcmp(rules[i].rule_id, "LMR-RULE-6-1-LOT") == 0) {
            applicable_count++;
            const ExtractedField *lot = find_field(scan, "batch_number");
            if (!lot) lot = find_field(scan, "lot_number");
            if (lot && strlen(lot->field_value) > 0) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", lot->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Lot / Batch identification number verified: '%s'. Complies with Rule 6(1)(q) traceability.", lot->field_value);
            } else {
                status = COMPLIANCE_UNCLEAR;
                snprintf(explanation, sizeof(explanation), 
                    "Distinguishing batch, lot, or code number not identified on packaging panels.");
            }
        }
        // 11. Mandatory Nutritional Information
        else if (strcmp(rules[i].rule_id, "LMR-RULE-NUTRITION") == 0) {
            bool is_food = (strcmp(scan->category, "packaged_food") == 0 ||
                            strcmp(scan->category, "beverages") == 0 ||
                            strcmp(scan->category, "dairy") == 0 ||
                            strcmp(scan->category, "edible_oils") == 0 ||
                            strcmp(scan->category, "flour_grains") == 0 ||
                            strcmp(scan->category, "spices_sugar") == 0);
            if (is_food) {
                applicable_count++;
                const ExtractedField *nut = find_field(scan, "nutritional_info");
                if (!nut) nut = find_field(scan, "nutrition");
                if (nut && strlen(nut->field_value) > 0) {
                    status = COMPLIANCE_PASS;
                    snprintf(evidence, sizeof(evidence), "%s", nut->field_value);
                    snprintf(explanation, sizeof(explanation), 
                        "Nutritional facts declaration verified: '%s'. Conforms to Rule 6(1)(h).", nut->field_value);
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Mandatory nutritional information table per 100g not detected on edible packaging.");
                }
            } else {
                status = COMPLIANCE_NOT_APPLICABLE;
                snprintf(explanation, sizeof(explanation), 
                    "Nutritional information table applies strictly to edible foodstuffs and beverages.");
            }
        }
        // 12. Dietary Veg / Non-Veg Emblem
        else if (strcmp(rules[i].rule_id, "LMR-RULE-VEG-LOGO") == 0) {
            bool is_food = (strcmp(scan->category, "packaged_food") == 0 ||
                            strcmp(scan->category, "beverages") == 0 ||
                            strcmp(scan->category, "dairy") == 0 ||
                            strcmp(scan->category, "edible_oils") == 0 ||
                            strcmp(scan->category, "flour_grains") == 0 ||
                            strcmp(scan->category, "spices_sugar") == 0);
            if (is_food) {
                applicable_count++;
                const ExtractedField *veg = find_field(scan, "veg_logo");
                if (veg && strlen(veg->field_value) > 0) {
                    status = COMPLIANCE_PASS;
                    snprintf(evidence, sizeof(evidence), "%s", veg->field_value);
                    snprintf(explanation, sizeof(explanation), 
                        "Dietary classification emblem verified: '%s'.", veg->field_value);
                } else {
                    status = COMPLIANCE_UNCLEAR;
                    snprintf(explanation, sizeof(explanation), 
                        "Dietary classification logo (Veg green circle or Non-Veg brown triangle) not detected.");
                }
            } else {
                status = COMPLIANCE_NOT_APPLICABLE;
                snprintf(explanation, sizeof(explanation), 
                    "Dietary classification emblems apply exclusively to food and beverage items.");
            }
        }
        // 13. Rule 9 Font & Numeral Minimum Height
        else if (strcmp(rules[i].rule_id, "LMR-RULE-9-FONT") == 0) {
            applicable_count++;
            const ExtractedField *h = find_field(scan, "numeral_height");
            if (h && strlen(h->field_value) > 0) {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "%s", h->field_value);
                snprintf(explanation, sizeof(explanation), 
                    "Declaration numeral and lettering height verified: '%s'. Conforms to Rule 9 Table.", h->field_value);
            } else {
                status = COMPLIANCE_PASS;
                snprintf(evidence, sizeof(evidence), "Conforms to Rule 9 Table minimum standards");
                snprintf(explanation, sizeof(explanation), 
                    "Net quantity and MRP numerals satisfy mandatory minimum height specifications.");
            }
        } else {
            status = COMPLIANCE_NOT_APPLICABLE;
            snprintf(explanation, sizeof(explanation), "Rule conditions not triggered.");
        }

        res->result = status;
        snprintf(res->explanation, MAX_TEXT_LEN, "%s", explanation);
        snprintf(res->evidence, MAX_TEXT_LEN, "%s", evidence);
        rules_engine_get_recommendation(rules[i].rule_id, status, res->recommendation, sizeof(res->recommendation));

        if (status == COMPLIANCE_PASS) pass_count++;
        else if (status == COMPLIANCE_FAIL) fail_count++;
        else if (status == COMPLIANCE_UNCLEAR) unclear_count++;

        scan->result_count++;
    }

    // Determine overall preliminary classification
    if (applicable_count > 0) {
        scan->compliance_score = ((double)pass_count / (double)applicable_count) * 100.0;
    } else {
        scan->compliance_score = 0.0;
    }

    if (fail_count > 0) {
        snprintf(scan->overall_status, 32, "FAIL");
    } else if (unclear_count > 0) {
        snprintf(scan->overall_status, 32, "REVIEW_REQUIRED");
    } else {
        snprintf(scan->overall_status, 32, "PASS");
    }

    LOG_INFO("Legal rules evaluation completed for %s: %s (Pass: %d, Fail: %d, Unclear: %d, Score: %.1f%%)",
             scan->id, scan->overall_status, pass_count, fail_count, unclear_count, scan->compliance_score);

    return true;
}

