/**
 * ============================================================================
 * LegalCheck 360: Unified Packaging Upload & Inspection Workflow
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Implements a sequential, guided 4-step wizard:
 * Step 1: Front Panel (PDP) [Upload or Not Available]
 * Step 2: Back Panel (MRP / Declarations) [Upload or Not Available]
 * Step 3: Side Flap / Nutrition [Upload or Not Available]
 * Step 4: Evidence Review & Start AI Inspection
 */

const panelState = {
  front: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' },
  back: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' },
  side: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' }
};

let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  goToStep(1);
});

/**
 * Step Navigation Wizard
 */
window.goToStep = function(stepNum) {
  if (stepNum < 1 || stepNum > 4) return;
  currentStep = stepNum;

  // Update progress indicators
  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`step-indicator-${i}`);
    const pane = document.getElementById(`pane-step-${i}`);

    if (ind) {
      ind.classList.remove('active');
      if (i === currentStep) {
        ind.classList.add('active');
      } else if (i < currentStep) {
        ind.classList.add('completed');
      }
    }

    if (pane) {
      pane.classList.remove('active');
      if (i === currentStep) {
        pane.classList.add('active');
      }
    }
  }

  if (currentStep === 4) {
    updateSummaryUI();
  }
};

/**
 * File Input Triggers
 */
window.triggerFileInput = function(panel) {
  const el = document.getElementById(`file-input-${panel}`);
  if (el) el.click();
};

window.triggerCameraInput = function(panel) {
  const el = document.getElementById(`camera-input-${panel}`);
  if (el) el.click();
};

/**
 * Drag and Drop Setup for Each Panel
 */
function setupDragAndDrop() {
  ['front', 'back', 'side'].forEach(panel => {
    const zone = document.getElementById(`drop-zone-${panel}`);
    if (!zone) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handlePanelFile(panel, e.dataTransfer.files);
      }
    });
  });
}

/**
 * Handle File Upload for Specific Panel
 */
window.handlePanelFile = function(panel, files) {
  if (!files || files.length === 0) return;
  const file = files[0];

  const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (!allowedTypes.includes(file.type.toLowerCase())) {
    showToast(`Unsupported format: ${file.name}. Please upload JPG, PNG, or WEBP.`, 'error');
    return;
  }

  if (file.size > maxSizeBytes) {
    showToast(`File ${file.name} exceeds 15MB limit.`, 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    panelState[panel] = {
      file: file,
      dataBase64: event.target.result,
      filename: file.name,
      mimeType: file.type,
      status: 'uploaded'
    };

    renderPanelPreview(panel);
    showToast(`${getPanelDisplayName(panel)} photograph uploaded successfully!`, 'success');
  };
  reader.readAsDataURL(file);
};

/**
 * Render Uploaded Thumbnail for Panel
 */
function renderPanelPreview(panel) {
  const dropBox = document.getElementById(`${panel}-drop-container`);
  const prevBox = document.getElementById(`${panel}-preview-container`);
  const imgEl = document.getElementById(`${panel}-preview-img`);
  const nameEl = document.getElementById(`${panel}-filename`);
  const sizeEl = document.getElementById(`${panel}-filesize`);

  if (!panelState[panel] || panelState[panel].status !== 'uploaded') {
    if (dropBox) dropBox.style.display = 'block';
    if (prevBox) prevBox.style.display = 'none';
    return;
  }

  if (dropBox) dropBox.style.display = 'none';
  if (prevBox) prevBox.style.display = 'block';

  if (imgEl) imgEl.src = panelState[panel].dataBase64;
  if (nameEl) nameEl.textContent = panelState[panel].filename;
  if (sizeEl && panelState[panel].file) {
    sizeEl.textContent = `File Size: ${(panelState[panel].file.size / 1024).toFixed(1)} KB`;
  }
}

/**
 * Mark Panel as Not Available
 */
window.markPanelUnavailable = function(panel) {
  panelState[panel] = {
    file: null,
    dataBase64: null,
    filename: null,
    mimeType: null,
    status: 'unavailable'
  };

  const dropBox = document.getElementById(`${panel}-drop-container`);
  const prevBox = document.getElementById(`${panel}-preview-container`);
  if (dropBox) dropBox.style.display = 'block';
  if (prevBox) prevBox.style.display = 'none';

  showToast(`${getPanelDisplayName(panel)} marked as Not Available.`, 'info');

  // Automatic advance to next step
  if (panel === 'front') {
    goToStep(2);
  } else if (panel === 'back') {
    goToStep(3);
  } else if (panel === 'side') {
    goToStep(4);
  }
};

/**
 * Reset / Clear Panel
 */
window.clearPanel = function(panel) {
  panelState[panel] = {
    file: null,
    dataBase64: null,
    filename: null,
    mimeType: null,
    status: 'pending'
  };

  const dropBox = document.getElementById(`${panel}-drop-container`);
  const prevBox = document.getElementById(`${panel}-preview-container`);
  if (dropBox) dropBox.style.display = 'block';
  if (prevBox) prevBox.style.display = 'none';
};

/**
 * Update Summary Table & Review Validation on Step 4
 */
function updateSummaryUI() {
  const panels = ['front', 'back', 'side'];
  let uploadedCount = 0;
  let unavailableCount = 0;

  panels.forEach(p => {
    const td = document.getElementById(`summary-${p}-status`);
    if (!td) return;

    if (panelState[p].status === 'uploaded' && panelState[p].dataBase64) {
      uploadedCount++;
      td.innerHTML = `
        <div style="display: flex; align-items: center;">
          <img src="${panelState[p].dataBase64}" class="summary-thumbnail" alt="${p}">
          <div>
            <span class="badge badge-pass" style="font-size: 0.75rem;">✓ Uploaded</span>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-family: monospace;">${panelState[p].filename || 'image.jpg'}</div>
          </div>
        </div>
      `;
    } else if (panelState[p].status === 'unavailable') {
      unavailableCount++;
      td.innerHTML = `<span class="badge badge-unclear">⚪ Marked Not Available</span>`;
    } else {
      td.innerHTML = `<span class="badge badge-neutral">⏳ Not Provided Yet</span>`;
    }
  });

  const banner = document.getElementById('evidence-validation-banner');
  const submitBtn = document.getElementById('submit-inspection-btn');

  if (uploadedCount === 0) {
    if (banner) {
      banner.innerHTML = `
        <div class="alert alert-warning" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem;">
          ⚠️ <strong>Insufficient Photographic Evidence:</strong> All three packaging panels are marked unavailable. Please upload at least one packaging photograph (Front or Back) to run a valid compliance inspection.
        </div>
      `;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (banner) {
      const partialNote = unavailableCount > 0 
        ? `<strong>Note:</strong> ${unavailableCount} panel(s) marked unavailable. Declarations normally on those panels will be evaluated as <em>Not Determined</em> without blocking your report.` 
        : `All 3 packaging panels provided for comprehensive multi-view inspection.`;

      banner.innerHTML = `
        <div class="alert alert-info" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.3); color: #60a5fa; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.85rem;">
          ✓ <strong>${uploadedCount} Packaging Panel(s) Ready:</strong> ${partialNote}
        </div>
      `;
    }
    if (submitBtn) submitBtn.disabled = false;
  }
}

/**
 * Category Changed Handler for Custom Commodity
 */
window.onCategoryChanged = function(val) {
  const customBox = document.getElementById('custom-category-container');
  if (!customBox) return;
  if (val === 'others') {
    customBox.style.display = 'block';
    const input = document.getElementById('custom-category-input');
    if (input) input.focus();
  } else {
    customBox.style.display = 'none';
  }
};

/**
 * Start AI Inspection & Post Evidence to Backend
 */
window.startUnifiedAiInspection = async function() {
  const panels = ['front', 'back', 'side'];
  const uploadedImages = [];
  const unavailablePanels = [];

  panels.forEach(p => {
    if (panelState[p].status === 'uploaded' && panelState[p].dataBase64) {
      uploadedImages.push({
        view_type: p,
        filename: panelState[p].filename || `${p}_view.jpg`,
        mime_type: panelState[p].mimeType || 'image/jpeg',
        data: panelState[p].dataBase64
      });
    } else {
      unavailablePanels.push(p);
    }
  });

  if (uploadedImages.length === 0) {
    showToast('Please provide at least one packaging photograph.', 'error');
    return;
  }

  const productName = (document.getElementById('product-name-input')?.value || '').trim();
  const category = document.getElementById('category-select')?.value || 'packaged_food';
  const customCategory = (document.getElementById('custom-category-input')?.value || '').trim();

  // Show Scanning Overlay & Interactive Stage Tracker
  showScanningOverlay(uploadedImages.length, unavailablePanels.length);

  const payload = {
    product_name: productName,
    category: category,
    custom_category: customCategory,
    unavailable_panels: unavailablePanels,
    images: uploadedImages
  };

  try {
    simulateStep(1, `Uploading ${uploadedImages.length} packaging photograph(s)...`);
    await delay(500);

    simulateStep(2, 'Validating image formats, panel views & signatures...');
    await delay(500);

    simulateStep(3, 'Reading printed packaging text via OCR...');
    
    // Send real API request
    const res = await API.createScan(payload);

    simulateStep(4, 'AI multimodal declaration extraction...');
    await delay(400);

    simulateStep(5, 'Matching Legal Metrology (PCR 2011) requirements...');
    await delay(400);

    simulateStep(6, 'Compiling compliance assessment & vector PDF report...');
    await delay(400);

    if (res.success && res.data && res.data.id) {
      showToast('Packaging compliance inspection completed!', 'success');
      window.location.href = `results.html?id=${res.data.id}`;
    } else {
      hideScanningOverlay();
      showToast(res.error || 'Inspection failed. Please try again.', 'error');
    }
  } catch (err) {
    console.error('Scan error:', err);
    hideScanningOverlay();
    showToast('Inspection request failed. Please check network connection.', 'error');
  }
};

/**
 * Academic Demonstration Presets
 */
window.loadSamplePreset = async function(presetType) {
  showToast(`Loading ${presetType} demonstration sample...`, 'info');

  const nameInput = document.getElementById('product-name-input');
  const catSelect = document.getElementById('category-select');

  try {
    if (presetType === 'compliant') {
      if (nameInput) nameInput.value = 'Royal Butter Delights Biscuits';
      if (catSelect) catSelect.value = 'packaged_food';

      const frontB64 = await fetchImageAsBase64('tests/samples/biscuit_front.jpg');
      const backB64 = await fetchImageAsBase64('tests/samples/biscuit_back.jpg');

      panelState.front = { file: { size: 45000 }, filename: 'biscuit_front.jpg', mimeType: 'image/jpeg', dataBase64: frontB64, status: 'uploaded' };
      panelState.back = { file: { size: 55000 }, filename: 'biscuit_back.jpg', mimeType: 'image/jpeg', dataBase64: backB64, status: 'uploaded' };
      panelState.side = { file: null, filename: null, mimeType: null, dataBase64: null, status: 'unavailable' };

    } else if (presetType === 'noncompliant') {
      if (nameInput) nameInput.value = 'Imported Caramel Crunch';
      if (catSelect) catSelect.value = 'packaged_food';

      const ncB64 = await fetchImageAsBase64('tests/samples/noncompliant_snack.jpg');

      panelState.front = { file: null, filename: null, mimeType: null, dataBase64: null, status: 'unavailable' };
      panelState.back = { file: { size: 48000 }, filename: 'noncompliant_snack.jpg', mimeType: 'image/jpeg', dataBase64: ncB64, status: 'uploaded' };
      panelState.side = { file: null, filename: null, mimeType: null, dataBase64: null, status: 'unavailable' };

    } else if (presetType === 'blurry') {
      if (nameInput) nameInput.value = 'Wheat Crisps (Partially Obscured)';
      if (catSelect) catSelect.value = 'packaged_food';

      const blurB64 = await fetchImageAsBase64('tests/samples/blurry_sample.jpg');

      panelState.front = { file: { size: 38000 }, filename: 'blurry_sample.jpg', mimeType: 'image/jpeg', dataBase64: blurB64, status: 'uploaded' };
      panelState.back = { file: null, filename: null, mimeType: null, dataBase64: null, status: 'unavailable' };
      panelState.side = { file: null, filename: null, mimeType: null, dataBase64: null, status: 'unavailable' };
    }

    renderPanelPreview('front');
    renderPanelPreview('back');
    renderPanelPreview('side');

    goToStep(4);
    showToast(`Loaded ${presetType} preset. Click "Start AI Inspection" to evaluate!`, 'success');
  } catch (err) {
    console.error('Preset loading error:', err);
    showToast('Failed to load sample image files.', 'error');
  }
};

/**
 * Scanning Modal Overlay
 */
function showScanningOverlay(uploadedCount, unavailableCount) {
  let overlay = document.getElementById('scan-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'scan-overlay';
    overlay.className = 'scan-overlay';
    overlay.innerHTML = `
      <div class="scan-modal">
        <div class="radar-spinner"></div>
        <h2 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 0.5rem;">Analyzing Product Packaging</h2>
        <p style="color: #9ca3af; font-size: 0.9rem;" id="scan-status-text">Processing image data...</p>
        <div class="scan-steps">
          <div class="scan-step-item" id="step-1"><span class="step-indicator">1</span> <span>Uploading packaging photographs</span></div>
          <div class="scan-step-item" id="step-2"><span class="step-indicator">2</span> <span>Validating file signatures & dimensions</span></div>
          <div class="scan-step-item" id="step-3"><span class="step-indicator">3</span> <span>Reading printed packaging text via OCR</span></div>
          <div class="scan-step-item" id="step-4"><span class="step-indicator">4</span> <span>AI structured declaration extraction</span></div>
          <div class="scan-step-item" id="step-5"><span class="step-indicator">5</span> <span>Evaluating Legal Metrology (PCR 2011) rules</span></div>
          <div class="scan-step-item" id="step-6"><span class="step-indicator">6</span> <span>Generating vector compliance PDF report</span></div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  overlay.style.display = 'flex';
}

function simulateStep(stepNum, statusText) {
  const statusEl = document.getElementById('scan-status-text');
  if (statusEl) statusEl.textContent = statusText;

  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`step-${i}`);
    if (!el) continue;
    if (i < stepNum) {
      el.className = 'scan-step-item completed';
      el.querySelector('.step-indicator').textContent = '✓';
    } else if (i === stepNum) {
      el.className = 'scan-step-item active';
    } else {
      el.className = 'scan-step-item';
    }
  }
}

function hideScanningOverlay() {
  const overlay = document.getElementById('scan-overlay');
  if (overlay) overlay.style.display = 'none';
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getPanelDisplayName(panel) {
  if (panel === 'front') return 'Front Panel (PDP)';
  if (panel === 'back') return 'Back Panel (MRP / Declarations)';
  if (panel === 'side') return 'Side Flap / Nutrition';
  return panel;
}

async function fetchImageAsBase64(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("File fetch failed");
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return createSampleFallbackDataUrl(url);
  }
}

function createSampleFallbackDataUrl(filename) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 600, 400);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('LegalCheck 360 Sample Package', 40, 60);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px monospace';
  ctx.fillText(`Sample Reference: ${filename}`, 40, 120);
  ctx.fillText('MRP: Rs. 30.00 incl. of all taxes', 40, 160);
  ctx.fillText('Net Qty: 150 g', 40, 200);
  ctx.fillText('Mfd by: Delight Foods India Pvt. Ltd.', 40, 240);
  return canvas.toDataURL('image/jpeg', 0.9);
}
