/**
 * POST /api/admin/rules
 */
const { addRule } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = req.body || {};
  if (!body.rule_id || !body.rule_name) {
    return res.status(400).json({ error: "Missing mandatory rule fields" });
  }

  const created = addRule(body);
  return res.status(201).json({
    success: true,
    message: "Statutory rule registered successfully",
    data: created
  });
};
