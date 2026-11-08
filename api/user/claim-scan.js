/**
 * POST /api/user/claim-scan
 * Associates an anonymous / guest scan with the logged-in user account.
 */
const { claimScanForUser, getScanById } = require('../_data');
const { getAuthenticatedUser } = require('../_auth');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authUser = getAuthenticatedUser(req);
  const body = req.body || {};
  const userUid = authUser ? authUser.uid : body.user_uid;
  const userEmail = authUser ? authUser.email : (body.user_email || '');
  const scanId = body.scan_id;

  if (!userUid) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in to save this inspection to your account.'
    });
  }

  if (!scanId) {
    return res.status(400).json({
      success: false,
      error: 'Missing scan_id parameter.'
    });
  }

  const scan = claimScanForUser(scanId, userUid, userEmail);
  if (!scan) {
    return res.status(404).json({
      success: false,
      error: 'Inspection record not found.'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Inspection successfully saved to your permanent account history.',
    data: {
      scan_id: scan.id,
      product_name: scan.product_name,
      overall_status: scan.overall_status,
      user_uid: scan.user_uid
    }
  });
};

