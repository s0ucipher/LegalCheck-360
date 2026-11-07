/**
 * ============================================================================
 * LegalCheck 360: Scan History & Audit Trail (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

let allScans = [];

document.addEventListener('DOMContentLoaded', async () => {
  setupFilters();
  await loadHistory();
});

function setupFilters() {
  const searchInput = document.getElementById('search-input');
  const statusFilter = document.getElementById('status-filter');

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }
  if (statusFilter) {
    statusFilter.addEventListener('change', applyFilters);
  }
}

async function loadHistory() {
  try {
    const res = await API.listScans();
    if (res.success && res.data) {
      allScans = res.data;
      renderTable(allScans);
    }
  } catch (err) {
    console.error('Error loading history:', err);
    showToast('Failed to load inspection history.', 'error');
  }
}

function applyFilters() {
  const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase();
  const statusVal = document.getElementById('status-filter')?.value || 'ALL';

  const filtered = allScans.filter(scan => {
    const matchesSearch = (scan.id && scan.id.toLowerCase().includes(searchVal)) ||
                          (scan.product_name && scan.product_name.toLowerCase().includes(searchVal));
    const matchesStatus = (statusVal === 'ALL') || (scan.overall_status === statusVal);
    return matchesSearch && matchesStatus;
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
    tr.innerHTML = `
      <td><strong>${scan.id}</strong></td>
      <td>${scan.product_name || 'General Commodity'}</td>
      <td><span style="text-transform: capitalize; color: #9ca3af;">${(scan.category || 'all').replace('_', ' ')}</span></td>
      <td>${formatDate(scan.created_at)}</td>
      <td>${formatStatusBadge(scan.overall_status)}</td>
      <td><strong>${scan.compliance_score ? scan.compliance_score.toFixed(1) + '%' : '0%'}</strong></td>
      <td>
        <a href="results.html?id=${scan.id}" class="btn btn-outline btn-sm">Report</a>
        <a href="${API.getPdfUrl(scan.id)}" target="_blank" class="btn btn-secondary btn-sm" title="PDF">PDF</a>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

