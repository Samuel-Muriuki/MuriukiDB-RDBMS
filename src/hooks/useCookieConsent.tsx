import { useState, useEffect, useCallback } from 'react';

export type ConsentPreferences = {
  necessary: boolean; // Always true - required for app to function
  analytics: boolean; // Sentry, performance monitoring
  functional: boolean; // Theme preferences, session data
};

const CONSENT_KEY = 'muriukidb-cookie-consent';
const CONSENT_VERSION = '1.0'; // Increment when privacy policy changes

interface StoredConsent {
  version: string;
  preferences: ConsentPreferences;
  timestamp: string;
}

const defaultPreferences: ConsentPreferences = {
  necessary: true,
  analytics: false,
  functional: true,
};

export function useCookieConsent() {
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);
  const [showBanner, setShowBanner] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    
    if (stored) {
      try {
        const parsed: StoredConsent = JSON.parse(stored);
        
        // Check if consent version matches (re-prompt if policy updated)
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences);
          setHasConsented(true);
          setShowBanner(false);
          return;
        }
      } catch {
        // Invalid stored data, show banner
      }
    }
    
    // No valid consent found - show banner
    setHasConsented(false);
    setShowBanner(true);
  }, []);

  const saveConsent = useCallback((newPreferences: ConsentPreferences) => {
    const consent: StoredConsent = {
      version: CONSENT_VERSION,
      preferences: { ...newPreferences, necessary: true }, // Necessary always true
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setPreferences(consent.preferences);
    setHasConsented(true);
    setShowBanner(false);

    // Dispatch event for other parts of the app to react
    window.dispatchEvent(new CustomEvent('consent-updated', { 
      detail: consent.preferences 
    }));
  }, []);

  const acceptAll = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: true,
      functional: true,
    });
  }, [saveConsent]);

  const acceptNecessary = useCallback(() => {
    saveConsent({
      necessary: true,
      analytics: false,
      functional: true,
    });
  }, [saveConsent]);

  const updatePreferences = useCallback((newPrefs: Partial<ConsentPreferences>) => {
    saveConsent({
      ...preferences,
      ...newPrefs,
      necessary: true, // Always required
    });
  }, [preferences, saveConsent]);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(CONSENT_KEY);
    setPreferences(defaultPreferences);
    setHasConsented(false);
    setShowBanner(true);
  }, []);

  return {
    hasConsented,
    preferences,
    showBanner,
    setShowBanner,
    acceptAll,
    acceptNecessary,
    updatePreferences,
    resetConsent,
  };
}
