/**
 * Billvex - PDF & Print Generation Module
 * Generates high-fidelity, crisp A4 PDF exports and handles native printing.
 */

(function (global) {
  'use strict';

  /**
   * Waits for all images inside an element to be fully loaded before rendering.
   * @param {HTMLElement} container
   * @param {number} timeoutMs
   * @returns {Promise<void>}
   */
  function waitForImages(container, timeoutMs = 2500) {
    if (!container) return Promise.resolve();
    const imgs = Array.from(container.querySelectorAll('img'));
    if (imgs.length === 0) return Promise.resolve();

    const promises = imgs.map(img => {
      if (img.complete && img.naturalWidth !== 0) return Promise.resolve();
      return new Promise(resolve => {
        const done = () => resolve();
        img.addEventListener('load', done, { once: true });
        img.addEventListener('error', done, { once: true });
        setTimeout(done, timeoutMs);
      });
    });

    return Promise.all(promises);
  }

  /**
   * Generates and downloads an A4 PDF of the target invoice element.
   * @param {HTMLElement} element - The invoice preview element
   * @param {Object} options - Export options (filename, onStart, onFinish, onError)
   */
  async function generatePdf(element, options = {}) {
    if (!element) {
      throw new Error('Invoice preview element not found.');
    }

    const onStart = options.onStart || (() => {});
    const onFinish = options.onFinish || (() => {});
    const filename = options.filename || 'Invoice.pdf';

    onStart();

    try {
      if (!window.html2canvas || !window.jspdf) {
        throw new Error('PDF export libraries are still loading. Please check your network connection.');
      }

      // Ensure all images are loaded
      await waitForImages(element);

      // Temporary class to prepare element for clean capture if needed
      element.classList.add('is-exporting-pdf');

      // High-res canvas capture (scale 2.5 gives sharp typography without excessive memory)
      const canvas = await window.html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 1024,
      });

      element.classList.remove('is-exporting-pdf');

      const imgData = canvas.toDataURL('image/png');
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Convert canvas pixels to mm (standard 96 DPI baseline)
      const dpi = 96;
      const imgWidthMM = (canvas.width / 2.5) * 25.4 / dpi;
      const imgHeightMM = (canvas.height / 2.5) * 25.4 / dpi;

      const margin = 8; // mm margin
      const usablePageWidth = pageWidth - (margin * 2);
      const usablePageHeight = pageHeight - (margin * 2);
      const imgHeightInPdf = (canvas.height * usablePageWidth) / canvas.width;

      if (imgHeightInPdf <= usablePageHeight + 2) {
        // Fits cleanly on a single A4 page
        const x = margin;
        const y = margin;
        pdf.addImage(imgData, 'PNG', x, y, usablePageWidth, imgHeightInPdf, undefined, 'FAST');
      } else {
        // Multi-page PDF pagination for lengthy itemized invoices
        let heightLeft = imgHeightInPdf;
        let position = 0;

        pdf.addImage(imgData, 'PNG', margin, margin + position, usablePageWidth, imgHeightInPdf, undefined, 'FAST');
        heightLeft -= usablePageHeight;

        while (heightLeft > 0) {
          position = -(imgHeightInPdf - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, margin + position, usablePageWidth, imgHeightInPdf, undefined, 'FAST');
          heightLeft -= usablePageHeight;
        }
      }

      pdf.save(filename);

      onFinish({ success: true, filename: filename });
      return { success: true, filename: filename };
    } catch (err) {
      if (element) {
        element.classList.remove('is-exporting-pdf');
      }
      onFinish({ success: false, error: err });
      throw err;
    }
  }

  /**
   * Triggers the native browser print dialog with print stylesheet.
   */
  function printInvoice() {
    window.print();
  }

  const PDFExporter = {
    waitForImages: waitForImages,
    generatePdf: generatePdf,
    printInvoice: printInvoice,
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = PDFExporter;
  } else {
    global.PDFExporter = PDFExporter;
  }
})(typeof window !== 'undefined' ? window : this);

