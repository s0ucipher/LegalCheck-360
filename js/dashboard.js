/**
 * ============================================================================
 * LegalCheck 360: Dashboard Logic (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  await loadDashboardData();
});

async function loadDashboardData() {
  try {
    // 1. Fetch dashboard metrics
    const statsResp = await API.getDashboardStats();
    if (statsResp.success && statsResp.data) {
      const s = statsResp.data;
      const completed = s.completed_inspections ?? ((s.pass_count || 0) + (s.fail_count || 0));
      const reviews = s.pending_reviews ?? (s.review_required_count || 0);
      const rate = typeof s.compliance_rate === 'number' ? s.compliance_rate.toFixed(1) : '0.0';
      const pass = s.pass_count ?? (s.compliant_count || 0);
      const fail = s.fail_count ?? (s.non_compliant_count || 0);

      document.getElementById('stat-total-scans').textContent = s.total_scans ?? 0;
      document.getElementById('stat-completed').textContent = completed;
      document.getElementById('stat-reviews').textContent = reviews;
      document.getElementById('stat-rate').textContent = `${rate}%`;
      
      const passEl = document.getElementById('stat-pass-count');
      if (passEl) passEl.textContent = `${pass} passed`;
      const failEl = document.getElementById('stat-fail-count');
      if (failEl) failEl.textContent = `${fail} violations`;
    }

    // 2. Fetch recent scans
    const scansResp = await API.listScans();
    const tbody = document.getElementById('recent-scans-tbody');
    if (!tbody) return;

    if (scansResp.success && scansResp.data && scansResp.data.length > 0) {
      tbody.innerHTML = '';
      scansResp.data.slice(0, 10).forEach(scan => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${scan.id}</strong></td>
          <td>${scan.product_name || 'General Commodity'}</td>
          <td><span style="text-transform: capitalize; color: #9ca3af;">${(scan.category || 'all').replace('_', ' ')}</span></td>
          <td>${formatDate(scan.created_at)}</td>
          <td>${formatStatusBadge(scan.overall_status)}</td>
          <td><strong>${scan.compliance_score ? scan.compliance_score.toFixed(1) + '%' : '0%'}</strong></td>
          <td>
            <a href="results.html?id=${scan.id}" class="btn btn-outline btn-sm">View Report</a>
            <a href="${API.getPdfUrl(scan.id)}" target="_blank" class="btn btn-secondary btn-sm" title="Download PDF">PDF</a>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 2.5rem; color: #6b7280;">
        No inspection records found. Click <strong>"Start New Inspection"</strong> to scan your first product package.
      </td></tr>`;
    }
  } catch (err) {
    console.error('Error loading dashboard:', err);
    showToast('Failed to connect to LegalCheck 360 backend.', 'error');
  }
}

