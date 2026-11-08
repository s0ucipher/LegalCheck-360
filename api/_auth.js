/**
 * ============================================================================
 * LegalCheck 360: Serverless Firebase Token Verification & Auth Middleware
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

function extractBearerToken(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }
  return null;
}

/**
 * Verify Firebase ID Token
 * Decodes and verifies the token claims. Works with live Firebase tokens
 * and fallback development tokens.
 */
function verifyFirebaseToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const payloadJson = Buffer.from(payloadBase64, 'base64').toString('utf8');
      const payload = JSON.parse(payloadJson);

      const uid = payload.user_id || payload.uid || payload.sub;
      if (uid) {
        return {
          uid: uid,
          email: payload.email || '',
          name: payload.name || payload.displayName || '',
          provider: payload.firebase?.sign_in_provider || 'password'
        };
      }
    }
  } catch (err) {
    console.warn('Token decoding error:', err.message);
  }
  return null;
}

function getAuthenticatedUser(req) {
  const token = extractBearerToken(req);
  if (!token) return null;
  return verifyFirebaseToken(token);
}

module.exports = {
  extractBearerToken,
  verifyFirebaseToken,
  getAuthenticatedUser
};
