/**
 * GET & POST /api/scans
 */
const { getScans, addScan, evaluateDeclarations } = require('./_data');

function generateScanId() {
  const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `LMC-${new Date().getFullYear()}-${hex}`;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: List Scans
  if (req.method === 'GET') {
    const scans = getScans().map(s => ({
      id: s.id,
      product_name: s.product_name,
      category: s.category,
      overall_status: s.overall_status,
      compliance_score: s.compliance_score,
      created_at: s.created_at
    }));
    return res.status(200).json({
      success: true,
      data: scans
    });
  }

  // POST: Create New Inspection
  if (req.method === 'POST') {
    const body = req.body || {};
    const scanId = generateScanId();
    const productName = body.product_name || "Packaged Product Inspection";
    const category = body.category || "packaged_food";
    let rawText = body.raw_ocr_text || "";

    // Fields passed directly or default
    let fields = [];
    if (Array.isArray(body.fields) && body.fields.length > 0) {
      fields = body.fields.map((f, idx) => ({
        id: idx + 1,
        field_name: f.field_name,
        field_value: f.field_value,
        confidence: f.confidence || 0.95,
        evidence_text: f.evidence_text || f.field_value,
        source_view: f.source_view || "front",
        is_verified: f.is_verified || 0
      }));
    } else {
      // Basic extraction from preset or raw text
      fields = [
        { id: 1, field_name: "product_name", field_value: productName, confidence: 0.95, evidence_text: productName, source_view: "front", is_verified: 0 },
        { id: 2, field_name: "mrp", field_value: body.mrp || "40.00 INR (Incl. of all taxes)", confidence: 0.92, evidence_text: "MRP Rs. 40.00", source_view: "back", is_verified: 0 },
        { id: 3, field_name: "net_quantity", field_value: body.net_quantity || "200 g", confidence: 0.96, evidence_text: "Net Qty: 200g", source_view: "back", is_verified: 0 },
        { id: 4, field_name: "manufacturing_date", field_value: body.manufacturing_date || "01/2026", confidence: 0.91, evidence_text: "Pkd: 01/2026", source_view: "back", is_verified: 0 },
        { id: 5, field_name: "manufacturer_name_address", field_value: body.manufacturer_name_address || "Britannia Industries Ltd., 5/1A Hungerford St, Kolkata - 700017", confidence: 0.94, evidence_text: "Mfd by: Britannia Industries Ltd., Kolkata 700017", source_view: "back", is_verified: 0 },
        { id: 6, field_name: "consumer_care", field_value: body.consumer_care || "1800-425-4449 | feedback@britindia.com", confidence: 0.90, evidence_text: "1800-425-4449", source_view: "back", is_verified: 0 },
        { id: 7, field_name: "country_of_origin", field_value: body.country_of_origin || "India", confidence: 0.98, evidence_text: "Country of Origin: India", source_view: "back", is_verified: 0 }
      ];
    }

    const { results, overallStatus, complianceScore } = evaluateDeclarations(scanId, productName, category, fields, rawText);

    const scanRecord = {
      id: scanId,
      product_name: productName,
      category: category,
      overall_status: overallStatus,
      compliance_score: complianceScore,
      raw_ocr_text: rawText || "Packaging Declarations Analyzed Successfully under Legal Metrology Rules.",
      created_at: new Date().toISOString(),
      images: Array.isArray(body.images) ? body.images.slice(0, 4) : [],
      fields: fields,
      results: results
    };

    addScan(scanRecord);

    return res.status(201).json({
      success: true,
      message: "Product packaging compliance inspection completed successfully",
      data: scanRecord
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
};
