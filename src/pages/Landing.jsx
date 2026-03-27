import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

const FEATURES = [
  { icon: '📋', title: 'Estimates & contracts', desc: 'Generate SC-compliant residential contracts in minutes — 3 payment versions, attorney acknowledgment gate, customer e-signature.' },
  { icon: '🔗', title: 'Customer portal', desc: 'Every job gets a persistent link. Customers see their estimate, contract, job status, and balance — nothing internal ever leaks through.' },
  { icon: '⚠️', title: 'Change order system', desc: 'Track-A stops work for life/safety issues. Track-B flags warranty impacts. All three CO types auto-advance the job lifecycle.' },
  { icon: '📦', title: 'Materials tracking', desc: 'Per-job materials list with storage locations (internal only), order/delivery status, and cost rollup that feeds your P&L.' },
  { icon: '💬', title: 'Communication log', desc: 'Log every call, text, email, and site visit. Follow-up reminders. Complete internal record — completely hidden from customers.' },
  { icon: '📊', title: 'Real P&L per job', desc: 'Revenue, materials cost, expenses, gross profit, and margin on every job overview. Plus business-level P&L with a 6-month trend chart.' },
]

const TIERS = [
  { name: 'Solo', price: 19, desc: 'Solo operator', crew: '3 crew members', color: 'border-gray-200', cta: 'Start free trial' },
  { name: 'Crew', price: 39, desc: 'Small crew (2–5)', crew: '10 crew members', color: 'border-brand', popular: true, cta: 'Start free trial' },
  { name: 'Company', price: 69, desc: 'Multi-crew operation', crew: 'Unlimited crew', color: 'border-gray-200', cta: 'Start free trial' },
]

const LIFECYCLE = [
  'New lead', 'Consult scheduled', 'Estimate sent', 'Estimate approved',
  'Contract signed', 'Deposit received', 'Materials ordered', 'Scheduled',
  'In progress', 'Punch list', 'Final invoice', 'Paid', 'Closed',
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white" style={{fontFamily:"'Inter','system-ui',sans-serif"}}>

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg" style={{color:'#050D1F'}}>Proline</span>
            <span className="font-bold text-lg" style={{color:'#0A3EF8'}}>Field OS</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/auth')} className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </button>
            <button onClick={() => navigate('/auth?signup=1')}
              className="text-sm font-semibold text-white px-4 py-2 rounded-lg transition-colors"
              style={{background:'#0A3EF8'}}>
              Start free trial
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-200">
          Built for residential service contractors
        </div>
        <h1 className="text-4xl font-bold leading-tight mb-4" style={{color:'#050D1F'}}>
          Stop running your business<br />on paper and group texts
        </h1>
        <p className="text-lg text-gray-500 mb-8 leading-relaxed max-w-xl mx-auto">
          Proline Field OS handles every stage from first lead to lien waiver — estimates, contracts, materials, payments, and crew — in one mobile-first app built for contractors, not accountants.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => navigate('/auth?signup=1')}
            className="text-base font-semibold text-white px-7 py-3.5 rounded-xl transition-all active:scale-[0.99]"
            style={{background:'#050D1F'}}>
            Start free trial — no card required
          </button>
          <button onClick={() => navigate('/auth')}
            className="text-base font-semibold px-7 py-3.5 rounded-xl border border-gray-200 text-gray-700 hover:border-gray-300 transition-colors">
            Sign in
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free during beta · Cancel anytime · Your data stays yours</p>
      </section>

      {/* Lifecycle strip */}
      <section className="py-8 border-y border-gray-100 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-4">Full job lifecycle — tracked automatically</p>
              {/* Mobile: 2-column pill grid */}
          <div className="grid grid-cols-2 sm:hidden gap-2">
            {LIFECYCLE.map((stage, i) => (
              <div key={stage} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100">
                <div className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{background: i < 4 ? '#0A3EF8' : i < 8 ? '#854F0B' : '#27500A'}} />
                <span className="text-[11px] text-gray-600 font-medium truncate">{stage}</span>
              </div>
            ))}
          </div>
          {/* Desktop: horizontal flow */}
          <div className="hidden sm:flex items-center flex-wrap gap-x-0 gap-y-3 justify-center">
            {LIFECYCLE.map((stage, i) => (
              <div key={stage} className="flex items-center flex-shrink-0">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full"
                    style={{background: i < 4 ? '#0A3EF8' : i < 8 ? '#854F0B' : '#27500A'}} />
                  <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap font-medium">{stage}</span>
                </div>
                {i < LIFECYCLE.length - 1 && <div className="w-5 h-px bg-gray-200 flex-shrink-0 mb-3" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{color:'#050D1F'}}>Everything your business needs. Nothing it doesn't.</h2>
        <p className="text-gray-500 text-center mb-12">Purpose-built for the job lifecycle of a residential contractor — not adapted from a generic CRM.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <div key={f.title} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-sm mb-1.5" style={{color:'#050D1F'}}>{f.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portal callout */}
      <section className="py-12 px-4" style={{background:'#050D1F'}}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Customer portal</p>
          <h2 className="text-2xl font-bold text-white mb-4">Your customers stay informed.<br />Your internal data stays private.</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xl mx-auto mb-6">
            Every job generates a persistent customer portal link. They see estimates, contracts, job status, and account balance. Communication logs, storage locations, internal notes, and task lists are stripped before they see a single byte.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto text-center">
            {['Estimate approval','Contract signing','Job progress','Account balance'].map(item => (
              <div key={item} className="bg-white/5 rounded-xl p-3">
                <p className="text-white text-xs font-medium">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 max-w-3xl mx-auto" id="pricing">
        <h2 className="text-2xl font-bold text-center mb-2" style={{color:'#050D1F'}}>Simple, honest pricing</h2>
        <p className="text-gray-500 text-center mb-10">Unlimited jobs on every plan. No per-job fees. No hidden charges.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {TIERS.map(tier => (
            <div key={tier.name} className={cn('rounded-2xl border-2 p-6 relative', tier.color, tier.popular ? 'shadow-md' : '')}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold text-white px-3 py-1 rounded-full" style={{background:'#0A3EF8'}}>
                  Most popular
                </div>
              )}
              <p className="font-bold text-lg mb-0.5" style={{color:'#050D1F'}}>{tier.name}</p>
              <p className="text-gray-400 text-xs mb-4">{tier.desc}</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-3xl font-bold" style={{color:'#050D1F'}}>${tier.price}</span>
                <span className="text-gray-400 text-sm">/mo</span>
              </div>
              <p className="text-xs text-gray-500 mb-5">{tier.crew} · Unlimited jobs</p>
              <button onClick={() => navigate('/auth?signup=1')}
                className={cn('w-full py-2.5 rounded-xl text-sm font-semibold transition-colors', tier.popular ? 'text-white' : 'border border-gray-200 text-gray-700 hover:border-gray-300')}
                style={tier.popular ? {background:'#050D1F'} : {}}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">All plans include customer portals, AI contract template setup, and e-signatures. Free during beta.</p>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 text-center max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-3" style={{color:'#050D1F'}}>Ready to run a tighter operation?</h2>
        <p className="text-gray-500 text-sm mb-6">Set up takes 10 minutes. Your first contract takes 5.</p>
        <button onClick={() => navigate('/auth?signup=1')}
          className="text-base font-semibold text-white px-8 py-3.5 rounded-xl transition-all"
          style={{background:'#050D1F'}}>
          Create your free account
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-sm" style={{color:'#050D1F'}}>Proline</span>
            <span className="font-bold text-sm" style={{color:'#0A3EF8'}}>Field OS</span>
          </div>
          <p className="text-xs text-gray-400">Built for residential contractors · Proline Gutter & Exteriors · {new Date().getFullYear()}</p>
          <button onClick={() => navigate('/auth')} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Sign in →
          </button>
        </div>
      </footer>
    </div>
  )
}
