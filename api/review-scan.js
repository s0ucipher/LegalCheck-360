/**
 * POST /api/reviews/:id
 */
const { getScanById } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing scan ID" });

  const scan = getScanById(id);
  if (!scan) return res.status(404).json({ error: "Inspection record not found" });

  const body = req.body || {};
  if (body.decision === 'APPROVED') scan.overall_status = 'PASS';
  else if (body.decision === 'REJECTED') scan.overall_status = 'FAIL';
  else if (body.decision === 'NEEDS_CORRECTION') scan.overall_status = 'REVIEW_REQUIRED';

  if (body.notes) scan.inspector_notes = body.notes;

  if (Array.isArray(body.field_overrides)) {
    body.field_overrides.forEach(ov => {
      const field = scan.fields.find(f => f.id === ov.field_id);
      if (field) {
        field.field_value = ov.field_value;
        field.is_verified = 1;
      }
    });
  }

  return res.status(200).json({
    success: true,
    message: "Inspector review and final legal determination saved successfully",
    data: {
      scan_id: id,
      new_status: scan.overall_status
    }
  });
};

