/**
 * POST /api/user/delete-scan
 * Deletes an inspection record owned by the authenticated user.
 */
const { deleteUserScan, getScanById } = require('../_data');
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
  const scanId = body.scan_id;

  if (!userUid) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to delete inspection records.'
    });
  }

  if (!scanId) {
    return res.status(400).json({
      success: false,
      error: 'Missing scan_id parameter.'
    });
  }

  const existing = getScanById(scanId);
  if (!existing) {
    return res.status(404).json({
      success: false,
      error: 'Inspection record not found.'
    });
  }

  // Security check: ensure the record belongs to the user or is a guest scan
  if (existing.user_uid && existing.user_uid !== userUid) {
    return res.status(403).json({
      success: false,
      error: 'Access denied: You do not have permission to delete this inspection record.'
    });
  }

  const success = deleteUserScan(scanId, userUid);

  return res.status(200).json({
    success: success,
    message: success ? 'Inspection record removed successfully.' : 'Unable to remove record.'
  });
};
