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

const SVG_ICONS = {
  desktop: `<svg class="toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>`,
  mobile: `<svg class="toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
  sun: `<svg class="toggle-svg sun-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg>`,
  moon: `<svg class="toggle-svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
};

/**
 * Switch Theme: Dark (Default) vs Light Mode
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
    themeIcon.innerHTML = isLight ? SVG_ICONS.sun : SVG_ICONS.moon;
    themeLabel.textContent = isLight ? 'Light' : 'Dark';
    if (singleThemeBtn) {
      singleThemeBtn.title = isLight ? 'Light Mode (Click for Dark)' : 'Dark Mode (Click for Light)';
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
  showToast(next === 'light' ? 'Light Mode activated' : 'Dark Mode activated', 'info');
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
    devIcon.innerHTML = isMobile ? SVG_ICONS.mobile : SVG_ICONS.desktop;
    devLabel.textContent = isMobile ? 'Mobile' : 'Desktop';
    if (singleDevBtn) {
      singleDevBtn.title = isMobile ? 'Mobile View (Click for Desktop)' : 'Desktop View (Click for Mobile)';
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
  showToast(next === 'mobile' ? 'Mobile View activated' : 'Desktop View restored', 'info');
}

/**
 * ============================================================================
 * Session Navigation Breadcrumbs & Global Upper-Left Back Option
 * ============================================================================
 */
function recordPageVisit() {
  try {
    const stackKey = 'legalcheck_nav_stack';
    let stack = JSON.parse(sessionStorage.getItem(stackKey) || '[]');
    const currentUrl = window.location.href;
    // Avoid duplicate push on refresh
    if (stack.length === 0 || stack[stack.length - 1] !== currentUrl) {
      stack.push(currentUrl);
      if (stack.length > 30) stack.shift();
      sessionStorage.setItem(stackKey, JSON.stringify(stack));
    }
  } catch (e) {
    console.warn('Could not record page visit in session', e);
  }
}

window.handleGlobalBack = function() {
  // 1. If currently on upload page and in multi-step wizard step > 1, step backwards
  if (typeof window.currentStep !== 'undefined' && window.currentStep > 1) {
    if (typeof window.goToStep === 'function') {
      window.goToStep(window.currentStep - 1);
      return;
    }
  }

  const pathname = window.location.pathname;
  const isHome = pathname === '/' || 
                 pathname.endsWith('/index.html') || 
                 pathname.endsWith('/index') || 
                 pathname === '';

  // 2. Pop navigation breadcrumb from session storage
  let stack = [];
  try {
    stack = JSON.parse(sessionStorage.getItem('legalcheck_nav_stack') || '[]');
  } catch (e) {}

  // Pop current page if it is top of stack
  if (stack.length > 0 && stack[stack.length - 1] === window.location.href) {
    stack.pop();
  }

  // Navigate to previous page in session breadcrumb if available
  if (stack.length > 0) {
    const prevUrl = stack.pop();
    sessionStorage.setItem('legalcheck_nav_stack', JSON.stringify(stack));
    window.location.href = prevUrl;
    return;
  }

  // 3. Fallback to browser history back if on same site
  if (window.history.length > 1 && !isHome) {
    window.history.back();
    // Safety check: If still on same page after timeout (external history), go to index.html
    setTimeout(() => {
      if (window.location.pathname === pathname) {
        window.location.href = 'index.html';
      }
    }, 350);
    return;
  }

  // 4. If all back is completed or on home, arrive safely at homepage
  if (!isHome) {
    window.location.href = 'index.html';
  } else {
    if (typeof showToast === 'function') {
      showToast('You are at the Home page', 'info');
    }
  }
};

// Restore saved settings on initial load and track visit
document.addEventListener('DOMContentLoaded', () => {
  recordPageVisit();

  const savedTheme = localStorage.getItem('legalcheck_theme') || 'dark';
  setThemeMode(savedTheme);

  const savedDevice = localStorage.getItem('legalcheck_device') || 'desktop';
  if (savedDevice === 'mobile') {
    setDeviceMode('mobile');
  } else {
    setDeviceMode('desktop');
  }
});


