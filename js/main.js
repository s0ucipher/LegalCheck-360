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

  // Update Mobile App Drawer Theme Switcher
  const drawerThemeIcon = document.getElementById('drawerThemeIcon');
  const drawerThemeLabel = document.getElementById('drawerThemeLabel');
  if (drawerThemeIcon && drawerThemeLabel) {
    drawerThemeIcon.textContent = isLight ? '🌙' : '☀️';
    drawerThemeLabel.textContent = isLight ? 'Dark Mode' : 'Light Mode';
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

  // Update Mobile App Drawer Device Switcher
  const drawerDevIcon = document.getElementById('drawerDeviceIcon');
  const drawerDevLabel = document.getElementById('drawerDeviceLabel');
  if (drawerDevIcon && drawerDevLabel) {
    drawerDevIcon.textContent = isMobile ? '🖥️' : '📱';
    drawerDevLabel.textContent = isMobile ? 'Desktop View' : 'Mobile View';
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
function isHomePage() {
  const p = window.location.pathname;
  return p === '/' || p.endsWith('/index.html') || p.endsWith('/index') || p === '';
}

function recordPageVisit() {
  try {
    if (isHomePage()) {
      // Clear navigation history stack when on Home page so Back button on other pages returns to Home
      sessionStorage.setItem('legalcheck_nav_stack', JSON.stringify([]));
      return;
    }
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
  // If currently on Home page, there is no back action
  if (isHomePage()) {
    return;
  }

  // 1. If currently on upload page and in multi-step wizard step > 1, step backwards
  if (typeof window.currentStep !== 'undefined' && window.currentStep > 1) {
    if (typeof window.goToStep === 'function') {
      window.goToStep(window.currentStep - 1);
      return;
    }
  }

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
  if (window.history.length > 1) {
    window.history.back();
    setTimeout(() => {
      if (!isHomePage()) {
        window.location.href = 'index.html';
      }
    }, 350);
    return;
  }

  // 4. Default safe destination
  window.location.href = 'index.html';
};

// Restore saved settings on initial load and track visit
document.addEventListener('DOMContentLoaded', () => {
  // Completely remove Back button on Home page without leaving spacing
  if (isHomePage()) {
    const homeBackBtn = document.getElementById('globalNavBackBtn');
    if (homeBackBtn) {
      homeBackBtn.remove();
    }
  }

  recordPageVisit();

  const savedTheme = localStorage.getItem('legalcheck_theme') || 'dark';
  setThemeMode(savedTheme);

  const savedDevice = localStorage.getItem('legalcheck_device') || 'desktop';
  if (savedDevice === 'mobile') {
    setDeviceMode('mobile');
  } else {
    setDeviceMode('desktop');
  }

  // Initialize Dedicated Smartphone Mode Navigation (Hamburger & Side Drawer)
  initMobileNavigation();
});

// ============================================================================
// Dedicated Mobile App Navigation Controller (Upper-Right Hamburger + Side Drawer)
// ============================================================================
function escapeNavText(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function initMobileNavigation() {
  // Clean up any legacy bottom bar elements if present
  const oldBottomNav = document.getElementById('mobileBottomNav');
  if (oldBottomNav) oldBottomNav.remove();

  // 1. Inject Hamburger button into .nav-container if missing (Upper-Right Corner)
  const navContainer = document.querySelector('.nav-container');
  if (navContainer && !document.getElementById('mobileMenuToggleBtn')) {
    const hamburgerBtn = document.createElement('button');
    hamburgerBtn.type = 'button';
    hamburgerBtn.id = 'mobileMenuToggleBtn';
    hamburgerBtn.className = 'mobile-menu-toggle';
    hamburgerBtn.setAttribute('aria-label', 'Open navigation menu');
    hamburgerBtn.setAttribute('title', 'Navigation Menu');
    hamburgerBtn.innerHTML = `
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
    `;
    hamburgerBtn.onclick = toggleMobileDrawer;
    navContainer.appendChild(hamburgerBtn);
  }

  // 2. Inject Mobile Side Navigation Drawer & Backdrop to body if missing
  if (!document.getElementById('mobileAppDrawer')) {
    const backdrop = document.createElement('div');
    backdrop.id = 'mobileDrawerBackdrop';
    backdrop.className = 'mobile-drawer-backdrop';
    backdrop.onclick = closeMobileDrawer;
    document.body.appendChild(backdrop);

    const drawer = document.createElement('aside');
    drawer.id = 'mobileAppDrawer';
    drawer.className = 'mobile-app-drawer';
    drawer.setAttribute('aria-label', 'Mobile Navigation Drawer');
    
    const isLight = document.documentElement.getAttribute('data-theme') === 'light' || document.body.classList.contains('theme-light');
    const isMobileMode = document.body.classList.contains('device-mobile-mode');

    drawer.innerHTML = `
      <div class="mobile-drawer-header">
        <div class="drawer-brand">
          <div class="drawer-brand-icon">⚖️</div>
          <div class="drawer-brand-text">LegalCheck <span>360</span></div>
        </div>
        <button type="button" class="drawer-close-btn" onclick="closeMobileDrawer()" aria-label="Close menu" title="Close menu">✕</button>
      </div>

      <!-- User / Guest Identity Profile Card -->
      <div class="drawer-user-card" id="drawerUserProfileCard">
        <div class="drawer-user-placeholder">
          <div class="drawer-guest-avatar">👤</div>
          <div class="drawer-user-details">
            <div class="drawer-user-title">Guest User</div>
            <div class="drawer-user-subtitle">Temporary inspection session</div>
          </div>
        </div>
        <div class="drawer-guest-actions">
          <a href="login.html" class="btn btn-outline btn-sm" onclick="closeMobileDrawer()">Sign In</a>
          <a href="register.html" class="btn btn-primary btn-sm" onclick="closeMobileDrawer()">Register</a>
        </div>
      </div>

      <!-- Quick Layout & Theme Switchers -->
      <div class="drawer-quick-controls">
        <button type="button" class="drawer-quick-btn" onclick="toggleDeviceMode()" title="Switch layout mode">
          <span class="drawer-quick-icon" id="drawerDeviceIcon">${isMobileMode ? '🖥️' : '📱'}</span>
          <span class="drawer-quick-label" id="drawerDeviceLabel">${isMobileMode ? 'Desktop View' : 'Mobile View'}</span>
        </button>
        <button type="button" class="drawer-quick-btn" onclick="toggleThemeMode()" title="Switch dark/light mode">
          <span class="drawer-quick-icon" id="drawerThemeIcon">${isLight ? '🌙' : '☀️'}</span>
          <span class="drawer-quick-label" id="drawerThemeLabel">${isLight ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <!-- Primary Application Navigation -->
      <nav class="drawer-nav">
        <div class="drawer-section-heading">MAIN NAVIGATION</div>
        <a href="index.html" class="drawer-nav-item" data-page="index" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">🏠</span>
          <span class="drawer-nav-label">Home</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="upload.html" class="drawer-nav-item drawer-highlight-item" data-page="upload" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">📸</span>
          <span class="drawer-nav-label">New Inspection</span>
          <span class="drawer-nav-pill">New</span>
        </a>
        <a href="history.html" class="drawer-nav-item" data-page="history" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">📋</span>
          <span class="drawer-nav-label">Inspection History</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="dashboard.html" class="drawer-nav-item" data-page="dashboard" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">📊</span>
          <span class="drawer-nav-label">Dashboard & Compliance</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="admin.html" class="drawer-nav-item" data-page="admin" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">⚖️</span>
          <span class="drawer-nav-label">Legal Rules (PCR 2011)</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="review.html" class="drawer-nav-item" data-page="review" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">👨‍⚖️</span>
          <span class="drawer-nav-label">Human Auditor Review</span>
          <span class="drawer-nav-chevron">›</span>
        </a>

        <div class="drawer-section-heading" style="margin-top: 1.25rem;">MY ACCOUNT & SETTINGS</div>
        <div id="drawerAuthLinks">
          <a href="login.html" class="drawer-nav-item" data-page="login" onclick="closeMobileDrawer()">
            <span class="drawer-nav-icon">🔑</span>
            <span class="drawer-nav-label">Sign In</span>
            <span class="drawer-nav-chevron">›</span>
          </a>
          <a href="register.html" class="drawer-nav-item" data-page="register" onclick="closeMobileDrawer()">
            <span class="drawer-nav-icon">✨</span>
            <span class="drawer-nav-label">Create Free Account</span>
            <span class="drawer-nav-chevron">›</span>
          </a>
        </div>
      </nav>

      <div class="drawer-footer">
        <div>LegalCheck 360 • "Smart Packaging. Smarter Compliance."</div>
        <div>Legal Metrology (Packaged Commodities) Rules, 2011</div>
      </div>
    `;
    document.body.appendChild(drawer);
  }

  // 3. Highlight active navigation page
  highlightActiveMobileNav();

  // 4. Connect with current user if LegalCheckAuth is already ready
  try {
    if (typeof LegalCheckAuth !== 'undefined') {
      const u = (typeof LegalCheckAuth.getCurrentUser === 'function') 
        ? LegalCheckAuth.getCurrentUser() 
        : (typeof LegalCheckAuth.getUser === 'function' ? LegalCheckAuth.getUser() : null);
      if (u) updateDrawerAuthUI(u);
    }
  } catch (e) {
    console.debug('Drawer user auth sync deferred:', e);
  }
}

function highlightActiveMobileNav() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  let currentPage = 'index';
  if (path.includes('dashboard')) currentPage = 'dashboard';
  else if (path.includes('upload')) currentPage = 'upload';
  else if (path.includes('history')) currentPage = 'history';
  else if (path.includes('admin')) currentPage = 'admin';
  else if (path.includes('review')) currentPage = 'review';
  else if (path.includes('results')) currentPage = 'upload';
  else if (path.includes('profile')) {
    currentPage = (hash.includes('setting')) ? 'settings' : 'profile';
  }
  else if (path.includes('login')) currentPage = 'login';
  else if (path.includes('register')) currentPage = 'register';
  else if (path === '/' || path.endsWith('/index.html') || path.endsWith('/index') || path === '') currentPage = 'index';

  document.querySelectorAll('.drawer-nav-item[data-page]').forEach(el => {
    const pageAttr = el.getAttribute('data-page');
    el.classList.toggle('active', pageAttr === currentPage);
  });
}

window.toggleMobileDrawer = function() {
  const drawer = document.getElementById('mobileAppDrawer');
  if (!drawer) return;
  if (drawer.classList.contains('open')) {
    closeMobileDrawer();
  } else {
    openMobileDrawer();
  }
};

window.openMobileDrawer = function() {
  const drawer = document.getElementById('mobileAppDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const hamburger = document.getElementById('mobileMenuToggleBtn');
  if (drawer && backdrop) {
    drawer.classList.add('open');
    backdrop.classList.add('open');
    if (hamburger) hamburger.classList.add('open');
    document.body.classList.add('drawer-open-lock');
  }
};

window.closeMobileDrawer = function() {
  const drawer = document.getElementById('mobileAppDrawer');
  const backdrop = document.getElementById('mobileDrawerBackdrop');
  const hamburger = document.getElementById('mobileMenuToggleBtn');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    if (hamburger) hamburger.classList.remove('open');
    document.body.classList.remove('drawer-open-lock');
  }
};

window.updateDrawerAuthUI = function(user) {
  const card = document.getElementById('drawerUserProfileCard');
  const links = document.getElementById('drawerAuthLinks');
  if (!card) return;

  if (user) {
    const initial = (user.displayName || user.email || 'U').substring(0, 2).toUpperCase();
    const displayName = user.displayName || user.email.split('@')[0];
    card.innerHTML = `
      <div class="drawer-user-info-active">
        <div class="drawer-user-avatar-badge">${initial}</div>
        <div class="drawer-user-text">
          <strong class="drawer-user-name">${escapeNavText(displayName)}</strong>
          <span class="drawer-user-email">${escapeNavText(user.email)}</span>
          <span class="drawer-user-status-pill">✓ Registered Account</span>
        </div>
      </div>
    `;

    if (links) {
      links.innerHTML = `
        <a href="profile.html" class="drawer-nav-item" data-page="profile" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">👤</span>
          <span class="drawer-nav-label">My Account</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="profile.html#settings" class="drawer-nav-item" data-page="settings" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">⚙️</span>
          <span class="drawer-nav-label">Settings</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <button type="button" class="drawer-nav-item drawer-nav-logout" onclick="closeMobileDrawer(); if(window.LegalCheckAuth) LegalCheckAuth.logout();">
          <span class="drawer-nav-icon">🚪</span>
          <span class="drawer-nav-label">Logout</span>
        </button>
      `;
    }
  } else {
    card.innerHTML = `
      <div class="drawer-user-placeholder">
        <div class="drawer-guest-avatar">👤</div>
        <div class="drawer-user-details">
          <div class="drawer-user-title">Guest User</div>
          <div class="drawer-user-subtitle">Temporary inspection session</div>
        </div>
      </div>
      <div class="drawer-guest-actions">
        <a href="login.html" class="btn btn-outline btn-sm" onclick="closeMobileDrawer()">Sign In</a>
        <a href="register.html" class="btn btn-primary btn-sm" onclick="closeMobileDrawer()">Register</a>
      </div>
    `;

    if (links) {
      links.innerHTML = `
        <a href="login.html" class="drawer-nav-item" data-page="login" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">🔑</span>
          <span class="drawer-nav-label">Sign In</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
        <a href="register.html" class="drawer-nav-item" data-page="register" onclick="closeMobileDrawer()">
          <span class="drawer-nav-icon">✨</span>
          <span class="drawer-nav-label">Create Free Account</span>
          <span class="drawer-nav-chevron">›</span>
        </a>
      `;
    }
  }

  // Re-run highlight so My Account / Settings / Login gets highlighted if on that page
  highlightActiveMobileNav();
};

// Close drawer on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMobileDrawer();
});


