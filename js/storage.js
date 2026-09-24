/**
 * Billvex - Local Storage & Persistence Module
 * 100% Client-side local storage management for invoice counters, preferences, and draft persistence.
 */

(function (global) {
  'use strict';

  const COUNTER_KEY = 'invoice_counter_v1';
  const DRAFT_KEY = 'billvex_draft_v2';
  const PREFS_KEY = 'billvex_prefs_v1';

  /**
   * Reads the current stored integer invoice counter.
   * @returns {number}
   */
  function readCounter() {
    try {
      const raw = localStorage.getItem(COUNTER_KEY);
      let n = raw ? parseInt(raw, 10) : 0;
      return isNaN(n) ? 0 : n;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Writes a new integer counter value to localStorage.
   * @param {number} newValue
   * @returns {boolean}
   */
  function writeCounter(newValue) {
    try {
      const num = parseInt(newValue, 10);
      localStorage.setItem(COUNTER_KEY, String(isNaN(num) ? 0 : num));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Calculates the next sequential invoice number.
   * @returns {number}
   */
  function nextAvailableNumber() {
    return readCounter() + 1;
  }

  /**
   * Parses an invoice number string like "INV-12", "INV 12", "12" into an integer.
   * @param {string} str
   * @returns {number|null}
   */
  function parseInvoiceNumber(str) {
    if (!str) return null;
    const s = String(str).trim();
    const match = s.match(/(\d+)\s*$/);
    if (match) {
      const n = parseInt(match[1], 10);
      return isNaN(n) ? null : n;
    }
    return null;
  }

  /**
   * Saves an in-progress invoice draft.
   * @param {Object} data
   * @returns {boolean}
   */
  function saveDraft(data) {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves the saved invoice draft if one exists.
   * @returns {Object|null}
   */
  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Clears the current saved draft.
   * @returns {boolean}
   */
  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Saves user UI preferences (e.g. brand color, custom terms template).
   * @param {Object} prefs
   */
  function savePreferences(prefs) {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Loads user UI preferences.
   * @returns {Object}
   */
  function loadPreferences() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  const SELLER_PROFILE_KEY = 'billvex_seller_profile_v1';

  /**
   * Saves the seller's reusable business profile.
   * @param {Object} profile
   * @returns {boolean}
   */
  function saveSellerProfile(profile) {
    try {
      localStorage.setItem(SELLER_PROFILE_KEY, JSON.stringify(profile));
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Loads the saved seller profile.
   * @returns {Object|null}
   */
  function loadSellerProfile() {
    try {
      const raw = localStorage.getItem(SELLER_PROFILE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Checks if a seller profile exists in local storage.
   * @returns {boolean}
   */
  function hasSellerProfile() {
    return Boolean(localStorage.getItem(SELLER_PROFILE_KEY));
  }

  /**
   * Clears the saved seller profile.
   * @returns {boolean}
   */
  function clearSellerProfile() {
    try {
      localStorage.removeItem(SELLER_PROFILE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Clears all local application storage.
   */
  function clearAllData() {
    try {
      localStorage.removeItem(COUNTER_KEY);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(PREFS_KEY);
      localStorage.removeItem(SELLER_PROFILE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  const Storage = {
    readCounter: readCounter,
    writeCounter: writeCounter,
    nextAvailableNumber: nextAvailableNumber,
    parseInvoiceNumber: parseInvoiceNumber,
    saveDraft: saveDraft,
    loadDraft: loadDraft,
    clearDraft: clearDraft,
    saveSellerProfile: saveSellerProfile,
    loadSellerProfile: loadSellerProfile,
    hasSellerProfile: hasSellerProfile,
    clearSellerProfile: clearSellerProfile,
    savePreferences: savePreferences,
    loadPreferences: loadPreferences,
    clearAllData: clearAllData,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
  } else {
    global.Storage = Storage;
  }
})(typeof window !== 'undefined' ? window : this);

