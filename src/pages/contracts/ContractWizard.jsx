import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { STATES, fmtM, dollarWords, uid } from '../../lib/utils'
import { TopNav } from '../../components/layout/AppShell'
import { ProgressBar, RadioCard, FormGroup, Input, Select, Textarea, Button } from '../../components/ui'
import { toast } from '../../components/ui'

const STEPS = ['Payment structure','Parties','Scope of work','Financial terms','Warranty','Permits & HOA','Insurance & review']

const MAINT_PRESETS = {
  'Gutters & Downspouts': 'Gutters & Downspouts: Clean minimum twice annually (spring and fall). Inspect and reseal all end caps, miters, and outlet connections annually. Confirm downspouts discharge a minimum of 4 feet from foundation.',
  'Fascia & Soffit': 'Fascia & Soffit: Inspect annually for pest intrusion, rot, or paint failure. Repaint or reseal any exposed wood surfaces as needed.',
  'Roofing': 'Roofing: Inspect annually for loose, cracked, or missing shingles. Clear all debris from valleys and gutters. Ensure all penetration flashings remain sealed.',
  'Siding': 'Siding: Inspect annually for caulking gaps or paint failure. Re-caulk as needed. Do not allow soil contact with siding material.',
  'Deck': 'Deck: Inspect annually for rot, fastener failure, or structural movement. Apply preservative or sealer to exposed wood surfaces annually.',
  'HVAC': 'HVAC: Replace filters per manufacturer schedule (minimum quarterly). Schedule annual professional inspection. Keep condenser unit clear of debris.',
}

export default function ContractWizard() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { jobs, contracts, settings, _nextCon } = useStore()
  const job = jobs.find(j => j.id === jobId) || {}
  const cd = settings.contractDefaults || {}

  const [step, setStep] = useState(1)
  const [d, setD] = useState({
    paymentVersion: cd.defaultPayment === 'deposit_draws' ? 'B' : cd.defaultPayment === 'deposit_milestone' ? 'C' : 'A',
    projectState: job.state || cd.governingState || 'SC',
    customerName: job.client || '',
    coCustomerName: '',
    customerAddress: job.address || '',
    customerPhone: job.phone || '',
    customerEmail: job.email || '',
    projectAddress: job.address || '',
    workType: job.type || '',
    startDate: job.startDate || '',
    estimatedCompletion: '',
    scope: job.notes || '',
    price: job.contractValue || '',
    deposit: '',
    lateFee: cd.lateFee || 1.5,
    responseDays: cd.coResponseDays || 5,
    warrantyYears: 5,
    maintenanceItems: '',
    includePermits: true,
    contractorPullsPermits: true,
    permitFeesIncluded: true,
    includeHOA: false,
    insurancePerOccurrence: '1,000,000',
    insuranceAggregate: '2,000,000',
    milestones: [{ id: uid(), description: '', amount: 0 }],
    contractNum: `CON-${String(_nextCon).padStart(4,'0')}`,
    paymentMethods: Object.entries(settings.paymentConfig||{}).filter(([,v])=>v.enabled).map(([k])=>k.charAt(0).toUpperCase()+k.slice(1)).join(', ') || 'Check, Zelle, ACH',
  })

  const set = (k, v) => setD(prev => ({...prev, [k]: v}))

  const next = () => {
    if (step === 2 && !d.customerName) { toast('Customer name required'); return }
    if (step === 2 && !d.projectAddress) { toast('Project address required'); return }
    if (step === 3 && !d.scope) { toast('Scope of work required'); return }
    if (step === 4 && (!d.price || d.price <= 0)) { toast('Contract price required'); return }
    if (step === 5 && !d.maintenanceItems) { toast('Maintenance requirements required'); return }
    if (step < 7) setStep(s => s + 1)
    else {
      sessionStorage.setItem('wizardData', JSON.stringify({ ...d, jobId }))
      navigate(`/jobs/${jobId}/contract/preview`)
    }
  }

  const addPreset = (text) => set('maintenanceItems', (d.maintenanceItems ? d.maintenanceItems + '\n\n' : '') + text)

  return (
    <div className="screen">
      <TopNav title="" onBack={step > 1 ? () => setStep(s=>s-1) : () => navigate(`/jobs/${jobId}`)}
        actions={null}
      />
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <ProgressBar current={step} total={7} />
        <p className="text-xs text-gray-400 mt-2">Step {step} of 7</p>
        <p className="font-display font-bold text-navy text-base mt-0.5">{STEPS[step-1]}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">
        {step === 1 && (
          <div className="space-y-3">
            {[
              { v:'A', title:'Version A — Balance at completion', desc:'Single payment within 3 business days of substantial completion. <strong>Section 3.2: Interest and disputed amounts only.</strong> Best for shorter projects.' },
              { v:'B', title:'Version B — Weekly labor draws', desc:'Weekly Friday invoices + remaining balance at completion. <strong>Includes immediate work cessation and crew reallocation clauses.</strong> Best for multi-week projects.' },
              { v:'C', title:'Version C — Milestone draws', desc:'Draws tied to specific project milestones (Exhibit A). Full late payment section including work cessation. Best for large phased projects.' },
            ].map(opt => (
              <RadioCard key={opt.v} selected={d.paymentVersion === opt.v} onClick={() => set('paymentVersion', opt.v)} title={opt.title} description={opt.desc} />
            ))}
            <FormGroup label="Project state" hint="Drives state-specific lien rights language in Article 9">
              <Select value={d.projectState} onChange={e => set('projectState', e.target.value)}>
                {Object.entries(STATES).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormGroup>
            {d.paymentVersion === 'C' && (
              <div>
                <p className="form-label">Milestone schedule</p>
                {d.milestones.map((m, i) => (
                  <div key={m.id} className="flex gap-2 mb-2">
                    <Input className="flex-[2]" value={m.description} placeholder="Milestone description" onChange={e => { const ms=[...d.milestones]; ms[i]={...ms[i],description:e.target.value}; set('milestones',ms) }} />
                    <Input className="flex-1" type="number" value={m.amount||''} placeholder="$" onChange={e => { const ms=[...d.milestones]; ms[i]={...ms[i],amount:parseFloat(e.target.value)||0}; set('milestones',ms) }} />
                    {d.milestones.length > 1 && <button onClick={() => set('milestones',d.milestones.filter((_,j)=>j!==i))} className="text-gray-400 hover:text-red-500 px-1">×</button>}
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full mt-1" onClick={() => set('milestones',[...d.milestones,{id:uid(),description:'',amount:0}])}>+ Add milestone</Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Customer full legal name *"><Input value={d.customerName} onChange={e=>set('customerName',e.target.value)} placeholder="John & Jane Smith" /></FormGroup>
              <FormGroup label="Co-customer / spouse"><Input value={d.coCustomerName} onChange={e=>set('coCustomerName',e.target.value)} placeholder="Optional" /></FormGroup>
            </div>
            <FormGroup label="Customer mailing address *"><Input value={d.customerAddress||d.projectAddress} onChange={e=>set('customerAddress',e.target.value)} placeholder="123 Main St, Greenville SC 29601" /></FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Phone"><Input type="tel" value={d.customerPhone} onChange={e=>set('customerPhone',e.target.value)} /></FormGroup>
              <FormGroup label="Email"><Input type="email" value={d.customerEmail} onChange={e=>set('customerEmail',e.target.value)} /></FormGroup>
            </div>
            <FormGroup label="Project site address *"><Input value={d.projectAddress} onChange={e=>set('projectAddress',e.target.value)} /></FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Work type"><Input value={d.workType} onChange={e=>set('workType',e.target.value)} placeholder="Gutter installation" /></FormGroup>
              <FormGroup label="Est. start date"><Input type="date" value={d.startDate} onChange={e=>set('startDate',e.target.value)} /></FormGroup>
            </div>
            <FormGroup label="Est. completion"><Input value={d.estimatedCompletion} onChange={e=>set('estimatedCompletion',e.target.value)} placeholder="Approximately 3–5 days from start" /></FormGroup>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-800 leading-relaxed">
              <strong>More detail = fewer disputes.</strong> Include material specs, brand names, colors, linear/square footage, locations on structure, and any expressly excluded items.
            </div>
            <FormGroup label="Detailed scope of work *">
              <Textarea rows={12} value={d.scope} onChange={e=>set('scope',e.target.value)} className="font-serif text-xs leading-relaxed" placeholder="Supply and install 120 LF of 6-inch K-style seamless aluminum gutters in Musket Brown…" />
            </FormGroup>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Contract price *"><Input type="number" value={d.price} onChange={e=>set('price',parseFloat(e.target.value)||'')} placeholder="0.00" /></FormGroup>
              <FormGroup label="Materials deposit"><Input type="number" value={d.deposit} onChange={e=>set('deposit',parseFloat(e.target.value)||'')} placeholder="Auto" /></FormGroup>
            </div>
            {d.price > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Contract price</span><span className="font-semibold">{fmtM(d.price)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Deposit</span><span>−{fmtM(d.deposit||0)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1"><span className="font-semibold">Balance</span><span className="font-bold text-brand">{fmtM((d.price||0)-(d.deposit||0))}</span></div>
                <p className="text-xs text-gray-400 mt-1">{dollarWords(d.price)}</p>
              </div>
            )}
            <FormGroup label="Late fee (% per month)" hint="Default 1.5% = 18% annualized"><Input type="number" step="0.1" value={d.lateFee} onChange={e=>set('lateFee',parseFloat(e.target.value)||1.5)} /></FormGroup>
            <FormGroup label="CO response deadline (days)"><Input type="number" value={d.responseDays} onChange={e=>set('responseDays',parseInt(e.target.value)||5)} /></FormGroup>
          </div>
        )}

        {step === 5 && (
          <div>
            <FormGroup label="Warranty period">
              <Select value={d.warrantyYears} onChange={e=>set('warrantyYears',parseInt(e.target.value))}>
                <option value={5}>5 years (standard)</option>
                <option value={7}>7 years (premium)</option>
                <option value={10}>10 years (premium+)</option>
              </Select>
            </FormGroup>
            <p className="form-label mt-3">Maintenance requirements (warranty conditions) *</p>
            <p className="text-xs text-gray-400 mb-2">These are the conditions of warranty coverage. Failure to perform = warranty void. Add presets or write your own.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.keys(MAINT_PRESETS).map(k => (
                <button key={k} onClick={() => addPreset(MAINT_PRESETS[k])} className="px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-full text-gray-600 active:bg-gray-200">+ {k}</button>
              ))}
            </div>
            <Textarea rows={8} value={d.maintenanceItems} onChange={e=>set('maintenanceItems',e.target.value)} className="font-serif text-xs leading-relaxed" placeholder="Enter specific maintenance requirements…" />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <div>
              <p className="form-label mb-2">Permits</p>
              {[{val:true,title:'Include Article 6 — Permit section',desc:'Project requires permits'},{val:false,title:'Omit permit article',desc:'No permits required for this scope'}].map(opt => (
                <RadioCard key={String(opt.val)} selected={d.includePermits === opt.val} onClick={()=>set('includePermits',opt.val)} title={opt.title} description={opt.desc} />
              ))}
              {d.includePermits && (
                <div className="bg-gray-50 rounded-xl p-3 mt-2 space-y-2">
                  <p className="text-xs font-semibold text-gray-600">Who pulls permits?</p>
                  {[{val:true,label:'Contractor pulls permits'},{val:false,label:'Customer pulls permits at own expense'}].map(opt => (
                    <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={d.contractorPullsPermits === opt.val} onChange={()=>set('contractorPullsPermits',opt.val)} />
                      <span className="text-sm">{opt.label}</span>
                    </label>
                  ))}
                  {d.contractorPullsPermits && (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input type="checkbox" checked={d.permitFeesIncluded} onChange={e=>set('permitFeesIncluded',e.target.checked)} />
                      <span className="text-sm">Permit fees included in contract price</span>
                    </label>
                  )}
                </div>
              )}
            </div>
            <div>
              <p className="form-label mb-2">HOA</p>
              {[{val:true,title:'HOA applies — include Article 6A',desc:'Customer must obtain HOA approval before work begins'},{val:false,title:'No HOA',desc:'Omit HOA article'}].map(opt => (
                <RadioCard key={String(opt.val)} selected={d.includeHOA === opt.val} onClick={()=>set('includeHOA',opt.val)} title={opt.title} description={opt.desc} />
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="CGL per occurrence"><Input value={d.insurancePerOccurrence} onChange={e=>set('insurancePerOccurrence',e.target.value)} /></FormGroup>
              <FormGroup label="CGL aggregate"><Input value={d.insuranceAggregate} onChange={e=>set('insuranceAggregate',e.target.value)} /></FormGroup>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-display font-bold text-navy text-xs uppercase tracking-wide mb-3">Contract summary</p>
              <div className="space-y-1.5 text-xs text-gray-600">
                <p>📄 <strong>{d.contractNum}</strong> — Version {d.paymentVersion}</p>
                <p>👤 {d.customerName || '—'}{d.coCustomerName ? ` & ${d.coCustomerName}` : ''}</p>
                <p>📍 {d.projectAddress || '—'}</p>
                <p>⚖️ {STATES[d.projectState]}</p>
                <p>💰 {fmtM(d.price)} · Deposit {fmtM(d.deposit||0)}</p>
                <p>🛡 {d.warrantyYears} year warranty{d.includePermits ? ` · ${d.contractorPullsPermits ? 'Contractor' : 'Customer'} pulls permits` : ' · No permit article'}{ d.includeHOA ? ' · HOA included' : ''}</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              Next you'll review the full generated document, make any edits, and confirm the attorney acknowledgment before saving.
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3" style={{bottom:'65px', paddingBottom:'env(safe-area-inset-bottom)'}}>
        <Button variant="ghost" className="flex-1" onClick={() => step > 1 ? setStep(s=>s-1) : navigate(`/jobs/${jobId}`)}>← Back</Button>
        <Button variant="primary" className="flex-[2]" onClick={next}>{step < 7 ? 'Continue →' : 'Preview contract →'}</Button>
      </div>
    </div>
  )
}
