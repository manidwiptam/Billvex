/**
 * Billvex - Client-Side Validation Module
 * Accessible validation checks for user inputs, email formats, numeric values, and GSTIN hints.
 */

(function (global) {
  'use strict';

  const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /**
   * Validates if a string looks like a standard 15-character Indian GSTIN.
   * @param {string} gstin
   * @returns {boolean}
   */
  function isValidGstin(gstin) {
    if (!gstin) return false;
    return GSTIN_REGEX.test(gstin.trim());
  }

  /**
   * Validates if a string is a standard email address.
   * @param {string} email
   * @returns {boolean}
   */
  function isValidEmail(email) {
    if (!email) return false;
    return EMAIL_REGEX.test(email.trim());
  }

  /**
   * Validates the invoice state before export or saving.
   * @param {Object} invoiceData
   * @returns {{ isValid: boolean, errors: Array<{ field: string, message: string }>, warnings: Array<{ field: string, message: string }> }}
   */
  function validateInvoice(invoiceData) {
    const errors = [];
    const warnings = [];

    if (!invoiceData) {
      errors.push({ field: 'general', message: 'No invoice data provided.' });
      return { isValid: false, errors, warnings };
    }

    // Check items
    const items = invoiceData.items || [];
    if (items.length === 0) {
      errors.push({ field: 'items', message: 'Please add at least one line item to the invoice.' });
    } else {
      let hasValidItem = false;
      items.forEach((item, index) => {
        const qty = parseFloat(item.qty);
        const rate = parseFloat(item.rate);
        const name = (item.name || '').trim();

        if (isNaN(qty) || qty < 0) {
          errors.push({ field: `item_qty_${index}`, message: `Item #${index + 1} has an invalid quantity.` });
        }
        if (isNaN(rate) || rate < 0) {
          errors.push({ field: `item_rate_${index}`, message: `Item #${index + 1} has an invalid rate.` });
        }
        if (name || (qty > 0 && rate > 0)) {
          hasValidItem = true;
        }
      });

      if (!hasValidItem) {
        errors.push({ field: 'items', message: 'At least one item must have a name, quantity, or rate.' });
      }
    }

    // Check Tax %
    const tax = parseFloat(invoiceData.taxPercent);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errors.push({ field: 'taxPercent', message: 'Tax percentage must be a number between 0% and 100%.' });
    }

    // Optional Email Validation
    if (invoiceData.companyEmail && invoiceData.companyEmail.trim() !== '') {
      if (!isValidEmail(invoiceData.companyEmail)) {
        warnings.push({ field: 'companyEmail', message: 'Company email format looks unconventional.' });
      }
    }

    // Optional GSTIN format hints (advisory, not blocking)
    if (invoiceData.companyGst && invoiceData.companyGst.trim() !== '') {
      if (!isValidGstin(invoiceData.companyGst)) {
        warnings.push({ field: 'companyGst', message: 'Company GSTIN does not match standard 15-character format.' });
      }
    }

    if (invoiceData.buyerGst && invoiceData.buyerGst.trim() !== '') {
      if (!isValidGstin(invoiceData.buyerGst)) {
        warnings.push({ field: 'buyerGst', message: 'Buyer GSTIN does not match standard 15-character format.' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
      warnings: warnings,
    };
  }

  const Validation = {
    isValidGstin: isValidGstin,
    isValidEmail: isValidEmail,
    validateInvoice: validateInvoice,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validation;
  } else {
    global.Validation = Validation;
  }
})(typeof window !== 'undefined' ? window : this);

