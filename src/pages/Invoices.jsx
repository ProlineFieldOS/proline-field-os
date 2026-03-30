import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import { sendInvoiceEmail } from '../lib/sendEmail'
import { fmtM, fmtDShort, cn, uid } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Button, Card, Badge, Modal, FormGroup, Input, Select, Empty } from '../components/ui'
import { toast } from '../components/ui'

const PAYMENT_METHODS = ['Check','Zelle','Cash App','Venmo','ACH','Cash','Credit Card','PayPal','Other']

// ── Invoice PDF print ─────────────────────────────────────────────────────────
function printInvoice(inv, job, settings) {
  const paid = (inv.payments || []).reduce((s, p) => s + (p.amount || 0), 0)
  const balance = (inv.amount || 0) - paid
  const fmtM = (n) => n?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'
  const fmtD = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'

  const paymentRows = (inv.payments || []).map(p =>
    `<tr>
      <td class="label">${fmtD(p.date)}</td>
      <td>${p.method || ''} ${p.memo ? `(${p.memo})` : ''}</td>
      <td class="right green">${fmtM(p.amount)}</td>
    </tr>`
  ).join('')

  const cfg = settings?.paymentConfig || {}
  const methods = []
  if (cfg.check?.enabled) methods.push(`Check payable to ${settings?.coName || 'contractor'}`)
  if (cfg.zelle?.enabled && cfg.zelle.handle) methods.push(`Zelle: ${cfg.zelle.handle}`)
  if (cfg.venmo?.enabled && cfg.venmo.handle) methods.push(`Venmo: ${cfg.venmo.handle}`)
  if (cfg.cashapp?.enabled && cfg.cashapp.handle) methods.push(`Cash App: ${cfg.cashapp.handle}`)
  if (cfg.ach?.enabled && cfg.ach.handle) methods.push(`ACH: ${cfg.ach.handle}`)
  const payInstructions = methods.length
    ? `<div class="payment-box"><strong>Payment accepted via:</strong><br>${methods.join(' &nbsp;·&nbsp; ')}</div>`
    : ''

  const w = window.open('', '_blank')
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>${inv.num}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; margin: 0; padding: 0.75in 1in; max-width: 8.5in; }
    .header { border-bottom: 3pt solid #050d1f; padding-bottom: 12pt; margin-bottom: 20pt; display: flex; justify-content: space-between; align-items: flex-end; }
    .co-name { font-size: 16pt; font-weight: bold; color: #050d1f; margin: 0; }
    .co-sub { font-size: 9pt; color: #555; margin: 3pt 0 0; }
    .inv-label { font-size: 9pt; color: #888; text-align: right; }
    .inv-num { font-size: 18pt; font-weight: bold; color: #050d1f; margin: 2pt 0 0; text-align: right; }
    .meta { background: #f8f8f8; border: 1pt solid #e0e0e0; padding: 10pt 12pt; margin-bottom: 16pt; font-size: 10pt; }
    .meta p { margin: 0 0 4pt; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16pt; }
    th { background: #050d1f; color: white; padding: 7pt 10pt; font-size: 9pt; text-align: left; }
    th.right { text-align: right; }
    td { padding: 7pt 10pt; border-bottom: 1pt solid #eee; font-size: 10pt; }
    td.right { text-align: right; }
    td.green { color: #15803d; font-weight: bold; }
    td.label { color: #555; font-size: 9pt; }
    .subtotal-row td { background: #f8f8f8; font-weight: bold; }
    .balance-row td { background: ${balance > 0 ? '#fdf2f2' : '#f0fdf4'}; font-weight: bold; font-size: 13pt; color: ${balance > 0 ? '#c00' : '#15803d'}; }
    .payment-box { background: #f0fdf4; border: 1pt solid #bbf7d0; padding: 10pt 12pt; font-size: 9.5pt; margin-bottom: 16pt; color: #166534; }
    .paid-stamp { background: #f0fdf4; border: 1pt solid #bbf7d0; padding: 12pt; text-align: center; font-size: 13pt; font-weight: bold; color: #15803d; margin-bottom: 16pt; }
    .footer { border-top: 1pt solid #ddd; margin-top: 24pt; padding-top: 8pt; text-align: center; font-size: 8.5pt; color: #999; }
    @media print { body { padding: 0; } @page { margin: 0.75in 1in; } }
  </style>
  </head><body>
  <div class="header">
    <div>
      <p class="co-name">${settings?.coName || 'Contractor'}</p>
      ${settings?.coPhone ? `<p class="co-sub">${settings.coPhone}</p>` : ''}
      ${settings?.coEmail ? `<p class="co-sub">${settings.coEmail}</p>` : ''}
      ${settings?.license ? `<p class="co-sub">License: ${settings.license}</p>` : ''}
    </div>
    <div>
      <p class="inv-label">INVOICE</p>
      <p class="inv-num">${inv.num}</p>
      ${inv.dueDate ? `<p style="text-align:right;font-size:9pt;color:#555;margin:3pt 0 0">Due: ${fmtD(inv.dueDate)}</p>` : ''}
    </div>
  </div>

  <div class="meta">
    <p><strong>Client:</strong> ${job?.client || inv.clientName || '—'}</p>
    ${job?.address ? `<p><strong>Project address:</strong> ${job.address}</p>` : ''}
    ${job?.type ? `<p><strong>Work type:</strong> ${job.type}</p>` : ''}
    <p><strong>Invoice date:</strong> ${fmtD(inv.created)}</p>
  </div>

  <table>
    <thead>
      <tr><th>Description</th><th class="right">Amount</th></tr>
    </thead>
    <tbody>
      <tr>
        <td>${job?.type || 'Services rendered'}${job?.address ? ' — ' + job.address.split(',')[0] : ''}</td>
        <td class="right">${fmtM(inv.amount)}</td>
      </tr>
    </tbody>
  </table>

  ${(inv.payments || []).length > 0 ? `
  <table>
    <thead><tr><th>Date</th><th>Payment</th><th class="right">Amount</th></tr></thead>
    <tbody>
      ${paymentRows}
      <tr class="subtotal-row">
        <td colspan="2">Total received</td>
        <td class="right green">${fmtM(paid)}</td>
      </tr>
    </tbody>
  </table>` : ''}

  <table>
    <tbody>
      <tr class="balance-row">
        <td colspan="${(inv.payments || []).length > 0 ? 2 : 1}">Balance due</td>
        <td class="right">${fmtM(balance)}</td>
      </tr>
    </tbody>
  </table>

  ${balance > 0 ? payInstructions : '<div class="paid-stamp">✓ Paid in Full — Thank You!</div>'}

  <div class="footer">${settings?.coName || 'Contractor'} · Powered by Proline Field OS</div>
  </body></html>`)
  w.document.close()
  w.print()
}

// ── Component ────────────────────────────────────────────────────────────────
export default function Invoices() {
  const [params] = useSearchParams()
  const { invoices, jobs, settings, addInvoice, addPayment } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [showPayment, setShowPayment] = useState(null)
  const [showEmail, setShowEmail] = useState(null) // invoice id
  const [filter, setFilter] = useState('all')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ jobId: params.get('jobId') || '', amount: '', dueDate: '', notes: '' })
  const [payForm, setPayForm] = useState({ amount: '', method: 'Check', memo: '', date: new Date().toISOString().split('T')[0] })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const setP = k => e => setPayForm(f => ({ ...f, [k]: e.target.value }))

  const filtered = invoices.filter(inv => filter === 'all' || inv.status === filter)

  const totalOutstanding = invoices.reduce((s, inv) => {
    const paid = (inv.payments || []).reduce((p, pm) => p + (pm.amount || 0), 0)
    return s + Math.max(0, (inv.amount || 0) - paid)
  }, 0)

  const handleCreate = () => {
    if (!form.amount || !form.jobId) { toast('Job and amount required'); return }
    const job = jobs.find(j => j.id === form.jobId)
    addInvoice({ ...form, amount: parseFloat(form.amount), clientName: job?.client || '' })
    setShowNew(false)
    setForm({ jobId: '', amount: '', dueDate: '', notes: '' })
    toast('Invoice created')
  }

  const handlePayment = (invId) => {
    if (!payForm.amount || parseFloat(payForm.amount) <= 0) { toast('Amount required'); return }
    addPayment(invId, { ...payForm, amount: parseFloat(payForm.amount), id: uid() })
    setShowPayment(null)
    setPayForm({ amount: '', method: 'Check', memo: '', date: new Date().toISOString().split('T')[0] })
    toast('Payment recorded')
  }

  const handleSendEmail = async () => {
    const inv = invoices.find(i => i.id === showEmail)
    if (!inv) return
    const job = jobs.find(j => j.id === inv.jobId)
    const email = job?.email
    if (!email) { toast('No customer email on this job — add it in Job Detail first', 'error'); return }
    setSending(true)
    const result = await sendInvoiceEmail({
      customerEmail: email,
      customerName: job?.client,
      invoice: inv,
      job,
      settings,
      portalToken: job?.portalToken,
    })
    setSending(false)
    if (result.success) {
      toast(`Invoice emailed to ${email}`)
      setShowEmail(null)
    } else {
      toast(result.error?.includes('BREVO') || result.error?.includes('configured')
        ? 'Email not configured — add BREVO_API_KEY in Vercel env vars'
        : `Send failed: ${result.error}`, 'error')
    }
  }

  const emailInv = showEmail ? invoices.find(i => i.id === showEmail) : null
  const emailJob = emailInv ? jobs.find(j => j.id === emailInv.jobId) : null

  return (
    <>
      <TopNav title="Invoices" actions={<button onClick={() => setShowNew(true)} className="text-white text-xl font-light">+</button>} />
      <div className="px-4 pt-4">
        {/* Outstanding KPI */}
        <div className="bg-navy rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-white/50 text-xs font-medium">Outstanding balance</p>
            <p className="text-white/40 text-xs">{invoices.filter(i => i.status !== 'paid').length} open invoices</p>
          </div>
          <p className="text-white font-display font-bold text-3xl">{fmtM(totalOutstanding)}</p>
          {invoices.length > 0 && (
            <div className="flex gap-4 mt-2.5 pt-2.5 border-t border-white/10">
              <div><p className="text-white/40 text-[10px]">Total invoiced</p><p className="text-white/80 text-xs font-semibold">{fmtM(invoices.reduce((s, i) => s + (i.amount || 0), 0))}</p></div>
              <div><p className="text-white/40 text-[10px]">Collected</p><p className="text-emerald-400 text-xs font-semibold">{fmtM(invoices.reduce((s, i) => s + (i.payments || []).reduce((p, pm) => p + (pm.amount || 0), 0), 0))}</p></div>
              <div><p className="text-white/40 text-[10px]">Invoices</p><p className="text-white/80 text-xs font-semibold">{invoices.length}</p></div>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {[['all', 'All'], ['unpaid', 'Unpaid'], ['partial', 'Partial'], ['paid', 'Paid']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors flex-shrink-0',
                filter === v ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200')}>
              {l}
            </button>
          ))}
        </div>

        {/* Invoice list */}
        {filtered.length === 0
          ? <Empty icon="💰" title="No invoices" action={<Button variant="primary" onClick={() => setShowNew(true)}>+ New invoice</Button>} />
          : <div className="space-y-2.5 pb-8">
              {filtered.map(inv => {
                const paid = (inv.payments || []).reduce((s, p) => s + (p.amount || 0), 0)
                const balance = (inv.amount || 0) - paid
                const job = jobs.find(j => j.id === inv.jobId)
                return (
                  <Card key={inv.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-navy">{inv.num}</span>
                          <Badge variant={inv.status === 'paid' ? 'green' : inv.status === 'partial' ? 'amber' : 'red'}>{inv.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{job?.client || inv.clientName || '—'}</p>
                        {inv.dueDate && <p className="text-xs text-gray-400">Due {fmtDShort(inv.dueDate)}</p>}
                        {(inv.payments || []).length > 0 && <p className="text-xs text-emerald-600 mt-1">{fmtM(paid)} received</p>}

                        {/* Action row */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <button
                            onClick={() => printInvoice(inv, job, settings)}
                            className="text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 active:scale-95 transition-transform"
                          >
                            Print / PDF
                          </button>
                          <button
                            onClick={() => setShowEmail(inv.id)}
                            className="text-xs text-brand border border-brand/30 rounded-lg px-2.5 py-1 active:scale-95 transition-transform"
                          >
                            Email to customer
                          </button>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-navy text-sm">{fmtM(balance)}</p>
                        <p className="text-xs text-gray-400">of {fmtM(inv.amount)}</p>
                        {balance > 0 && (
                          <button
                            onClick={() => { setShowPayment(inv.id); setPayForm(f => ({ ...f, amount: String(balance) })) }}
                            className="mt-1.5 text-xs font-semibold text-brand border border-brand rounded-lg px-2 py-1 active:scale-95 transition-transform"
                          >
                            Record payment
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
        }
      </div>

      {/* New invoice modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New invoice"
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" className="flex-[2]" onClick={handleCreate}>Create</Button></div>}>
        <div className="space-y-3">
          <FormGroup label="Job *"><Select value={form.jobId} onChange={set('jobId')}><option value="">Select job…</option>{jobs.map(j => <option key={j.id} value={j.id}>{j.client} — {j.address?.split(',')[0]}</option>)}</Select></FormGroup>
          <FormGroup label="Amount *"><Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" /></FormGroup>
          <FormGroup label="Due date"><Input type="date" value={form.dueDate} onChange={set('dueDate')} /></FormGroup>
          <FormGroup label="Notes"><Input value={form.notes} onChange={set('notes')} placeholder="Optional" /></FormGroup>
        </div>
      </Modal>

      {/* Record payment modal */}
      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title="Record payment"
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setShowPayment(null)}>Cancel</Button><Button variant="primary" className="flex-[2]" onClick={() => handlePayment(showPayment)}>Record</Button></div>}>
        <div className="space-y-3">
          <FormGroup label="Amount *"><Input type="number" value={payForm.amount} onChange={setP('amount')} placeholder="0.00" /></FormGroup>
          <FormGroup label="Payment method"><Select value={payForm.method} onChange={setP('method')}>{PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}</Select></FormGroup>
          <FormGroup label="Date"><Input type="date" value={payForm.date} onChange={setP('date')} /></FormGroup>
          <FormGroup label="Memo"><Input value={payForm.memo} onChange={setP('memo')} placeholder="Check #1042, deposit ref…" /></FormGroup>
        </div>
      </Modal>

      {/* Email invoice modal */}
      <Modal open={!!showEmail} onClose={() => setShowEmail(null)} title="Email invoice to customer">
        <div className="p-4 space-y-4">
          {emailJob?.email
            ? <>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Send <strong>{emailInv?.num}</strong> to <strong>{emailJob.client}</strong> at <span className="text-brand">{emailJob.email}</span>.<br /><br />
                  The email will include the invoice amount, payment history, balance due, accepted payment methods, and a link to their project portal.
                </p>
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowEmail(null)}>Cancel</Button>
                  <Button variant="primary" className="flex-[2]" onClick={handleSendEmail} disabled={sending}>
                    {sending ? 'Sending…' : 'Send invoice'}
                  </Button>
                </div>
              </>
            : <div className="space-y-3">
                <p className="text-sm text-gray-600 leading-relaxed">
                  No customer email address is saved on this job. Add one in <strong>Job Detail → Overview</strong> to enable invoice email.
                </p>
                <Button variant="ghost" className="w-full" onClick={() => setShowEmail(null)}>Close</Button>
              </div>
          }
        </div>
      </Modal>
    </>
  )
}
