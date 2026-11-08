/**
 * ============================================================================
 * LegalCheck 360: Scan History & Audit Trail (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

let allScans = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupFilters();
  checkAuthAndGuestBanner();
  
  // Reactively track authentication state changes
  if (window.LegalCheckAuth && typeof window.LegalCheckAuth.onAuthStateChanged === 'function') {
    window.LegalCheckAuth.onAuthStateChanged((user) => {
      checkAuthAndGuestBanner(user);
      loadHistory();
    });
  }

  await loadHistory();
});

function checkAuthAndGuestBanner(userObj) {
  const user = userObj || (window.LegalCheckAuth ? window.LegalCheckAuth.getCurrentUser() : null);
  const isLogged = !!(user && !user.isGuest && user.uid);
  const notice = document.getElementById('guestHistoryNotice');
  const heading = document.getElementById('historyPageHeading');
  const subheading = document.getElementById('historyPageSubheading');

  if (notice) {
    notice.style.display = isLogged ? 'none' : 'flex';
  }

  if (isLogged) {
    const name = user.displayName || (user.email ? user.email.split('@')[0] : 'Auditor');
    if (heading) heading.textContent = `Packaging Inspection Audit Trail — ${name}`;
    if (subheading) subheading.textContent = `Permanent inspection records and legal compliance certificates registered to your account (${user.email || ''})`;
  } else {
    if (heading) heading.textContent = `Packaging Inspection Audit Trail`;
    if (subheading) subheading.textContent = `Complete historical registry of inspected consumer goods and regulatory outcomes`;
  }
}

function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');
  const sortFilter = document.getElementById('sort-filter');

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
  if (sortFilter) sortFilter.addEventListener('change', applyFilters);
}

async function loadHistory() {
  try {
    const res = await LegalCheckAPI.listScans();
    if (res.success && res.data) {
      allScans = res.data;
      updateMetrics(allScans);
      applyFilters();
    }
  } catch (err) {
    console.error('Error loading history:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to load inspection history.', 'error');
    }
  }
}

function updateMetrics(scans) {
  const total = scans.length;
  const pass = scans.filter(s => s.overall_status === 'PASS').length;
  const fail = scans.filter(s => s.overall_status === 'FAIL').length;
  const review = scans.filter(s => s.overall_status === 'REVIEW_REQUIRED' || s.overall_status === 'PARTIALLY_EVALUATED' || s.overall_status === 'UNCLEAR').length;
  const rate = total > 0 ? Math.round((pass / total) * 1000) / 10 : 0.0;

  const totalEl = document.getElementById('historyTotalCount');
  const passEl = document.getElementById('historyPassCount');
  const failEl = document.getElementById('historyFailCount');
  const reviewEl = document.getElementById('historyReviewCount');
  const rateEl = document.getElementById('historyRateVal');

  if (totalEl) totalEl.textContent = total;
  if (passEl) passEl.textContent = pass;
  if (failEl) failEl.textContent = fail;
  if (reviewEl) reviewEl.textContent = review;
  if (rateEl) rateEl.textContent = `${rate.toFixed(1)}%`;
}

function applyFilters() {
  const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
  const statusVal = document.getElementById('status-filter')?.value || 'ALL';
  const sortVal = document.getElementById('sort-filter')?.value || 'date-desc';

  let filtered = allScans.filter(scan => {
    const matchesSearch = (scan.id && scan.id.toLowerCase().includes(searchVal)) ||
                          (scan.product_name && scan.product_name.toLowerCase().includes(searchVal)) ||
                          (scan.category && scan.category.toLowerCase().includes(searchVal));
    const matchesStatus = (statusVal === 'ALL') || (scan.overall_status === statusVal);
    return matchesSearch && matchesStatus;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortVal === 'date-desc') {
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    } else if (sortVal === 'date-asc') {
      return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    } else if (sortVal === 'score-desc') {
      return (b.compliance_score || 0) - (a.compliance_score || 0);
    } else if (sortVal === 'score-asc') {
      return (a.compliance_score || 0) - (b.compliance_score || 0);
    }
    return 0;
  });

  renderTable(filtered);
}

function renderTable(scans) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  if (scans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: #6b7280;">No matching inspection records found.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  scans.forEach(scan => {
    const tr = document.createElement('tr');
    tr.id = `scan-row-${scan.id}`;
    tr.innerHTML = `
      <td><strong>${escapeHtml(scan.id)}</strong></td>
      <td>
        <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(scan.product_name || 'General Commodity')}</div>
        ${scan.is_guest ? '<span style="font-size: 0.7rem; color: #f59e0b; background: rgba(245,158,11,0.12); padding: 0.1rem 0.35rem; border-radius: 4px;">Guest Session</span>' : '<span style="font-size: 0.7rem; color: #10b981; background: rgba(16,185,129,0.12); padding: 0.1rem 0.35rem; border-radius: 4px;">Saved to Account</span>'}
      </td>
      <td><span style="text-transform: capitalize; color: #9ca3af;">${escapeHtml((scan.category || 'all').replace(/_/g, ' '))}</span></td>
      <td>${formatDate(scan.created_at)}</td>
      <td>${formatStatusBadge(scan.overall_status)}</td>
      <td><strong>${scan.compliance_score ? scan.compliance_score.toFixed(1) + '%' : '0%'}</strong></td>
      <td>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <a href="results.html?id=${encodeURIComponent(scan.id)}" class="btn btn-outline btn-sm">Report</a>
          <a href="${LegalCheckAPI.getPdfUrl(scan.id)}" target="_blank" class="btn btn-secondary btn-sm" title="Download PDF">PDF</a>
          <button type="button" class="btn btn-danger btn-sm" onclick="handleDeleteScan('${scan.id}')" title="Delete inspection" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">✕</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function handleDeleteScan(scanId) {
  if (!confirm(`Are you sure you want to remove inspection record ${scanId}? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await LegalCheckAPI.deleteScan(scanId);
    if (res.success) {
      allScans = allScans.filter(s => s.id !== scanId);
      updateMetrics(allScans);
      applyFilters();
      if (typeof showToast === 'function') {
        showToast('Inspection record removed.', 'info');
      }
    } else {
      alert(res.error || 'Failed to delete record.');
    }
  } catch (e) {
    alert('Error deleting inspection record.');
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}
