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

  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (statusFilter) statusFilter.addEventListener('change', applyFilters);
}

async function loadHistory() {
  try {
    const api = window.API || window.LegalCheckAPI;
    if (!api) {
      console.warn('API client not yet available, retrying...');
      setTimeout(loadHistory, 300);
      return;
    }
    const res = await api.listScans();
    if (res && res.success && res.data) {
      allScans = res.data;
      applyFilters();
    } else {
      renderTable([]);
    }
  } catch (err) {
    console.error('Error loading history:', err);
    if (typeof showToast === 'function') {
      showToast('Failed to load inspection history.', 'error');
    }
    renderTable([]);
  }
}

function applyFilters() {
  const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
  const statusVal = document.getElementById('status-filter')?.value || 'ALL';

  let filtered = allScans.filter(scan => {
    const matchesSearch = !searchVal ||
                          (scan.id && scan.id.toLowerCase().includes(searchVal)) ||
                          (scan.product_name && scan.product_name.toLowerCase().includes(searchVal)) ||
                          (scan.category && scan.category.toLowerCase().includes(searchVal));
    const matchesStatus = (statusVal === 'ALL') ||
                          (scan.overall_status === statusVal) ||
                          (statusVal === 'REVIEW_REQUIRED' && (scan.overall_status === 'REVIEW_REQUIRED' || scan.overall_status === 'UNCLEAR' || scan.overall_status === 'PARTIALLY_EVALUATED'));
    return matchesSearch && matchesStatus;
  });

  renderTable(filtered);
}

function renderTable(scans) {
  const tbody = document.getElementById('history-tbody');
  if (!tbody) return;

  if (!scans || scans.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: #6b7280;">No matching inspection records found.</td></tr>`;
    return;
  }

  const api = window.API || window.LegalCheckAPI;
  tbody.innerHTML = '';
  scans.forEach(scan => {
    const tr = document.createElement('tr');
    tr.id = `scan-row-${scan.id}`;
    const pdfUrl = api ? api.getPdfUrl(scan.id) : `api/scans/${scan.id}/pdf`;
    tr.innerHTML = `
      <td><strong>${escapeHtml(scan.id)}</strong></td>
      <td>
        <div style="font-weight: 600; color: var(--text-main);">${escapeHtml(scan.product_name || 'General Commodity')}</div>
      </td>
      <td><span style="text-transform: capitalize; color: #9ca3af;">${escapeHtml((scan.category || 'all').replace(/_/g, ' '))}</span></td>
      <td>${formatDate(scan.created_at)}</td>
      <td>${formatStatusBadge(scan.overall_status)}</td>
      <td><strong>${scan.compliance_score !== undefined && scan.compliance_score !== null ? scan.compliance_score.toFixed(1) + '%' : '0%'}</strong></td>
      <td>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <a href="results.html?id=${encodeURIComponent(scan.id)}" class="btn btn-outline btn-sm">Report</a>
          <a href="${pdfUrl}" target="_blank" class="btn btn-secondary btn-sm" title="Download PDF">PDF</a>
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
    const api = window.API || window.LegalCheckAPI;
    const res = await api.deleteScan(scanId);
    if (res && res.success) {
      allScans = allScans.filter(s => s.id !== scanId);
      applyFilters();
      if (typeof showToast === 'function') {
        showToast('Inspection record removed.', 'info');
      }
    } else {
      alert((res && res.error) || 'Failed to delete record.');
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
