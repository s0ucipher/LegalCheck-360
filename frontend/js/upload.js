/**
 * ============================================================================
 * LegalCheck 360: Unified Packaging Upload & Inspection Workflow
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Implements a sequential, guided 5-step wizard with 4 packaging panels:
 * Step 1: Front Panel (PDP) [Upload or Not Available]
 * Step 2: Back Panel (MRP / Declarations) [Upload or Not Available]
 * Step 3: Side Panel 1 (Nutrition & Ingredients) [Upload or Not Available]
 * Step 4: Side Panel 2 (Batch, Barcode & USP) [Upload or Not Available]
 * Step 5: Evidence Review & Start AI Inspection
 */

const panelState = {
  front: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' },
  back: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' },
  side1: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' },
  side2: { file: null, dataBase64: null, filename: null, mimeType: null, status: 'pending' }
};

let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
  setupDragAndDrop();
  goToStep(1);
});

/**
 * Step Navigation Wizard (Steps 1 to 5)
 */
window.goToStep = function(stepNum) {
  if (stepNum < 1 || stepNum > 5) return;
  currentStep = stepNum;
  window.currentStep = stepNum;

  // Update progress indicators
  for (let i = 1; i <= 5; i++) {
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

  // Smooth scroll to top of upload wizard
  const wizard = document.getElementById('wizard-progress');
  if (wizard && window.innerWidth < 768) {
    wizard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  if (currentStep === 5) {
    updateSummaryUI();
  }
};

/**
 * Direct File Input Triggers (Zero Redundant Modals)
 */
window.triggerCameraInput = function(panel) {
  const el = document.getElementById(`camera-input-${panel}`);
  if (el) {
    el.value = '';
    el.click();
  }
};

window.triggerGalleryInput = function(panel) {
  const el = document.getElementById(`gallery-input-${panel}`);
  if (el) {
    el.value = '';
    el.click();
  }
};

window.triggerFilesInput = function(panel) {
  const el = document.getElementById(`files-input-${panel}`);
  if (el) {
    el.value = '';
    el.click();
  }
};

/**
 * Drag and Drop Setup for All 4 Panels
 */
function setupDragAndDrop() {
  ['front', 'back', 'side1', 'side2'].forEach(panel => {
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
 * Handle File Upload for Specific Panel (Auto-Advances to Next Step)
 */
window.handlePanelFile = function(panel, files) {
  if (!files || files.length === 0) return;
  const file = files[0];

  const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
  const fileName = (file.name || "").toLowerCase();
  const extMatch = /\.(jpe?g|png|webp|heic|heif|bmp|tiff?)$/i.test(fileName);
  const isImageMime = file.type && file.type.toLowerCase().startsWith('image/');

  if (!isImageMime && !extMatch) {
    showToast(`Unsupported format: ${file.name}. Please upload a packaging photo (JPG, PNG, WEBP).`, 'error');
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
      mimeType: file.type || 'image/jpeg',
      status: 'uploaded'
    };

    renderPanelPreview(panel);
    showToast(`✓ ${getPanelDisplayName(panel)} photo uploaded!`, 'success');

    // Auto-advance smoothly to next step without requiring user to touch blank space
    setTimeout(() => {
      if (panel === 'front') {
        goToStep(2);
      } else if (panel === 'back') {
        goToStep(3);
      } else if (panel === 'side1') {
        goToStep(4);
      } else if (panel === 'side2') {
        goToStep(5);
      }
    }, 450);
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
 * Mark Panel as Not Available (Auto-Advances)
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
  } else if (panel === 'side1') {
    goToStep(4);
  } else if (panel === 'side2') {
    goToStep(5);
  }
};

/**
 * Reset / Clear Panel (Allows Retaking)
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
 * Update Summary Table & Review Validation on Step 5
 */
function updateSummaryUI() {
  const panels = ['front', 'back', 'side1', 'side2'];
  let uploadedCount = 0;
  let unavailableCount = 0;

  panels.forEach(p => {
    const td = document.getElementById(`summary-${p}-status`);
    if (!td) return;

    if (panelState[p].status === 'uploaded' && panelState[p].dataBase64) {
      uploadedCount++;
      td.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.6rem;">
          <img src="${panelState[p].dataBase64}" class="summary-thumbnail" alt="${p}" style="width: 44px; height: 44px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
          <div>
            <span class="badge badge-pass" style="font-size: 0.75rem;">✓ Uploaded</span>
            <div style="font-size: 0.72rem; color: var(--text-muted); font-family: monospace; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${panelState[p].filename || 'image.jpg'}</div>
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
          ⚠️ <strong>Insufficient Photographic Evidence:</strong> No packaging photographs uploaded. Please provide at least one panel photograph (Front, Back, or Side) to run a valid compliance inspection.
        </div>
      `;
    }
    if (submitBtn) submitBtn.disabled = true;
  } else {
    if (banner) {
      const partialNote = unavailableCount > 0 
        ? `<strong>Note:</strong> ${unavailableCount} panel(s) marked unavailable. Declarations on those panels will be evaluated as <em>Not Determined</em> without blocking your statutory report.` 
        : `All 4 packaging panels provided for full multi-view 360° compliance screening.`;

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
 * Live Mandatory Fields Validator
 */
window.validateMandatoryFieldsLive = function() {
  const nameInput = document.getElementById('product-name-input');
  const catSelect = document.getElementById('category-select');
  const customInput = document.getElementById('custom-category-input');

  const nameVal = (nameInput?.value || '').trim();
  const catVal = (catSelect?.value || '').trim();
  const customVal = (customInput?.value || '').trim();

  if (nameInput) {
    if (nameVal.length > 0) {
      nameInput.style.borderColor = '#10b981';
      document.getElementById('product-name-error').style.display = 'none';
    } else {
      nameInput.style.borderColor = '';
    }
  }

  if (catSelect) {
    if (catVal.length > 0) {
      catSelect.style.borderColor = '#10b981';
      document.getElementById('category-select-error').style.display = 'none';
    } else {
      catSelect.style.borderColor = '';
    }
  }

  if (customInput && catVal === 'others') {
    if (customVal.length > 0) {
      customInput.style.borderColor = '#10b981';
      document.getElementById('custom-category-error').style.display = 'none';
    } else {
      customInput.style.borderColor = '';
    }
  }
};

/**
 * Start Unified AI Compliance Inspection
 */
window.startUnifiedAiInspection = async function() {
  const nameInput = document.getElementById('product-name-input');
  const catSelect = document.getElementById('category-select');
  const customInput = document.getElementById('custom-category-input');

  const productName = (nameInput?.value || '').trim();
  const category = (catSelect?.value || '').trim();
  const customCategory = (customInput?.value || '').trim();

  let hasError = false;

  if (!productName) {
    hasError = true;
    if (nameInput) {
      nameInput.style.borderColor = '#ef4444';
      nameInput.focus();
    }
    const errEl = document.getElementById('product-name-error');
    if (errEl) errEl.style.display = 'block';
  } else {
    if (nameInput) nameInput.style.borderColor = '#10b981';
    const errEl = document.getElementById('product-name-error');
    if (errEl) errEl.style.display = 'none';
  }

  if (!category) {
    hasError = true;
    if (catSelect) catSelect.style.borderColor = '#ef4444';
    const errEl = document.getElementById('category-select-error');
    if (errEl) errEl.style.display = 'block';
  } else {
    if (catSelect) catSelect.style.borderColor = '#10b981';
    const errEl = document.getElementById('category-select-error');
    if (errEl) errEl.style.display = 'none';
  }

  if (category === 'others' && !customCategory) {
    hasError = true;
    if (customInput) {
      customInput.style.borderColor = '#ef4444';
      customInput.focus();
    }
    const errEl = document.getElementById('custom-category-error');
    if (errEl) errEl.style.display = 'block';
  } else if (category === 'others') {
    if (customInput) customInput.style.borderColor = '#10b981';
    const errEl = document.getElementById('custom-category-error');
    if (errEl) errEl.style.display = 'none';
  }

  if (hasError) {
    showToast('Product Name and Category are strictly mandatory for statutory compliance inspection.', 'error');
    return;
  }

  const panels = ['front', 'back', 'side1', 'side2'];
  const uploadedImages = [];
  const unavailablePanels = [];

  panels.forEach(p => {
    if (panelState[p].status === 'uploaded' && panelState[p].dataBase64) {
      uploadedImages.push({
        filename: panelState[p].filename || `${p}_view.jpg`,
        view_type: p,
        data: panelState[p].dataBase64
      });
    } else {
      unavailablePanels.push(p);
    }
  });

  if (uploadedImages.length === 0) {
    showToast('Please upload at least one packaging photograph before submitting.', 'error');
    return;
  }

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
    simulateStep(1, `Uploading packaging photographs (${uploadedImages.length} panel${uploadedImages.length > 1 ? 's' : ''})... Please wait patiently.`, 16);
    await delay(450);

    simulateStep(2, 'Validating file signatures & dimensions...', 33);
    
    // Execute inspection API call concurrently with visual progress simulation
    const resPromise = API.createScan(payload);

    await delay(500);
    simulateStep(3, 'Reading printed packaging text via OCR...', 50);

    await delay(550);
    simulateStep(4, 'AI structured declaration extraction...', 68);

    await delay(550);
    simulateStep(5, 'Evaluating Legal Metrology (PCR 2011) rules...', 85);

    const res = await resPromise;

    simulateStep(6, 'Generating vector compliance PDF report...', 100);
    await delay(450);

    if (res.success && res.data && res.data.id) {
      // Save locally as safety cache so results.html loads instantly with zero cold-start delay
      try {
        const cached = JSON.parse(localStorage.getItem('legalcheck_scans') || '[]');
        const filtered = cached.filter(s => s.id !== res.data.id);
        filtered.unshift(res.data);
        localStorage.setItem('legalcheck_scans', JSON.stringify(filtered));
      } catch (e) {}

      showToast('Packaging compliance inspection completed!', 'success');
      window.location.href = `results.html?id=${encodeURIComponent(res.data.id)}`;
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
      if (nameInput) nameInput.value = 'Britannia Good Day Butter Cookies';
      if (catSelect) catSelect.value = 'packaged_food';

      panelState.front = {
        file: { name: 'biscuit_front.jpg', size: 145000 },
        dataBase64: createSampleFallbackDataUrl('biscuit_front.jpg', 'Britannia Good Day Butter Cookies', 'Net Qty: 200 g (SI Units)'),
        filename: 'biscuit_front.jpg',
        mimeType: 'image/jpeg',
        status: 'uploaded'
      };

      panelState.back = {
        file: { name: 'biscuit_back.jpg', size: 182000 },
        dataBase64: createSampleFallbackDataUrl('biscuit_back.jpg', 'Mandatory Declarations', 'MRP Rs. 40.00 incl. taxes | 01/2026'),
        filename: 'biscuit_back.jpg',
        mimeType: 'image/jpeg',
        status: 'uploaded'
      };

      panelState.side1 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };
      panelState.side2 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };

    } else if (presetType === 'noncompliant') {
      if (nameInput) nameInput.value = 'Crunchy Bites Spiced Potato Wafers';
      if (catSelect) catSelect.value = 'packaged_food';

      panelState.front = {
        file: { name: 'biscuit_front.jpg', size: 135000 },
        dataBase64: createSampleFallbackDataUrl('biscuit_front.jpg', 'Crunchy Bites Spiced Potato Wafers', 'Net Wt. 7.05 oz [ILLEGAL NON-METRIC]'),
        filename: 'biscuit_front.jpg',
        mimeType: 'image/jpeg',
        status: 'uploaded'
      };

      panelState.back = {
        file: { name: 'noncompliant_snack.jpg', size: 160000 },
        dataBase64: createSampleFallbackDataUrl('noncompliant_snack.jpg', 'Back Declarations (Illegal Units)', 'Price: 35 Rupees [NO INCL TAXES]'),
        filename: 'noncompliant_snack.jpg',
        mimeType: 'image/jpeg',
        status: 'uploaded'
      };

      panelState.side1 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };
      panelState.side2 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };

    } else if (presetType === 'blurry') {
      if (nameInput) nameInput.value = 'Darjeeling Green Tea Premium Blend';
      if (catSelect) catSelect.value = 'beverages';

      panelState.front = {
        file: { name: 'blurry_sample.jpg', size: 95000 },
        dataBase64: createSampleFallbackDataUrl('blurry_sample.jpg', 'Darjeeling Green Tea (Glare/Blurry)', 'Net Qty: [Partially Obscured]'),
        filename: 'blurry_sample.jpg',
        mimeType: 'image/jpeg',
        status: 'uploaded'
      };

      panelState.back = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };
      panelState.side1 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };
      panelState.side2 = { file: null, dataBase64: null, filename: null, mimeType: null, status: 'unavailable' };
    }

    renderPanelPreview('front');
    renderPanelPreview('back');
    renderPanelPreview('side1');
    renderPanelPreview('side2');
    validateMandatoryFieldsLive();
    goToStep(5);
    updateSummaryUI();

    const submitBtn = document.getElementById('submit-inspection-btn');
    if (submitBtn) submitBtn.disabled = false;

    showToast(`Loaded ${presetType.toUpperCase()} preset. Click "🚀 Start AI Inspection" to demonstrate to judges!`, 'success');
  } catch (err) {
    console.error('Preset load error:', err);
  }
};

/**
 * Scanning Overlay Progress Simulator
 */
function showScanningOverlay(imagesCount, unavailCount) {
  let overlay = document.getElementById('scan-overlay');
  if (overlay) {
    overlay.style.display = 'flex';
  }
  const title = document.getElementById('scan-overlay-title');
  if (title) {
    title.textContent = 'Analyzing Product Packaging';
  }
  const sub = document.getElementById('scan-overlay-subtitle');
  if (sub) {
    sub.textContent = 'Please wait patiently, your compliance results are being prepared...';
  }
  const prog = document.getElementById('scan-progress-bar');
  if (prog) {
    prog.style.width = '15%';
  }
  // Reset all 6 step indicators
  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`sim-step-${i}`);
    if (el) {
      el.className = 'scan-step-item';
      const indicator = el.querySelector('.step-indicator');
      if (indicator) indicator.textContent = i;
    }
  }
}

function simulateStep(stepNum, subtitle, percent) {
  const sub = document.getElementById('scan-overlay-subtitle');
  if (sub && subtitle) sub.textContent = subtitle;

  const bar = document.getElementById('scan-progress-bar');
  if (bar && percent !== undefined) bar.style.width = `${percent}%`;

  for (let i = 1; i <= 6; i++) {
    const el = document.getElementById(`sim-step-${i}`);
    if (!el) continue;
    const indicator = el.querySelector('.step-indicator');
    if (i < stepNum) {
      el.className = 'scan-step-item completed';
      if (indicator) indicator.textContent = '✓';
    } else if (i === stepNum) {
      el.className = 'scan-step-item active';
      if (indicator) indicator.textContent = i;
    } else {
      el.className = 'scan-step-item';
      if (indicator) indicator.textContent = i;
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
  if (panel === 'side1') return 'Side Panel 1 (Nutrition & Ingredients)';
  if (panel === 'side2') return 'Side Panel 2 (Batch & Barcode)';
  return panel;
}

function createSampleFallbackDataUrl(filename, title, subtitle) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 600, 400);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('LegalCheck 360 Demonstration Sample', 40, 60);
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText(title || 'Packaged Commodity Evidence', 40, 110);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '16px monospace';
  ctx.fillText(subtitle || 'Mandatory Regulatory Declarations', 40, 160);
  ctx.fillText(`File: ${filename}`, 40, 210);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Standard SI Metric Declarations under PCR 2011', 40, 270);
  return canvas.toDataURL('image/jpeg', 0.9);
}
