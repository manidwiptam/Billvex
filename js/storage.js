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

  const PROFILES_COLLECTION_KEY = 'billvex_profiles_collection_v2';
  const ACTIVE_PROFILE_ID_KEY = 'billvex_active_profile_id_v2';

  /**
   * Reads all saved business profiles.
   * @returns {Array<Object>}
   */
  function getAllProfiles() {
    try {
      const raw = localStorage.getItem(PROFILES_COLLECTION_KEY);
      if (!raw) return [];
      const list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  /**
   * Retrieves a single profile by its unique ID.
   * @param {string} id
   * @returns {Object|null}
   */
  function getProfileById(id) {
    if (!id) return null;
    const all = getAllProfiles();
    return all.find(p => p.id === id) || null;
  }

  /**
   * Saves or updates a business profile.
   * @param {string} name - Profile display name (e.g. "Apex Technologies")
   * @param {Object} data - Company data fields
   * @param {string|null} id - Existing profile ID if updating
   * @returns {Object|null} The saved profile object
   */
  function saveProfile(name, data, id = null) {
    try {
      const all = getAllProfiles();
      const profileId = id || ('prof_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5));
      const existingIdx = all.findIndex(p => p.id === profileId);

      const profileObj = {
        id: profileId,
        name: (name || data.companyName || 'Business Profile').trim(),
        updatedAt: new Date().toISOString(),
        data: data
      };

      if (existingIdx >= 0) {
        profileObj.createdAt = all[existingIdx].createdAt || profileObj.updatedAt;
        all[existingIdx] = profileObj;
      } else {
        profileObj.createdAt = profileObj.updatedAt;
        all.unshift(profileObj);
      }

      localStorage.setItem(PROFILES_COLLECTION_KEY, JSON.stringify(all));
      localStorage.setItem(ACTIVE_PROFILE_ID_KEY, profileId);
      return profileObj;
    } catch (e) {
      return null;
    }
  }

  /**
   * Deletes a business profile by ID.
   * @param {string} id
   * @returns {boolean}
   */
  function deleteProfile(id) {
    try {
      let all = getAllProfiles();
      all = all.filter(p => p.id !== id);
      localStorage.setItem(PROFILES_COLLECTION_KEY, JSON.stringify(all));
      
      const activeId = getActiveProfileId();
      if (activeId === id) {
        if (all.length > 0) {
          localStorage.setItem(ACTIVE_PROFILE_ID_KEY, all[0].id);
        } else {
          localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Retrieves the ID of the currently active business profile.
   * @returns {string|null}
   */
  function getActiveProfileId() {
    try {
      return localStorage.getItem(ACTIVE_PROFILE_ID_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Sets the active business profile ID.
   * @param {string} id
   * @returns {boolean}
   */
  function setActiveProfileId(id) {
    try {
      if (id) {
        localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Automatic legacy single-profile migration
  try {
    const legacy = localStorage.getItem('billvex_seller_profile_v1');
    if (legacy && getAllProfiles().length === 0) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed === 'object') {
        saveProfile(parsed.companyName || 'My Business', parsed);
      }
    }
  } catch (e) {}

  /**
   * Clears all local application storage.
   */
  function clearAllData() {
    try {
      localStorage.removeItem(COUNTER_KEY);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(PREFS_KEY);
      localStorage.removeItem(PROFILES_COLLECTION_KEY);
      localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      localStorage.removeItem('billvex_seller_profile_v1');
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
    getAllProfiles: getAllProfiles,
    getProfileById: getProfileById,
    saveProfile: saveProfile,
    deleteProfile: deleteProfile,
    getActiveProfileId: getActiveProfileId,
    setActiveProfileId: setActiveProfileId,
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

