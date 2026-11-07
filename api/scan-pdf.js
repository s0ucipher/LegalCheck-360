/**
 * GET /api/scans/:id/pdf
 */
const { getScanById, generatePdfReportBuffer } = require('./_data');

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
      if (last && last !== 'scan-detail' && last !== 'review-scan' && last !== 'scan-pdf' && last !== 'scans' && last !== 'pdf') {
        return last;
      }
    } catch (e) {}
  }
  return null;
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = extractScanId(req);
  if (!id) return res.status(400).send("Missing scan ID");

  const scan = getScanById(id);
  if (!scan) return res.status(404).send("Inspection record not found");

  const pdfBuffer = generatePdfReportBuffer(scan);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="LegalCheck360_Report_${id}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.status(200).send(pdfBuffer);
};

