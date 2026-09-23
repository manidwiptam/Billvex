# Billvex

A modern, fast, responsive billing and invoice generator designed as a clean, local-first SaaS utility. Billvex allows businesses, freelancers, and merchants to compose, customize, preview in real time, and export crisp A4 PDF invoices directly from the browser.

---

## Features

- **Split-Screen Workspace**: Real-time two-way synchronization between the form editor and a printable A4 live preview document.
- **Hydrangea Theme & Glassmorphism**: Ultra-premium translucent frosted glass interfaces (`backdrop-filter: blur(24px)`), ambient lilac & periwinkle backdrop glows, layered lighting depth, and spring easing.
- **Signature Typography**: Distinctive **Fugaz One** display typeface for brand & section headers paired with clean, highly legible **Work Sans** for body, numeric tables, and billing documents.
- **Lenis Smooth Inertial Scrolling**: Fluid, hardware-accelerated momentum scrolling powered by the modern Lenis library (with automatic reduced-motion fallback).
- **Dual Theme Engine**: Choose between the signature **Hydrangea (Default)** periwinkle/indigo palette (`#6366f1`) or the **Custom / Logo Brand** theme, which automatically samples and applies the primary accent color from your uploaded logo (with manual fine-tuning).
- **Company Branding**: Customizable business profile, instant logo upload with base64 client rendering, and automatic brand color extraction.
- **Invoice Metadata**: Auto-incrementing sequential invoice numbering with local persistence, date pickers, and configurable sale/invoice classifications.
- **Customer / Party Details**: Buyer/Client name, billing address, optional GSTIN, State code, vehicle dispatch number, and contact information.
- **Dynamic Line Items**: Add, edit, reorder, and remove line items with keyboard shortcuts (`Enter` to add row), supporting decimals for quantity and rates.
- **Tax Calculation Engine**:
  - Dual tax modes: CGST + SGST (50/50 split) or single IGST rate.
  - Configurable tax percentage (e.g. 0%, 5%, 12%, 18%, 28%, custom).
  - Decimal-safe mathematical calculations to eliminate floating-point drift.
- **Indian Rupee Currency In Words**: Automatic conversion of total payable amounts into Indian numbering words (Crores, Lakhs, Thousands, Hundreds, Rupees, and Paise).
- **Payment & Bank Details**: Support for Cash, Online (NEFT/RTGS/UPI), and Cheque modes with conditional banking inputs (Bank Name, Account Number, IFSC).
- **Custom Terms & Signature**: Customizable terms and conditions and authorized signatory block.
- **High-Fidelity PDF & Print**:
  - Crisp A4 vector/canvas rendering via `jsPDF` and `html2canvas` with image-loading guarantees.
  - Native browser print support with dedicated `@media print` stylesheets.
- **Auto-Save & Local Drafts**: Automatic local draft saving to prevent accidental data loss upon refresh.
- **Responsive & Accessible**: Mobile-friendly tab switching between editor and preview, full keyboard accessibility, clear focus states, and `prefers-reduced-motion` compliance.

---

## Screenshots / Demo

*Live Demo / Screenshot preview placeholder:*

```
+-------------------------------------------------------------------------------+
|  Billvex (SaaS Utility)             [Theme]  [Demo Data] [Print] [Download]   |
+------------------------------------+------------------------------------------+
|  FORM EDITOR                       |  LIVE A4 DOCUMENT PREVIEW                |
|  - Company Info & Logo             |  +------------------------------------+  |
|  - Invoice No & Date               |  | [LOGO] COMPANY NAME      TAX INV  |  |
|  - Buyer / Party Details           |  | Billed To: Buyer Name    INV-01   |  |
|  - Items (Qty x Rate)              |  | Item           Qty   Rate  Total  |  |
|  - Tax Mode (CGST/SGST vs IGST)    |  | --------------------------------- |  |
|  - Payment & Bank Details          |  | Subtotal:                ₹1,000   |  |
|  - Terms & Conditions              |  | IGST (18%):                ₹180   |  |
|                                    |  | Grand Total:             ₹1,180   |  |
|                                    |  +------------------------------------+  |
+------------------------------------+------------------------------------------+
```

---

## Tech Stack

- **HTML5**: Semantic, accessible document markup.
- **CSS3**: Modern CSS custom properties, frosted glassmorphism (`backdrop-filter`), CSS Grid, Flexbox, and print media queries.
- **JavaScript (ES6+)**: Vanilla modular architecture with zero build dependencies.
- **Client Libraries**:
  - [Lenis](https://github.com/darkroomengineering/lenis) (v1.1.18) &ndash; MIT License (Smooth inertial scrolling)
  - [html2canvas](https://github.com/niklasvh/html2canvas) (v1.4.1) &ndash; MIT License
  - [jsPDF](https://github.com/parallax/jsPDF) (v2.5.1) &ndash; MIT License

---

## Getting Started

Because Billvex is built purely with standard web technologies, no build tools, Node.js packages, or compilers are required.

### 1. Clone the repository
```bash
git clone https://github.com/manidwiptam/Billvex.git
cd Billvex
```

### 2. Run locally
Open `index.html` directly in any modern web browser:
```bash
# On Windows (PowerShell)
Start-Process index.html

# On macOS
open index.html

# On Linux
xdg-open index.html
```

Or serve using any local static web server:
```bash
# Python 3
python -m http.server 8000

# Node.js (npx)
npx serve
```

Then visit `http://localhost:8000` in your browser.

---

## Usage

1. **Company Information**: Enter your business name, address, optional contact details, GSTIN, and upload a company logo.
2. **Invoice Details**: Confirm or customize the invoice number, date, and sale type.
3. **Buyer Details**: Enter customer name, billing address, and optional dispatch details.
4. **Line Items**: Enter items with HSN/SAC codes, quantities, and rates. The row totals, subtotals, and totals calculate automatically in real time.
5. **Tax & Payment**: Select the tax mode (CGST + SGST or IGST) and tax rate. Select payment mode (Cash, Online, or Cheque) and enter bank details if applicable.
6. **Export**: Click **Download PDF** to export a high-resolution A4 document, or click **Print** to use the browser print dialog.

---

## PDF Export & Printing

- **Download PDF**: Captures the invoice at high pixel density, scales it proportionally to standard A4 dimensions with clean 8mm margins, and saves it with a formatted filename (`YYYY-MM-DD_INV-XXX.pdf`).
- **Direct Print**: Uses a dedicated `@media print` stylesheet (`css/print.css`) that strips all app navigation, buttons, and editor controls, delivering a pure document printout.

---

## Privacy & Data Protection

Billvex follows a strict **100% Local-First** architecture:
- All invoice data, customer details, tax figures, bank accounts, and uploaded logos are processed entirely within the user's local web browser.
- **No data is transmitted** to external servers, cloud databases, or third-party storage.
- No analytics, tracking scripts, or telemetry libraries are loaded.
- Local drafts and the sequential invoice counter are saved in standard browser `localStorage` and can be reset or cleared at any time via the in-app **Reset** button.

---

## Security Considerations

- **Input Sanitization**: User-entered strings rendered into the live preview are securely escaped to prevent Cross-Site Scripting (XSS).
- **Client-Side Processing**: Images uploaded as logos are read via `FileReader.readAsDataURL` and handled strictly within local memory.
- **Static Dependencies**: Third-party helper scripts are sourced from trusted, version-pinned CDNs over HTTPS.

---

## Legal & Compliance Disclaimer

> **Important Disclaimer:**
>
> Billvex is a software utility for creating and exporting invoices/bills. It does not provide legal, tax, accounting, or compliance advice. Users are responsible for verifying that invoices generated with the application meet the requirements applicable to their business, location, transaction, and tax status.
>
> Billvex makes no claim of being certified, approved, or endorsed by any government entity, tax department, or GST authority. Tax calculation modes, GSTIN fields, and HSN/SAC code inputs are configurable user-entered templates provided solely for operational convenience.

---

## Trademark & Branding Safety

"Billvex" and its accompanying visual assets are original to this project. Billvex does not claim affiliation with, endorsement by, or sponsorship from any third-party company, financial institution, or government agency. Users planning commercial deployment under this name should perform their own independent trademark and name availability checks in their respective jurisdictions.

---

## Third-Party Assets & Licenses

| Asset / Library | Source / Author | License |
| :--- | :--- | :--- |
| **Fugaz One Font** | [Google Fonts / Brenda Gallo](https://fonts.google.com/specimen/Fugaz+One) | [OFL (Open Font License)](https://scripts.sil.org/OFL) |
| **Work Sans Font** | [Google Fonts / Wei Huang](https://fonts.google.com/specimen/Work+Sans) | [OFL (Open Font License)](https://scripts.sil.org/OFL) |
| **Lenis** | Darkroom Engineering | [MIT License](https://github.com/darkroomengineering/lenis/blob/main/LICENSE) |
| **jsPDF** | Parallax & Contributors | [MIT License](https://github.com/parallax/jsPDF/blob/master/LICENSE) |
| **html2canvas** | Niklas von Hertzen | [MIT License](https://github.com/niklasvh/html2canvas/blob/master/LICENSE) |
| **Billvex Icon / Favicon** | Original SVG Asset | [MIT License](./LICENSE) |

---

## License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2025-2026 Manidwiptam Halder

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Contributing

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the repository (`https://github.com/manidwiptam/Billvex`).
2. Create a feature branch (`git checkout -b feature/your-feature-name`).
3. Commit your changes (`git commit -m 'feat: Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature-name`).
5. Open a Pull Request.

---

## Roadmap

- [x] Modern 2026 SaaS split-pane editor and live preview workspace
- [x] Client-side A4 PDF download and print stylesheets
- [x] Dynamic GST (CGST+SGST / IGST) calculations with decimal precision
- [x] Indian Rupee currency words conversion
- [x] Local storage persistence and auto-saved drafts
- [x] Brand color and logo customizer
- [ ] Multi-currency selection (USD, EUR, GBP)
- [ ] Export / Import invoice templates as JSON
- [ ] Multiple printable invoice theme templates
