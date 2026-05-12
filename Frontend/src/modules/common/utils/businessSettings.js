/**
 * Business Settings Utility
 * Handles loading and updating business settings (favicon, title, logo)
 */

import apiClient from "@/services/api/axios";
import { API_ENDPOINTS } from "@/services/api/config";
import { searchAPI } from "@/services/api";

const SETTINGS_KEY = 'global_business_settings';

// Initialize from localStorage immediately so it's available for components on mount
let cachedSettings = (() => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
})();

/**
 * Update theme color in document root
 */
export const updateThemeColor = (color) => {
  if (!color || typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--primary-theme', color);
  document.documentElement.style.setProperty('--sidebar-theme', color);
};

// Apply cached settings immediately on module load if they exist
if (cachedSettings) {
  setTimeout(() => {
    updateFavicon(cachedSettings.favicon?.url);
    updateTitle(cachedSettings.companyName);
    updateThemeColor(cachedSettings.themeColor);
  }, 0);
}

let inFlightSettingsPromise = null;

/**
 * Load business settings from backend (public endpoint - no auth required)
 */
export const loadBusinessSettings = async () => {
  try {
    const endpoint = API_ENDPOINTS.ADMIN.BUSINESS_SETTINGS_PUBLIC;
    if (!endpoint || (typeof endpoint === "string" && !endpoint.trim())) {
      return cachedSettings;
    }

    if (inFlightSettingsPromise) {
      return await inFlightSettingsPromise;
    }

    inFlightSettingsPromise = (async () => {
      // Use the generic searchAPI or a dedicated public getter if available
      const response = await apiClient.get(endpoint, { noCache: true });
      const settings = response?.data?.data || response?.data;

      if (settings) {
        cachedSettings = settings;
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {}
        
        updateFavicon(settings.favicon?.url);
        updateTitle(settings.companyName);
        updateThemeColor(settings.themeColor);
        return settings;
      }
      return cachedSettings;
    })();

    return await inFlightSettingsPromise;
  } catch (error) {
    return cachedSettings;
  } finally {
    inFlightSettingsPromise = null;
  }
};

/**
 * Update favicon in document
 */
export const updateFavicon = (url) => {
  if (!url || typeof document === 'undefined') return;
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(el => el.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = "image/png";
  link.href = url;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
};

/**
 * Update page title
 */
export const updateTitle = (companyName) => {
  if (companyName && typeof document !== 'undefined') {
    document.title = companyName;
  }
};

/**
 * Set cached settings manually (useful after update)
 */
export const setCachedSettings = (settings) => {
  if (settings) {
    cachedSettings = settings;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {}
    
    updateFavicon(settings.favicon?.url);
    updateTitle(settings.companyName);
    updateThemeColor(settings.themeColor);
    
    // Dispatch event so all components listening can update immediately
    window.dispatchEvent(new CustomEvent('businessSettingsUpdated', { detail: settings }));
  }
};

/**
 * Clear cached settings (call after updating settings)
 */
export const clearCache = () => {
  cachedSettings = null;
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (e) {}
};

/**
 * Get cached settings
 */
export const getCachedSettings = () => {
  return cachedSettings;
};

/**
 * Get app specific logo with fallback to common logo
 */
export const getAppLogo = (appType) => {
  const settings = getCachedSettings();
  if (!settings) return null;
  
  switch(appType) {
    case 'admin': return settings.adminLogo?.url || settings.logo?.url;
    case 'user': return settings.userLogo?.url || settings.logo?.url;
    case 'delivery': return settings.deliveryLogo?.url || settings.logo?.url;
    case 'restaurant': return settings.restaurantLogo?.url || settings.logo?.url;
    case 'seller': return settings.sellerLogo?.url || settings.logo?.url;
    default: return settings.logo?.url;
  }
};

/**
 * Get app specific favicon with fallback to common favicon
 */
export const getAppFavicon = (appType) => {
  const settings = getCachedSettings();
  if (!settings) return null;
  
  switch(appType) {
    case 'admin': return settings.adminFavicon?.url || settings.favicon?.url;
    case 'user': return settings.userFavicon?.url || settings.favicon?.url;
    case 'delivery': return settings.deliveryFavicon?.url || settings.favicon?.url;
    case 'restaurant': return settings.restaurantFavicon?.url || settings.favicon?.url;
    case 'seller': return settings.sellerFavicon?.url || settings.favicon?.url;
    default: return settings.favicon?.url;
  }
};

/**
 * Update browser favicon
 */
export const updateBrowserFavicon = (url) => {
  if (!url) return;
  const link = document.querySelector("link[rel~='icon']");
  if (link) {
    link.href = url;
  } else {
    const newLink = document.createElement("link");
    newLink.rel = "icon";
    newLink.href = url;
    document.head.appendChild(newLink);
  }
};

/**
 * Get company name from business settings with fallback
 */
export const getCompanyName = () => {
  const settings = getCachedSettings();
  return settings?.companyName || "Appzeto";
};

/**
 * Get company name asynchronously (loads if not cached)
 */
export const getCompanyNameAsync = async () => {
  try {
    const settings = await loadBusinessSettings();
    return settings?.companyName || "Appzeto";
  } catch (error) {
    return "Appzeto";
  }
};
