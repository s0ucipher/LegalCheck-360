/**
 * GET /api/health
 */
module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    status: "healthy",
    service: "LegalCheck 360",
    tagline: "Smart Packaging. Smarter Compliance.",
    version: "1.0.0",
    runtime: "Vercel Cloud Serverless Backend",
    academic_c_core: "C11 Mongoose / SQLite3 (Compiled Local Binary)",
    timestamp: new Date().toISOString()
  });
};

