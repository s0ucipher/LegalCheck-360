/**
 * GET & POST /api/scans
 */
const { getScans, getUserScans, addScan, evaluateDeclarations, extractDeclarationsForCategory } = require('./_data');
const { getAuthenticatedUser } = require('./_auth');

function generateScanId() {
  const hex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
  return `LMC-${new Date().getFullYear()}-${hex}`;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: List Scans (User-isolated if authenticated)
  if (req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const queryUid = (req.query && req.query.user_uid) || null;
    const targetUid = user ? user.uid : queryUid;

    let scans = [];
    if (targetUid) {
      // Return only this authenticated user's persistent scans
      scans = getUserScans(targetUid);
    } else {
      // Guest view: only guest scans or empty personal history
      scans = getScans().filter(s => s.is_guest);
    }

    const formatted = scans.map(s => ({
      id: s.id,
      product_name: s.product_name,
      category: s.category,
      overall_status: s.overall_status,
      compliance_score: s.compliance_score,
      created_at: s.created_at,
      user_uid: s.user_uid || null,
      is_guest: !!s.is_guest
    }));

    return res.status(200).json({
      success: true,
      data: formatted
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

    const authUser = getAuthenticatedUser(req);
    const userUid = authUser ? authUser.uid : (body.user_uid || null);
    const userEmail = authUser ? authUser.email : (body.user_email || '');
    const isGuest = !userUid;

    const scanRecord = {
      id: scanId,
      user_uid: userUid,
      user_email: userEmail,
      is_guest: isGuest,
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

