/**
 * Billvex - Core Calculation Engine
 * Pure, testable functions for billing calculations and Indian numbering currency words.
 */

(function (global) {
  'use strict';

  /**
   * Safely converts any input into a valid float number.
   * @param {any} val
   * @returns {number}
   */
  function toNum(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const cleanStr = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleanStr);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Safely rounds a number to 2 decimal places to avoid IEEE-754 floating point drift.
   * @param {number} num
   * @returns {number}
   */
  function round2(num) {
    return Math.round((toNum(num) + Number.EPSILON) * 100) / 100;
  }

  /**
   * Formats a number to 2 fixed decimal places string.
   * @param {number} num
   * @returns {string}
   */
  function format2(num) {
    return round2(num).toFixed(2);
  }

  /**
   * Formats an amount using Indian currency notation (e.g., 1,23,456.78).
   * @param {number} num
   * @returns {string}
   */
  function formatCurrency(num) {
    const val = round2(num);
    const parts = val.toFixed(2).split('.');
    let intPart = parts[0];
    const decPart = parts[1];

    const isNegative = intPart.startsWith('-');
    if (isNegative) intPart = intPart.substring(1);

    let lastThree = intPart.substring(intPart.length - 3);
    const otherNumbers = intPart.substring(0, intPart.length - 3);
    if (otherNumbers !== '') {
      lastThree = ',' + lastThree;
    }
    const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

    return (isNegative ? '-' : '') + formattedInt + '.' + decPart;
  }

  /**
   * Calculates a line item total.
   * @param {number|string} qty
   * @param {number|string} rate
   * @returns {number}
   */
  function calculateLineTotal(qty, rate) {
    const q = toNum(qty);
    const r = toNum(rate);
    return round2(q * r);
  }

  /**
   * Calculates complete invoice totals given an array of items and tax configurations.
   * @param {Array<{qty: number|string, rate: number|string}>} items
   * @param {string} taxMode - 'cgst' or 'igst'
   * @param {number|string} taxPercent
   * @returns {Object} Calculated totals summary
   */
  function calculateTotals(items, taxMode, taxPercent) {
    const mode = (taxMode || 'cgst').toLowerCase();
    const ratePct = Math.max(0, toNum(taxPercent));

    let totalQty = 0;
    let subtotal = 0;

    const computedItems = (items || []).map((item, idx) => {
      const q = toNum(item.qty);
      const r = toNum(item.rate);
      const lineTotal = calculateLineTotal(q, r);
      totalQty += q;
      subtotal += lineTotal;
      return {
        ...item,
        sno: idx + 1,
        qty: q,
        rate: r,
        total: lineTotal,
      };
    });

    subtotal = round2(subtotal);

    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (mode === 'cgst') {
      cgstPercent = round2(ratePct / 2);
      sgstPercent = round2(ratePct / 2);
      cgstAmount = round2((subtotal * cgstPercent) / 100);
      sgstAmount = round2((subtotal * sgstPercent) / 100);
    } else {
      igstPercent = round2(ratePct);
      igstAmount = round2((subtotal * igstPercent) / 100);
    }

    const grandTotal = round2(subtotal + cgstAmount + sgstAmount + igstAmount);

    return {
      items: computedItems,
      totalQty: round2(totalQty),
      subtotal: subtotal,
      taxMode: mode,
      taxPercent: ratePct,
      cgstPercent: cgstPercent,
      sgstPercent: sgstPercent,
      igstPercent: igstPercent,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,
      totalTax: round2(cgstAmount + sgstAmount + igstAmount),
      grandTotal: grandTotal,
    };
  }

  /**
   * Converts a numeric amount into words formatted in the Indian numbering system.
   * Handles Crores, Lakhs, Thousands, Hundreds, and Paise.
   * @param {number|string} amount
   * @returns {string} Words representation
   */
  function numberToIndianWords(amount) {
    const val = toNum(amount);
    if (val === 0) return 'Zero Rupees Only';

    const absVal = Math.abs(val);
    const whole = Math.floor(absVal);
    const paise = Math.round((absVal - whole) * 100);

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    function convertTwoDigits(n) {
      if (n < 20) return ones[n];
      const ten = tens[Math.floor(n / 10)];
      const one = ones[n % 10];
      return (ten + (one ? ' ' + one : '')).trim();
    }

    function convertThreeDigits(n) {
      if (n < 100) return convertTwoDigits(n);
      const hundred = ones[Math.floor(n / 100)] + ' Hundred';
      const rem = n % 100;
      return (hundred + (rem ? ' and ' + convertTwoDigits(rem) : '')).trim();
    }

    let words = '';
    let rem = whole;

    const crore = Math.floor(rem / 10000000);
    rem %= 10000000;

    const lakh = Math.floor(rem / 100000);
    rem %= 100000;

    const thousand = Math.floor(rem / 1000);
    rem %= 1000;

    const hundred = Math.floor(rem / 100);
    const lastTwo = rem % 100;

    if (crore > 0) {
      words += convertThreeDigits(crore) + ' Crore ';
    }
    if (lakh > 0) {
      words += convertTwoDigits(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      words += convertTwoDigits(thousand) + ' Thousand ';
    }
    if (hundred > 0) {
      words += ones[hundred] + ' Hundred ';
    }
    if (lastTwo > 0) {
      words += convertTwoDigits(lastTwo) + ' ';
    }

    words = words.trim();
    if (!words) words = 'Zero';

    let result = (val < 0 ? 'Minus ' : '') + words + ' Rupees';

    if (paise > 0) {
      result += ' and ' + convertTwoDigits(paise) + ' Paise';
    }

    return (result + ' Only').replace(/\s+/g, ' ');
  }

  // Export for browser global and CommonJS test environments
  const Calculations = {
    toNum: toNum,
    round2: round2,
    format2: format2,
    formatCurrency: formatCurrency,
    calculateLineTotal: calculateLineTotal,
    calculateTotals: calculateTotals,
    numberToIndianWords: numberToIndianWords,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculations;
  } else {
    global.Calculations = Calculations;
  }
})(typeof window !== 'undefined' ? window : this);
