/**
 * ============================================================================
 * LegalCheck 360: Vercel Cloud Serverless Backend Core
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Provides serverless compliance evaluation, packaging declarations extraction,
 * statutory rules engine (PCR 2011), and vector PDF generation for Vercel.
 */

// Initial Seed Legal Rules (PCR 2011 & 2022 Amendments)
let legalRules = [
  {
    id: 1,
    rule_id: "LMR-RULE-6-1-A",
    rule_name: "Manufacturer / Packer / Importer Name & Complete Address",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Every package shall bear name and complete address of manufacturer, packer, or importer.",
    legal_reference: "Rule 6(1)(a), Legal Metrology (Packaged Commodities) Rules, 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 2,
    rule_id: "LMR-RULE-6-1-B",
    rule_name: "Generic or Common Name of Commodity",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Package shall clearly declare common or generic trade name of commodity.",
    legal_reference: "Rule 6(1)(b), Legal Metrology (Packaged Commodities) Rules, 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 3,
    rule_id: "LMR-RULE-6-1-C",
    rule_name: "Net Quantity in Standard Metric Units",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Net quantity in standard SI metric units (g, kg, ml, l, m, count). Non-metric units (lbs, oz) prohibited.",
    legal_reference: "Rule 6(1)(c) read with Rule 12 & 13, PCR 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 4,
    rule_id: "LMR-RULE-6-1-D",
    rule_name: "Month and Year of Manufacture / Packing / Import",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Every package shall mention month and year of manufacture, packing or import.",
    legal_reference: "Rule 6(1)(d), Legal Metrology (Packaged Commodities) Rules, 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 5,
    rule_id: "LMR-RULE-6-1-E",
    rule_name: "Maximum Retail Price (MRP) Inclusive of All Taxes",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Maximum Retail Price in INR (Rs./₹) with mandatory phrase 'inclusive of all taxes'.",
    legal_reference: "Rule 6(1)(da) / Rule 6(1)(e), PCR 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 6,
    rule_id: "LMR-RULE-6-1-N",
    rule_name: "Consumer Care / Grievance Redressal Contact",
    version: "2011.amended.2022",
    category: "all",
    requirement: "Package must state name, address, telephone number, and e-mail of consumer care helpline.",
    legal_reference: "Rule 6(1)(n), Legal Metrology (Packaged Commodities) Rules, 2011",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 7,
    rule_id: "LMR-RULE-6-10",
    rule_name: "Country of Origin Declaration",
    version: "2020.amendment",
    category: "all",
    requirement: "Mandatory country of origin declaration on retail packaged commodities.",
    legal_reference: "Rule 6(10) / Notification G.S.R. 529(E), PCR 2011",
    effective_from: "2020-01-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 8,
    rule_id: "LMR-RULE-6-1-USP",
    rule_name: "Unit Sale Price Declaration",
    version: "2021.amendment.2022",
    category: "all",
    requirement: "Packages > 1kg/1L must declare Unit Sale Price per kg/litre; packages < 1kg/1L per 100g/100ml.",
    legal_reference: "Rule 6(1)(11) amended via G.S.R. 779(E), PCR 2011",
    effective_from: "2022-12-01",
    verified_at: "2026-01-15",
    active_status: 1
  },
  {
    id: 9,
    rule_id: "LMR-RULE-FOOD-SAFETY",
    rule_name: "Best Before / Expiry & FSSAI Declarations",
    version: "2011.amended.2022",
    category: "packaged_food",
    requirement: "Pre-packaged food must display Best Before / Expiry date and FSSAI License Number.",
    legal_reference: "Rule 6(1)(d) proviso read with FSSAI Regulations",
    effective_from: "2011-03-01",
    verified_at: "2026-01-15",
    active_status: 1
  }
];

// Pre-seeded Scans
let scanRecords = [
  {
    id: "LMC-2026-PASS-001",
    product_name: "Britannia Good Day Butter Cookies",
    category: "packaged_food",
    overall_status: "PASS",
    compliance_score: 100.0,
    raw_ocr_text: "Britannia Good Day Butter Cookies Net Qty: 200g MRP Rs. 40.00 (Incl. of all taxes) USP: Rs. 0.20/g Pkd: 01/2026 Best Before 6 months from packaging Mfd by: Britannia Industries Ltd., 5/1A Hungerford St, Kolkata 700017 Consumer Care: 1800-425-4449 feedback@britindia.com Country of Origin: India Lic No. 10015043001129",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    images: ["tests/samples/biscuit_front.jpg", "tests/samples/biscuit_back.jpg"],
    fields: [
      { id: 1, field_name: "product_name", field_value: "Britannia Good Day Butter Cookies", confidence: 0.98, evidence_text: "Britannia Good Day Butter Cookies", source_view: "front", is_verified: 1 },
      { id: 2, field_name: "mrp", field_value: "40.00 INR (Incl. of all taxes)", confidence: 0.96, evidence_text: "MRP Rs. 40.00 (Incl. of all taxes)", source_view: "back", is_verified: 1 },
      { id: 3, field_name: "net_quantity", field_value: "200 g", confidence: 0.99, evidence_text: "Net Qty: 200g", source_view: "back", is_verified: 1 },
      { id: 4, field_name: "manufacturing_date", field_value: "01/2026", confidence: 0.94, evidence_text: "Pkd: 01/2026", source_view: "back", is_verified: 1 },
      { id: 5, field_name: "manufacturer_name_address", field_value: "Britannia Industries Ltd., 5/1A Hungerford St, Kolkata - 700017, WB", confidence: 0.95, evidence_text: "Mfd by: Britannia Industries Ltd., 5/1A Hungerford St, Kolkata 700017", source_view: "back", is_verified: 1 },
      { id: 6, field_name: "consumer_care", field_value: "1800-425-4449 | feedback@britindia.com", confidence: 0.93, evidence_text: "Consumer Care: 1800-425-4449 feedback@britindia.com", source_view: "back", is_verified: 1 },
      { id: 7, field_name: "country_of_origin", field_value: "India", confidence: 0.99, evidence_text: "Country of Origin: India", source_view: "back", is_verified: 1 },
      { id: 8, field_name: "unit_sale_price", field_value: "0.20 INR / g", confidence: 0.92, evidence_text: "USP: Rs. 0.20/g", source_view: "back", is_verified: 1 },
      { id: 9, field_name: "fssai_license", field_value: "10015043001129", confidence: 0.97, evidence_text: "Lic No. 10015043001129", source_view: "back", is_verified: 1 }
    ],
    results: [
      { rule_id: "LMR-RULE-6-1-A", rule_name: "Manufacturer / Packer Address", status: "PASS", evidence: "Britannia Industries Ltd., Kolkata 700017", explanation: "Complete address and name present.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-B", rule_name: "Generic Commodity Name", status: "PASS", evidence: "Butter Cookies", explanation: "Generic name clearly declared.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-C", rule_name: "Metric Net Quantity", status: "PASS", evidence: "200 g", explanation: "SI metric units declared properly.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-D", rule_name: "Month/Year of Packing", status: "PASS", evidence: "01/2026", explanation: "Valid packing date in MM/YYYY format.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-E", rule_name: "MRP incl. Taxes", status: "PASS", evidence: "MRP Rs. 40.00 (Incl. of all taxes)", explanation: "MRP stated with mandatory tax clause.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-N", rule_name: "Consumer Care Helpline", status: "PASS", evidence: "1800-425-4449 | feedback@britindia.com", explanation: "Toll-free number and email provided.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-10", rule_name: "Country of Origin", status: "PASS", evidence: "India", explanation: "Country of origin explicitly declared.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-USP", rule_name: "Unit Sale Price", status: "PASS", evidence: "Rs. 0.20/g", explanation: "Unit sale price declared adjacent to MRP.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-FOOD-SAFETY", rule_name: "Best Before & FSSAI", status: "PASS", evidence: "Lic No. 10015043001129", explanation: "FSSAI License number and Best Before present.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" }
    ]
  },
  {
    id: "LMC-2026-FAIL-002",
    product_name: "Crunchy Bites Spiced Potato Wafers",
    category: "packaged_food",
    overall_status: "FAIL",
    compliance_score: 11.1,
    raw_ocr_text: "Crunchy Bites Wafers Net Wt 7.05 oz (200g) Price: 35 Rupees Packed at Mumbai India",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    images: ["tests/samples/noncompliant_snack.jpg"],
    fields: [
      { id: 1, field_name: "product_name", field_value: "Crunchy Bites Spiced Potato Wafers", confidence: 0.91, evidence_text: "Crunchy Bites Wafers", source_view: "front", is_verified: 0 },
      { id: 2, field_name: "mrp", field_value: "35 Rupees (Missing tax phrase)", confidence: 0.85, evidence_text: "Price: 35 Rupees", source_view: "back", is_verified: 0 },
      { id: 3, field_name: "net_quantity", field_value: "7.05 oz (Non-metric imperial primary)", confidence: 0.88, evidence_text: "Net Wt 7.05 oz", source_view: "back", is_verified: 0 },
      { id: 4, field_name: "manufacturer_name_address", field_value: "Mumbai India (Incomplete address, no PIN)", confidence: 0.70, evidence_text: "Packed at Mumbai India", source_view: "back", is_verified: 0 }
    ],
    results: [
      { rule_id: "LMR-RULE-6-1-A", rule_name: "Manufacturer / Packer Address", status: "FAIL", evidence: "Packed at Mumbai India", explanation: "Address lacks premise number, street, and mandatory 6-digit postal PIN code.", recommendation: "Affix complete name and full physical address (with PIN code) of manufacturer/packer on the principal display panel.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-B", rule_name: "Generic Commodity Name", status: "PASS", evidence: "Spiced Potato Wafers", explanation: "Generic name declared.", recommendation: "Declaration satisfies statutory requirements under PCR 2011.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-C", rule_name: "Metric Net Quantity", status: "FAIL", evidence: "7.05 oz", explanation: "Imperial ounces used as primary declaration; violates Rule 12 metric SI standard.", recommendation: "Declare net quantity using standard SI metric units (g, kg, ml, l, m) conforming to Rule 12 & 13. Non-metric units (lbs, oz) are illegal.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-D", rule_name: "Month/Year of Packing", status: "UNCLEAR", evidence: "Not detected", explanation: "Packing date declaration not found on label.", recommendation: "Print the Month and Year of manufacture or packing clearly in MM/YYYY format as mandated by Rule 6(1)(d).", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-E", rule_name: "MRP incl. Taxes", status: "FAIL", evidence: "Price: 35 Rupees", explanation: "Missing mandatory phrase 'inclusive of all taxes' under Rule 6(1)(da).", recommendation: "Declare Maximum Retail Price in Indian Rupees with explicit phrase 'inclusive of all taxes' or 'incl. of all taxes'.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-N", rule_name: "Consumer Care Helpline", status: "FAIL", evidence: "None", explanation: "No customer service contact or email provided.", recommendation: "Provide a dedicated consumer grievance contact with helpline phone number, email address, and physical address.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-10", rule_name: "Country of Origin", status: "UNCLEAR", evidence: "Not explicitly stated", explanation: "Ambiguous origin statement.", recommendation: "Clearly declare the Country of Origin or Country of Manufacture on the packaging label.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-USP", rule_name: "Unit Sale Price", status: "UNCLEAR", evidence: "Missing", explanation: "Unit sale price not printed.", recommendation: "Declare Unit Sale Price (per kg or per 100g) adjacent to the MRP as per G.S.R. 779(E) amendment.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-FOOD-SAFETY", rule_name: "Best Before & FSSAI", status: "UNCLEAR", evidence: "Missing", explanation: "FSSAI License missing.", recommendation: "Ensure Best Before date, Expiry date, and FSSAI License Number are prominently legible on food packaging.", reviewer_status: "UNREVIEWED" }
    ]
  },
  {
    id: "LMC-2026-REV-003",
    product_name: "Darjeeling Green Tea Premium Blend",
    category: "beverages",
    overall_status: "REVIEW_REQUIRED",
    compliance_score: 0.0,
    raw_ocr_text: "Packaging text partially unreadable due to lighting glare and motion blur.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
    images: ["tests/samples/blurry_sample.jpg"],
    fields: [
      { id: 1, field_name: "product_name", field_value: "Darjeeling Green Tea (Uncertain)", confidence: 0.42, evidence_text: "Tea...", source_view: "front", is_verified: 0 }
    ],
    results: [
      { rule_id: "LMR-RULE-6-1-A", rule_name: "Manufacturer / Packer Address", status: "UNCLEAR", evidence: "Obscured", explanation: "Address area blurred by light glare.", recommendation: "Upload a clearer, evenly lit photograph of the back panel.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-B", rule_name: "Generic Commodity Name", status: "UNCLEAR", evidence: "Uncertain", explanation: "Low OCR confidence.", recommendation: "Declaration text was partially obscured. Upload a clearer photograph.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-C", rule_name: "Metric Net Quantity", status: "UNCLEAR", evidence: "Not legible", explanation: "Quantity declaration unreadable.", recommendation: "Upload a clear photo of the bottom/corner display panel.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-D", rule_name: "Month/Year of Packing", status: "UNCLEAR", evidence: "Not legible", explanation: "Packing date unreadable.", recommendation: "Upload a clearer photograph or submit for human inspector review.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-E", rule_name: "MRP incl. Taxes", status: "UNCLEAR", evidence: "Blurred", explanation: "Price text not decipherable.", recommendation: "Upload a clearer photograph or submit for human inspector review.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-N", rule_name: "Consumer Care Helpline", status: "UNCLEAR", evidence: "Not found", explanation: "Helpline unreadable.", recommendation: "Upload a clearer photograph or submit for human inspector review.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-10", rule_name: "Country of Origin", status: "UNCLEAR", evidence: "Not found", explanation: "Origin unreadable.", recommendation: "Upload a clearer photograph or submit for human inspector review.", reviewer_status: "UNREVIEWED" },
      { rule_id: "LMR-RULE-6-1-USP", rule_name: "Unit Sale Price", status: "UNCLEAR", evidence: "Not found", explanation: "USP unreadable.", recommendation: "Upload a clearer photograph or submit for human inspector review.", reviewer_status: "UNREVIEWED" }
    ]
  }
];

// Helper: Evaluate declarations against Legal Metrology Rules
function evaluateDeclarations(scanId, productName, category, fields, rawText) {
  const getField = (name) => fields.find(f => f.field_name.toLowerCase() === name.toLowerCase());

  const results = [];
  let passCount = 0;
  let failCount = 0;
  let unclearCount = 0;

  legalRules.filter(r => r.active_status === 1).forEach(rule => {
    let status = "UNCLEAR";
    let evidence = "Not detected in uploaded packaging text";
    let explanation = "Declaration was not detected or confidence was below acceptable threshold.";
    let recommendation = "";

    if (rule.rule_id === "LMR-RULE-6-1-A") {
      const f = getField("manufacturer_name_address") || getField("manufacturer");
      if (f && f.field_value && f.field_value.length > 5) {
        evidence = f.field_value;
        const hasPin = /\b\d{6}\b/.test(f.field_value);
        if (hasPin) {
          status = "PASS";
          explanation = "Complete manufacturer/packer name and address with postal PIN code verified.";
        } else {
          status = "FAIL";
          explanation = "Manufacturer name or address is incomplete (mandatory postal PIN code not identified).";
        }
      } else {
        status = "UNCLEAR";
        explanation = "Manufacturer / packer declaration was not legible or detected.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-B") {
      const f = getField("product_name");
      if (f && f.field_value && f.field_value.length > 2) {
        status = "PASS";
        evidence = f.field_value;
        explanation = "Generic or common trade name is prominently declared.";
      } else {
        status = "UNCLEAR";
        explanation = "Generic or trade name not clearly recognized.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-C") {
      const f = getField("net_quantity");
      if (f && f.field_value) {
        evidence = f.field_value;
        const val = f.field_value.toLowerCase();
        const hasMetric = /\b(g|kg|ml|l|ltr|meter|m|count|piece|units|pieces)\b/i.test(val);
        const hasImperial = /\b(lbs|lb|oz|fluid\s*oz|ft|inch)\b/i.test(val);
        if (hasMetric && !hasImperial) {
          status = "PASS";
          explanation = "Net quantity declared in lawful SI metric units conforming to Rule 12.";
        } else if (hasImperial) {
          status = "FAIL";
          explanation = "Non-metric imperial units (lbs, oz) detected as primary declaration; prohibited under Rule 12 & 13.";
        } else {
          status = "UNCLEAR";
          explanation = "Net quantity units uncertain or non-standard.";
        }
      } else {
        status = "UNCLEAR";
        explanation = "Net quantity declaration not found on package.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-D") {
      const f = getField("manufacturing_date") || getField("packing_date");
      if (f && f.field_value) {
        evidence = f.field_value;
        const dateMatch = /\b(0[1-9]|1[0-2])[\/\-\.](20\d\d|\d\d)\b/.test(f.field_value) ||
                          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s\.\,\-]+(20\d\d|\d\d)\b/i.test(f.field_value);
        if (dateMatch) {
          status = "PASS";
          explanation = "Month and Year of packing declared in compliant format.";
        } else {
          status = "UNCLEAR";
          explanation = "Date format appears ambiguous or incomplete.";
        }
      } else {
        status = "UNCLEAR";
        explanation = "Manufacturing or packing date declaration not detected.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-E") {
      const f = getField("mrp");
      if (f && f.field_value) {
        evidence = f.field_value;
        const val = f.field_value.toLowerCase();
        const hasNum = /\d+(\.\d+)?/.test(val);
        const hasTax = val.includes("tax") || val.includes("incl");
        if (hasNum && hasTax) {
          status = "PASS";
          explanation = "Maximum Retail Price declared with mandatory 'inclusive of all taxes' clause.";
        } else if (hasNum && !hasTax) {
          status = "FAIL";
          explanation = "MRP numeric value detected, but missing mandatory statutory phrase 'inclusive of all taxes'.";
        } else {
          status = "UNCLEAR";
          explanation = "MRP value not legible.";
        }
      } else {
        status = "UNCLEAR";
        explanation = "MRP declaration not found on packaging.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-N") {
      const f = getField("consumer_care");
      if (f && f.field_value && f.field_value.length > 5) {
        evidence = f.field_value;
        const hasPhone = /\b\d{3,5}[\s\-]?\d{3,7}\b/.test(f.field_value) || /1800\b/.test(f.field_value);
        const hasEmail = /@/.test(f.field_value);
        if (hasPhone || hasEmail) {
          status = "PASS";
          explanation = "Consumer grievance redressal contact (helpline / email) verified.";
        } else {
          status = "FAIL";
          explanation = "Consumer care declaration incomplete (neither phone number nor email detected).";
        }
      } else {
        status = "FAIL";
        explanation = "Mandatory consumer care helpline details not detected on packaging.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-10") {
      const f = getField("country_of_origin");
      if (f && f.field_value && f.field_value.length > 2) {
        status = "PASS";
        evidence = f.field_value;
        explanation = "Country of origin clearly stated on retail packaging.";
      } else {
        status = "UNCLEAR";
        explanation = "Country of origin declaration not detected.";
      }
    } else if (rule.rule_id === "LMR-RULE-6-1-USP") {
      const f = getField("unit_sale_price");
      if (f && f.field_value && f.field_value.length > 2) {
        status = "PASS";
        evidence = f.field_value;
        explanation = "Unit Sale Price declared as required by 2022 amendment.";
      } else {
        status = "UNCLEAR";
        explanation = "Unit Sale Price declaration not found adjacent to MRP.";
      }
    } else if (rule.rule_id === "LMR-RULE-FOOD-SAFETY") {
      if (category === "packaged_food" || category === "beverages") {
        const f = getField("fssai_license") || getField("best_before");
        if (f && f.field_value) {
          status = "PASS";
          evidence = f.field_value;
          explanation = "Food safety declaration / FSSAI license identified.";
        } else {
          status = "UNCLEAR";
          explanation = "FSSAI license or Best Before not clearly recognized.";
        }
      } else {
        status = "NOT_APPLICABLE";
        evidence = "Non-food category";
        explanation = "FSSAI compliance only applies to packaged edible items.";
      }
    }

    if (status === "PASS") {
      passCount++;
      recommendation = "Declaration satisfies statutory requirements under PCR 2011.";
    } else if (status === "FAIL") {
      failCount++;
      recommendation = `Ensure mandatory declaration strictly conforms to ${rule.legal_reference}.`;
    } else if (status === "UNCLEAR") {
      unclearCount++;
      recommendation = "Declaration text was partially obscured. Upload a clearer photograph or submit for human inspector review.";
    }

    results.push({
      rule_id: rule.rule_id,
      rule_name: rule.rule_name,
      legal_reference: rule.legal_reference,
      status: status,
      evidence: evidence,
      explanation: explanation,
      recommendation: recommendation,
      reviewer_status: "UNREVIEWED"
    });
  });

  const applicableRules = results.filter(r => r.status !== "NOT_APPLICABLE");
  const complianceScore = applicableRules.length > 0 
    ? Math.round((passCount / applicableRules.length) * 1000) / 10 
    : 0.0;

  let overallStatus = "PASS";
  if (failCount > 0) {
    overallStatus = "FAIL";
  } else if (unclearCount > 2 || (passCount < 3 && failCount === 0)) {
    overallStatus = "REVIEW_REQUIRED";
  }

  return { results, overallStatus, complianceScore };
}

// Minimal Pure Vector PDF Generator (Adobe PDF 1.4)
function generatePdfReportBuffer(scan) {
  const sanitize = (str) => (str || "").replace(/[()\\]/g, "");
  
  const lines = [
    `%PDF-1.4`,
    `1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`,
    `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`,
    `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >> endobj`,
    `5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> endobj`,
    `6 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`
  ];

  let stream = "";
  // Header background (Slate)
  stream += `0.06 0.09 0.16 rg 0 742 595 100 re f\n`;
  // Gold accent line
  stream += `0.85 0.65 0.13 rg 0 738 595 4 re f\n`;
  // Header Text
  stream += `BT /F1 18 Tf 1 1 1 rg 40 790 Td (LEGALCHECK 360 - STATUTORY INSPECTION REPORT) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.8 0.8 0.8 rg 40 765 Td (Legal Metrology \\(Packaged Commodities\\) Rules, 2011 Compliance Audit) Tj ET\n`;

  // Status Pill
  const status = scan.overall_status || "REVIEW_REQUIRED";
  if (status === "PASS") stream += `0.1 0.6 0.3 rg\n`;
  else if (status === "FAIL") stream += `0.8 0.15 0.15 rg\n`;
  else stream += `0.8 0.5 0.1 rg\n`;
  stream += `440 760 115 28 re f\n`;
  stream += `BT /F1 12 Tf 1 1 1 rg 455 770 Td (${status}) Tj ET\n`;

  // Metadata Box
  stream += `0.95 0.96 0.98 rg 40 640 515 80 re f\n`;
  stream += `0.8 0.8 0.8 RG 1 w 40 640 515 80 re s\n`;
  stream += `BT /F1 10 Tf 0.1 0.1 0.1 rg 55 700 Td (Scan Reference ID: ${sanitize(scan.id)}) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.2 0.2 0.2 rg 55 682 Td (Product Name: ${sanitize(scan.product_name || "N/A")}) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.2 0.2 0.2 rg 55 664 Td (Product Category: ${sanitize(scan.category || "General")}) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.2 0.2 0.2 rg 320 682 Td (Compliance Score: ${scan.compliance_score || 0}%) Tj ET\n`;
  stream += `BT /F2 10 Tf 0.2 0.2 0.2 rg 320 664 Td (Audit Date: ${new Date(scan.created_at || Date.now()).toLocaleDateString()}) Tj ET\n`;

  // Section Heading
  stream += `BT /F1 12 Tf 0.06 0.09 0.16 rg 40 610 Td (RULE-BY-RULE STATUTORY EVALUATION) Tj ET\n`;

  // Rules List
  let y = 580;
  const results = scan.results || [];
  results.slice(0, 7).forEach((r) => {
    // Row background
    stream += `0.98 0.98 0.99 rg 40 ${y - 8} 515 32 re f\n`;
    stream += `0.88 0.88 0.88 RG 0.5 w 40 ${y - 8} 515 32 re s\n`;

    // Rule Name & Ref
    stream += `BT /F1 9 Tf 0.1 0.1 0.1 rg 50 ${y + 12} Td (${sanitize(r.rule_name || r.rule_id)}) Tj ET\n`;
    stream += `BT /F2 8 Tf 0.4 0.4 0.4 rg 50 ${y + 0} Td (${sanitize(r.legal_reference || "")}) Tj ET\n`;

    // Status Pill
    if (r.status === "PASS") stream += `0.1 0.6 0.3 rg\n`;
    else if (r.status === "FAIL") stream += `0.8 0.15 0.15 rg\n`;
    else stream += `0.8 0.5 0.1 rg\n`;
    stream += `480 ${y - 2} 65 18 re f\n`;
    stream += `BT /F1 8 Tf 1 1 1 rg 495 ${y + 3} Td (${r.status}) Tj ET\n`;

    y -= 38;
  });

  // Footer Disclaimer
  stream += `0.06 0.09 0.16 rg 40 40 515 1 re f\n`;
  stream += `BT /F2 8 Tf 0.45 0.45 0.45 rg 40 25 Td (Preliminary automated advisory under Indian Legal Metrology Rules, 2011. Not official certification.) Tj ET\n`;
  stream += `BT /F1 8 Tf 0.06 0.09 0.16 rg 450 25 Td (LegalCheck 360 Cloud) Tj ET\n`;

  const streamLen = Buffer.byteLength(stream, 'utf-8');
  lines.push(`4 0 obj << /Length ${streamLen} >> stream\n${stream}\nendstream\nendobj`);

  // Xref and Trailer
  const body = lines.join("\n") + "\n";
  return Buffer.from(body, 'utf-8');
}

module.exports = {
  legalRules,
  scanRecords,
  evaluateDeclarations,
  generatePdfReportBuffer,
  getScans: () => scanRecords,
  addScan: (scan) => { scanRecords.unshift(scan); return scan; },
  getScanById: (id) => scanRecords.find(s => s.id === id),
  getRules: (cat) => cat ? legalRules.filter(r => r.category === 'all' || r.category === cat) : legalRules,
  addRule: (rule) => { const r = { ...rule, id: legalRules.length + 1 }; legalRules.push(r); return r; },
  toggleRule: (id) => {
    const r = legalRules.find(item => item.rule_id === id);
    if (r) {
      r.active_status = r.active_status === 1 ? 0 : 1;
      return r;
    }
    return null;
  },
  getStats: () => {
    const total = scanRecords.length;
    const pass = scanRecords.filter(s => s.overall_status === 'PASS').length;
    const fail = scanRecords.filter(s => s.overall_status === 'FAIL').length;
    const review = scanRecords.filter(s => s.overall_status === 'REVIEW_REQUIRED').length;
    const rate = total > 0 ? Math.round((pass / total) * 1000) / 10 : 0.0;
    return {
      total_scans: total,
      compliant_count: pass,
      non_compliant_count: fail,
      review_required_count: review,
      compliance_rate: rate,
      recent_scans: scanRecords.slice(0, 10).map(s => ({
        id: s.id,
        product_name: s.product_name,
        category: s.category,
        overall_status: s.overall_status,
        compliance_score: s.compliance_score,
        created_at: s.created_at
      }))
    };
  }
};
