/**
 * ============================================================================
 * LegalCheck 360: Main App Utilities & Toast Notifications (Vanilla JS)
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 */

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  else if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span> <div>${message}</div>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
}

function formatStatusBadge(status) {
  if (status === 'PASS') {
    return `<span class="badge badge-pass">PASS</span>`;
  } else if (status === 'FAIL') {
    return `<span class="badge badge-fail">FAIL</span>`;
  } else if (status === 'REVIEW_REQUIRED' || status === 'UNCLEAR') {
    return `<span class="badge badge-unclear">UNCLEAR / REVIEW</span>`;
  } else {
    return `<span class="badge badge-neutral">${status || 'PENDING'}</span>`;
  }
}

