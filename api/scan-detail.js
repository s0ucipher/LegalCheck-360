/**
 * GET /api/scans/:id
 */
const { getScanById } = require('./_data');

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = extractScanId(req);
  if (!id) return res.status(400).json({ error: "Missing scan ID" });

  const scan = getScanById(id);
  if (!scan) return res.status(404).json({ error: "Inspection record not found" });

  return res.status(200).json({
    success: true,
    data: scan
  });
};

