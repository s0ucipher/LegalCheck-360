/**
 * ============================================================================
 * LegalCheck 360: Firebase Authentication Configuration
 * "Smart Packaging. Smarter Compliance."
 * ============================================================================
 * 
 * Instructions to connect your real Firebase project:
 * 1. Go to Firebase Console (https://console.firebase.google.com).
 * 2. Create or select your project.
 * 3. Enable Authentication -> Sign-in method -> Email/Password & Google.
 * 4. In Project Settings -> General -> Your apps -> Web app (</>), copy the firebaseConfig.
 * 5. Replace the placeholder values below, or configure via window.LEGALCHECK_FIREBASE_CONFIG.
 */

(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.FirebaseConfig = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // Default Firebase Web App Configuration
  // (Replace these placeholders with your live Firebase Project credentials)
  const defaultFirebaseConfig = {
    apiKey: "AIzaSyDemoLegalCheck360KeyPlaceholderForRealAuth",
    authDomain: "legalcheck-360.firebaseapp.com",
    projectId: "legalcheck-360",
    storageBucket: "legalcheck-360.appspot.com",
    messagingSenderId: "360000000000",
    appId: "1:360000000000:web:demo360legalcheckhash"
  };

  // Allow dynamic override from window or localStorage
  function getActiveConfig() {
    try {
      if (typeof window !== 'undefined' && window.LEGALCHECK_FIREBASE_CONFIG) {
        return window.LEGALCHECK_FIREBASE_CONFIG;
      }
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('legalcheck_firebase_config');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {}
    return defaultFirebaseConfig;
  }

  function isLiveFirebaseConfigured(config) {
    if (!config || !config.apiKey) return false;
    return !config.apiKey.includes('Placeholder') && !config.apiKey.includes('AIzaSyDemo');
  }

  return {
    getConfig: getActiveConfig,
    isConfigured: () => isLiveFirebaseConfigured(getActiveConfig()),
    saveCustomConfig: (cfg) => {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('legalcheck_firebase_config', JSON.stringify(cfg));
      }
    }
  };
});

