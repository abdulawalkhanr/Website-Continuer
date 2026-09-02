const COMPANY = {
  name: "CIR Consultation Service",
  tagline: "Your Partner in Financial Health",
  phone: "01169296558",
  whatsapp: "+91 6900637638",
  email: "support@circonsultationservice.in",
  website: "www.circonsultationservice.in",
  address: "India",
};

function logoUrl() {
  return `${window.location.origin}/cir-logo.jpg`;
}

function formatDate(d?: string | Date | null) {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

function formatAmount(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function openPrint(html: string) {
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) setTimeout(() => URL.revokeObjectURL(url), 60000);
}

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a2340; background: #fff; font-size: 13px; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 3px solid #1a2340; margin-bottom: 24px; }
  .logo { height: 70px; width: auto; }
  .company-info { text-align: right; }
  .company-name { font-size: 18px; font-weight: 700; color: #1a2340; }
  .company-tagline { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .company-contact { font-size: 11px; color: #4b5563; margin-top: 4px; line-height: 1.6; }
  .doc-title { text-align: center; margin: 20px 0; }
  .doc-title h1 { font-size: 22px; font-weight: 700; color: #1a2340; letter-spacing: 1px; text-transform: uppercase; }
  .doc-title .doc-no { font-size: 12px; color: #6b7280; margin-top: 4px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-partial { background: #fef3c7; color: #92400e; }
  .badge-pending { background: #fee2e2; color: #991b1b; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; margin-bottom: 10px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
  .grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px 16px; }
  .field label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #9ca3af; display: block; margin-bottom: 2px; }
  .field span { font-size: 13px; font-weight: 500; }
  .amount-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px 20px; margin: 16px 0; }
  .amount-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; }
  .amount-row.total { border-top: 2px solid #1a2340; margin-top: 8px; padding-top: 10px; font-weight: 700; font-size: 15px; }
  .amount-row.paid { color: #065f46; }
  .amount-row.pending { color: #b45309; }
  .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  .sig-box { text-align: center; }
  .sig-line { border-bottom: 1px solid #9ca3af; height: 40px; margin-bottom: 6px; }
  .sig-label { font-size: 11px; color: #6b7280; }
  .sig-name { font-size: 12px; font-weight: 600; margin-top: 2px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 10px; color: #9ca3af; line-height: 1.8; }
  .terms li { font-size: 12px; line-height: 1.8; margin-bottom: 4px; color: #374151; }
  .terms { padding-left: 18px; }
  .highlight-box { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #92400e; margin: 12px 0; }
  @media print {
    body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    .page { padding: 20px; }
    .no-print { display: none; }
  }
`;

export interface ReceiptData {
  receiptNo?: string;
  date?: string | Date;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  customerCity?: string;
  caseNumber: string;
  serviceType: string;
  serviceFee: number;
  advancePaid: number;
  pendingAmount: number;
  paymentStatus: string;
  paymentId?: number;
}

export function generateReceipt(data: ReceiptData) {
  const receiptNo = data.receiptNo || `RCP-${data.paymentId || Date.now()}`;
  const statusClass = data.paymentStatus === "PAID" ? "badge-paid" : data.paymentStatus === "PARTIAL" ? "badge-partial" : "badge-pending";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Payment Receipt — ${receiptNo}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img class="logo" src="${logoUrl()}" alt="CIR Consultation Service Logo" />
      <div class="company-info">
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-tagline">${COMPANY.tagline}</div>
        <div class="company-contact">
          📞 ${COMPANY.phone} &nbsp;|&nbsp; 💬 ${COMPANY.whatsapp}<br/>
          ✉ ${COMPANY.email}<br/>
          🌐 ${COMPANY.website}
        </div>
      </div>
    </div>

    <div class="doc-title">
      <h1>Payment Receipt</h1>
      <div class="doc-no">Receipt No: <strong>${receiptNo}</strong> &nbsp;|&nbsp; Date: <strong>${formatDate(data.date)}</strong> &nbsp;|&nbsp; <span class="badge ${statusClass}">${data.paymentStatus}</span></div>
    </div>

    <div class="section">
      <div class="section-title">Client Information</div>
      <div class="grid2">
        <div class="field"><label>Client Name</label><span>${data.customerName}</span></div>
        <div class="field"><label>Mobile</label><span>${data.customerMobile || "—"}</span></div>
        <div class="field"><label>Email</label><span>${data.customerEmail || "—"}</span></div>
        <div class="field"><label>City</label><span>${data.customerCity || "—"}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Case Details</div>
      <div class="grid2">
        <div class="field"><label>Case Number</label><span>${data.caseNumber}</span></div>
        <div class="field"><label>Service Type</label><span>${data.serviceType.replace(/_/g, " ")}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Breakdown</div>
      <div class="amount-box">
        <div class="amount-row">
          <span>Total Service Fee</span>
          <span>${formatAmount(data.serviceFee)}</span>
        </div>
        <div class="amount-row paid">
          <span>✔ Amount Received</span>
          <span>${formatAmount(data.advancePaid)}</span>
        </div>
        <div class="amount-row pending">
          <span>⏳ Balance Due</span>
          <span>${formatAmount(data.pendingAmount)}</span>
        </div>
        <div class="amount-row total">
          <span>Total Service Fee</span>
          <span>${formatAmount(data.serviceFee)}</span>
        </div>
      </div>
      ${data.pendingAmount > 0 ? `<div class="highlight-box">⚠ A balance of <strong>${formatAmount(data.pendingAmount)}</strong> is due. Please pay via UPI or bank transfer and contact us.</div>` : `<div style="background:#d1fae5;border:1px solid #6ee7b7;border-radius:8px;padding:12px 16px;font-size:12px;color:#065f46;margin:12px 0;">✔ Full payment received. Thank you for choosing ${COMPANY.name}!</div>`}
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Client Signature</div>
        <div class="sig-name">${data.customerName}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Authorised Signatory</div>
        <div class="sig-name">${COMPANY.name}</div>
      </div>
    </div>

    <div class="footer">
      This is a computer-generated receipt and does not require a physical signature.<br/>
      ${COMPANY.name} &nbsp;|&nbsp; ${COMPANY.phone} &nbsp;|&nbsp; ${COMPANY.email} &nbsp;|&nbsp; ${COMPANY.website}<br/>
      Generated on ${new Date().toLocaleString("en-IN")}
    </div>
  </div>
</body>
</html>`;

  openPrint(html);
}

export interface AgreementData {
  agreementNo?: string;
  date?: string | Date;
  customerName: string;
  customerEmail?: string;
  customerMobile?: string;
  customerCity?: string;
  caseNumber: string;
  serviceType: string;
  serviceFee: number;
  advancePaid?: number;
  paymentId?: number;
}

export function generateAgreement(data: AgreementData) {
  const agreementNo = data.agreementNo || `AGR-${data.paymentId || data.caseNumber}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Service Agreement — ${agreementNo}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img class="logo" src="${logoUrl()}" alt="CIR Consultation Service Logo" />
      <div class="company-info">
        <div class="company-name">${COMPANY.name}</div>
        <div class="company-tagline">${COMPANY.tagline}</div>
        <div class="company-contact">
          📞 ${COMPANY.phone} &nbsp;|&nbsp; 💬 ${COMPANY.whatsapp}<br/>
          ✉ ${COMPANY.email}<br/>
          🌐 ${COMPANY.website}
        </div>
      </div>
    </div>

    <div class="doc-title">
      <h1>Service Agreement</h1>
      <div class="doc-no">Agreement No: <strong>${agreementNo}</strong> &nbsp;|&nbsp; Date: <strong>${formatDate(data.date)}</strong></div>
    </div>

    <div class="section">
      <div class="section-title">Parties to the Agreement</div>
      <div class="grid2">
        <div>
          <div class="field" style="margin-bottom:8px;"><label>Service Provider</label><span style="font-weight:600;">${COMPANY.name}</span></div>
          <div class="field" style="margin-bottom:8px;"><label>Contact</label><span>${COMPANY.phone}</span></div>
          <div class="field"><label>Website</label><span>${COMPANY.website}</span></div>
        </div>
        <div>
          <div class="field" style="margin-bottom:8px;"><label>Client Name</label><span style="font-weight:600;">${data.customerName}</span></div>
          <div class="field" style="margin-bottom:8px;"><label>Mobile</label><span>${data.customerMobile || "—"}</span></div>
          <div class="field" style="margin-bottom:8px;"><label>Email</label><span>${data.customerEmail || "—"}</span></div>
          <div class="field"><label>City</label><span>${data.customerCity || "—"}</span></div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Engagement Details</div>
      <div class="grid2">
        <div class="field"><label>Case Reference</label><span>${data.caseNumber}</span></div>
        <div class="field"><label>Service</label><span>${data.serviceType.replace(/_/g, " ")}</span></div>
        <div class="field"><label>Service Fee</label><span style="font-weight:700;font-size:15px;">${formatAmount(data.serviceFee)}</span></div>
        <div class="field"><label>Engagement Date</label><span>${formatDate(data.date)}</span></div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Scope of Services</div>
      <ul class="terms">
        <li>Review and analysis of the client's credit report (CIBIL/Experian/CRIF/Equifax).</li>
        <li>Identification of erroneous, fraudulent, or incorrect entries affecting the credit score.</li>
        <li>Preparation and filing of formal dispute letters with relevant credit bureaus and lenders.</li>
        <li>Regular follow-up with credit bureaus on behalf of the client until resolution.</li>
        <li>Provision of expert guidance and counselling to improve overall credit health.</li>
        <li>Progress updates shared with the client throughout the resolution process.</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Payment Terms</div>
      <ul class="terms">
        <li>Total service fee of <strong>${formatAmount(data.serviceFee)}</strong> is payable as agreed between both parties.</li>
        <li>An advance payment is required before commencement of services.</li>
        <li>The balance amount is due upon successful resolution or as mutually agreed.</li>
        <li>Payments may be made via UPI, NEFT/RTGS, or any other agreed mode.</li>
        <li>Service fees are non-refundable once work has commenced unless otherwise agreed in writing.</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Terms & Conditions</div>
      <ul class="terms">
        <li>The client agrees to provide accurate and complete documents as requested by ${COMPANY.name}.</li>
        <li>${COMPANY.name} will not be liable for delays caused by credit bureaus, lenders, or third parties.</li>
        <li>Results depend on the nature and complexity of disputes; no specific outcome is guaranteed.</li>
        <li>All client information shall be treated as confidential and used solely for service delivery.</li>
        <li>This agreement is subject to Indian law. Disputes shall be resolved by mutual arbitration.</li>
        <li>Either party may terminate this agreement with 7 days written notice; fees for work done remain payable.</li>
      </ul>
    </div>

    <div class="section">
      <div class="section-title">Declaration</div>
      <p style="font-size:12px;line-height:1.8;color:#374151;">
        I, <strong>${data.customerName}</strong>, hereby confirm that I have read, understood, and agree to all the terms and conditions
        set out in this Service Agreement. I authorise <strong>${COMPANY.name}</strong> to act on my behalf for the purpose
        of credit report rectification and CIBIL dispute resolution as described above.
      </p>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Client Signature &amp; Date</div>
        <div class="sig-name">${data.customerName}</div>
      </div>
      <div class="sig-box">
        <div class="sig-line"></div>
        <div class="sig-label">Authorised Signatory &amp; Date</div>
        <div class="sig-name">${COMPANY.name}</div>
      </div>
    </div>

    <div class="footer">
      This agreement is binding upon signature by both parties.<br/>
      ${COMPANY.name} &nbsp;|&nbsp; ${COMPANY.phone} &nbsp;|&nbsp; ${COMPANY.email} &nbsp;|&nbsp; ${COMPANY.website}<br/>
      Generated on ${new Date().toLocaleString("en-IN")}
    </div>
  </div>
</body>
</html>`;

  openPrint(html);
}
