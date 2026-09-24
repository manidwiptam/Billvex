/**
 * Billvex - Main Application Controller
 * Manages editor form state, dynamic line items, live preview synchronization,
 * brand customization, modals, toasts, and PDF export workflows.
 */

(function () {
  'use strict';

  const HYDRANGEA_DEFAULT_COLOR = '#6366f1';

  // Application State
  const state = {
    companyName: '',
    companyAddress: '',
    companyEmail: '',
    companyPhone: '',
    companyGst: '',
    companyLogo: '',
    themeMode: 'hydrangea', // 'hydrangea' or 'custom'
    customColor: '#6366f1',
    primaryColor: '#6366f1',
    
    invoiceNo: '',
    invoiceDate: '',
    saleType: 'INTERSTATE SALE',
    
    buyerName: '',
    buyerAddress: '',
    buyerGst: '',
    stateCode: '',
    vehicleNo: '',
    contact: '',
    
    taxMode: 'cgst',
    taxPercent: 18,
    
    paymentType: 'Cash',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    
    termsText: '1. Goods once sold will not be taken back or exchanged.\n2. Payment terms: Due on receipt.',
    companySign: '',
    
    items: [],
  };

  // Helper: Format today's date as DD-MM-YYYY
  function getTodayDateString() {
    const d = new Date();
    const DD = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const YYYY = d.getFullYear();
    return `${DD}-${MM}-${YYYY}`;
  }

  // Toast System
  function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-hiding');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, duration);
  }

  // Modal Dialog System
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      const focusable = modal.querySelector('button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Initialize Default State
  function initDefaultState() {
    const counter = Storage.nextAvailableNumber();
    state.invoiceNo = `INV-${counter}`;
    state.invoiceDate = getTodayDateString();
    state.items = [
      { id: generateId(), name: '', hs: '', qty: '', rate: '' },
      { id: generateId(), name: '', hs: '', qty: '', rate: '' }
    ];
  }

  function generateId() {
    return 'item_' + Math.random().toString(36).substr(2, 9);
  }

  // Extract dominant accent color from image data URL using canvas pixel analysis
  function extractDominantColor(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) return resolve(null);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const size = 48;
          canvas.width = size;
          canvas.height = size;
          ctx.drawImage(img, 0, 0, size, size);
          const pixels = ctx.getImageData(0, 0, size, size).data;

          let bestColor = null;
          let maxScore = -1;

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            const a = pixels[i + 3];

            if (a < 128) continue; // skip transparent

            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const brightness = (r + g + b) / 3;
            const saturation = max === 0 ? 0 : (max - min) / max;

            // Discard pure whites, deep blacks, and washed out neutrals
            if (brightness > 238 || brightness < 22 || saturation < 0.28) continue;

            // Score favoring saturated, balanced hues
            const score = saturation * 200 + (128 - Math.abs(brightness - 128));
            if (score > maxScore) {
              maxScore = score;
              bestColor = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
            }
          }
          resolve(bestColor);
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  // Set brand accent color in DOM and state
  function setPrimaryColor(color) {
    state.primaryColor = color;
    document.documentElement.style.setProperty('--primary', color);
    
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) colorPicker.value = color;

    renderLivePreview();
  }

  // Apply theme mode ('hydrangea' or 'custom')
  function applyThemeMode(mode, customColor = null) {
    state.themeMode = mode;
    const customPickerWrap = document.getElementById('customColorPickerWrap');

    setCustomDropdownValue('themeDropdown', mode);

    if (mode === 'hydrangea') {
      if (customPickerWrap) customPickerWrap.style.display = 'none';
      setPrimaryColor(HYDRANGEA_DEFAULT_COLOR);
    } else {
      if (customPickerWrap) customPickerWrap.style.display = 'flex';
      const targetColor = customColor || state.customColor || HYDRANGEA_DEFAULT_COLOR;
      state.customColor = targetColor;
      setPrimaryColor(targetColor);
    }
  }

  // Bind Form Inputs to State
  function bindFormInputs() {
    const fields = [
      'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGst',
      'invoiceNo', 'invoiceDate', 'saleType',
      'buyerName', 'buyerAddress', 'buyerGst', 'stateCode', 'vehicleNo', 'contact',
      'taxPercent', 'bankName', 'bankAccount', 'bankIfsc', 'termsText', 'companySign'
    ];

    fields.forEach(fieldId => {
      const input = document.getElementById(fieldId);
      if (!input) return;

      input.addEventListener('input', (e) => {
        state[fieldId] = e.target.value;

        // Auto-sync companySign placeholder/default with companyName if not explicitly customized
        if (fieldId === 'companyName' && (!state.companySign || state.companySign === state.companyName)) {
          const signInput = document.getElementById('companySign');
          if (signInput && !signInput.dataset.userEdited) {
            signInput.value = state.companyName;
            state.companySign = state.companyName;
          }
        }

        // If user manually changed invoice number, update counter reference
        if (fieldId === 'invoiceNo') {
          const parsed = Storage.parseInvoiceNumber(e.target.value);
          if (parsed !== null && parsed > 0) {
            Storage.writeCounter(parsed - 1);
          }
        }

        renderLivePreview();
        debounceAutoSave();
      });
    });

    const signInput = document.getElementById('companySign');
    if (signInput) {
      signInput.addEventListener('input', () => {
        signInput.dataset.userEdited = 'true';
      });
    }

    // Tax Mode Radios
    const taxModeRadios = document.querySelectorAll('input[name="taxMode"]');
    taxModeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        state.taxMode = e.target.value;
        renderLivePreview();
        debounceAutoSave();
      });
    });

    // Payment Type Selector
    const paymentSelect = document.getElementById('paymentType');
    if (paymentSelect) {
      paymentSelect.addEventListener('change', (e) => {
        state.paymentType = e.target.value;
        updatePaymentFieldsVisibility();
        renderLivePreview();
        debounceAutoSave();
      });
    }

    // Logo Upload & Interactive Drag & Drop Box
    const logoDropBox = document.getElementById('logoDropBox');
    const logoInput = document.getElementById('logoInput');
    const removeLogoBtn = document.getElementById('removeLogoBtn');

    async function processLogoFile(file) {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Please select a valid image file (PNG, JPG, SVG, WebP).', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (ev) => {
        state.companyLogo = ev.target.result;
        updateLogoPreviewUI();

        // Extract dominant brand color from uploaded logo
        const extractedColor = await extractDominantColor(state.companyLogo);
        if (extractedColor) {
          state.customColor = extractedColor;
          if (state.themeMode === 'custom') {
            setPrimaryColor(extractedColor);
          }
          showToast('Logo uploaded & brand palette detected!', 'success');
        } else {
          showToast('Company logo updated.', 'success');
        }

        renderLivePreview();
        debounceAutoSave();
      };
      reader.readAsDataURL(file);
    }

    if (logoInput) {
      logoInput.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        processLogoFile(file);
      });
    }

    // Drag and drop listeners on logoDropBox
    if (logoDropBox) {
      ['dragenter', 'dragover'].forEach(eventName => {
        logoDropBox.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          logoDropBox.classList.add('is-dragover');
        });
      });

      ['dragleave', 'dragend'].forEach(eventName => {
        logoDropBox.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          logoDropBox.classList.remove('is-dragover');
        });
      });

      logoDropBox.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        logoDropBox.classList.remove('is-dragover');
        const dt = e.dataTransfer;
        const file = dt && dt.files && dt.files[0];
        processLogoFile(file);
      });

      // Click to open file chooser when prompt is visible
      logoDropBox.addEventListener('click', (e) => {
        if (!state.companyLogo || e.target.closest('#logoDropPrompt')) {
          if (logoInput) logoInput.click();
        }
      });

      logoDropBox.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !state.companyLogo) {
          e.preventDefault();
          if (logoInput) logoInput.click();
        }
      });
    }

    if (removeLogoBtn) {
      removeLogoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.companyLogo = '';
        if (logoInput) logoInput.value = '';
        updateLogoPreviewUI();
        renderLivePreview();
        debounceAutoSave();
        showToast('Logo removed.', 'info');
      });
    }

    // Setup Custom Glassmorphic Select Dropdowns
    function setupCustomDropdown(wrapperId, onSelect) {
      const wrapper = document.getElementById(wrapperId);
      if (!wrapper) return;

      const trigger = wrapper.querySelector('.custom-select-trigger');
      const menu = wrapper.querySelector('.custom-select-menu');
      const options = wrapper.querySelectorAll('.custom-select-option');
      const hiddenSelect = wrapper.querySelector('select');
      const parentCard = wrapper.closest('.editor-card');

      function closeMenu() {
        trigger.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
        menu.classList.remove('is-open');
        wrapper.classList.remove('is-open');
        if (parentCard) {
          parentCard.classList.remove('has-open-dropdown');
        }
      }

      function openMenu() {
        // Close other open dropdowns first
        document.querySelectorAll('.custom-select-trigger.is-open').forEach(t => {
          t.classList.remove('is-open');
          t.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.custom-select-menu.is-open').forEach(m => m.classList.remove('is-open'));
        document.querySelectorAll('.custom-select-wrapper.is-open').forEach(w => w.classList.remove('is-open'));
        document.querySelectorAll('.editor-card.has-open-dropdown').forEach(c => c.classList.remove('has-open-dropdown'));

        trigger.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        menu.classList.add('is-open');
        wrapper.classList.add('is-open');
        if (parentCard) {
          parentCard.classList.add('has-open-dropdown');
        }
      }

      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (menu.classList.contains('is-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      options.forEach(opt => {
        opt.addEventListener('click', (e) => {
          e.stopPropagation();
          const val = opt.dataset.value;
          const icon = opt.querySelector('.option-icon')?.textContent || '';
          const title = opt.querySelector('.option-title')?.textContent || '';

          // Update trigger display
          const iconSpan = trigger.querySelector('.select-option-icon');
          const textSpan = trigger.querySelector('.select-current-text');
          if (iconSpan) iconSpan.textContent = icon;
          if (textSpan) textSpan.textContent = title;

          // Update active option class
          options.forEach(o => {
            const isMatch = o.dataset.value === val;
            o.classList.toggle('is-selected', isMatch);
            o.setAttribute('aria-selected', isMatch ? 'true' : 'false');
          });

          // Sync hidden select
          if (hiddenSelect) {
            hiddenSelect.value = val;
          }

          closeMenu();
          if (onSelect) onSelect(val);
        });
      });

      // Keyboard navigation
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault();
          openMenu();
          const firstOpt = menu.querySelector('.custom-select-option');
          if (firstOpt) firstOpt.focus();
        }
      });

      menu.addEventListener('keydown', (e) => {
        const current = document.activeElement;
        if (e.key === 'Escape') {
          closeMenu();
          trigger.focus();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = current.nextElementSibling;
          if (next && next.classList.contains('custom-select-option')) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = current.previousElementSibling;
          if (prev && prev.classList.contains('custom-select-option')) prev.focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          current.click();
        }
      });
    }

    // Close all open dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.custom-select-wrapper')) {
        document.querySelectorAll('.custom-select-trigger.is-open').forEach(t => {
          t.classList.remove('is-open');
          t.setAttribute('aria-expanded', 'false');
        });
        document.querySelectorAll('.custom-select-menu.is-open').forEach(m => m.classList.remove('is-open'));
        document.querySelectorAll('.custom-select-wrapper.is-open').forEach(w => w.classList.remove('is-open'));
        document.querySelectorAll('.editor-card.has-open-dropdown').forEach(c => c.classList.remove('has-open-dropdown'));
      }
    });

    // Initialize Theme Mode Dropdown
    setupCustomDropdown('themeDropdown', (val) => {
      applyThemeMode(val);
      debounceAutoSave();
    });

    // Initialize Payment Mode Dropdown
    setupCustomDropdown('paymentDropdown', (val) => {
      state.paymentType = val;
      updatePaymentFieldsVisibility();
      renderLivePreview();
      debounceAutoSave();
    });

    // Custom Color Picker
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('input', (e) => {
        state.customColor = e.target.value;
        if (state.themeMode === 'custom') {
          setPrimaryColor(e.target.value);
        }
        debounceAutoSave();
      });
    }
  }

  // Helper to programmatically update a custom dropdown value and trigger display
  function setCustomDropdownValue(wrapperId, val) {
    const wrapper = document.getElementById(wrapperId);
    if (!wrapper) return;

    const trigger = wrapper.querySelector('.custom-select-trigger');
    const options = wrapper.querySelectorAll('.custom-select-option');
    const hiddenSelect = wrapper.querySelector('select');

    options.forEach(opt => {
      const isMatch = opt.dataset.value === val;
      opt.classList.toggle('is-selected', isMatch);
      opt.setAttribute('aria-selected', isMatch ? 'true' : 'false');

      if (isMatch && trigger) {
        const icon = opt.querySelector('.option-icon')?.textContent || '';
        const title = opt.querySelector('.option-title')?.textContent || '';
        const iconSpan = trigger.querySelector('.select-option-icon');
        const textSpan = trigger.querySelector('.select-current-text');
        if (iconSpan) iconSpan.textContent = icon;
        if (textSpan) textSpan.textContent = title;
      }
    });

    if (hiddenSelect) hiddenSelect.value = val;
  }

  function updateLogoPreviewUI() {
    const dropPrompt = document.getElementById('logoDropPrompt');
    const uploadedCard = document.getElementById('logoUploadedCard');
    const thumbWrap = document.getElementById('editorLogoPreview');
    if (!dropPrompt || !uploadedCard || !thumbWrap) return;

    if (state.companyLogo) {
      thumbWrap.innerHTML = `<img src="${state.companyLogo}" alt="Company Logo" />`;
      dropPrompt.style.display = 'none';
      uploadedCard.style.display = 'flex';
    } else {
      thumbWrap.innerHTML = '';
      dropPrompt.style.display = 'flex';
      uploadedCard.style.display = 'none';
    }
  }

  function updatePaymentFieldsVisibility() {
    const bankSection = document.getElementById('editorBankSection');
    if (!bankSection) return;

    if (state.paymentType === 'Cash') {
      bankSection.style.display = 'none';
      bankSection.setAttribute('aria-hidden', 'true');
    } else {
      bankSection.style.display = 'block';
      bankSection.setAttribute('aria-hidden', 'false');
    }
  }

  // Dynamic Line Items UI Management
  function renderEditorItems() {
    const tbody = document.getElementById('editorItemsTbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.id = `row_${item.id}`;
      tr.dataset.id = item.id;

      const lineTotal = Calculations.calculateLineTotal(item.qty, item.rate);

      tr.innerHTML = `
        <td class="row-sno">${index + 1}</td>
        <td>
          <input type="text" class="form-control item-name-input" placeholder="Item name / description" value="${escapeHtml(item.name)}" aria-label="Item description #${index + 1}" />
        </td>
        <td style="width: 100px;">
          <input type="text" class="form-control item-hs-input" placeholder="HSN/SAC" value="${escapeHtml(item.hs)}" aria-label="HS code #${index + 1}" />
        </td>
        <td style="width: 85px;">
          <input type="number" step="0.001" min="0" class="form-control item-qty-input" placeholder="0" value="${escapeHtml(item.qty)}" style="text-align:right" aria-label="Quantity #${index + 1}" />
        </td>
        <td style="width: 105px;">
          <input type="number" step="0.01" min="0" class="form-control item-rate-input" placeholder="0.00" value="${escapeHtml(item.rate)}" style="text-align:right" aria-label="Rate #${index + 1}" />
        </td>
        <td class="row-total-val">₹${Calculations.format2(lineTotal)}</td>
        <td style="width: 44px; text-align: center;">
          <button type="button" class="btn btn-danger-ghost btn-sm btn-icon-only del-item-btn" title="Delete row" aria-label="Delete item #${index + 1}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </td>
      `;

      // Event listeners for row inputs
      const nameInput = tr.querySelector('.item-name-input');
      const hsInput = tr.querySelector('.item-hs-input');
      const qtyInput = tr.querySelector('.item-qty-input');
      const rateInput = tr.querySelector('.item-rate-input');
      const delBtn = tr.querySelector('.del-item-btn');

      nameInput.addEventListener('input', (e) => {
        item.name = e.target.value;
        renderLivePreview();
        debounceAutoSave();
      });

      hsInput.addEventListener('input', (e) => {
        item.hs = e.target.value;
        renderLivePreview();
        debounceAutoSave();
      });

      qtyInput.addEventListener('input', (e) => {
        item.qty = e.target.value;
        updateRowTotal(tr, item);
        renderLivePreview();
        debounceAutoSave();
      });

      rateInput.addEventListener('input', (e) => {
        item.rate = e.target.value;
        updateRowTotal(tr, item);
        renderLivePreview();
        debounceAutoSave();
      });

      // Pressing enter on rate row creates a new line item seamlessly
      rateInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addItemRow(true);
        }
      });

      delBtn.addEventListener('click', () => {
        removeItemRow(item.id, tr);
      });

      tbody.appendChild(tr);
    });
  }

  function updateRowTotal(tr, item) {
    const totalCell = tr.querySelector('.row-total-val');
    if (totalCell) {
      const total = Calculations.calculateLineTotal(item.qty, item.rate);
      totalCell.textContent = `₹${Calculations.format2(total)}`;
    }
  }

  function addItemRow(focusNext = false) {
    const newItem = { id: generateId(), name: '', hs: '', qty: '', rate: '' };
    state.items.push(newItem);
    renderEditorItems();

    const newTr = document.getElementById(`row_${newItem.id}`);
    if (newTr) {
      newTr.classList.add('anim-new-row');
      if (focusNext) {
        const input = newTr.querySelector('.item-name-input');
        if (input) input.focus();
      }
    }

    renderLivePreview();
    debounceAutoSave();
  }

  function removeItemRow(id, rowElement) {
    if (state.items.length <= 1) {
      // Clear values if only 1 item left
      state.items[0] = { id: generateId(), name: '', hs: '', qty: '', rate: '' };
      renderEditorItems();
      renderLivePreview();
      debounceAutoSave();
      return;
    }

    if (rowElement) {
      rowElement.classList.add('anim-removing-row');
      setTimeout(() => {
        state.items = state.items.filter(item => item.id !== id);
        renderEditorItems();
        renderLivePreview();
        debounceAutoSave();
      }, 150);
    } else {
      state.items = state.items.filter(item => item.id !== id);
      renderEditorItems();
      renderLivePreview();
      debounceAutoSave();
    }
  }

  function clearAllItems() {
    state.items = [{ id: generateId(), name: '', hs: '', qty: '', rate: '' }];
    renderEditorItems();
    renderLivePreview();
    debounceAutoSave();
    showToast('All items cleared.', 'info');
  }

  // Live Preview Rendering Engine
  function renderLivePreview() {
    // 1. Header & Company Info
    const previewCompanyName = document.getElementById('previewCompanyName');
    const previewCompanyAddress = document.getElementById('previewCompanyAddress');
    const previewCompanyContact = document.getElementById('previewCompanyContact');
    const previewCompanyLogo = document.getElementById('previewCompanyLogo');

    if (previewCompanyName) {
      previewCompanyName.textContent = state.companyName || 'Your Company Name';
    }

    if (previewCompanyAddress) {
      previewCompanyAddress.textContent = state.companyAddress || 'Company Address Line, City, State, PIN';
    }

    if (previewCompanyContact) {
      const parts = [];
      if (state.companyEmail) parts.push(state.companyEmail);
      if (state.companyPhone) parts.push(state.companyPhone);
      previewCompanyContact.textContent = parts.join(' | ');
      previewCompanyContact.style.display = parts.length ? 'block' : 'none';
    }

    if (previewCompanyLogo) {
      if (state.companyLogo) {
        previewCompanyLogo.src = state.companyLogo;
        previewCompanyLogo.style.display = 'block';
      } else {
        previewCompanyLogo.style.display = 'none';
      }
    }

    // 2. Invoice Meta
    const previewInvoiceNo = document.getElementById('previewInvoiceNo');
    const previewInvoiceDate = document.getElementById('previewInvoiceDate');
    const previewSaleType = document.getElementById('previewSaleType');

    if (previewInvoiceNo) previewInvoiceNo.textContent = state.invoiceNo || 'INV-1';
    if (previewInvoiceDate) previewInvoiceDate.textContent = state.invoiceDate || getTodayDateString();
    if (previewSaleType) previewSaleType.textContent = state.saleType || 'TAX INVOICE';

    // 3. Parties Info
    const previewBuyerName = document.getElementById('previewBuyerName');
    const previewBuyerAddress = document.getElementById('previewBuyerAddress');
    const previewBuyerGst = document.getElementById('previewBuyerGst');
    const previewStateCode = document.getElementById('previewStateCode');
    const previewVehicleNo = document.getElementById('previewVehicleNo');
    const previewContact = document.getElementById('previewContact');
    const previewCompanyGst = document.getElementById('previewCompanyGst');

    if (previewBuyerName) previewBuyerName.textContent = state.buyerName || 'Buyer / Client Name';
    if (previewBuyerAddress) previewBuyerAddress.textContent = state.buyerAddress || 'Buyer billing address details';
    if (previewBuyerGst) previewBuyerGst.textContent = state.buyerGst || '-';
    if (previewStateCode) previewStateCode.textContent = state.stateCode || '-';
    if (previewVehicleNo) previewVehicleNo.textContent = state.vehicleNo || '-';
    if (previewContact) previewContact.textContent = state.contact || '-';
    if (previewCompanyGst) previewCompanyGst.textContent = state.companyGst || '-';

    // 4. Items Table & Calculations
    const totals = Calculations.calculateTotals(state.items, state.taxMode, state.taxPercent);
    const docTbody = document.getElementById('previewDocItemsTbody');

    if (docTbody) {
      docTbody.innerHTML = '';
      
      if (totals.items.length === 0) {
        docTbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px;">No items added yet.</td></tr>`;
      } else {
        totals.items.forEach(item => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td class="doc-col-sno">${item.sno}</td>
            <td class="doc-col-name">${escapeHtml(item.name || '-')}</td>
            <td class="doc-col-hs">${escapeHtml(item.hs || '-')}</td>
            <td class="doc-col-qty">${item.qty ? item.qty : '0'}</td>
            <td class="doc-col-rate">₹${Calculations.format2(item.rate)}</td>
            <td class="doc-col-total">₹${Calculations.format2(item.total)}</td>
          `;
          docTbody.appendChild(tr);
        });
      }
    }

    // 5. Totals Box
    const previewTotalQty = document.getElementById('previewTotalQty');
    const previewSubtotal = document.getElementById('previewSubtotal');
    const previewCgstRow = document.getElementById('previewCgstRow');
    const previewSgstRow = document.getElementById('previewSgstRow');
    const previewIgstRow = document.getElementById('previewIgstRow');
    const previewCgstLabel = document.getElementById('previewCgstLabel');
    const previewSgstLabel = document.getElementById('previewSgstLabel');
    const previewIgstLabel = document.getElementById('previewIgstLabel');
    const previewCgstVal = document.getElementById('previewCgstVal');
    const previewSgstVal = document.getElementById('previewSgstVal');
    const previewIgstVal = document.getElementById('previewIgstVal');
    const previewGrandTotal = document.getElementById('previewGrandTotal');

    if (previewTotalQty) previewTotalQty.textContent = totals.totalQty;
    if (previewSubtotal) previewSubtotal.textContent = `₹${Calculations.formatCurrency(totals.subtotal)}`;

    if (state.taxMode === 'cgst') {
      if (previewCgstRow) previewCgstRow.style.display = 'flex';
      if (previewSgstRow) previewSgstRow.style.display = 'flex';
      if (previewIgstRow) previewIgstRow.style.display = 'none';

      if (previewCgstLabel) previewCgstLabel.textContent = `CGST (${totals.cgstPercent}%)`;
      if (previewSgstLabel) previewSgstLabel.textContent = `SGST (${totals.sgstPercent}%)`;
      if (previewCgstVal) previewCgstVal.textContent = `₹${Calculations.formatCurrency(totals.cgstAmount)}`;
      if (previewSgstVal) previewSgstVal.textContent = `₹${Calculations.formatCurrency(totals.sgstAmount)}`;
    } else {
      if (previewCgstRow) previewCgstRow.style.display = 'none';
      if (previewSgstRow) previewSgstRow.style.display = 'none';
      if (previewIgstRow) previewIgstRow.style.display = 'flex';

      if (previewIgstLabel) previewIgstLabel.textContent = `IGST (${totals.igstPercent}%)`;
      if (previewIgstVal) previewIgstVal.textContent = `₹${Calculations.formatCurrency(totals.igstAmount)}`;
    }

    if (previewGrandTotal) {
      previewGrandTotal.textContent = `₹${Calculations.formatCurrency(totals.grandTotal)}`;
    }

    // 6. Words representation
    const previewAmountWords = document.getElementById('previewAmountWords');
    if (previewAmountWords) {
      previewAmountWords.textContent = Calculations.numberToIndianWords(totals.grandTotal);
    }

    // 7. Bank & Payment Info
    const previewBankBox = document.getElementById('previewBankBox');
    const previewPaymentType = document.getElementById('previewPaymentType');
    const previewBankName = document.getElementById('previewBankName');
    const previewBankAccount = document.getElementById('previewBankAccount');
    const previewBankIfsc = document.getElementById('previewBankIfsc');

    if (previewPaymentType) previewPaymentType.textContent = state.paymentType;

    if (state.paymentType === 'Cash') {
      if (previewBankBox) previewBankBox.style.display = 'none';
    } else {
      if (previewBankBox) previewBankBox.style.display = 'block';
      if (previewBankName) previewBankName.textContent = state.bankName || '-';
      if (previewBankAccount) previewBankAccount.textContent = state.bankAccount || '-';
      if (previewBankIfsc) previewBankIfsc.textContent = state.bankIfsc || '-';
    }

    // 8. Terms & Signature
    const previewTerms = document.getElementById('previewTerms');
    const previewSignFor = document.getElementById('previewSignFor');

    if (previewTerms) previewTerms.textContent = state.termsText;
    if (previewSignFor) {
      const company = state.companySign || state.companyName || 'Company';
      previewSignFor.textContent = `For ${company}`;
    }

    // Mobile badge update
    const mobileTotalBadge = document.getElementById('mobilePreviewTotalBadge');
    if (mobileTotalBadge) {
      mobileTotalBadge.textContent = `₹${Calculations.formatCurrency(totals.grandTotal)}`;
    }
  }

  // Escape HTML helper for safe rendering
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load state into editor form fields
  function populateFormFromState() {
    const fields = [
      'companyName', 'companyAddress', 'companyEmail', 'companyPhone', 'companyGst',
      'invoiceNo', 'invoiceDate', 'saleType',
      'buyerName', 'buyerAddress', 'buyerGst', 'stateCode', 'vehicleNo', 'contact',
      'taxPercent', 'bankName', 'bankAccount', 'bankIfsc', 'termsText', 'companySign'
    ];

    fields.forEach(fieldId => {
      const el = document.getElementById(fieldId);
      if (el && state[fieldId] !== undefined) {
        el.value = state[fieldId];
      }
    });

    // Tax Mode
    const taxRadio = document.querySelector(`input[name="taxMode"][value="${state.taxMode}"]`);
    if (taxRadio) taxRadio.checked = true;

    // Payment Type
    setCustomDropdownValue('paymentDropdown', state.paymentType || 'Cash');

    updateLogoPreviewUI();
    updatePaymentFieldsVisibility();
    applyThemeMode(state.themeMode || 'hydrangea', state.customColor);
    renderEditorItems();
    renderLivePreview();
  }

  // Debounced Draft Auto-saving
  // Debounced Draft Auto-saving
  let autoSaveTimeout = null;
  function debounceAutoSave() {
    clearTimeout(autoSaveTimeout);
    autoSaveTimeout = setTimeout(() => {
      Storage.saveDraft(state);
    }, 600);
  }

  // Get currently entered business profile details from state
  function getBusinessDataFromState() {
    return {
      companyName: state.companyName || '',
      companyAddress: state.companyAddress || '',
      companyEmail: state.companyEmail || '',
      companyPhone: state.companyPhone || '',
      companyGst: state.companyGst || '',
      companyLogo: state.companyLogo || '',
      bankName: state.bankName || '',
      bankAccount: state.bankAccount || '',
      bankIfsc: state.bankIfsc || '',
      paymentType: state.paymentType || 'Cash',
      termsText: state.termsText || '',
      companySign: state.companySign || '',
      taxMode: state.taxMode || 'cgst',
      taxPercent: state.taxPercent !== undefined ? state.taxPercent : 18,
      themeMode: state.themeMode || 'hydrangea',
      customColor: state.customColor || '#6366f1',
    };
  }

  // Apply business profile details to state
  function applyProfileDataToState(profileData) {
    if (!profileData) return;
    state.companyName = profileData.companyName || '';
    state.companyAddress = profileData.companyAddress || '';
    state.companyEmail = profileData.companyEmail || '';
    state.companyPhone = profileData.companyPhone || '';
    state.companyGst = profileData.companyGst || '';
    state.companyLogo = profileData.companyLogo || '';
    state.bankName = profileData.bankName || '';
    state.bankAccount = profileData.bankAccount || '';
    state.bankIfsc = profileData.bankIfsc || '';
    state.paymentType = profileData.paymentType || 'Cash';
    state.termsText = profileData.termsText || state.termsText;
    state.companySign = profileData.companySign || profileData.companyName || '';
    if (profileData.taxMode) state.taxMode = profileData.taxMode;
    if (profileData.taxPercent !== undefined) state.taxPercent = profileData.taxPercent;
    if (profileData.themeMode) state.themeMode = profileData.themeMode;
    if (profileData.customColor) state.customColor = profileData.customColor;
  }

  // Render Business Profiles Dropdown & Header Badge
  function renderProfileDropdown() {
    const profiles = Storage.getAllProfiles();
    const activeId = Storage.getActiveProfileId();
    const activeProfile = profiles.find(p => p.id === activeId) || (profiles.length > 0 ? profiles[0] : null);

    // Update Header Trigger Label & Icon
    const headerName = document.getElementById('headerProfileName');
    const headerIcon = document.getElementById('headerProfileIcon');
    if (headerName) {
      headerName.textContent = activeProfile ? activeProfile.name : 'Business Profile';
    }
    if (headerIcon) {
      if (activeProfile && activeProfile.data && activeProfile.data.companyLogo) {
        headerIcon.innerHTML = `<img src="${activeProfile.data.companyLogo}" alt="" style="width:18px;height:18px;border-radius:4px;object-fit:contain;" />`;
      } else {
        headerIcon.textContent = '🏢';
      }
    }

    // Update Company Info Card Saved Badge
    const profileSavedBadge = document.getElementById('profileSavedBadge');
    const activeBadgeLabel = document.getElementById('activeProfileBadgeLabel');
    if (profileSavedBadge) {
      profileSavedBadge.style.display = activeProfile ? 'inline-flex' : 'none';
      if (activeBadgeLabel && activeProfile) {
        activeBadgeLabel.textContent = activeProfile.name;
      }
    }

    // Update 'Update Current Profile' button visibility in dropdown footer
    const updateBtn = document.getElementById('updateCurrentProfileBtn');
    if (updateBtn) {
      updateBtn.style.display = activeProfile ? 'flex' : 'none';
      if (activeProfile) {
        updateBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Update "${escapeHtml(activeProfile.name)}"
        `;
      }
    }

    // Populate profile list in dropdown
    const listContainer = document.getElementById('profileDropdownList');
    if (!listContainer) return;

    if (profiles.length === 0) {
      listContainer.innerHTML = `
        <div class="profile-empty-hint">
          No saved profiles yet.<br>Save your business details to switch easily.
        </div>
      `;
      return;
    }

    listContainer.innerHTML = profiles.map(p => {
      const isActive = activeProfile && activeProfile.id === p.id;
      const subtitle = p.data.companyGst ? `GSTIN: ${p.data.companyGst}` : (p.data.companyAddress ? p.data.companyAddress.split('\n')[0] : 'No details');
      const thumbHtml = p.data.companyLogo
        ? `<img src="${p.data.companyLogo}" alt="" />`
        : `🏢`;

      return `
        <div class="profile-item-row ${isActive ? 'is-active' : ''}" data-profile-id="${p.id}">
          <div class="profile-item-main" role="button" tabindex="0" title="Switch to ${escapeHtml(p.name)}">
            <div class="profile-item-thumb">${thumbHtml}</div>
            <div class="profile-item-details">
              <span class="profile-item-title">${escapeHtml(p.name)}</span>
              <span class="profile-item-subtitle">${escapeHtml(subtitle)}</span>
            </div>
          </div>
          <div class="profile-item-actions">
            ${isActive ? `<svg class="profile-active-check" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
            <button type="button" class="profile-del-btn" data-delete-id="${p.id}" data-profile-name="${escapeHtml(p.name)}" title="Delete profile">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to rows and delete buttons
    listContainer.querySelectorAll('.profile-item-main').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('.profile-item-row');
        if (row && row.dataset.profileId) {
          switchProfile(row.dataset.profileId);
          closeProfileDropdown();
        }
      });
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const row = btn.closest('.profile-item-row');
          if (row && row.dataset.profileId) {
            switchProfile(row.dataset.profileId);
            closeProfileDropdown();
          }
        }
      });
    });

    listContainer.querySelectorAll('.profile-del-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.deleteId;
        const name = btn.dataset.profileName;
        promptDeleteProfile(id, name);
      });
    });
  }

  // Switch to selected business profile
  function switchProfile(profileId, notify = true) {
    const profile = Storage.getProfileById(profileId);
    if (!profile) return;

    Storage.setActiveProfileId(profileId);
    applyProfileDataToState(profile.data);
    populateFormFromState();
    debounceAutoSave();
    renderProfileDropdown();
    if (notify) {
      showToast(`Switched to profile: ${profile.name}`, 'success');
    }
  }

  // Open the Save Profile Modal
  function openSaveProfileModal() {
    const nameInput = document.getElementById('profileNameInput');
    if (nameInput) {
      const activeId = Storage.getActiveProfileId();
      const activeProfile = activeId ? Storage.getProfileById(activeId) : null;
      nameInput.value = state.companyName ? state.companyName.trim() : (activeProfile ? `${activeProfile.name} (Copy)` : 'My Business');
    }
    closeProfileDropdown();
    openModal('saveProfileModal');
    if (nameInput) {
      setTimeout(() => nameInput.focus(), 80);
    }
  }

  // Confirm Saving a New Profile
  function confirmSaveProfile() {
    const nameInput = document.getElementById('profileNameInput');
    const name = nameInput ? nameInput.value.trim() : '';

    if (!name) {
      showToast('Please enter a profile name.', 'warning');
      if (nameInput) nameInput.focus();
      return;
    }

    const data = getBusinessDataFromState();
    const saved = Storage.saveProfile(name, data);
    if (saved) {
      closeModal('saveProfileModal');
      renderProfileDropdown();
      showToast(`Business profile "${saved.name}" saved!`, 'success', 3500);
    } else {
      showToast('Failed to save profile. Please check browser storage.', 'error');
    }
  }

  // Update the Current Active Profile with changes made on screen
  function updateCurrentActiveProfile() {
    const activeId = Storage.getActiveProfileId();
    if (!activeId) {
      openSaveProfileModal();
      return;
    }
    const current = Storage.getProfileById(activeId);
    if (!current) {
      openSaveProfileModal();
      return;
    }

    const data = getBusinessDataFromState();
    const updated = Storage.saveProfile(current.name, data, activeId);
    if (updated) {
      closeProfileDropdown();
      renderProfileDropdown();
      showToast(`Updated profile "${updated.name}" successfully!`, 'success');
    }
  }

  // Delete Profile Confirmation Flow
  let pendingDeleteProfileId = null;

  function promptDeleteProfile(id, name) {
    pendingDeleteProfileId = id;
    const nameTarget = document.getElementById('deleteProfileTargetName');
    if (nameTarget) nameTarget.textContent = name || 'this profile';
    closeProfileDropdown();
    openModal('deleteProfileModal');
  }

  function confirmDeleteProfile() {
    if (!pendingDeleteProfileId) return;
    const deletedId = pendingDeleteProfileId;
    const ok = Storage.deleteProfile(deletedId);
    if (ok) {
      closeModal('deleteProfileModal');
      const activeId = Storage.getActiveProfileId();
      if (activeId) {
        const nextProfile = Storage.getProfileById(activeId);
        if (nextProfile) {
          applyProfileDataToState(nextProfile.data);
          populateFormFromState();
          debounceAutoSave();
        }
      }
      renderProfileDropdown();
      showToast('Profile deleted.', 'info');
    } else {
      showToast('Could not delete profile.', 'error');
    }
    pendingDeleteProfileId = null;
  }

  // Profile Dropdown Toggle Helpers
  function closeProfileDropdown() {
    const wrapper = document.getElementById('profileDropdown');
    if (wrapper) {
      const trigger = wrapper.querySelector('.custom-select-trigger');
      const menu = wrapper.querySelector('.custom-select-menu');
      if (trigger) {
        trigger.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      if (menu) menu.classList.remove('is-open');
      wrapper.classList.remove('is-open');
    }
  }

  function setupProfileDropdown() {
    const wrapper = document.getElementById('profileDropdown');
    if (!wrapper) return;

    const trigger = document.getElementById('profileDropdownTrigger');
    const menu = document.getElementById('profileDropdownMenu');

    if (trigger && menu) {
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const isOpen = menu.classList.contains('is-open');
        // Close other open dropdowns
        document.querySelectorAll('.custom-select-trigger.is-open').forEach(t => {
          if (t !== trigger) {
            t.classList.remove('is-open');
            t.setAttribute('aria-expanded', 'false');
          }
        });
        document.querySelectorAll('.custom-select-menu.is-open').forEach(m => {
          if (m !== menu) m.classList.remove('is-open');
        });
        document.querySelectorAll('.custom-select-wrapper.is-open').forEach(w => {
          if (w !== wrapper) w.classList.remove('is-open');
        });

        if (isOpen) {
          closeProfileDropdown();
        } else {
          trigger.classList.add('is-open');
          trigger.setAttribute('aria-expanded', 'true');
          menu.classList.add('is-open');
          wrapper.classList.add('is-open');
        }
      });
    }
  }

  // Reset Application
  function resetAll(mode = 'all') {
    Storage.clearDraft();

    if (mode === 'itemsOnly') {
      // Clear only buyer information and item rows, preserving seller identity
      const counter = Storage.nextAvailableNumber();
      state.invoiceNo = `INV-${counter}`;
      state.invoiceDate = getTodayDateString();
      state.buyerName = '';
      state.buyerAddress = '';
      state.buyerGst = '';
      state.stateCode = '';
      state.vehicleNo = '';
      state.contact = '';
      state.items = [
        { id: generateId(), name: '', hs: '', qty: '', rate: '' },
        { id: generateId(), name: '', hs: '', qty: '', rate: '' }
      ];

      // If user has active saved profile, re-ensure it is applied
      const activeId = Storage.getActiveProfileId();
      if (activeId) {
        const profile = Storage.getProfileById(activeId);
        if (profile) {
          applyProfileDataToState(profile.data);
        }
      }

      populateFormFromState();
      debounceAutoSave();
      showToast('New invoice created! Your business details are preserved.', 'success');
      return;
    }

    // Full reset to completely blank form
    initDefaultState();
    state.companyName = '';
    state.companyAddress = '';
    state.companyEmail = '';
    state.companyPhone = '';
    state.companyGst = '';
    state.companyLogo = '';
    state.themeMode = 'hydrangea';
    state.customColor = '#6366f1';
    state.primaryColor = '#6366f1';
    state.buyerName = '';
    state.buyerAddress = '';
    state.buyerGst = '';
    state.stateCode = '';
    state.vehicleNo = '';
    state.contact = '';
    state.taxMode = 'cgst';
    state.taxPercent = 18;
    state.paymentType = 'Cash';
    state.bankName = '';
    state.bankAccount = '';
    state.bankIfsc = '';
    state.termsText = '1. Goods once sold will not be taken back or exchanged.\n2. Payment terms: Due on receipt.';
    state.companySign = '';

    populateFormFromState();
    renderProfileDropdown();
    showToast('Invoice form reset to blank.', 'info');
  }

  // PDF Export Flow
  async function handleDownloadPdf() {
    const downloadBtn = document.getElementById('downloadPdfBtn');
    const previewDoc = document.getElementById('invoicePaper');
    if (!previewDoc) return;

    // Validation check
    const validation = Validation.validateInvoice(state);
    if (!validation.isValid) {
      const firstError = validation.errors[0];
      showToast(firstError.message, 'error', 4000);
      return;
    }

    if (validation.warnings.length > 0) {
      showToast(validation.warnings[0].message, 'warning', 3000);
    }

    const safeDate = (state.invoiceDate || getTodayDateString()).replace(/[^\w-]/g, '_');
    const safeInv = (state.invoiceNo || 'INV').replace(/[^\w-]/g, '_');
    const filename = `${safeDate}_${safeInv}.pdf`;

    try {
      await PDFExporter.generatePdf(previewDoc, {
        filename: filename,
        onStart: () => {
          if (downloadBtn) {
            downloadBtn.disabled = true;
            downloadBtn.innerHTML = `<span class="spinner"></span> Rendering PDF...`;
          }
        },
        onFinish: ({ success, error }) => {
          if (downloadBtn) {
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = `
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              Download PDF
            `;
          }

          if (success) {
            showToast('PDF downloaded successfully!', 'success');

            // Commit invoice counter sequentially upon export
            const parsed = Storage.parseInvoiceNumber(state.invoiceNo);
            if (parsed !== null && parsed > 0) {
              Storage.writeCounter(parsed);
              const next = parsed + 1;
              state.invoiceNo = `INV-${next}`;
              const invInput = document.getElementById('invoiceNo');
              if (invInput) invInput.value = state.invoiceNo;
              renderLivePreview();
              debounceAutoSave();
            }
          } else if (error) {
            showToast('Failed to export PDF: ' + (error.message || error), 'error', 5000);
          }
        },
      });
    } catch (err) {
      showToast('Error exporting PDF: ' + (err.message || err), 'error', 5000);
      if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          Download PDF
        `;
      }
    }
  }

  // Setup UI Action Listeners
  function initActions() {
    // Add Row & Clear Rows Buttons
    const addRowBtn = document.getElementById('addRowBtn');
    const clearRowsBtn = document.getElementById('clearRowsBtn');
    if (addRowBtn) addRowBtn.addEventListener('click', () => addItemRow(true));
    if (clearRowsBtn) clearRowsBtn.addEventListener('click', () => openModal('confirmClearRowsModal'));

    // Download PDF Button
    const downloadPdfBtn = document.getElementById('downloadPdfBtn');
    if (downloadPdfBtn) downloadPdfBtn.addEventListener('click', handleDownloadPdf);

    // Print Button
    const printBtn = document.getElementById('printBtn');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    // Reset Button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => openModal('confirmResetModal'));

    // Business Profile Actions
    const openSaveProfileModalBtn = document.getElementById('openSaveProfileModalBtn');
    const saveProfileCardBtn = document.getElementById('saveProfileCardBtn');
    const updateCurrentProfileBtn = document.getElementById('updateCurrentProfileBtn');
    const confirmSaveProfileModalBtn = document.getElementById('confirmSaveProfileModalBtn');
    const confirmDeleteProfileModalBtn = document.getElementById('confirmDeleteProfileModalBtn');
    const profileNameInput = document.getElementById('profileNameInput');

    if (openSaveProfileModalBtn) openSaveProfileModalBtn.addEventListener('click', openSaveProfileModal);
    if (saveProfileCardBtn) saveProfileCardBtn.addEventListener('click', openSaveProfileModal);
    if (updateCurrentProfileBtn) updateCurrentProfileBtn.addEventListener('click', updateCurrentActiveProfile);
    if (confirmSaveProfileModalBtn) confirmSaveProfileModalBtn.addEventListener('click', confirmSaveProfile);
    if (confirmDeleteProfileModalBtn) confirmDeleteProfileModalBtn.addEventListener('click', confirmDeleteProfile);

    if (profileNameInput) {
      profileNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          confirmSaveProfile();
        }
      });
    }

    // Disclaimer & Privacy Links
    const disclaimerLink = document.getElementById('disclaimerLink');
    if (disclaimerLink) disclaimerLink.addEventListener('click', () => openModal('disclaimerModal'));

    const privacyLink = document.getElementById('privacyLink');
    if (privacyLink) privacyLink.addEventListener('click', () => openModal('privacyModal'));

    // Mobile View Toggle Tabs
    const tabEditor = document.getElementById('tabEditor');
    const tabPreview = document.getElementById('tabPreview');
    const editorPane = document.getElementById('editorPane');
    const previewPane = document.getElementById('previewPane');

    if (tabEditor && tabPreview && editorPane && previewPane) {
      tabEditor.addEventListener('click', () => {
        tabEditor.classList.add('active');
        tabPreview.classList.remove('active');
        editorPane.classList.remove('is-hidden-mobile');
        previewPane.classList.add('is-hidden-mobile');
      });

      tabPreview.addEventListener('click', () => {
        tabPreview.classList.add('active');
        tabEditor.classList.remove('active');
        previewPane.classList.remove('is-hidden-mobile');
        editorPane.classList.add('is-hidden-mobile');
      });
    }

    // Modal Close Buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-backdrop');
        if (modal) closeModal(modal.id);
      });
    });

    // Modal Action Handlers
    const confirmResetAllBtn = document.getElementById('confirmResetAllBtn');
    if (confirmResetAllBtn) {
      confirmResetAllBtn.addEventListener('click', () => {
        resetAll('all');
        closeModal('confirmResetModal');
      });
    }

    const confirmResetItemsOnlyBtn = document.getElementById('confirmResetItemsOnlyBtn');
    if (confirmResetItemsOnlyBtn) {
      confirmResetItemsOnlyBtn.addEventListener('click', () => {
        resetAll('itemsOnly');
        closeModal('confirmResetModal');
      });
    }

    const confirmClearRowsBtn = document.getElementById('confirmClearRowsBtn');
    if (confirmClearRowsBtn) {
      confirmClearRowsBtn.addEventListener('click', () => {
        clearAllItems();
        closeModal('confirmClearRowsModal');
      });
    }

    // Keyboard Shortcuts (Ctrl+P / Cmd+P for print)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        window.print();
      }
    });
  }

  // Lenis Smooth Scroll Integration (iPhone-style fluid scrolling)
  function initLenis() {
    try {
      if (typeof window.Lenis !== 'undefined') {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!prefersReducedMotion) {
          const lenis = new window.Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
          });

          function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
          }

          requestAnimationFrame(raf);
        }
      }
    } catch (e) {
      // Graceful fallback if Lenis is unavailable
    }
  }

  // App Entry Point
  function initApp() {
    initDefaultState();
    bindFormInputs();
    setupProfileDropdown();
    initActions();
    initLenis();

    // Try loading saved draft
    const savedDraft = Storage.loadDraft();
    if (savedDraft && typeof savedDraft === 'object') {
      Object.assign(state, savedDraft);
    } else {
      // If starting fresh without a draft, auto-fill from active seller profile if available
      const activeId = Storage.getActiveProfileId();
      const profiles = Storage.getAllProfiles();
      const profileToLoad = (activeId ? Storage.getProfileById(activeId) : null) || (profiles.length > 0 ? profiles[0] : null);
      if (profileToLoad) {
        applyProfileDataToState(profileToLoad.data);
      }
    }

    renderProfileDropdown();
    populateFormFromState();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();

