// Client-side email helper — calls /api/send-email

const BASE = window.location.origin

export async function sendPortalLink({ customerEmail, customerName, portalToken, jobAddress, jobType, companyName, companyPhone }) {
  const portalUrl = `${BASE}/portal/${portalToken}`

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="border-bottom:3px solid #050d1f;padding-bottom:16px;margin-bottom:24px">
        <h2 style="color:#050d1f;margin:0;font-size:20px">${companyName || 'Your Contractor'}</h2>
        ${companyPhone ? `<p style="color:#666;margin:4px 0;font-size:14px">${companyPhone}</p>` : ''}
      </div>
      <p style="font-size:16px;color:#111">Hi ${customerName || 'there'},</p>
      <p style="color:#444;line-height:1.6">
        Your project portal is ready. You can view your estimate, contract, project status, and account balance at any time using the secure link below.
      </p>
      ${jobAddress ? `<p style="color:#666;font-size:14px"><strong>Project:</strong> ${jobAddress}${jobType ? ` — ${jobType}` : ''}</p>` : ''}
      <div style="text-align:center;margin:32px 0">
        <a href="${portalUrl}" style="background:#050d1f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          View Your Project Portal →
        </a>
      </div>
      <p style="color:#666;font-size:13px">
        Or copy this link: <a href="${portalUrl}" style="color:#0a3ef8">${portalUrl}</a>
      </p>
      <p style="color:#666;font-size:13px">
        This link is unique to your project and will remain active throughout the life of your job. 
        No account or password required.
      </p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px;text-align:center">
        ${companyName || 'Your Contractor'} · Powered by Proline Field OS
      </p>
    </div>
  `

  return callEmailAPI({
    to: customerEmail,
    toName: customerName,
    subject: `Your project portal — ${jobAddress || companyName || 'Project update'}`,
    html,
    fromName: companyName,
  })
}

export async function sendInviteEmail({ toEmail, toName, role, companyName, invitedByName, inviteLink }) {
  const roleLabels = { owner: 'Owner', office: 'Office', foreman: 'Foreman', crew: 'Crew Member' }
  const roleLabel = roleLabels[role] || role

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="border-bottom:3px solid #050d1f;padding-bottom:16px;margin-bottom:24px">
        <h2 style="color:#050d1f;margin:0;font-size:20px">Proline Field OS</h2>
        <p style="color:#666;margin:4px 0;font-size:14px">Job management for residential contractors</p>
      </div>
      <p style="font-size:16px;color:#111">Hi ${toName || 'there'},</p>
      <p style="color:#444;line-height:1.6">
        <strong>${invitedByName || 'Your company'}</strong> has invited you to join <strong>${companyName || 'their account'}</strong> on Proline Field OS as a <strong>${roleLabel}</strong>.
      </p>
      <p style="color:#444;line-height:1.6">
        Proline Field OS is the job management system for ${companyName || 'your company'}. 
        You'll use it to view jobs, schedules, and project documents.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${inviteLink || BASE}" style="background:#050d1f;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;display:inline-block">
          Accept Invitation →
        </a>
      </div>
      ${inviteLink ? `<p style="color:#666;font-size:13px">Or copy: <a href="${inviteLink}" style="color:#0a3ef8">${inviteLink}</a></p>` : ''}
      <p style="color:#888;font-size:13px">This invitation was sent by ${invitedByName || 'your account owner'}. If you weren't expecting this, you can ignore this email.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px;text-align:center">Proline Field OS · prolinefieldos.com</p>
    </div>
  `

  return callEmailAPI({
    to: toEmail,
    toName,
    subject: `You've been invited to join ${companyName || 'a company'} on Proline Field OS`,
    html,
    fromName: companyName || 'Proline Field OS',
  })
}

async function callEmailAPI({ to, toName, subject, html, fromName, fromEmail }) {
  try {
    const resp = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, toName, subject, html, fromName, fromEmail }),
    })
    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error || 'Email send failed')
    return { success: true, data }
  } catch (e) {
    console.error('sendEmail error:', e.message)
    return { success: false, error: e.message }
  }
}

export async function sendInvoiceEmail({ customerEmail, customerName, invoice, job, settings, portalToken }) {
  const BASE = window.location.origin
  const paid = (invoice.payments || []).reduce((s, p) => s + (p.amount || 0), 0)
  const balance = (invoice.amount || 0) - paid
  const portalUrl = portalToken ? `${BASE}/portal/${portalToken}` : null
  const fmtM = (n) => n?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

  const paymentsRows = (invoice.payments || []).map(p =>
    `<tr><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;color:#444;font-size:13px">${fmtD(p.date)}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;color:#444;font-size:13px">${p.method || ''}</td><td style="padding:6px 8px;border-bottom:1px solid #f0f0f0;text-align:right;color:#16a34a;font-size:13px;font-weight:600">${fmtM(p.amount)}</td></tr>`
  ).join('')

  const paymentInstructionsHtml = (() => {
    const cfg = settings?.paymentConfig || {}
    const methods = []
    if (cfg.check?.enabled) methods.push(`<li>Check payable to <strong>${settings?.coName || 'contractor'}</strong></li>`)
    if (cfg.zelle?.enabled && cfg.zelle.handle) methods.push(`<li>Zelle: <strong>${cfg.zelle.handle}</strong></li>`)
    if (cfg.venmo?.enabled && cfg.venmo.handle) methods.push(`<li>Venmo: <strong>${cfg.venmo.handle}</strong></li>`)
    if (cfg.cashapp?.enabled && cfg.cashapp.handle) methods.push(`<li>Cash App: <strong>${cfg.cashapp.handle}</strong></li>`)
    if (cfg.ach?.enabled && cfg.ach.handle) methods.push(`<li>ACH/Bank Transfer: <strong>${cfg.ach.handle}</strong></li>`)
    if (!methods.length) return ''
    return `
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-top:20px">
        <p style="font-weight:bold;color:#15803d;margin:0 0 8px">Payment accepted via:</p>
        <ul style="margin:0;padding-left:20px;color:#166534;font-size:14px;line-height:1.8">${methods.join('')}</ul>
      </div>`
  })()

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px">
      <div style="border-bottom:3px solid #050d1f;padding-bottom:16px;margin-bottom:24px">
        <h2 style="color:#050d1f;margin:0;font-size:20px">${settings?.coName || 'Your Contractor'}</h2>
        ${settings?.coPhone ? `<p style="color:#666;margin:4px 0;font-size:13px">${settings.coPhone}</p>` : ''}
        ${settings?.coEmail ? `<p style="color:#666;margin:0;font-size:13px">${settings.coEmail}</p>` : ''}
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px">
        <tr>
          <td>
            <p style="margin:0;font-size:13px;color:#888">INVOICE</p>
            <p style="margin:2px 0 0;font-size:22px;font-weight:bold;color:#050d1f">${invoice.num}</p>
          </td>
          <td style="text-align:right">
            ${invoice.dueDate ? `<p style="margin:0;font-size:12px;color:#888">Due date</p><p style="margin:2px 0 0;font-size:14px;font-weight:600;color:${balance > 0 ? '#dc2626' : '#16a34a'}">${fmtD(invoice.dueDate)}</p>` : ''}
          </td>
        </tr>
      </table>

      <div style="background:#f8fafc;border-radius:8px;padding:16px;margin-bottom:20px;font-size:13px;color:#444">
        <p style="margin:0 0 4px"><strong>Client:</strong> ${customerName || job?.client || '—'}</p>
        ${job?.address ? `<p style="margin:0 0 4px"><strong>Project:</strong> ${job.address}</p>` : ''}
        ${job?.type ? `<p style="margin:0"><strong>Work type:</strong> ${job.type}</p>` : ''}
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-bottom:20px">
        <thead>
          <tr style="background:#050d1f">
            <th style="padding:10px 12px;text-align:left;color:white;font-size:12px;font-weight:600">Description</th>
            <th style="padding:10px 12px;text-align:right;color:white;font-size:12px;font-weight:600">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#111">${job?.type || 'Services rendered'} — ${job?.address?.split(',')[0] || ''}</td>
            <td style="padding:12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;font-weight:600;color:#111">${fmtM(invoice.amount)}</td>
          </tr>
          ${paymentsRows ? `
          <tr><td colspan="2" style="padding:8px 12px;background:#f8fafc;font-size:12px;color:#666;font-weight:600">PAYMENTS RECEIVED</td></tr>
          ${paymentsRows}` : ''}
        </tbody>
        <tfoot>
          <tr style="background:${balance > 0 ? '#fef2f2' : '#f0fdf4'}">
            <td style="padding:12px;font-weight:bold;font-size:15px;color:${balance > 0 ? '#dc2626' : '#16a34a'}">Balance due</td>
            <td style="padding:12px;text-align:right;font-weight:bold;font-size:18px;color:${balance > 0 ? '#dc2626' : '#16a34a'}">${fmtM(balance)}</td>
          </tr>
        </tfoot>
      </table>

      ${balance > 0 ? paymentInstructionsHtml : `
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;text-align:center">
          <p style="color:#16a34a;font-weight:bold;margin:0;font-size:15px">✓ Paid in full — Thank you!</p>
        </div>`}

      ${portalUrl ? `
        <div style="text-align:center;margin:28px 0 16px">
          <a href="${portalUrl}" style="background:#050d1f;color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block">
            View Your Project Portal →
          </a>
        </div>` : ''}

      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px;text-align:center">${settings?.coName || 'Your Contractor'} · Powered by Proline Field OS</p>
    </div>
  `

  return callEmailAPI({
    to: customerEmail,
    toName: customerName,
    subject: `Invoice ${invoice.num} — ${balance > 0 ? `${fmtM(balance)} due` : 'Paid in full'} — ${settings?.coName || 'Your Contractor'}`,
    html,
    fromName: settings?.coName,
  })
}
