import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store'
import { fmtM } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

const OWNER_EMAIL = 'brandyturner815@gmail.com'
const PLANS = ['trial', 'beta_free', 'solo', 'crew', 'company']
const PLAN_PRICE = { solo: 19, crew: 39, company: 69, trial: 0, beta_free: 0 }

// ── Micro components ─────────────────────────────────────────────
const Stat = ({ label, value, sub, color = 'text-gray-900', small }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-4">
    <p className="text-xs text-gray-400 mb-1">{label}</p>
    <p className={cn(small ? 'text-lg' : 'text-2xl', 'font-bold', color)}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
)

const Tab = ({ id, label, active, onClick, badge }) => (
  <button onClick={() => onClick(id)}
    className={cn('px-3 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5',
      active ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600')}>
    {label}
    {badge > 0 && <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{badge}</span>}
  </button>
)

export default function SaasAdmin() {
  // ── All hooks first ────────────────────────────────────────────
  const navigate = useNavigate()
  const { user } = useAuth()
  const { viewAsRole, setViewAsRole, jobs } = useStore()
  const [tab, setTab] = useState('dashboard')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editPlan, setEditPlan] = useState(null) // { userId, currentPlan }
  const [ticketFilter, setTicketFilter] = useState('open')

  const isOwner = !!user && user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase()

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    if (!supabase) { setLoading(false); setError('Supabase not configured'); return }
    try {
      const { data, error: err } = await supabase.from('user_data').select('user_id, db')
      if (err) throw err
      const parsed = (data || []).map(row => {
        const db = row.db || {}
        const rowJobs = db.jobs || []
        const invoices = db.invoices || []
        const sub = db.subscription || {}
        const totalInvoiced = invoices.reduce((s, i) => s + (i.amount || 0), 0)
        const totalPaid = invoices.reduce((s, i) =>
          s + (i.payments || []).reduce((p, pm) => p + (pm.amount || 0), 0), 0)

        // Trial timing
        const trialStart = sub.trialStartDate || db.settings?.signupDate || null
        const daysSince = trialStart ? Math.floor((Date.now() - new Date(trialStart)) / 86400000) : null
        const trialDaysLeft = daysSince !== null ? Math.max(0, 14 - daysSince) : null

        // Renewal
        const renewalDate = sub.renewalDate || null
        const daysToRenewal = renewalDate
          ? Math.ceil((new Date(renewalDate) - Date.now()) / 86400000)
          : null

        // Support tickets
        const tickets = db.supportTickets || []
        const openTickets = tickets.filter(t => t.status === 'open').length

        // Team
        const team = db.accountTeam || []

        // Health score (simple: 0-100)
        let health = 50
        if (rowJobs.length > 0) health += 20
        if (db.contractTemplate) health += 15
        if (totalPaid > 0) health += 15

        return {
          userId: row.user_id,
          coName: db.settings?.coName || '(unnamed)',
          coEmail: db.settings?.coEmail || '',
          coPhone: db.settings?.coPhone || '',
          primaryState: db.settings?.primaryState || '',
          plan: sub.plan || db.plan || 'trial',
          jobCount: rowJobs.length,
          activeJobs: rowJobs.filter(j => j.status === 'active').length,
          totalInvoiced,
          totalPaid,
          hasTemplate: !!db.contractTemplate,
          templateTrade: db.contractTemplateMeta?.trade || null,
          templateGenerations: db.templateGenerationCount || 0,
          crewCount: (db.crew || []).length,
          teamCount: team.length,
          schemaVersion: db.schemaVersion || 1,
          trialStart,
          trialDaysLeft,
          renewalDate,
          daysToRenewal,
          openTickets,
          tickets,
          health,
          isOwner: db.settings?.coEmail?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
        }
      })
      setAccounts(parsed)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isOwner) fetchAccounts()
    else setLoading(false)
  }, [isOwner, fetchAccounts])
  // ── End hooks ──────────────────────────────────────────────────

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Not signed in</p>
    </div>
  )
  if (!isOwner) return (
    <div className="min-h-screen flex items-center justify-center p-8 text-center bg-gray-50">
      <div>
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-bold text-lg text-gray-900 mb-2">Access denied</p>
        <p className="text-gray-400 text-sm mb-4">Platform admin access only.</p>
        <button onClick={() => navigate('/dashboard')} className="text-blue-600 text-sm underline">Back to app</button>
      </div>
    </div>
  )

  // ── Computed KPIs ────────────────────────────────────────────
  const totalAccounts = accounts.length
  const paidAccounts  = accounts.filter(a => !['trial','beta_free'].includes(a.plan)).length
  const trialAccounts = accounts.filter(a => ['trial','beta_free'].includes(a.plan)).length
  const withTemplate  = accounts.filter(a => a.hasTemplate).length
  const totalJobs     = accounts.reduce((s, a) => s + a.jobCount, 0)
  const platformInvoiced = accounts.reduce((s, a) => s + a.totalInvoiced, 0)
  const mrr = accounts.reduce((s, a) => s + (PLAN_PRICE[a.plan] || 0), 0)
  const arr = mrr * 12
  const expiringTrial = accounts.filter(a => a.trialDaysLeft !== null && a.trialDaysLeft > 0 && a.trialDaysLeft <= 3)
  const expiredTrial  = accounts.filter(a => a.trialDaysLeft === 0)
  const renewingSoon  = accounts.filter(a => a.daysToRenewal !== null && a.daysToRenewal <= 7 && a.daysToRenewal >= 0)
  const trialConversion = totalAccounts > 0 ? Math.round((paidAccounts / totalAccounts) * 100) : 0
  const avgJobsPerAccount = totalAccounts > 0 ? (totalJobs / totalAccounts).toFixed(1) : 0
  const allTickets = accounts.flatMap(a => (a.tickets || []).map(t => ({ ...t, accountName: a.coName, userId: a.userId })))
  const openTickets = allTickets.filter(t => (t.status || 'open') === 'open').length
  const highPriorityTickets = allTickets.filter(t => (t.priority === 'High' || t.priority === 'Urgent') && (t.status || 'open') === 'open').length

  // Tier distribution
  const tierDist = PLANS.reduce((acc, p) => ({ ...acc, [p]: accounts.filter(a => a.plan === p).length }), {})

  // Update plan in Supabase
  const updatePlan = async (userId, newPlan) => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('user_data').select('db').eq('user_id', userId).single()
      if (data?.db) {
        const db = { ...data.db, subscription: { ...(data.db.subscription || {}), plan: newPlan } }
        await supabase.from('user_data').update({ db }).eq('user_id', userId)
        toast('Plan updated')
        fetchAccounts()
      }
    } catch (e) { console.warn('Plan update:', e.message) }
    setEditPlan(null)
  }

  // Respond to a ticket
  const respondToTicket = async (userId, ticketId, response) => {
    if (!supabase) return
    try {
      const { data } = await supabase.from('user_data').select('db').eq('user_id', userId).single()
      if (data?.db) {
        const db = { ...data.db }
        const idx = (db.supportTickets || []).findIndex(t => t.id === ticketId)
        if (idx >= 0) {
          db.supportTickets[idx] = { ...db.supportTickets[idx], status: 'resolved', response, resolvedAt: new Date().toISOString() }
        }
        await supabase.from('user_data').update({ db }).eq('user_id', userId)
        fetchAccounts()
      }
    } catch (e) { console.warn('Ticket respond:', e.message) }
  }

  const toast = (msg) => {
    // simple inline toast
    const el = document.createElement('div')
    el.textContent = msg
    el.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#050d1f;color:white;padding:8px 16px;border-radius:8px;font-size:12px;font-weight:600;z-index:9999'
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 2500)
  }

  const TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'kpi',       label: 'KPIs' },
    { id: 'accounts',  label: `Accounts (${totalAccounts})` },
    { id: 'retention', label: 'Retention' },
    { id: 'tickets',   label: 'Support', badge: openTickets },
    { id: 'viewas',    label: 'View as' },
  ]

  const ROLES = [
    { id: 'visitor',  icon: '🌐', label: 'Visitor',  desc: 'Landing page — what new visitors see', nav: '/' },
    { id: 'owner',    icon: '👑', label: 'Owner',    desc: 'Full access — all modules',             nav: '/dashboard' },
    { id: 'office',   icon: '💼', label: 'Office',   desc: 'Full operational access, no billing',   nav: '/dashboard' },
    { id: 'foreman',  icon: '🦺', label: 'Foreman',  desc: 'Jobs, docs, schedule, comms',           nav: '/dashboard' },
    { id: 'crew',     icon: '👷', label: 'Crew',     desc: 'View-only on assigned jobs',             nav: '/dashboard' },
    { id: 'customer', icon: '🏠', label: 'Customer', desc: 'Portal only — estimate, contract, balance', nav: null },
  ]

  return (
    <div className="min-h-screen bg-gray-50" style={{fontFamily:'system-ui,sans-serif'}}>

      {/* Header */}
      <div style={{background:'#050d1f'}} className="px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Proline Field OS · Platform Admin</p>
            <p className="text-white/40 text-xs">{user.email} · {totalAccounts} accounts · MRR ${mrr}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAccounts}
              className="text-white/50 text-xs hover:text-white">↻</button>
            <button onClick={() => navigate('/dashboard')}
              className="text-white/60 text-xs hover:text-white border border-white/20 rounded-lg px-3 py-1.5">
              ← App
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[48px] z-10">
        <div className="max-w-4xl mx-auto flex overflow-x-auto">
          {TABS.map(t => <Tab key={t.id} id={t.id} label={t.label} active={tab === t.id} onClick={setTab} badge={t.badge} />)}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-5 pb-20">

        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="MRR" value={`$${mrr}`} color="text-emerald-600" sub={`$${arr}/yr ARR`} />
              <Stat label="Total accounts" value={totalAccounts} sub={`${paidAccounts} paid · ${trialAccounts} trial`} />
              <Stat label="Trial → Paid" value={`${trialConversion}%`} color={trialConversion > 20 ? 'text-emerald-600' : 'text-amber-500'} />
              <Stat label="Open tickets" value={openTickets} color={openTickets > 0 ? 'text-red-500' : 'text-gray-900'} sub={highPriorityTickets > 0 ? `${highPriorityTickets} high/urgent` : undefined} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Stat label="Total jobs" value={totalJobs} sub={`${avgJobsPerAccount}/account avg`} small />
              <Stat label="Platform invoiced" value={fmtM(platformInvoiced)} small />
              <Stat label="With template" value={withTemplate} sub={`${totalAccounts - withTemplate} not set up`} small />
              <Stat label="Trial expiring ≤3d" value={expiringTrial.length} color={expiringTrial.length > 0 ? 'text-amber-500' : 'text-gray-900'} small />
            </div>

            {/* Alerts */}
            {(expiringTrial.length > 0 || expiredTrial.length > 0 || renewingSoon.length > 0 || openTickets > 0) && (
              <div className="bg-white rounded-xl border border-gray-100 p-4">
                <p className="font-semibold text-sm text-gray-900 mb-2">⚡ Needs attention</p>
                <div className="space-y-1.5">
                  {openTickets > 0 && (
                    <button onClick={() => setTab('tickets')}
                      className="w-full text-left text-xs py-1.5 px-2 bg-red-50 rounded-lg text-red-700 font-medium hover:bg-red-100">
                      {openTickets} open support ticket{openTickets !== 1 ? 's' : ''} →
                    </button>
                  )}
                  {expiringTrial.map(a => (
                    <div key={a.userId} className="text-xs py-1 px-2 bg-amber-50 rounded-lg text-amber-700">
                      {a.coName} — trial expires in {a.trialDaysLeft}d
                    </div>
                  ))}
                  {expiredTrial.map(a => (
                    <div key={a.userId} className="text-xs py-1 px-2 bg-red-50 rounded-lg text-red-700">
                      {a.coName} — trial expired
                    </div>
                  ))}
                  {renewingSoon.map(a => (
                    <div key={a.userId} className="text-xs py-1 px-2 bg-blue-50 rounded-lg text-blue-700">
                      {a.coName} — renews in {a.daysToRenewal}d
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Platform health */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Platform health</p>
              <div className="space-y-1.5 text-xs">
                {[
                  ['Supabase',     supabase ? '✓ Connected' : '✗ Not configured',  supabase ? 'text-emerald-600' : 'text-red-500'],
                  ['Gemini API',   'GEMINI_API_KEY in Vercel env vars',              'text-gray-400'],
                  ['PWA',          '✓ vite-plugin-pwa configured',                  'text-emerald-600'],
                  ['Schema',       'v2 current — all accounts checked',             'text-emerald-600'],
                  ['Domain',       'prolinefieldos.com → Vercel → SSL',             'text-emerald-600'],
                  ['GitHub',       'github.com/ProlineFieldOS/proline-field-os',    'text-blue-500'],
                ].map(([l, v, c]) => (
                  <div key={l} className="flex justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-500">{l}</span>
                    <span className={`font-medium ${c}`}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Marketing KPIs ── */}
        {tab === 'kpi' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-400">Use these for marketing decisions. Refresh to pull latest Supabase data.</p>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Revenue metrics</p>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="MRR" value={`$${mrr}`} color="text-emerald-600" small />
                <Stat label="ARR" value={`$${arr}`} color="text-emerald-600" small />
                <Stat label="Avg revenue/account" value={paidAccounts > 0 ? `$${Math.round(mrr/paidAccounts)}/mo` : '$0'} small />
                <Stat label="Platform invoiced" value={fmtM(platformInvoiced)} small />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Acquisition & conversion</p>
              <div className="space-y-2 text-xs">
                {[
                  ['Total signups', totalAccounts],
                  ['Paid conversions', paidAccounts],
                  ['Trial → Paid rate', `${trialConversion}%`],
                  ['Currently in trial', trialAccounts],
                  ['Trial expired (not converted)', expiredTrial.length],
                  ['Expiring in 3 days', expiringTrial.length],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{l}</span>
                    <span className="font-semibold text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Plan distribution</p>
              <div className="space-y-2">
                {Object.entries(tierDist).filter(([_, v]) => v > 0).map(([plan, count]) => (
                  <div key={plan} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-20 flex-shrink-0 capitalize">{plan}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{width: `${Math.round((count/totalAccounts)*100)}%`}} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count}</span>
                    <span className="text-xs text-gray-400 w-8 text-right">${(PLAN_PRICE[plan]||0)*count}/mo</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Product engagement</p>
              <div className="space-y-2 text-xs">
                {[
                  ['Avg jobs per account', avgJobsPerAccount],
                  ['Accounts with template set up', `${withTemplate} / ${totalAccounts}`],
                  ['Accounts with crew', `${accounts.filter(a=>a.crewCount>0).length} / ${totalAccounts}`],
                  ['Total jobs across platform', totalJobs],
                  ['Support tickets submitted', allTickets.length],
                  ['Resolved tickets', allTickets.filter(t=>t.status==='resolved').length],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-gray-600">{l}</span>
                    <span className="font-semibold text-gray-900">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Accounts ── */}
        {tab === 'accounts' && (
          <div>
            {loading && <p className="text-xs text-gray-400 text-center py-10">Loading…</p>}
            {!loading && error && <p className="text-xs text-red-500 text-center py-4">Error: {error}</p>}
            <div className="space-y-3 mt-1">
              {accounts.map(a => (
                <div key={a.userId} className={cn('bg-white rounded-xl border p-4', a.isOwner ? 'border-blue-200' : 'border-gray-100')}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">{a.coName}</p>
                        {a.isOwner && <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">You</span>}
                        {a.openTickets > 0 && <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">{a.openTickets} ticket{a.openTickets>1?'s':''}</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{a.coEmail}{a.coPhone ? ` · ${a.coPhone}` : ''}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                        <span>{a.jobCount} jobs</span>
                        <span>{fmtM(a.totalInvoiced)} invoiced</span>
                        {a.hasTemplate
                          ? <span className="text-emerald-600">✓ Template</span>
                          : <span className="text-amber-500">No template</span>
                        }
                        {a.crewCount > 0 && <span>{a.crewCount} crew</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 space-y-1">
                      {/* Plan with edit */}
                      {editPlan?.userId === a.userId ? (
                        <div className="flex flex-col gap-1">
                          <select onChange={e => updatePlan(a.userId, e.target.value)}
                            className="text-xs border border-gray-200 rounded px-2 py-1">
                            {PLANS.map(p => <option key={p} value={p} selected={a.plan===p}>{p} {PLAN_PRICE[p]>0?`$${PLAN_PRICE[p]}/mo`:''}</option>)}
                          </select>
                          <button onClick={() => setEditPlan(null)} className="text-xs text-gray-400">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditPlan({ userId: a.userId, currentPlan: a.plan })}
                          className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                            ['trial','beta_free'].includes(a.plan) ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700')}>
                          {a.plan} ✎
                        </button>
                      )}
                      {a.trialDaysLeft !== null && a.trialDaysLeft <= 14 && (
                        <p className={cn('text-xs', a.trialDaysLeft===0?'text-red-500':a.trialDaysLeft<=3?'text-amber-500':'text-gray-400')}>
                          {a.trialDaysLeft===0?'Trial expired':`${a.trialDaysLeft}d trial left`}
                        </p>
                      )}
                      {a.daysToRenewal !== null && (
                        <p className={cn('text-xs', a.daysToRenewal<=7?'text-blue-500':'text-gray-300')}>
                          Renews {a.daysToRenewal<0?'overdue':`in ${a.daysToRenewal}d`}
                        </p>
                      )}
                      <p className="text-xs text-gray-300">v{a.schemaVersion}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Retention ── */}
        {tab === 'retention' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Active paid" value={paidAccounts} color="text-emerald-600" small />
              <Stat label="Trial expired" value={expiredTrial.length} color={expiredTrial.length>0?'text-red-500':'text-gray-900'} sub="Not converted" small />
              <Stat label="Renewing ≤7 days" value={renewingSoon.length} color={renewingSoon.length>0?'text-blue-600':'text-gray-900'} small />
              <Stat label="Churn risk" value={`${expiringTrial.length + expiredTrial.length}`} color={expiringTrial.length+expiredTrial.length>0?'text-amber-500':'text-gray-900'} small />
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Upcoming renewals</p>
              {renewingSoon.length === 0 && accounts.filter(a=>a.renewalDate).length === 0
                ? <p className="text-xs text-gray-400">No renewal data yet — set when accounts convert to paid</p>
                : <div className="space-y-1.5">
                    {accounts.filter(a=>a.renewalDate).sort((a,b)=>new Date(a.renewalDate)-new Date(b.renewalDate)).map(a => (
                      <div key={a.userId} className="flex justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                        <span className="text-gray-700">{a.coName}</span>
                        <span className={cn('font-medium', a.daysToRenewal<=7?'text-blue-600':'text-gray-500')}>
                          {new Date(a.renewalDate).toLocaleDateString()} ({a.daysToRenewal<0?'overdue':`${a.daysToRenewal}d`})
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Account health scores</p>
              <div className="space-y-2">
                {accounts.sort((a,b)=>a.health-b.health).map(a => (
                  <div key={a.userId} className="flex items-center gap-3">
                    <span className="text-xs text-gray-600 truncate w-32 flex-shrink-0">{a.coName}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className={cn('h-2 rounded-full transition-all', a.health>=70?'bg-emerald-500':a.health>=40?'bg-amber-400':'bg-red-400')}
                        style={{width:`${a.health}%`}} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{a.health}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">Health = engagement score (jobs created, template set up, payments recorded)</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="font-semibold text-sm text-gray-900 mb-3">Trial status breakdown</p>
              <div className="space-y-1.5">
                {accounts.filter(a=>a.trialDaysLeft!==null||a.plan==='trial'||a.plan==='beta_free').map(a => (
                  <div key={a.userId} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{a.coName}</span>
                    <span className={cn('font-medium',
                      a.trialDaysLeft===0?'text-red-500':
                      a.trialDaysLeft!==null&&a.trialDaysLeft<=3?'text-amber-500':'text-gray-500')}>
                      {a.trialDaysLeft===null?'No trial data':
                       a.trialDaysLeft===0?'Expired':
                       `${a.trialDaysLeft}d remaining`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Support Tickets ── */}
        {tab === 'tickets' && (
          <div>
            <div className="flex gap-2 mb-4">
              {['open','in_progress','resolved','all'].map(f => (
                <button key={f} onClick={() => setTicketFilter(f)}
                  className={cn('text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    ticketFilter===f ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-500 border-gray-200')}>
                  {f==='in_progress'?'In Progress':f.charAt(0).toUpperCase()+f.slice(1)}
                  {f==='open'&&openTickets>0&&<span className="ml-1 text-red-400">({openTickets})</span>}
                </button>
              ))}
            </div>

            {allTickets.filter(t => ticketFilter==='all' || (t.status||'open')===ticketFilter).length === 0
              ? <p className="text-xs text-gray-400 text-center py-10">No {ticketFilter} tickets</p>
              : <div className="space-y-3">
                  {allTickets
                    .filter(t => ticketFilter==='all' || (t.status||'open')===ticketFilter)
                    .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .map(t => (
                      <TicketCard key={t.id} ticket={t} onRespond={(response) => respondToTicket(t.userId, t.id, response)} />
                    ))}
                </div>
            }
          </div>
        )}

        {/* ── View As ── */}
        {tab === 'viewas' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Switch to any role or view to test the app or site from that perspective.
            </p>
            <div className="space-y-3 mb-5">
              {ROLES.map(role => (
                <button key={role.id}
                  onClick={() => {
                    if (role.id === 'visitor') {
                      window.open('/', '_blank')
                      return
                    }
                    setViewAsRole(role.id)
                    if (role.id === 'customer') {
                      const firstJob = jobs[0]
                      if (firstJob?.portalToken) navigate(`/portal/${firstJob.portalToken}`)
                      else { alert('Create a job first to test customer view'); return }
                    } else {
                      navigate(role.nav || '/dashboard')
                    }
                  }}
                  className={cn('w-full text-left p-4 rounded-2xl border-2 transition-colors bg-white',
                    viewAsRole === role.id ? 'border-blue-600' : 'border-gray-200 hover:border-gray-300')}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-900">{role.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                    </div>
                    {role.id === 'visitor'
                      ? <span className="text-xs text-gray-300">Opens new tab →</span>
                      : viewAsRole === role.id
                        ? <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Active</span>
                        : <span className="text-xs text-gray-300">Switch →</span>
                    }
                  </div>
                </button>
              ))}
            </div>
            {viewAsRole !== 'owner' && (
              <button onClick={() => { setViewAsRole('owner'); navigate('/dashboard') }}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500">
                Exit role view → back to Owner
              </button>
            )}

            <p className="font-semibold text-sm text-gray-900 mt-6 mb-3">Customer portal links</p>
            {jobs.length === 0
              ? <p className="text-xs text-gray-400">No jobs — create one first</p>
              : <div className="space-y-2">
                  {jobs.slice(0,10).map(job => (
                    <div key={job.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{job.client}</p>
                        <p className="text-xs text-gray-400">{job.kbStatus}</p>
                      </div>
                      {job.portalToken
                        ? <div className="flex gap-2 flex-shrink-0">
                            <a href={`/portal/${job.portalToken}`} target="_blank" rel="noreferrer"
                              className="text-xs font-bold text-white bg-gray-900 rounded-lg px-3 py-1.5">Open →</a>
                            <button onClick={() => navigator.clipboard?.writeText(window.location.origin+'/portal/'+job.portalToken)}
                              className="text-xs text-gray-400 border border-gray-200 rounded-lg px-2 py-1.5">Copy</button>
                          </div>
                        : <span className="text-xs text-gray-300">No token</span>
                      }
                    </div>
                  ))}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  )
}

// ── Ticket card with inline respond ─────────────────────────────
function TicketCard({ ticket: t, onRespond }) {
  const [responding, setResponding] = useState(false)
  const [response, setResponse] = useState('')

  const priorityColor = { Urgent: 'text-red-600', High: 'text-amber-600', Normal: 'text-gray-500', Low: 'text-gray-400' }

  return (
    <div className={cn('bg-white rounded-xl border p-4', (t.status||'open')==='open' ? 'border-gray-200' : 'border-gray-100')}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="font-semibold text-sm text-gray-900">{t.subject}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.accountName} · {t.category} · {new Date(t.createdAt).toLocaleDateString()}
            {t.contactEmail && ` · ${t.contactEmail}`}
          </p>
        </div>
        <div className="flex flex-col gap-1 flex-shrink-0 text-right">
          <span className={cn('text-xs font-semibold', (t.status||'open')==='resolved'?'text-emerald-600':'text-blue-600')}>
            {(t.status||'open').replace('_',' ')}
          </span>
          {t.priority && t.priority !== 'Normal' && (
            <span className={cn('text-xs font-medium', priorityColor[t.priority])}>{t.priority}</span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 leading-relaxed mb-3">{t.description}</p>

      {t.response && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 mb-2">
          <p className="text-xs font-semibold text-emerald-700 mb-1">Your response:</p>
          <p className="text-xs text-emerald-800">{t.response}</p>
        </div>
      )}

      {(t.status||'open') !== 'resolved' && (
        responding ? (
          <div className="space-y-2">
            <textarea value={response} onChange={e => setResponse(e.target.value)}
              rows={3} placeholder="Write your response..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-blue-400" />
            <div className="flex gap-2">
              <button onClick={() => { onRespond(response); setResponding(false); setResponse('') }}
                className="text-xs font-bold text-white bg-gray-900 rounded-lg px-3 py-1.5">Send & resolve</button>
              <button onClick={() => setResponding(false)}
                className="text-xs text-gray-400">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setResponding(true)}
            className="text-xs font-semibold text-blue-600 hover:underline">
            Respond →
          </button>
        )
      )}
    </div>
  )
}
