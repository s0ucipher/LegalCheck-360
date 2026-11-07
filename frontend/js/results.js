/**
 * ============================================================================
 * LegalCheck 360: Complete AI Inspection Results & Statutory Matrix
 * "Smart Packaging. Smarter Compliance."
 * Sections A through G Unified Architecture (Vanilla JS)
 * ============================================================================
 */

let currentScan = null;

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();

  const params = new URLSearchParams(window.location.search);
  let scanId = params.get('id');

  // Fallback: If no ID in URL, check localStorage for the most recent scan
  if (!scanId) {
    try {
      const cached = JSON.parse(localStorage.getItem('legalcheck_scans') || '[]');
      if (cached.length > 0 && cached[0].id) {
        scanId = cached[0].id;
        // Update URL cleanly without reloading
        const newUrl = `${window.location.pathname}?id=${scanId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }
    } catch (e) {
      console.warn('Could not read cached scans', e);
    }
  }

  if (!scanId) {
    showErrorState('No Inspection ID specified in URL and no cached inspection session found.');
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

function showLoadingState() {
  const loading = document.getElementById('results-loading-state');
  const error = document.getElementById('results-error-state');
  const main = document.getElementById('results-main-content');
  if (loading) loading.style.display = 'flex';
  if (error) error.style.display = 'none';
  if (main) main.style.display = 'none';
}

function showErrorState(msg) {
  const loading = document.getElementById('results-loading-state');
  const error = document.getElementById('results-error-state');
  const main = document.getElementById('results-main-content');
  const errText = document.getElementById('error-message-text');

  if (loading) loading.style.display = 'none';
  if (main) main.style.display = 'none';
  if (error) {
    error.style.display = 'block';
    if (errText && msg) errText.textContent = msg;
  }
}

function showMainContent() {
  const loading = document.getElementById('results-loading-state');
  const error = document.getElementById('results-error-state');
  const main = document.getElementById('results-main-content');

  if (loading) loading.style.display = 'none';
  if (error) error.style.display = 'none';
  if (main) main.style.display = 'block';
}

async function loadScanDetails(scanId) {
  showLoadingState();

  try {
    const res = await API.getScan(scanId);
    if (!res.success || !res.data) {
      showErrorState(`Inspection record "${scanId}" could not be located. It may have expired from serverless memory or was not saved.`);
      return;
    }

    currentScan = res.data;
    showMainContent();

    // Render Sections A through G
    renderSectionA(currentScan);
    renderSectionB(currentScan.fields || [], currentScan.unavailable_panels || []);
    renderSectionC(currentScan.results || []);
    renderSectionD(currentScan.results || [], currentScan.unavailable_panels || []);
    renderSectionE(currentScan.results || []);
    renderSectionF(currentScan);
    renderSectionG(currentScan.images || [], currentScan.raw_ocr_text || '');

  } catch (err) {
    console.error('Error fetching scan details:', err);
    showErrorState(`An error occurred while loading inspection record "${scanId}".`);
  }
}

/**
 * SECTION A: Inspection Summary (Executive Header)
 */
function renderSectionA(scan) {
  const scanIdEl = document.getElementById('header-scan-id');
  const prodNameEl = document.getElementById('header-product-name');
  const catEl = document.getElementById('header-category');
  const dateEl = document.getElementById('header-date');
  const uploadedEl = document.getElementById('header-uploaded-count');
  const unavailEl = document.getElementById('header-unavail-count');

  if (scanIdEl) scanIdEl.textContent = scan.id;
  if (prodNameEl) prodNameEl.textContent = scan.product_name || 'General Packaged Commodity';
  if (catEl) catEl.textContent = (scan.category || 'all').replace(/_/g, ' ');
  if (dateEl) dateEl.textContent = formatDate(scan.created_at);

  const imagesCount = (scan.images && scan.images.length) || (scan.uploaded_images_count || 0);
  const unavailPanels = scan.unavailable_panels || [];

  if (uploadedEl) {
    uploadedEl.textContent = `📸 Uploaded: ${imagesCount} Panel${imagesCount !== 1 ? 's' : ''}`;
  }
  if (unavailEl) {
    if (unavailPanels.length > 0) {
      unavailEl.textContent = `⚪ Unavailable: ${unavailPanels.length} Panel (${unavailPanels.join(', ')})`;
      unavailEl.className = 'badge badge-warning';
    } else {
      unavailEl.textContent = `✓ All 3 Panels Provided`;
      unavailEl.className = 'badge badge-pass';
    }
  }

  updateHeaderStatusBadge(scan.overall_status, scan.compliance_score || 0);

  const pdfBtn = document.getElementById('download-pdf-btn');
  const pdfBtnLarge = document.getElementById('download-pdf-btn-large');
  const pdfUrl = API.getPdfUrl(scan.id);
  if (pdfBtn) pdfBtn.href = pdfUrl;
  if (pdfBtnLarge) pdfBtnLarge.href = pdfUrl;
}

function updateHeaderStatusBadge(status, score) {
  const statusContainer = document.getElementById('header-status-badge');
  const scoreText = document.getElementById('header-score-text');
  const scoreBar = document.getElementById('header-score-bar');
  const scoreSub = document.getElementById('header-score-subtitle');

  const safeScore = typeof score === 'number' ? score : parseFloat(score) || 0;

  if (scoreText) scoreText.textContent = `${safeScore.toFixed(1)}%`;
  if (scoreBar) {
    scoreBar.style.width = `${Math.min(100, Math.max(0, safeScore))}%`;
    if (safeScore >= 80) scoreBar.style.background = '#10b981';
    else if (safeScore >= 50) scoreBar.style.background = '#f59e0b';
    else scoreBar.style.background = '#ef4444';
  }

  if (!statusContainer) return;

  let badgeClass = 'badge-unclear';
  let label = 'NEEDS HUMAN REVIEW';

  if (status === 'PASS' || status === 'COMPLIANT') {
    badgeClass = 'badge-pass';
    label = `✓ COMPLIANT`;
  } else if (status === 'FAIL' || status === 'NON_COMPLIANT') {
    badgeClass = 'badge-fail';
    label = `✗ NON-COMPLIANT`;
  } else if (status === 'PARTIALLY_EVALUATED') {
    badgeClass = 'badge-info';
    label = `⚪ PARTIALLY EVALUATED`;
    if (scoreSub) scoreSub.textContent = 'Evaluated over provided packaging evidence only';
  } else if (status === 'REVIEW_REQUIRED' || status === 'NEEDS_HUMAN_REVIEW' || status === 'UNCLEAR') {
    badgeClass = 'badge-warning';
    label = `⚠️ NEEDS HUMAN REVIEW`;
    if (scoreSub) scoreSub.textContent = 'Ambiguous / low confidence markings require manual audit';
  }

  statusContainer.className = `badge ${badgeClass} score-badge-large`;
  statusContainer.textContent = label;
}

/**
 * SECTION B: Extracted Packaging Information (By Packaging Panel)
 */
function renderSectionB(fields, unavailablePanels = []) {
  const container = document.getElementById('panel-declarations-container');
  if (!container) return;

  const unavailSet = new Set((unavailablePanels || []).map(p => p.toLowerCase()));

  // Panel definitions
  const panels = [
    {
      id: 'front',
      name: 'Front Panel (Principal Display Panel - PDP)',
      icon: '🖼️',
      expected: ['product_name', 'net_quantity'],
      desc: 'Mandatory brand identity, generic product denomination, and prominent net quantity declaration.'
    },
    {
      id: 'back',
      name: 'Back Panel (Statutory Declarations / MRP Flap)',
      icon: '📋',
      expected: ['mrp', 'manufacturing_date', 'packing_date', 'manufacturer_name_address', 'manufacturer', 'consumer_care', 'country_of_origin', 'unit_sale_price', 'fssai_license'],
      desc: 'Mandatory MRP (incl. of all taxes), Date of packing, Manufacturer & Packer postal address with PIN, and Consumer Care helpline.'
    },
    {
      id: 'side',
      name: 'Side Flap / Nutrition & Batch Information',
      icon: '📦',
      expected: ['nutritional_info', 'batch_number', 'ingredients'],
      desc: 'Nutritional facts table, batch/lot code, storage instructions, and allergen declarations.'
    }
  ];

  container.innerHTML = '';

  panels.forEach(p => {
    const isUnavail = unavailSet.has(p.id);
    const panelFields = fields.filter(f => {
      const v = (f.source_view || '').toLowerCase();
      if (v === p.id) return true;
      if (!v && p.expected.includes(f.field_name.toLowerCase())) return true;
      return false;
    });

    const card = document.createElement('div');
    card.className = 'panel-group-card';

    let headerStatusBadge = `<span class="badge badge-pass">✓ Uploaded & Analyzed</span>`;
    if (isUnavail) {
      headerStatusBadge = `<span class="badge badge-neutral">⚪ Marked Not Available by User</span>`;
    } else if (panelFields.length === 0) {
      headerStatusBadge = `<span class="badge badge-warning">⚠️ No Declarations Extracted</span>`;
    }

    card.innerHTML = `
      <div class="panel-group-header">
        <div class="panel-group-title">
          <span>${p.icon}</span>
          <span>${p.name}</span>
        </div>
        <div>${headerStatusBadge}</div>
      </div>
      <div style="padding: 1.25rem;">
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 1rem;">${p.desc}</p>
        ${isUnavail ? `
          <div style="background: rgba(100, 116, 139, 0.1); border: 1px dashed var(--border-color); border-radius: var(--radius-sm); padding: 1.25rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            ⚪ This panel was marked <strong>Not Available</strong> during inspection. Applicable declarations were classified as <em>NOT DETERMINED</em> and excluded from negative scoring.
          </div>
        ` : (panelFields.length === 0 ? `
          <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--radius-sm); padding: 1rem; color: var(--text-muted); font-size: 0.85rem;">
            No specific declarations were detected on this panel photograph. Text may be blurred or non-statutory.
          </div>
        ` : `
          <div class="table-container" style="margin-bottom: 0;">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Mandatory Declaration</th>
                  <th>Extracted / Verified Value (Editable)</th>
                  <th>Verifiable Text Snippet</th>
                  <th>Confidence</th>
                </tr>
              </thead>
              <tbody>
                ${panelFields.map(f => {
                  const confPercent = Math.round((f.confidence || 0.95) * 100);
                  return `
                    <tr>
                      <td style="font-weight: 600; color: var(--text-main); white-space: nowrap;">
                        ${formatFieldName(f.field_name)}
                      </td>
                      <td>
                        <input type="text" class="field-input-inline field-override-input"
                               data-field="${f.field_name}"
                               value="${escapeHtml(f.field_value || '')}"
                               title="Click to edit or correct OCR extraction"
                               onchange="onFieldEdited('${f.field_name}', this.value)">
                      </td>
                      <td style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">
                        "${escapeHtml(f.evidence_text || f.field_value || 'Detected on packaging')}"
                      </td>
                      <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <div style="width: 50px; height: 6px; background: rgba(100, 116, 139, 0.25); border-radius: 3px; overflow: hidden;">
                            <div style="width: ${confPercent}%; height: 100%; background: ${confPercent >= 80 ? '#10b981' : (confPercent >= 60 ? '#f59e0b' : '#ef4444')};"></div>
                          </div>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${confPercent}%</span>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `)}
      </div>
    `;

    container.appendChild(card);
  });
}

/**
 * SECTION C: Statutory Compliance Assessment (Rule-by-Rule Checklist)
 */
function renderSectionC(results) {
  const container = document.getElementById('rules-matrix-container');
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = `<div class="card" style="text-align: center; padding: 2rem; color: var(--text-muted);">No applicable rules evaluated for this category.</div>`;
    return;
  }

  container.innerHTML = '';

  let pass = 0, fail = 0, unclear = 0, notDet = 0;

  results.forEach(r => {
    const compStatus = r.compliance_status || r.result || r.status || 'NEEDS_HUMAN_REVIEW';
    const presStatus = r.presence_status || (compStatus === 'COMPLIANT' ? 'PRESENT' : 'MISSING');

    if (compStatus === 'COMPLIANT' || compStatus === 'PASS') pass++;
    else if (compStatus === 'NON_COMPLIANT' || compStatus === 'FAIL') fail++;
    else if (compStatus === 'NEEDS_HUMAN_REVIEW' || compStatus === 'UNCLEAR') unclear++;
    else if (compStatus === 'NOT_DETERMINED') notDet++;

    const card = document.createElement('div');
    card.className = 'rule-card-detailed';

    // Presence Badge
    let presBadgeClass = 'badge-neutral';
    if (presStatus === 'PRESENT') presBadgeClass = 'badge-pass';
    else if (presStatus === 'MISSING') presBadgeClass = 'badge-fail';
    else if (presStatus === 'UNREADABLE') presBadgeClass = 'badge-warning';
    else if (presStatus === 'NOT_DETERMINED') presBadgeClass = 'badge-info';

    // Compliance Badge
    let compBadgeClass = 'badge-neutral';
    let compLabel = compStatus;
    if (compStatus === 'COMPLIANT' || compStatus === 'PASS') {
      compBadgeClass = 'badge-pass';
      compLabel = '✓ COMPLIANT';
    } else if (compStatus === 'NON_COMPLIANT' || compStatus === 'FAIL') {
      compBadgeClass = 'badge-fail';
      compLabel = '✗ NON-COMPLIANT';
    } else if (compStatus === 'NEEDS_HUMAN_REVIEW' || compStatus === 'UNCLEAR') {
      compBadgeClass = 'badge-warning';
      compLabel = '⚠️ NEEDS HUMAN REVIEW';
    } else if (compStatus === 'NOT_DETERMINED') {
      compBadgeClass = 'badge-info';
      compLabel = '⚪ NOT DETERMINED';
    } else if (compStatus === 'NOT_APPLICABLE') {
      compBadgeClass = 'badge-neutral';
      compLabel = '⚪ NOT APPLICABLE';
    }

    const isCompliant = compStatus === 'COMPLIANT' || compStatus === 'PASS';

    card.innerHTML = `
      <div class="rule-card-top">
        <div class="rule-title-group">
          <h4>${escapeHtml(r.rule_name || r.rule_id)}</h4>
          <div style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 600;">
            ${escapeHtml(r.legal_reference || r.rule_id)} • Source: <span style="text-transform: capitalize;">${escapeHtml(r.source_panel || 'Packaging Evidence')}</span>
          </div>
        </div>
        <div class="rule-badges-group">
          <span class="badge ${presBadgeClass}" title="Presence Status on Packaging">
            Presence: ${presStatus}
          </span>
          <span class="badge ${compBadgeClass}" id="badge-comp-${r.rule_id}">
            ${compLabel}
          </span>
        </div>
      </div>

      <!-- Evidence Snippet -->
      <div class="rule-evidence-box">
        <strong>Extracted Evidence:</strong> ${escapeHtml(r.evidence || r.extracted_information || 'No verifiable declaration detected')}
      </div>

      <!-- Statutory Rationale -->
      <div class="rule-explanation-box">
        <strong>Statutory Analysis:</strong> ${escapeHtml(r.explanation || 'Evaluated under applicable Legal Metrology rules.')}
      </div>

      <!-- Remedial Guidance -->
      <div class="rule-correction-box ${isCompliant ? 'compliant-box' : ''}">
        <strong>${isCompliant ? '✓ Statutory Compliance:' : '⚠️ Required Correction:'}</strong>
        ${escapeHtml(r.recommendation || 'Satisfies Legal Metrology statutory provisions.')}
      </div>

      <!-- Auditor Quick Override Row -->
      <div class="rule-decision-row">
        <label style="font-weight: 600; color: var(--text-main); font-size: 0.85rem;">
          Auditor Statutory Determination:
        </label>
        <select class="rule-status-selector" data-rule="${r.rule_id}" data-status="${compStatus}" onchange="onUserRuleDecisionChanged('${r.rule_id}', this.value)">
          <option value="COMPLIANT" ${isCompliant ? 'selected' : ''}>✓ COMPLIANT (Satisfies PCR 2011)</option>
          <option value="NON_COMPLIANT" ${(compStatus === 'NON_COMPLIANT' || compStatus === 'FAIL') ? 'selected' : ''}>✗ NON-COMPLIANT (Confirmed Statutory Violation)</option>
          <option value="NEEDS_HUMAN_REVIEW" ${(compStatus === 'NEEDS_HUMAN_REVIEW' || compStatus === 'UNCLEAR') ? 'selected' : ''}>⚠️ NEEDS HUMAN REVIEW (Ambiguous Markings)</option>
          <option value="NOT_DETERMINED" ${compStatus === 'NOT_DETERMINED' ? 'selected' : ''}>⚪ NOT DETERMINED (Panel Photograph Pending)</option>
          <option value="NOT_APPLICABLE" ${compStatus === 'NOT_APPLICABLE' ? 'selected' : ''}>⚪ NOT APPLICABLE (Exempt Category)</option>
        </select>
        <span style="color: var(--text-sub); font-size: 0.75rem;">(Auditor override updates compliance score and official PDF)</span>
      </div>
    `;

    container.appendChild(card);
  });

  // Update Section C counters
  const pEl = document.getElementById('stat-pass-count');
  const fEl = document.getElementById('stat-fail-count');
  const uEl = document.getElementById('stat-unclear-count');
  const nEl = document.getElementById('stat-notdet-count');

  if (pEl) pEl.textContent = `${pass} Compliant`;
  if (fEl) fEl.textContent = `${fail} Non-Compliant`;
  if (uEl) uEl.textContent = `${unclear} Review`;
  if (nEl) nEl.textContent = `${notDet} Not Determined`;
}

/**
 * SECTION D: Missing or Unverifiable Information
 */
function renderSectionD(results, unavailablePanels = []) {
  const container = document.getElementById('gaps-summary-container');
  if (!container) return;

  const gaps = results.filter(r => {
    const ps = r.presence_status;
    const cs = r.compliance_status || r.result || r.status;
    return ps === 'MISSING' || ps === 'UNREADABLE' || ps === 'NOT_DETERMINED' || cs === 'NON_COMPLIANT' || cs === 'NEEDS_HUMAN_REVIEW' || cs === 'NOT_DETERMINED';
  });

  if (gaps.length === 0) {
    container.innerHTML = `
      <div class="card" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); padding: 1.5rem; text-align: center;">
        <span style="font-size: 2rem; display: block; margin-bottom: 0.5rem;">🎉</span>
        <strong style="color: #10b981; font-size: 1.1rem;">All Mandatory Declarations Present & Legible</strong>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">
          No packaging declarations were omitted or obscured across the provided evidence. All statutory fields under PCR 2011 were successfully verified.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="gaps-summary-card">
      <div style="margin-bottom: 1rem; font-weight: 700; color: var(--text-main); font-size: 0.95rem;">
        ⚠️ Identified Regulatory Gaps & Unverifiable Evidence (${gaps.length} items):
      </div>
      <div>
        ${gaps.map(g => {
          let badgeClass = 'badge-fail';
          let tagText = 'MISSING ON PACKAGE';
          let actionGuidance = 'Manufacturer must include this mandatory declaration on the retail package.';

          if (g.presence_status === 'UNREADABLE' || g.compliance_status === 'NEEDS_HUMAN_REVIEW') {
            badgeClass = 'badge-warning';
            tagText = 'UNREADABLE / LOW CLARITY';
            actionGuidance = 'Recapture packaging photograph under bright, non-reflective lighting to verify text clarity.';
          } else if (g.presence_status === 'NOT_DETERMINED' || g.compliance_status === 'NOT_DETERMINED') {
            badgeClass = 'badge-info';
            tagText = 'PANEL NOT PROVIDED';
            actionGuidance = `Provide photograph of the ${g.source_panel || 'remaining'} panel to enable automated statutory verification.`;
          }

          return `
            <div class="gap-item-row">
              <div style="flex: 1; min-width: 260px;">
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.9rem;">
                  ${escapeHtml(g.rule_name || g.rule_id)}
                </div>
                <div style="font-size: 0.8rem; color: var(--text-sub); margin-top: 2px;">
                  ${escapeHtml(g.legal_reference || g.rule_id)} • Action Required: <strong style="color: var(--text-main);">${actionGuidance}</strong>
                </div>
              </div>
              <div>
                <span class="badge ${badgeClass}">${tagText}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * SECTION E: Recommended Corrective Actions
 */
function renderSectionE(results) {
  const container = document.getElementById('corrective-actions-container');
  if (!container) return;

  const actions = results
    .filter(r => {
      const cs = r.compliance_status || r.result || r.status;
      return cs === 'NON_COMPLIANT' || cs === 'FAIL' || cs === 'NEEDS_HUMAN_REVIEW' || cs === 'UNCLEAR' || cs === 'NOT_DETERMINED';
    })
    .map(r => ({
      rule_id: r.rule_id,
      legal_ref: r.legal_reference || r.rule_id,
      recommendation: r.recommendation || `Ensure compliance with ${r.legal_reference}`
    }));

  if (actions.length === 0) {
    container.innerHTML = `
      <div class="card" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); padding: 1.5rem; text-align: center;">
        <strong style="color: #10b981; font-size: 1.1rem;">✓ Zero Corrective Actions Required</strong>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; margin-bottom: 0;">
          The packaging fully adheres to statutory standards under the Legal Metrology (Packaged Commodities) Rules, 2011.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="corrective-actions-card">
      <div style="margin-bottom: 1rem; font-weight: 700; color: var(--text-main); font-size: 0.95rem;">
        Prioritized Remedial Steps for Manufacturer / Packer:
      </div>
      <div>
        ${actions.map((act, idx) => `
          <div class="corrective-item">
            <span class="corrective-num">${idx + 1}</span>
            <div style="flex: 1;">
              <div style="font-size: 0.9rem; color: var(--text-main); font-weight: 500;">
                ${escapeHtml(act.recommendation)}
              </div>
              <div style="font-size: 0.75rem; color: var(--accent-cyan); margin-top: 3px;">
                Statutory Authority: ${escapeHtml(act.legal_ref)}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * SECTION F: Human Auditor Review & Final Determination
 */
function renderSectionF(scan) {
  const nameInput = document.getElementById('auditor-name-input');
  const decisionSelect = document.getElementById('auditor-decision-select');
  const notesInput = document.getElementById('auditor-notes-input');
  const pill = document.getElementById('auditor-verified-pill');
  const headerVerifiedChip = document.getElementById('header-verified-chip');

  if (scan.reviewed_by && nameInput) {
    nameInput.value = scan.reviewed_by;
  }
  if (scan.review_comments && notesInput) {
    notesInput.value = scan.review_comments;
  }

  if (decisionSelect) {
    if (scan.overall_status === 'PASS' || scan.overall_status === 'COMPLIANT') {
      decisionSelect.value = 'APPROVED';
    } else if (scan.overall_status === 'FAIL' || scan.overall_status === 'NON_COMPLIANT') {
      decisionSelect.value = 'REJECTED';
    } else if (scan.overall_status === 'PARTIALLY_EVALUATED') {
      decisionSelect.value = 'PARTIAL_INSPECTION';
    } else {
      decisionSelect.value = 'PASS_WITH_REMARKS';
    }
  }

  if (scan.is_human_reviewed) {
    if (pill) pill.style.display = 'inline-flex';
    if (headerVerifiedChip) headerVerifiedChip.style.display = 'inline-flex';
  }
}

/**
 * SECTION G: Official PDF Report & Raw Evidence
 */
function renderSectionG(images, rawText) {
  const grid = document.getElementById('results-images-grid');
  const rawTextEl = document.getElementById('raw-ocr-text-view');

  if (grid) {
    grid.innerHTML = '';
    if (!images || images.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 1.5rem; text-align: center; color: var(--text-muted);">No images attached to this inspection record.</div>`;
    } else {
      images.forEach(img => {
        const card = document.createElement('div');
        card.className = 'preview-card';
        card.innerHTML = `
          <img src="${img.file_path || img.preview_url || 'assets/placeholder.jpg'}" alt="${escapeHtml(img.original_filename || 'Packaging View')}" style="height: 180px; object-fit: cover; width: 100%;">
          <div class="preview-info" style="padding: 0.75rem;">
            <strong style="text-transform: capitalize; color: #60a5fa; font-size: 0.85rem;">
              ${escapeHtml(img.view_type || 'Packaging')} View
            </strong>
            <span style="color: var(--text-muted); font-size: 0.75rem; display: block; margin-top: 2px;">
              ${img.file_size ? `${Math.round(img.file_size / 1024)} KB` : 'Uploaded Photograph'}
            </span>
          </div>
        `;
        grid.appendChild(card);
      });
    }
  }

  if (rawTextEl) {
    rawTextEl.textContent = rawText || 'No raw OCR typography text captured.';
  }
}

/**
 * User Field Edit Handler
 */
function onFieldEdited(fieldName, newVal) {
  if (!currentScan || !currentScan.fields) return;

  const f = currentScan.fields.find(field => field.field_name.toLowerCase() === fieldName.toLowerCase());
  if (f) {
    f.field_value = newVal;
    f.is_verified = 1;
    showToast(`Updated ${formatFieldName(fieldName)}: "${newVal}"`, 'info');
    saveScanToLocalStorage(currentScan);
  }
}

/**
 * Auditor Statutory Determination Override
 */
function onUserRuleDecisionChanged(ruleId, newResult) {
  if (!currentScan || !currentScan.results) return;

  const target = currentScan.results.find(r => r.rule_id === ruleId);
  if (!target) return;

  // Map selection to compliance_status and result
  target.compliance_status = newResult;
  target.result = newResult === 'COMPLIANT' ? 'PASS' : (newResult === 'NON_COMPLIANT' ? 'FAIL' : (newResult === 'NOT_DETERMINED' ? 'NOT_DETERMINED' : 'UNCLEAR'));
  target.status = target.result;
  target.reviewer_status = 'OVERRIDDEN';

  // Live recalculate score across evaluable rules
  recalculateComplianceScore();

  // Re-render Section C, D, E with new state
  renderSectionC(currentScan.results);
  renderSectionD(currentScan.results, currentScan.unavailable_panels || []);
  renderSectionE(currentScan.results);

  saveScanToLocalStorage(currentScan);
  showToast(`Auditor determination updated for ${ruleId}: ${newResult}`, 'info');
}

function recalculateComplianceScore() {
  if (!currentScan || !currentScan.results) return;

  const applicable = currentScan.results.filter(r => {
    const cs = r.compliance_status || r.result || r.status;
    const ps = r.presence_status;
    return cs !== 'NOT_APPLICABLE' && ps !== 'NOT_APPLICABLE' && cs !== 'NOT_DETERMINED';
  });

  const compliant = applicable.filter(r => (r.compliance_status === 'COMPLIANT' || r.result === 'PASS')).length;
  const nonCompliant = applicable.filter(r => (r.compliance_status === 'NON_COMPLIANT' || r.result === 'FAIL')).length;
  const reviewReq = applicable.filter(r => (r.compliance_status === 'NEEDS_HUMAN_REVIEW' || r.result === 'UNCLEAR')).length;

  const unavailCount = (currentScan.unavailable_panels || []).length;
  const score = applicable.length > 0 ? (compliant / applicable.length) * 100 : 0;
  currentScan.compliance_score = Math.round(score * 10) / 10;

  if (nonCompliant > 0) {
    currentScan.overall_status = 'FAIL';
  } else if (reviewReq > 0) {
    currentScan.overall_status = 'REVIEW_REQUIRED';
  } else if (unavailCount > 0) {
    currentScan.overall_status = 'PARTIALLY_EVALUATED';
  } else {
    currentScan.overall_status = 'PASS';
  }

  updateHeaderStatusBadge(currentScan.overall_status, currentScan.compliance_score);
}

/**
 * Auditor Review Confirmation & Final Save
 */
async function finalizeUserDecision() {
  if (!currentScan) return;

  const nameInput = document.getElementById('auditor-name-input');
  const decisionSelect = document.getElementById('auditor-decision-select');
  const notesInput = document.getElementById('auditor-notes-input');

  const reviewerName = nameInput ? nameInput.value.trim() : 'Legal Metrology Inspector';
  const decision = decisionSelect ? decisionSelect.value : 'APPROVED';
  const notes = notesInput ? notesInput.value.trim() : 'Auditor finalized determination.';

  // Gather field overrides
  const overrides = [];
  document.querySelectorAll('.field-override-input').forEach(input => {
    const fName = input.getAttribute('data-field');
    const fVal = input.value.trim();
    const fieldObj = currentScan.fields && currentScan.fields.find(f => f.field_name === fName);
    if (fieldObj) {
      overrides.push({ field_id: fieldObj.id || 1, field_value: fVal });
    }
  });

  const reviewPayload = {
    reviewer_name: reviewerName,
    decision: decision,
    comments: notes,
    field_overrides: overrides
  };

  currentScan.reviewed_by = reviewerName;
  currentScan.review_comments = notes;
  currentScan.is_human_reviewed = true;

  // Show verified badge
  const pill = document.getElementById('auditor-verified-pill');
  const headerChip = document.getElementById('header-verified-chip');
  if (pill) pill.style.display = 'inline-flex';
  if (headerChip) headerChip.style.display = 'inline-flex';

  saveScanToLocalStorage(currentScan);

  try {
    await API.submitReview(currentScan.id, reviewPayload);
    showToast('✓ Final statutory compliance determination confirmed and saved!', 'success');
  } catch (err) {
    console.warn('Network review submit failed; saved to local inspection cache', err);
    showToast('✓ Determination confirmed and saved to inspector cache!', 'success');
  }
}

function scrollToAuditorSection() {
  // Activate Tab 3
  const tabBtn = document.querySelector('.tab-btn[data-tab="tab-auditor-review"]');
  if (tabBtn) tabBtn.click();

  const el = document.getElementById('section-auditor-review');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
  }
}

function saveScanToLocalStorage(scan) {
  try {
    const key = 'legalcheck_scans';
    let cached = JSON.parse(localStorage.getItem(key) || '[]');
    const idx = cached.findIndex(s => s.id === scan.id);
    if (idx >= 0) {
      cached[idx] = scan;
    } else {
      cached.unshift(scan);
    }
    localStorage.setItem(key, JSON.stringify(cached.slice(0, 50)));
  } catch (e) {
    console.warn('Failed to cache scan locally', e);
  }
}

function formatFieldName(name) {
  const map = {
    'product_name': 'Generic / Product Name',
    'mrp': 'Maximum Retail Price (MRP)',
    'net_quantity': 'Net Quantity',
    'manufacturer_name_address': 'Manufacturer / Packer Address',
    'manufacturer': 'Manufacturer / Packer Identity',
    'manufacturing_date': 'Month & Year of Mfg/Packing',
    'packing_date': 'Pre-Packing Date',
    'consumer_care': 'Consumer Grievance Helpline',
    'country_of_origin': 'Country of Origin',
    'unit_sale_price': 'Unit Sale Price (USP)',
    'fssai_license': 'FSSAI License / Best Before',
    'nutritional_info': 'Nutritional Information',
    'batch_number': 'Lot / Batch Code'
  };
  return map[name] || name.replace(/_/g, ' ').toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
