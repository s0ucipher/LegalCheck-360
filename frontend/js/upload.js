/**
 * ============================================================================
 * LegalCheck 360: Product Upload & Scanning Engine (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

let uploadedImages = []; // Array of { file, dataBase64, viewType, filename, mimeType }
let currentViewType = 'front';

document.addEventListener('DOMContentLoaded', () => {
  setupDropZone();
  setupViewTagButtons();
  setupFormSubmit();
});

function setupViewTagButtons() {
  const buttons = document.querySelectorAll('.view-tag-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentViewType = btn.getAttribute('data-view') || 'front';
    });
  });
}

function setupDropZone() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  });
}

function handleFiles(files) {
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB limit
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  Array.from(files).forEach(file => {
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
      uploadedImages.push({
        file: file,
        filename: file.name,
        mimeType: file.type,
        viewType: currentViewType,
        dataBase64: event.target.result
      });
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
}

function renderPreviews() {
  const grid = document.getElementById('preview-grid');
  const submitBtn = document.getElementById('submit-scan-btn');
  if (!grid) return;

  grid.innerHTML = '';

  uploadedImages.forEach((img, idx) => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    card.innerHTML = `
      <img src="${img.dataBase64}" alt="${img.filename}">
      <div class="preview-info">
        <div>
          <strong style="text-transform: capitalize; color: #60a5fa;">${img.viewType} View</strong>
          <div style="color: #6b7280; font-size: 0.7rem;">${(img.file.size / 1024).toFixed(0)} KB</div>
        </div>
        <button type="button" class="remove-btn" onclick="removeImage(${idx})" title="Remove">✕</button>
      </div>
    `;
    grid.appendChild(card);
  });

  if (submitBtn) {
    submitBtn.disabled = (uploadedImages.length === 0);
  }
}

window.removeImage = function(index) {
  uploadedImages.splice(index, 1);
  renderPreviews();
};

function setupFormSubmit() {
  const form = document.getElementById('scan-upload-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (uploadedImages.length === 0) {
      showToast('Please select at least one product photograph.', 'error');
      return;
    }

    const productName = document.getElementById('product-name-input').value.trim() || 'Packaged Commodity';
    const category = document.getElementById('category-select').value || 'packaged_food';

    // Show Scanning Overlay & Interactive Stage Tracker
    showScanningOverlay();

    const payload = {
      product_name: productName,
      category: category,
      images: uploadedImages.map(img => ({
        view_type: img.viewType,
        filename: img.filename,
        mime_type: img.mimeType,
        data: img.dataBase64
      }))
    };

    try {
      // Simulate/trigger visual progress steps
      simulateStep(1, 'Uploading high-resolution product photographs...');
      await delay(600);
      
      simulateStep(2, 'Validating image formats and binary signatures...');
      await delay(600);

      simulateStep(3, 'Extracting printed text via OCR...');
      
      // Send real API request to C backend
      const res = await API.createScan(payload);

      simulateStep(4, 'AI structured extraction & declaration parsing...');
      await delay(400);

      simulateStep(5, 'Matching Indian Legal Metrology (PCR 2011) checklist...');
      await delay(400);

      simulateStep(6, 'Evaluating rule compliance & compiling PDF...');
      await delay(500);

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
      showToast('Server connection failed. Is the C backend running?', 'error');
    }
  });
}

function showScanningOverlay() {
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

