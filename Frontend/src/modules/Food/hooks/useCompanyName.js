import { useState, useEffect } from 'react';
import { loadBusinessSettings, getCachedSettings, getCompanyName } from '@common/utils/businessSettings';

/**
 * Custom hook to get company name from business settings
 * @returns {string} Company name with fallback to "Appzeto Food"
 */
export const useCompanyName = () => {
  const [companyName, setCompanyName] = useState(() => {
    // Initialize with cached value if available
    const cached = getCachedSettings();
    return cached?.companyName || 'Appzeto';
  });

  useEffect(() => {
    const loadCompanyName = async () => {
      try {
        const settings = await loadBusinessSettings();
        if (settings?.companyName) {
          setCompanyName(settings.companyName);
        }
      } catch (error) {
        // Keep default value on error
        console.warn('Failed to load company name:', error);
      }
    };

    // Load if not cached
    const cached = getCachedSettings();
    if (!cached?.companyName) {
      loadCompanyName();
    } else {
      setCompanyName(cached.companyName);
    }

    // Listen for business settings updates
    const handleSettingsUpdate = () => {
      const updated = getCachedSettings();
      if (updated?.companyName) {
        setCompanyName(updated.companyName);
      }
    };

    window.addEventListener('businessSettingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('businessSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  return companyName;
};
