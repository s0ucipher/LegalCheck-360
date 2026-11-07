/**
 * GET /api/dashboard/stats
 */
const { getStats } = require('../_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const stats = getStats();
  return res.status(200).json({
    success: true,
    data: stats
  });
};
