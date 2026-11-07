/**
 * POST /api/admin/rules/:id/toggle
 */
const { toggleRule } = require('./_data');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const id = req.query.id;
  if (!id) return res.status(400).json({ error: "Missing rule ID" });

  const updated = toggleRule(id);
  if (!updated) return res.status(404).json({ error: "Rule not found" });

  return res.status(200).json({
    success: true,
    message: "Statutory rule status toggled",
    data: {
      rule_id: id,
      new_active_status: updated.active_status
    }
  });
};

