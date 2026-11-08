/**
 * GET & POST /api/scans
 */
const { getScans, addScan, evaluateDeclarations, extractDeclarationsForCategory } = require('./_data');

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
    let productName = (body.product_name && body.product_name.trim()) || "";
    const category = body.category || "packaged_food";
    const customCategory = (body.custom_category && body.custom_category.trim()) || "";
    const unavailablePanels = Array.isArray(body.unavailable_panels) ? body.unavailable_panels : [];
    const images = Array.isArray(body.images) ? body.images : [];
    let rawText = body.raw_ocr_text || "";

    if (!productName && (!body.fields || body.fields.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "Product / Brand Name is mandatory under Legal Metrology inspection guidelines."
      });
    }

    // Fields passed directly or extracted dynamically based on category/preset
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
      if (!productName) productName = "Packaged Product Inspection";
    } else {
      const extracted = extractDeclarationsForCategory(productName, category, customCategory, images, unavailablePanels);
      productName = extracted.product_name;
      fields = extracted.fields;
      if (!rawText) rawText = extracted.raw_ocr_text;
    }

    const { results, overallStatus, complianceScore } = evaluateDeclarations(scanId, productName, category, fields, rawText, unavailablePanels);

    const scanRecord = {
      id: scanId,
      product_name: productName,
      category: category,
      custom_category: customCategory,
      overall_status: overallStatus,
      compliance_score: complianceScore,
      raw_ocr_text: rawText || "Packaging Declarations Analyzed Successfully under Legal Metrology Rules.",
      created_at: new Date().toISOString(),
      images: images.slice(0, 6),
      unavailable_panels: unavailablePanels,
      uploaded_images_count: images.length,
      unavailable_panels_count: unavailablePanels.length,
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

