// Generates a complete printable contract review draft
// Merges company settings + AI template language into the full 14-article contract
// so the attorney sees exactly what a real customer would sign

import { generateContractText } from './contractText'

export function printContractReview(contractTemplate, settings, paymentVersion = 'A') {
  const co = settings || {}
  const tpl = contractTemplate || {}

  // Build sample data that mirrors a real contract, using AI template language
  // where it applies
  const scopeBoilerplate = tpl.scopeBoilerplate || ''
  const firstScopeTemplate = tpl.scopeTemplates?.[0]
  const sampleScope = firstScopeTemplate
    ? `${scopeBoilerplate}\n\n${firstScopeTemplate.scope || ''}`
    : `${scopeBoilerplate}\n\n[Contractor will furnish all labor, materials, equipment, and services necessary to complete the work as specified in the executed estimate and agreed scope documents.]`

  // Maintenance from first template
  const firstMaint = tpl.maintenanceTemplates?.[0]
  const maintText = firstMaint
    ? (Array.isArray(firstMaint.requirements)
        ? firstMaint.requirements.join('\n\n')
        : firstMaint.requirements || '')
    : `Customer shall maintain the Work in accordance with industry-standard maintenance practices appropriate for the materials installed.`

  // Warranty exclusions — merge AI exclusions into the standard list
  const aiExclusions = (tpl.warrantyExclusions || []).map((ex, i) => {
    const text = typeof ex === 'string' ? ex : (ex.condition || ex.exclusion || JSON.stringify(ex))
    const explanation = typeof ex === 'object' ? (ex.explanation || ex.reason || '') : ''
    return `(${String.fromCharCode(106 + i)}) ${text}${explanation ? ` — ${explanation}` : ''}`
  })

  const cd = co.contractDefaults || {}

  // Generate the full contract with sample data
  const contractData = {
    contractNum: 'CON-XXXX',
    customerName: '[CUSTOMER FULL LEGAL NAME]',
    customerAddress: '[CUSTOMER ADDRESS]',
    customerPhone: '[CUSTOMER PHONE]',
    customerEmail: '[CUSTOMER EMAIL]',
    projectAddress: '[PROJECT SITE ADDRESS]',
    workType: tpl.tradeLabel || tpl.trade || co.jobTypes?.[0] || 'Residential Improvement',
    scope: sampleScope,
    price: 0,
    deposit: 0,
    paymentVersion,
    startDate: '',
    estimatedCompletion: '[To be determined at time of scheduling]',
    durationDays: 'X',
    warrantyYears: 5,
    maintenanceItems: maintText,
    paymentMethods: Object.entries(co.paymentConfig || {})
      .filter(([, v]) => v.enabled)
      .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
      .join(', ') || 'Check, Zelle, ACH',
    lateFee: cd.lateFee || 1.5,
    adminFee: cd.adminFee || 75,
    responseDays: cd.coResponseDays || 5,
    disputeMethod: cd.disputeMethod || 'mediation_arbitration',
    includePermits: false,
    includeHOA: false,
    curePeriod: cd.curePeriod || 10,
    insurancePerOccurrence: '1,000,000',
    insuranceAggregate: '2,000,000',
    projectState: co.primaryState || 'SC',
    lienDays: cd.lienDays || 90,
    milestones: [],
  }

  const contractText = generateContractText(contractData, co)

  // Build warranty exclusions note for the review footer
  const aiExclusionsNote = aiExclusions.length > 0
    ? `\n\n⚠ NOTE FOR ATTORNEY: The following warranty exclusions are AI-generated and specific to this trade. They supplement Article 5.3 of the standard contract above:\n\n${aiExclusions.join('\n\n')}`
    : ''

  // Build CO scenarios note
  const coScenarios = (tpl.commonChangeOrders || []).map((co, i) => {
    const type = co.type === 'required_a' ? 'Required — Life/Safety/Code (Track A)'
      : co.type === 'required_b' ? 'Required — Warranty Impact (Track B)'
      : 'Customer-Requested (CO-02)'
    return `Scenario ${i + 1} — ${type}\nTrigger: ${co.scenario || ''}\n${co.descriptionTemplate ? `Description template: ${co.descriptionTemplate}` : ''}${co.conditionTemplate ? `\nCondition: ${co.conditionTemplate}` : ''}${co.correctiveTemplate ? `\nCorrective work: ${co.correctiveTemplate}` : ''}${co.consequenceTemplate ? `\nConsequence if declined: ${co.consequenceTemplate}` : ''}`
  }).join('\n\n─────────────────────────────────────────\n\n')

  const coNote = coScenarios
    ? `\n\n⚠ NOTE FOR ATTORNEY: The following pre-written Change Order language is AI-generated and specific to this trade. These templates are used when creating change orders in the field:\n\n${coScenarios}`
    : ''

  const fullReviewText = contractText + aiExclusionsNote + coNote

  // Render as printable HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Contract Review Draft — ${co.coName || 'Your Company'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: white; }
    .page { max-width: 8.5in; margin: 0 auto; padding: 0.75in 1in; }

    /* Print bar */
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #050d1f; color: white; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; gap: 16px; }
    .print-bar-left p { font-family: system-ui, sans-serif; font-size: 12px; color: rgba(255,255,255,0.7); }
    .print-bar-left strong { color: white; font-size: 13px; }
    .print-bar-right { display: flex; gap: 10px; flex-shrink: 0; }
    .print-btn { font-family: system-ui, sans-serif; background: white; color: #050d1f; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .print-btn.secondary { background: transparent; color: white; border: 1px solid rgba(255,255,255,0.4); }
    .spacer { height: 56px; }

    /* Review draft banner */
    .draft-banner { background: #fff3cd; border: 2px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin-bottom: 32px; }
    .draft-banner h2 { font-family: system-ui, sans-serif; font-size: 14px; font-weight: 800; color: #92400e; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    .draft-banner p { font-size: 10.5pt; line-height: 1.6; color: #78350f; margin-bottom: 6px; }
    .draft-banner p:last-child { margin-bottom: 0; }

    /* Contract body */
    .contract-body { white-space: pre-wrap; font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.7; color: #000; }

    /* Watermark on print */
    @media print {
      .print-bar, .spacer { display: none !important; }
      .page { padding: 0.6in 0.85in; }
      body::before {
        content: 'ATTORNEY REVIEW DRAFT — NOT FOR EXECUTION';
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 48px; font-weight: 900;
        color: rgba(0,0,0,0.06);
        white-space: nowrap;
        pointer-events: none;
        z-index: 1000;
        font-family: system-ui, sans-serif;
      }
    }

    /* Attorney sign-off block */
    .signoff { margin-top: 48px; border-top: 2px solid #000; padding-top: 24px; }
    .signoff h3 { font-size: 13pt; font-weight: bold; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
    .signoff p { font-size: 10pt; color: #444; margin-bottom: 20px; line-height: 1.5; }
    .sig-line { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 22px; }
    .sig-line .line { flex: 1; border-bottom: 1px solid #000; height: 28px; }
    .sig-line .label { font-size: 9.5pt; color: #333; white-space: nowrap; }

    .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 9pt; color: #888; text-align: center; line-height: 1.5; }
  </style>
</head>
<body>

<div class="print-bar">
  <div class="print-bar-left">
    <strong>ATTORNEY REVIEW DRAFT — ${co.coName || 'Your Company'}</strong>
    <p>This is a review copy only. Not for execution. Placeholder values marked in [brackets].</p>
  </div>
  <div class="print-bar-right">
    <button class="print-btn secondary" onclick="window.close()">Close</button>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>
</div>
<div class="spacer"></div>

<div class="page">

  <div class="draft-banner">
    <h2>⚖ Attorney Review Draft — Not for Execution</h2>
    <p><strong>Purpose:</strong> This document is provided for attorney review only. It represents the complete contract as it will appear to customers, with your company settings and AI-generated trade language integrated throughout.</p>
    <p><strong>Customer placeholders:</strong> Fields marked in [BRACKETS] are filled in by the contract wizard at time of job creation. These are placeholder values for review purposes only.</p>
    <p><strong>AI-generated language:</strong> Sections containing trade-specific scope, maintenance requirements, warranty exclusions, and change order scenarios were generated by an AI system. Your attorney should review all language for legal sufficiency in your state and trade before you unlock this template for use.</p>
    <p><strong>To print or save as PDF:</strong> Click the "Print / Save as PDF" button above. In the print dialog, select "Save as PDF" to save a copy to send to your attorney.</p>
  </div>

  <div class="contract-body">${escapeHtml(fullReviewText)}</div>

  <div class="signoff">
    <h3>Attorney Review and Approval</h3>
    <p>By signing below, the undersigned attorney confirms that they have reviewed the complete contract document above, including all standard articles and all AI-generated trade-specific language, and that in their professional judgment the language is legally sufficient for use in the state(s) indicated.</p>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Attorney signature</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Printed name</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Bar number &amp; state(s) of licensure</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Law firm / practice name</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Date reviewed</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Approved for use in the following state(s)</div>
    </div>
    <div class="sig-line">
      <div class="line"></div>
      <div class="label">Any conditions or required modifications (attach addendum if needed)</div>
    </div>
  </div>

  <div class="footer">
    ATTORNEY REVIEW DRAFT — ${co.coName || 'Your Company'} — Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} — CONFIDENTIAL — NOT FOR EXECUTION
  </div>

</div>

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}

function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/━/g, '─')
}
