/**
 * GET /api/user/stats
 * Retrieves compliance statistics specifically for the authenticated user.
 */
const { getUserStats } = require('../_data');
const { getAuthenticatedUser } = require('../_auth');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const authUser = getAuthenticatedUser(req);
  const userUid = authUser ? authUser.uid : (req.query && req.query.user_uid);

  if (!userUid) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required to view personal inspection statistics.'
    });
  }

  const stats = getUserStats(userUid);

  return res.status(200).json({
    success: true,
    data: stats
  });
};
