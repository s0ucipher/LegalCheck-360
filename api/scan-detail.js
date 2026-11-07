/**
 * GET /api/scans/:id
 */
const { getScanById } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = (req.query && req.query.id) || (req.url ? req.url.split('?')[0].split('/').filter(Boolean).pop() : null);
  if (!id) return res.status(400).json({ error: "Missing scan ID" });

  const scan = getScanById(id);
  if (!scan) return res.status(404).json({ error: "Inspection record not found" });

  return res.status(200).json({
    success: true,
    data: scan
  });
};

