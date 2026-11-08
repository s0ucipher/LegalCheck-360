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

  // GET: List Scans (User-isolated if authenticated, always including academic benchmark records)
  if (req.method === 'GET') {
    const user = getAuthenticatedUser(req);
    const queryUid = (req.query && req.query.user_uid) || null;
    const targetUid = user ? user.uid : queryUid;

    const allScans = getScans();
    // Academic benchmark demonstration inspections for college evaluation showcase
    const benchmarkScans = allScans.filter(s =>
      s.id === 'LMC-2026-PASS-001' ||
      s.id === 'LMC-2026-FAIL-002' ||
      s.id === 'LMC-2026-REV-003'
    );

    let userScans = [];
    if (targetUid) {
      // User's personal inspections
      userScans = getUserScans(targetUid);
    } else {
      // Guest view: guest scans created in this instance
      userScans = allScans.filter(s => s.is_guest);
    }

    // Merge: User's personal scans at top (newest first), followed by academic benchmarks (deduplicated)
    const scanMap = new Map();
    for (const s of userScans) {
      scanMap.set(s.id, s);
    }
    for (const s of benchmarkScans) {
      if (!scanMap.has(s.id)) {
        scanMap.set(s.id, s);
      }
    }

    let scans = Array.from(scanMap.values());

    // Optional status filter
    const statusFilter = req.query && req.query.status;
    if (statusFilter && statusFilter !== 'ALL') {
      scans = scans.filter(s =>
        s.overall_status === statusFilter ||
        (statusFilter === 'REVIEW_REQUIRED' && (s.overall_status === 'REVIEW_REQUIRED' || s.overall_status === 'UNCLEAR' || s.overall_status === 'PARTIALLY_EVALUATED'))
      );
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

