/**
 * GET /api/scans/:id/pdf
 */
const { getScanById, generatePdfReportBuffer } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).send("Missing scan ID");

  const scan = getScanById(id);
  if (!scan) return res.status(404).send("Inspection record not found");

  const pdfBuffer = generatePdfReportBuffer(scan);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="LegalCheck360_Report_${id}.pdf"`);
  res.setHeader('Content-Length', pdfBuffer.length);
  return res.status(200).send(pdfBuffer);
};

