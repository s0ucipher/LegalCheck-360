/**
 * ============================================================================
 * LegalCheck 360: Inspection Results & Compliance Matrix (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  const params = new URLSearchParams(window.location.search);
  const scanId = params.get('id');

  if (!scanId) {
    showToast('No Inspection ID specified in URL.', 'error');
    return;
  }

  await loadScanDetails(scanId);
});

function setupTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetEl = document.getElementById(tabTarget);
      if (targetEl) targetEl.classList.add('active');
    });
  });
}

async function loadScanDetails(scanId) {
  try {
    const res = await API.getScan(scanId);
    if (!res.success || !res.data) {
      showToast('Inspection record not found.', 'error');
      return;
    }

    const scan = res.data;
    renderHeader(scan);
    renderExtractedFields(scan.fields || []);
    renderComplianceMatrix(scan.results || []);
    renderPackagingImages(scan.images || [], scan.raw_ocr_text);

  } catch (err) {
    console.error('Error fetching scan details:', err);
    showToast('Failed to load inspection details.', 'error');
  }
}

function renderHeader(scan) {
  document.getElementById('header-scan-id').textContent = scan.id;
  document.getElementById('header-product-name').textContent = scan.product_name || 'General Commodity';
  document.getElementById('header-category').textContent = (scan.category || 'all').replace('_', ' ');
  document.getElementById('header-date').textContent = formatDate(scan.created_at);

  const statusContainer = document.getElementById('header-status-badge');
  if (statusContainer) {
    let badgeClass = 'badge-unclear';
    let label = 'REVIEW REQUIRED';
    if (scan.overall_status === 'PASS') {
      badgeClass = 'badge-pass';
      label = `PASS (Score: ${scan.compliance_score.toFixed(1)}%)`;
    } else if (scan.overall_status === 'FAIL') {
      badgeClass = 'badge-fail';
      label = `FAIL (Score: ${scan.compliance_score.toFixed(1)}%)`;
    }
    statusContainer.className = `badge ${badgeClass} score-badge-large`;
    statusContainer.innerHTML = label;
  }

  const pdfBtn = document.getElementById('download-pdf-btn');
  if (pdfBtn) {
    pdfBtn.href = API.getPdfUrl(scan.id);
  }

  const reviewBtn = document.getElementById('human-review-btn');
  if (reviewBtn) {
    reviewBtn.href = `review.html?id=${scan.id}`;
  }
}

function renderExtractedFields(fields) {
  const tbody = document.getElementById('fields-tbody');
  if (!tbody) return;

  if (fields.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #6b7280;">No declarations extracted.</td></tr>`;
    return;
  }

  tbody.innerHTML = '';
  fields.forEach(f => {
    const tr = document.createElement('tr');
    const confPercent = (f.confidence * 100).toFixed(0);
    tr.innerHTML = `
      <td><strong>${formatFieldName(f.field_name)}</strong></td>
      <td>
        <span style="font-size: 1rem; color: #f9fafb;">${f.field_value}</span>
        ${f.unit ? `<span style="color: #9ca3af; font-size: 0.85rem; margin-left: 4px;">(${f.unit})</span>` : ''}
      </td>
      <td><span style="font-size: 0.8rem; color: #9ca3af; font-style: italic;">"${f.evidence_text || 'Declared on package'}"</span></td>
      <td><span class="badge badge-neutral">${f.extraction_source || 'AI'}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 60px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden;">
            <div style="width: ${confPercent}%; height: 100%; background: #3b82f6;"></div>
          </div>
          <span style="font-size: 0.75rem; color: #9ca3af;">${confPercent}%</span>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderComplianceMatrix(results) {
  const container = document.getElementById('rules-matrix-container');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `<p style="color: #9ca3af; text-align: center; padding: 2rem;">No applicable rules found for this category.</p>`;
    return;
  }

  container.innerHTML = '';
  results.forEach(r => {
    const card = document.createElement('div');
    card.className = 'rule-card';

    let badgeClass = 'badge-unclear';
    if (r.result === 'PASS') badgeClass = 'badge-pass';
    else if (r.result === 'FAIL') badgeClass = 'badge-fail';
    else if (r.result === 'NOT_APPLICABLE') badgeClass = 'badge-neutral';

    card.innerHTML = `
      <div class="rule-card-header">
        <div>
          <span class="rule-citation">${r.rule_id}</span>
          <span style="color: #6b7280; font-size: 0.8rem; margin-left: 8px;">(v${r.rule_version})</span>
        </div>
        <span class="badge ${badgeClass}">${r.result}</span>
      </div>
      <div class="rule-explanation">
        ${r.explanation}
      </div>
      ${r.evidence ? `<div style="font-size: 0.8rem; color: #9ca3af; margin-bottom: 0.5rem;"><strong>Evidence:</strong> ${r.evidence}</div>` : ''}
      <div class="rule-recommendation">
        <strong>Statutory Guidance:</strong> ${r.recommendation}
      </div>
    `;
    container.appendChild(card);
  });
}

function renderPackagingImages(images, rawText) {
  const imgGrid = document.getElementById('results-images-grid');
  const rawTextEl = document.getElementById('raw-ocr-text-view');

  if (imgGrid) {
    imgGrid.innerHTML = '';
    images.forEach(img => {
      const card = document.createElement('div');
      card.className = 'preview-card';
      card.innerHTML = `
        <img src="${img.file_path}" alt="${img.original_filename}" style="height: 180px; object-fit: cover;">
        <div class="preview-info">
          <strong style="text-transform: capitalize; color: #60a5fa;">${img.view_type} View</strong>
          <span style="color: #6b7280; font-size: 0.75rem;">${(img.file_size / 1024).toFixed(0)} KB</span>
        </div>
      `;
      imgGrid.appendChild(card);
    });
  }

  if (rawTextEl) {
    rawTextEl.textContent = rawText || 'No raw OCR text recorded.';
  }
}

function formatFieldName(name) {
  const map = {
    'product_name': 'Generic / Product Name',
    'mrp': 'Maximum Retail Price (MRP)',
    'net_quantity': 'Net Quantity',
    'manufacturer': 'Manufacturer / Packer',
    'mfg_date': 'Date of Manufacture / Packing',
    'expiry_date': 'Best Before / Expiry Date',
    'consumer_care': 'Consumer Care Details',
    'country_of_origin': 'Country of Origin',
    'unit_sale_price': 'Unit Sale Price'
  };
  return map[name] || name.replace('_', ' ').toUpperCase();
}

