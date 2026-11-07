/**
 * ============================================================================
 * LegalCheck 360: API Client Wrapper (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

const API_BASE_URL = window.location.origin;

const API = {
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    return res.json();
  },

  async getDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
    return res.json();
  },

  async listScans(statusFilter = '') {
    const url = statusFilter ? `${API_BASE_URL}/api/scans?status=${encodeURIComponent(statusFilter)}` : `${API_BASE_URL}/api/scans`;
    const res = await fetch(url);
    return res.json();
  },

  async getScan(scanId) {
    const res = await fetch(`${API_BASE_URL}/api/scans/${encodeURIComponent(scanId)}`);
    return res.json();
  },

  async createScan(payload) {
    const res = await fetch(`${API_BASE_URL}/api/scans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  },

  async getRules(category = '') {
    const url = category ? `${API_BASE_URL}/api/rules?category=${encodeURIComponent(category)}` : `${API_BASE_URL}/api/rules`;
    const res = await fetch(url);
    return res.json();
  },

  async addRule(ruleData) {
    const res = await fetch(`${API_BASE_URL}/api/admin/rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData)
    });
    return res.json();
  },

  async toggleRule(ruleId) {
    const res = await fetch(`${API_BASE_URL}/api/admin/rules/${encodeURIComponent(ruleId)}/toggle`, {
      method: 'POST'
    });
    return res.json();
  },

  async submitReview(scanId, reviewData) {
    const res = await fetch(`${API_BASE_URL}/api/reviews/${encodeURIComponent(scanId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewData)
    });
    return res.json();
  },

  getPdfUrl(scanId) {
    return `${API_BASE_URL}/api/scans/${encodeURIComponent(scanId)}/pdf`;
  }
};

