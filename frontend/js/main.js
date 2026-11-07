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

/**
 * Switch Theme: Dark (Default) vs Regular (Light Mode)
 */
function setThemeMode(mode) {
  const isLight = (mode === 'light');
  if (isLight) {
    document.body.classList.add('theme-light');
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('legalcheck_theme', 'light');
  } else {
    document.body.classList.remove('theme-light');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('legalcheck_theme', 'dark');
  }

  // Update Single Theme Toggle button (Icon + Label)
  const themeIcon = document.getElementById('themeToggleIcon');
  const themeLabel = document.getElementById('themeToggleLabel');
  const singleThemeBtn = document.getElementById('singleThemeToggle');
  if (themeIcon && themeLabel) {
    themeIcon.textContent = isLight ? '☀️' : '🌙';
    themeLabel.textContent = isLight ? 'Regular' : 'Dark';
    if (singleThemeBtn) {
      singleThemeBtn.title = isLight ? 'Currently in Regular (Light) Mode. Click to switch to Dark Mode.' : 'Currently in Dark Mode. Click to switch to Regular (Light) Mode.';
    }
  }

  // Backwards compatibility for segmented buttons
  const btnDark = document.getElementById('btnThemeDark');
  const btnLight = document.getElementById('btnThemeLight');
  if (btnDark && btnLight) {
    btnDark.classList.toggle('active', !isLight);
    btnLight.classList.toggle('active', isLight);
  }
}

function toggleThemeMode() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = (current === 'dark') ? 'light' : 'dark';
  setThemeMode(next);
  showToast(next === 'light' ? '☀️ Regular Light Mode activated' : '🌙 Dark Mode activated', 'info');
}

/**
 * Switch View: Desktop vs Smartphone Simulation Mode
 */
function setDeviceMode(mode) {
  const isMobile = (mode === 'mobile');
  if (isMobile) {
    document.body.classList.add('device-mobile-mode');
    localStorage.setItem('legalcheck_device', 'mobile');
  } else {
    document.body.classList.remove('device-mobile-mode');
    localStorage.setItem('legalcheck_device', 'desktop');
  }

  // Update Single Device Toggle button (Icon + Label)
  const devIcon = document.getElementById('deviceToggleIcon');
  const devLabel = document.getElementById('deviceToggleLabel');
  const singleDevBtn = document.getElementById('singleDeviceToggle');
  if (devIcon && devLabel) {
    devIcon.textContent = isMobile ? '📱' : '🖥️';
    devLabel.textContent = isMobile ? 'Smartphone' : 'Desktop';
    if (singleDevBtn) {
      singleDevBtn.title = isMobile ? 'Currently in Smartphone Mode. Click to switch to Desktop.' : 'Currently in Desktop Mode. Click to switch to Smartphone.';
    }
  }

  // Backwards compatibility for segmented buttons
  const btnDesktop = document.getElementById('btnModeDesktop');
  const btnMobile = document.getElementById('btnModeMobile');
  if (btnDesktop && btnMobile) {
    btnDesktop.classList.toggle('active', !isMobile);
    btnMobile.classList.toggle('active', isMobile);
  }
}

function toggleDeviceMode() {
  const isMobile = document.body.classList.contains('device-mobile-mode');
  const next = isMobile ? 'desktop' : 'mobile';
  setDeviceMode(next);
  showToast(next === 'mobile' ? '📱 Smartphone Simulation View activated (430px)' : '🖥️ Desktop View restored', 'info');
}

// Restore saved settings on initial load
document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('legalcheck_theme') || 'dark';
  setThemeMode(savedTheme);

  const savedDevice = localStorage.getItem('legalcheck_device') || 'desktop';
  if (savedDevice === 'mobile') {
    setDeviceMode('mobile');
  } else {
    setDeviceMode('desktop');
  }
});


