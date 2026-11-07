/**
 * POST /api/reviews/:id
 */
const { getScanById, updateScan } = require('./_data');

function extractScanId(req) {
  if (req.query && req.query.id && req.query.id !== ':id') {
    return req.query.id;
  }
  if (req.url) {
    try {
      const u = new URL(req.url, 'http://localhost');
      const qId = u.searchParams.get('id');
      if (qId && qId !== ':id') return qId;
      const parts = u.pathname.split('/').filter(Boolean);
      const last = parts.pop();
      if (last && last !== 'scan-detail' && last !== 'review-scan' && last !== 'scan-pdf' && last !== 'scans') {
        return last;
      }
    } catch (e) {}
  }
  return null;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = extractScanId(req);
  if (!id) return res.status(400).json({ error: "Missing scan ID" });

  const scan = getScanById(id);
  if (!scan) return res.status(404).json({ error: "Inspection record not found" });

  const body = req.body || {};
  if (body.decision === 'APPROVED') scan.overall_status = 'PASS';
  else if (body.decision === 'REJECTED') scan.overall_status = 'FAIL';
  else if (body.decision === 'NEEDS_CORRECTION') scan.overall_status = 'REVIEW_REQUIRED';
  else if (body.decision === 'PARTIAL_INSPECTION') scan.overall_status = 'PARTIALLY_EVALUATED';

  scan.reviewer_name = body.reviewer_name || scan.reviewer_name || 'Legal Metrology Inspector';
  scan.review_comments = body.comments || body.notes || scan.review_comments || '';
  scan.is_human_reviewed = true;
  scan.decision = body.decision;

  if (Array.isArray(body.field_overrides)) {
    body.field_overrides.forEach(ov => {
      const field = scan.fields.find(f => f.id === ov.field_id);
      if (field) {
        field.field_value = ov.field_value;
        field.is_verified = 1;
      }
    });
  }

  // Update rule determinations if passed
  if (Array.isArray(body.rule_overrides)) {
    body.rule_overrides.forEach(ro => {
      const targetRule = scan.results.find(r => r.rule_id === ro.rule_id);
      if (targetRule) {
        targetRule.status = ro.status;
        targetRule.result = ro.status;
        targetRule.reviewer_status = 'OVERRIDDEN';
      }
    });
  }

  updateScan(scan);

  return res.status(200).json({
    success: true,
    message: "Inspector review and final legal determination saved successfully",
    data: {
      scan_id: id,
      new_status: scan.overall_status
    }
  });
};

