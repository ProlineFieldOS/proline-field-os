// Generates a full printable HTML document of the AI contract template
// Opens in a new tab — user can Ctrl+P / Cmd+P to print or save as PDF

export function printTemplate(template, meta, companyName) {
  if (!template) return

  const coType = (co) => {
    if (co.type === 'required_a') return 'Required — Life/Safety/Code (Track A)'
    if (co.type === 'required_b') return 'Required — Warranty Impact (Track B)'
    return 'Customer-Requested (CO-02)'
  }

  const section = (title, content) => `
    <div class="section">
      <h2>${title}</h2>
      ${content}
    </div>`

  const field = (label, value) => value ? `
    <div class="field">
      <span class="label">${label}:</span>
      <span class="value">${value}</span>
    </div>` : ''

  const textBlock = (label, text) => text ? `
    <div class="text-block">
      ${label ? `<div class="block-label">${label}</div>` : ''}
      <div class="block-content">${(text || '').replace(/\n/g, '<br>')}</div>
    </div>` : ''

  const scopeTemplates = (template.scopeTemplates || []).map((t, i) => `
    <div class="item">
      <div class="item-title">Scope Template ${i + 1}: ${t.jobType || ''}</div>
      ${textBlock('', t.scope || '')}
    </div>`).join('')

  const maintenanceTemplates = (template.maintenanceTemplates || []).map((t, i) => {
    const reqs = Array.isArray(t.requirements) ? t.requirements.join('\n\n') : (t.requirements || '')
    return `
    <div class="item">
      <div class="item-title">${t.jobType || `Maintenance Set ${i + 1}`}</div>
      ${textBlock('', reqs)}
    </div>`
  }).join('')

  const warrantyExclusions = (template.warrantyExclusions || []).map((ex, i) => {
    const condition = typeof ex === 'string' ? ex : (ex.condition || ex.exclusion || JSON.stringify(ex))
    const explanation = typeof ex === 'object' ? (ex.explanation || ex.reason || '') : ''
    return `
    <div class="item">
      <div class="item-number">${i + 1}.</div>
      <div>
        <div class="item-title">${condition}</div>
        ${explanation ? `<div class="item-desc">${explanation}</div>` : ''}
      </div>
    </div>`
  }).join('')

  const changeOrders = (template.commonChangeOrders || []).map((co, i) => `
    <div class="item">
      <div class="item-title">Change Order Scenario ${i + 1} — ${coType(co)}</div>
      <div class="item-desc italic">${co.scenario || ''}</div>
      ${textBlock('Description template', co.descriptionTemplate || '')}
      ${co.conditionTemplate ? textBlock('Condition', co.conditionTemplate) : ''}
      ${co.correctiveTemplate ? textBlock('Corrective work required', co.correctiveTemplate) : ''}
      ${co.consequenceTemplate ? textBlock('Consequence if declined', co.consequenceTemplate) : ''}
    </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AI Contract Template — ${companyName || 'Review Copy'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #111; background: white; padding: 0; }
    .page { max-width: 8.5in; margin: 0 auto; padding: 0.75in 1in; }

    /* Cover header */
    .cover { border-bottom: 3px solid #050d1f; padding-bottom: 24px; margin-bottom: 32px; }
    .cover h1 { font-size: 22pt; font-weight: bold; color: #050d1f; margin-bottom: 6px; }
    .cover .subtitle { font-size: 13pt; color: #333; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .meta-item { font-size: 10pt; }
    .meta-item .k { font-weight: bold; color: #444; }

    /* Attorney notice */
    .notice { background: #fff8e1; border: 1.5px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin-bottom: 28px; }
    .notice strong { color: #92400e; }
    .notice p { font-size: 10pt; line-height: 1.6; color: #78350f; margin-top: 6px; }

    /* Sections */
    .section { margin-bottom: 32px; page-break-inside: avoid; }
    .section h2 { font-size: 13pt; font-weight: bold; color: #050d1f; border-bottom: 1.5px solid #ddd; padding-bottom: 6px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Field rows */
    .field { display: flex; gap: 8px; margin-bottom: 4px; font-size: 10.5pt; }
    .field .label { font-weight: bold; min-width: 160px; color: #444; }
    .field .value { color: #111; }

    /* Text blocks */
    .text-block { margin: 10px 0; }
    .block-label { font-size: 9pt; font-weight: bold; color: #666; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px; }
    .block-content { font-size: 10.5pt; line-height: 1.65; background: #f9fafb; border-left: 3px solid #d1d5db; padding: 10px 14px; border-radius: 0 4px 4px 0; white-space: pre-wrap; }

    /* Items */
    .item { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; display: flex; gap: 10px; }
    .item:last-child { border-bottom: none; }
    .item-number { font-weight: bold; color: #6b7280; min-width: 20px; margin-top: 1px; }
    .item-title { font-size: 11pt; font-weight: bold; color: #111; margin-bottom: 6px; }
    .item-desc { font-size: 10pt; color: #555; margin-bottom: 8px; line-height: 1.5; }
    .italic { font-style: italic; }

    /* Signature block */
    .sig-block { margin-top: 40px; border-top: 2px solid #050d1f; padding-top: 20px; }
    .sig-block h3 { font-size: 11pt; font-weight: bold; margin-bottom: 16px; }
    .sig-line { display: flex; align-items: flex-end; gap: 12px; margin-bottom: 20px; }
    .sig-line .line { flex: 1; border-bottom: 1px solid #333; height: 24px; }
    .sig-line .caption { font-size: 9pt; color: #666; white-space: nowrap; }

    /* Print styles */
    @media print {
      body { padding: 0; }
      .page { padding: 0.6in 0.85in; }
      .no-print { display: none !important; }
      .section { page-break-inside: avoid; }
      .item { page-break-inside: avoid; }
    }

    /* Screen-only print button */
    .print-bar { position: fixed; top: 0; left: 0; right: 0; background: #050d1f; color: white; padding: 10px 24px; display: flex; align-items: center; justify-content: space-between; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
    .print-bar p { font-family: system-ui, sans-serif; font-size: 13px; color: rgba(255,255,255,0.8); }
    .print-btn { font-family: system-ui, sans-serif; background: white; color: #050d1f; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer; }
    .print-bar-spacer { height: 48px; }
  </style>
</head>
<body>

  <div class="print-bar no-print">
    <p>AI Contract Template Review Copy — ${companyName || ''}</p>
    <button class="print-btn" onclick="window.print()">🖨 Print / Save as PDF</button>
  </div>
  <div class="print-bar-spacer no-print"></div>

  <div class="page">
    <div class="cover">
      <h1>AI-Generated Contract Template</h1>
      <div class="subtitle">Review Copy — ${companyName || 'Your Company'}</div>
      <div class="meta-grid">
        ${field('Trade', template.tradeLabel || template.trade || '')}
        ${field('Generated for', template.generatedFor || companyName || '')}
        ${field('Generated', meta?.generatedAt ? new Date(meta.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '')}
        ${field('Status', meta?.status === 'active' ? 'Active — Attorney Reviewed' : meta?.status === 'active_unreviewed' ? 'Active — Self-Authorized (No Attorney Review)' : 'Draft — Pending Review')}
        ${meta?.reviewedBy ? field('Reviewed by', meta.reviewedBy) : ''}
        ${meta?.reviewDate ? field('Review date', new Date(meta.reviewDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })) : ''}
      </div>
    </div>

    <div class="notice">
      <strong>⚖ Attorney Review Notice</strong>
      <p>This document was generated by an AI system and has not been independently verified by a licensed attorney. All language in this document should be reviewed by a licensed attorney in your state before use in any contracts with customers. This document is provided as a starting point only and does not constitute legal advice. Proline Field OS and its creators make no warranty as to the legal sufficiency of this language in any jurisdiction.</p>
    </div>

    ${section('Scope Boilerplate',
      textBlock('This text appears at the beginning of every contract scope section', template.scopeBoilerplate || '')
    )}

    ${template.scopeTemplates?.length ? section('Scope Templates by Job Type',
      `<p style="font-size:10pt;color:#666;margin-bottom:14px;">Variables in <strong>{{double brackets}}</strong> are filled in by the contract wizard when creating a new contract.</p>` + scopeTemplates
    ) : ''}

    ${template.warrantyBoilerplate ? section('Warranty Boilerplate',
      textBlock('General warranty language included in all contracts', template.warrantyBoilerplate)
    ) : ''}

    ${template.maintenanceTemplates?.length ? section('Maintenance Requirements (Warranty Conditions)',
      `<p style="font-size:10pt;color:#666;margin-bottom:14px;">Customers must follow these requirements to keep their warranty valid.</p>` + maintenanceTemplates
    ) : ''}

    ${template.warrantyExclusions?.length ? section('Warranty Exclusions',
      `<p style="font-size:10pt;color:#666;margin-bottom:14px;">These conditions void the warranty and should be disclosed to customers prior to work.</p>
      <div style="display:flex;flex-direction:column;gap:0">` + warrantyExclusions + `</div>`
    ) : ''}

    ${template.commonChangeOrders?.length ? section('Pre-Written Change Order Scenarios',
      `<p style="font-size:10pt;color:#666;margin-bottom:14px;">These scenarios are pre-loaded into the change order wizard. Language can be edited before issuing.</p>` + changeOrders
    ) : ''}

    ${template.insuranceRecommendation ? section('Insurance Recommendation',
      textBlock('', template.insuranceRecommendation)
    ) : ''}

    <div class="sig-block no-print">
      <h3>Attorney Review Sign-Off</h3>
      <div class="sig-line">
        <div class="line"></div>
        <div class="caption">Attorney signature</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="caption">Attorney printed name & bar number</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="caption">Date reviewed</div>
      </div>
      <div class="sig-line">
        <div class="line"></div>
        <div class="caption">Approved for use in (states)</div>
      </div>
    </div>

    <div style="margin-top:40px;padding-top:16px;border-top:1px solid #ddd;font-size:9pt;color:#999;text-align:center;">
      Printed from Proline Field OS · ${companyName || ''} · ${new Date().toLocaleDateString('en-US', { year:'numeric',month:'long',day:'numeric' })} · CONFIDENTIAL — ATTORNEY REVIEW COPY
    </div>
  </div>

</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
}
