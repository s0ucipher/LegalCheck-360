/**
 * ============================================================================
 * LegalCheck 360: Inspection Results & Interactive Decision Matrix (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

let currentScan = null;

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

    currentScan = res.data;
    renderHeader(currentScan);
    renderExtractedFields(currentScan.fields || []);
    renderComplianceMatrix(currentScan.results || []);
    renderPackagingImages(currentScan.images || [], currentScan.raw_ocr_text);

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

  updateHeaderStatusBadge(scan.overall_status, scan.compliance_score);

  const pdfBtn = document.getElementById('download-pdf-btn');
  if (pdfBtn) {
    pdfBtn.href = API.getPdfUrl(scan.id);
  }

  const reviewBtn = document.getElementById('human-review-btn');
  if (reviewBtn) {
    reviewBtn.href = `review.html?id=${scan.id}`;
  }
}

function updateHeaderStatusBadge(status, score) {
  const statusContainer = document.getElementById('header-status-badge');
  if (!statusContainer) return;

  let badgeClass = 'badge-unclear';
  let label = 'REVIEW REQUIRED';
  if (status === 'PASS') {
    badgeClass = 'badge-pass';
    label = `PASS (Score: ${score.toFixed(1)}%)`;
  } else if (status === 'FAIL') {
    badgeClass = 'badge-fail';
    label = `FAIL (Score: ${score.toFixed(1)}%)`;
  }

  statusContainer.className = `badge ${badgeClass} score-badge-large`;
  statusContainer.innerHTML = label;
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
        <input type="text" class="field-input-inline field-override-input" 
               data-field="${f.field_name}" 
               value="${f.field_value || ''}" 
               title="Click to edit/verify extracted value"
               onchange="onFieldEdited('${f.field_name}', this.value)">
        ${f.unit ? `<span style="color: var(--text-muted); font-size: 0.85rem; margin-left: 4px;">(${f.unit})</span>` : ''}
      </td>
      <td><span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">"${f.evidence_text || 'Declared on package'}"</span></td>
      <td><span class="badge badge-neutral">${f.extraction_source || 'AI'}</span></td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 60px; height: 6px; background: #374151; border-radius: 3px; overflow: hidden;">
            <div style="width: ${confPercent}%; height: 100%; background: #3b82f6;"></div>
          </div>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${confPercent}%</span>
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
    container.innerHTML = `<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No applicable rules found for this category.</p>`;
    return;
  }

  container.innerHTML = '';
  results.forEach(r => {
    const card = document.createElement('div');
    card.className = 'rule-card';

    const ruleRes = r.result || r.status || 'UNCLEAR';

    let badgeClass = 'badge-unclear';
    if (ruleRes === 'PASS') badgeClass = 'badge-pass';
    else if (ruleRes === 'FAIL') badgeClass = 'badge-fail';
    else if (ruleRes === 'NOT_APPLICABLE') badgeClass = 'badge-neutral';

    card.innerHTML = `
      <div class="rule-card-header">
        <div>
          <span class="rule-citation">${r.rule_id}</span>
          <span style="color: var(--text-sub); font-size: 0.8rem; margin-left: 8px;">(v${r.rule_version || '2011'})</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge ${badgeClass}" id="badge-${r.rule_id}">${ruleRes}</span>
        </div>
      </div>
      <div class="rule-explanation">
        ${r.explanation}
      </div>
      ${r.evidence ? `<div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem;"><strong>Evidence:</strong> ${r.evidence}</div>` : ''}
      <div class="rule-recommendation">
        <strong>Statutory Guidance:</strong> ${r.recommendation}
      </div>
      
      <!-- User Final Decision Quick Override Row -->
      <div class="rule-decision-row">
        <label style="font-weight: 600; color: var(--text-main);">Auditor Statutory Determination:</label>
        <select class="rule-status-selector" data-rule="${r.rule_id}" data-status="${ruleRes}" onchange="onUserRuleDecisionChanged('${r.rule_id}', this.value)">
          <option value="PASS" ${ruleRes === 'PASS' ? 'selected' : ''}>✓ PASS (Satisfies Requirement)</option>
          <option value="FAIL" ${ruleRes === 'FAIL' ? 'selected' : ''}>✗ FAIL (Confirmed Violation)</option>
          <option value="UNCLEAR" ${ruleRes === 'UNCLEAR' ? 'selected' : ''}>⚠️ UNCLEAR (Needs Verification)</option>
          <option value="NOT_APPLICABLE" ${ruleRes === 'NOT_APPLICABLE' ? 'selected' : ''}>⚪ NOT APPLICABLE</option>
        </select>
        <span style="color: var(--text-sub); font-size: 0.75rem;">(You have final authority to override AI finding)</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function onFieldEdited(fieldName, newVal) {
  if (!currentScan) return;
  const f = currentScan.fields.find(field => field.field_name === fieldName);
  if (f) {
    f.field_value = newVal;
    f.is_verified = 1;
    showToast(`Updated ${formatFieldName(fieldName)}: "${newVal}"`, 'info');
  }
}

function onUserRuleDecisionChanged(ruleId, newResult) {
  if (!currentScan || !currentScan.results) return;

  const target = currentScan.results.find(r => r.rule_id === ruleId);
  if (!target) return;

  target.result = newResult;
  target.status = newResult;
  target.reviewer_status = "OVERRIDDEN";

  // Update badge UI
  const badge = document.getElementById(`badge-${ruleId}`);
  if (badge) {
    let badgeClass = 'badge-unclear';
    if (newResult === 'PASS') badgeClass = 'badge-pass';
    else if (newResult === 'FAIL') badgeClass = 'badge-fail';
    else if (newResult === 'NOT_APPLICABLE') badgeClass = 'badge-neutral';
    badge.className = `badge ${badgeClass}`;
    badge.textContent = newResult;
  }

  // Update select color data-status attribute
  const select = document.querySelector(`.rule-status-selector[data-rule="${ruleId}"]`);
  if (select) select.setAttribute('data-status', newResult);

  // Recalculate score live
  recalculateComplianceScore();
  showToast(`Rule ${ruleId} updated to ${newResult}`, 'info');
}

function recalculateComplianceScore() {
  if (!currentScan || !currentScan.results) return;

  const applicable = currentScan.results.filter(r => (r.result || r.status) !== 'NOT_APPLICABLE');
  const passes = applicable.filter(r => (r.result || r.status) === 'PASS').length;
  const fails = applicable.filter(r => (r.result || r.status) === 'FAIL').length;
  const unclears = applicable.filter(r => (r.result || r.status) === 'UNCLEAR').length;

  const score = applicable.length > 0 ? (passes / applicable.length) * 100 : 0;
  currentScan.compliance_score = score;

  if (fails > 0) {
    currentScan.overall_status = "FAIL";
  } else if (unclears > 0) {
    currentScan.overall_status = "REVIEW_REQUIRED";
  } else {
    currentScan.overall_status = "PASS";
  }

  updateHeaderStatusBadge(currentScan.overall_status, score);
}

async function finalizeUserDecision() {
  if (!currentScan) return;

  // Show verified pill
  const pill = document.getElementById('user-verified-pill');
  if (pill) pill.style.display = 'inline-flex';

  // Gather field overrides
  const overrides = [];
  document.querySelectorAll('.field-override-input').forEach(input => {
    const fName = input.getAttribute('data-field');
    const fVal = input.value.trim();
    const fieldObj = currentScan.fields.find(f => f.field_name === fName);
    if (fieldObj) {
      overrides.push({ field_id: fieldObj.id || 1, field_value: fVal });
    }
  });

  const reviewPayload = {
    reviewer_name: "Authorized Inspector / User",
    decision: currentScan.overall_status === 'PASS' ? 'APPROVED' : (currentScan.overall_status === 'FAIL' ? 'REJECTED' : 'PASS_WITH_REMARKS'),
    comments: `Auditor finalized determination with score ${currentScan.compliance_score.toFixed(1)}%. User verified declarations.`,
    field_overrides: overrides
  };

  try {
    const res = await API.submitReview(currentScan.id, reviewPayload);
    showToast('✓ Final statutory compliance determination confirmed and saved!', 'success');
  } catch (err) {
    showToast('Failed to save final determination to server.', 'error');
  }
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
          <span style="color: var(--text-muted); font-size: 0.75rem;">${(img.file_size / 1024).toFixed(0)} KB</span>
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
