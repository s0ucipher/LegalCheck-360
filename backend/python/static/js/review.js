/**
 * ============================================================================
 * LegalCheck 360: Human Review & Auditor Override Engine (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

let currentScanId = null;
let currentFields = [];

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  currentScanId = params.get('id');

  if (!currentScanId) {
    showToast('No Scan ID provided for review.', 'error');
    return;
  }

  await loadReviewData(currentScanId);
  setupReviewForm();
});

async function loadReviewData(scanId) {
  try {
    const res = await API.getScan(scanId);
    if (!res.success || !res.data) {
      showToast('Scan not found.', 'error');
      return;
    }

    const scan = res.data;
    currentFields = scan.fields || [];

    document.getElementById('review-scan-id').textContent = scan.id;
    document.getElementById('review-product-name').textContent = scan.product_name;

    // Render Packaging Photos
    const imgContainer = document.getElementById('review-images-col');
    if (imgContainer) {
      imgContainer.innerHTML = '';
      (scan.images || []).forEach(img => {
        const div = document.createElement('div');
        div.style.marginBottom = '1.25rem';
        div.innerHTML = `
          <div style="font-weight: 600; font-size: 0.85rem; color: #60a5fa; text-transform: capitalize; margin-bottom: 4px;">
            ${img.view_type} View
          </div>
          <img src="${img.file_path}" alt="Package" style="width: 100%; border-radius: 8px; border: 1px solid #374151; max-height: 280px; object-fit: contain; background: #111827;">
        `;
        imgContainer.appendChild(div);
      });
    }

    // Render Editable Declaration Fields
    const fieldsContainer = document.getElementById('review-fields-col');
    if (fieldsContainer) {
      fieldsContainer.innerHTML = '';
      currentFields.forEach(f => {
        const group = document.createElement('div');
        group.className = 'form-group';
        group.style.background = '#1f2937';
        group.style.padding = '1rem';
        group.style.borderRadius = '8px';
        group.style.border = '1px solid #374151';

        group.innerHTML = `
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
            <label style="font-weight: 600; color: #f9fafb;">${formatFieldName(f.field_name)}</label>
            <span style="font-size: 0.75rem; color: #9ca3af;">Source: ${f.extraction_source} (${(f.confidence * 100).toFixed(0)}%)</span>
          </div>
          <input type="text" class="form-control field-override-input" data-id="${f.id}" value="${f.field_value || ''}" style="margin-bottom: 6px;">
          <div style="font-size: 0.75rem; color: #6b7280; font-style: italic;">Evidence: "${f.evidence_text || 'None'}"</div>
        `;
        fieldsContainer.appendChild(group);
      });
    }

  } catch (err) {
    console.error('Review load error:', err);
    showToast('Failed to load review data.', 'error');
  }
}

function setupReviewForm() {
  const form = document.getElementById('human-review-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const reviewerName = document.getElementById('reviewer-name-input').value.trim() || 'Senior Metrology Auditor';
    const decision = document.getElementById('reviewer-decision').value;
    const comments = document.getElementById('reviewer-comments').value.trim() || 'Manual verification completed.';

    // Gather field overrides
    const overrides = [];
    document.querySelectorAll('.field-override-input').forEach(input => {
      const fid = parseInt(input.getAttribute('data-id'), 10);
      const fval = input.value.trim();
      overrides.push({ field_id: fid, field_value: fval });
    });

    try {
      const res = await API.submitReview(currentScanId, {
        reviewer_name: reviewerName,
        decision: decision,
        comments: comments,
        field_overrides: overrides
      });

      if (res.success) {
        showToast('Inspector review decision recorded successfully.', 'success');
        setTimeout(() => {
          window.location.href = `results.html?id=${currentScanId}`;
        }, 800);
      } else {
        showToast(res.error || 'Failed to submit review.', 'error');
      }
    } catch (err) {
      showToast('Error recording reviewer decision.', 'error');
    }
  });
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

