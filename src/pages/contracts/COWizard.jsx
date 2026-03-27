import { useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store'
import { fmtM, uid } from '../../lib/utils'
import { TopNav } from '../../components/layout/AppShell'
import { ProgressBar, FormGroup, Input, Textarea, Button } from '../../components/ui'
import { toast } from '../../components/ui'

export default function COWizard() {
  const { jobId } = useParams()
  const [params] = useSearchParams()
  const coType = params.get('type') || 'customer'
  const navigate = useNavigate()
  const { jobs, contracts, invoices, settings, _nextCO } = useStore()
  const job = jobs.find(j => j.id === jobId) || {}
  const con = contracts.find(c => c.jobId === jobId && c.status !== 'void')
  const totalPaid = (invoices.filter(i => i.jobId === jobId)).reduce((s,inv) => s + (inv.payments||[]).reduce((p,pm) => p+(pm.amount||0),0), 0)

  const [step, setStep] = useState(1)
  const [d, setD] = useState({
    coNum: `CO-${String(_nextCO).padStart(4,'0')}`,
    coType,
    jobId,
    customerName: job.client || '',
    projectAddress: job.address || '',
    originalContractNum: con?.num || '',
    originalContractPrice: con?.price || 0,
    totalPaidToDate: totalPaid,
    adminFee: settings.contractDefaults?.adminFee || 75,
    responseDays: settings.contractDefaults?.coResponseDays || 5,
    description: '', coAmount: 0, materialsDeposit: 0,
    scheduleImpact: false, scheduleDays: 0, newCompletion: '',
    lifeSafety: false, structural: false, codeViolation: false,
    conditionDescription: '', correctiveWork: '', consequences: '', warrantyImpactDescription: '',
  })
  const set = (k, v) => setD(prev => ({...prev, [k]: v}))

  const maxSteps = coType === 'customer' ? 3 : coType === 'required_a' ? 4 : 3
  const typeLabel = coType === 'customer' ? 'Customer-requested CO' : coType === 'required_a' ? 'Required CO — Track A (Life/Safety/Code)' : 'Required CO — Track B (Warranty Impact)'

  const next = () => {
    if (step < maxSteps) setStep(s => s + 1)
    else {
      sessionStorage.setItem('coWizardData', JSON.stringify(d))
      navigate(`/jobs/${jobId}/co/preview`)
    }
  }

  return (
    <div className="screen">
      <TopNav title="" onBack={step > 1 ? () => setStep(s=>s-1) : () => navigate(`/jobs/${jobId}`)} />
      <div className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        <ProgressBar current={step} total={maxSteps} />
        <p className="text-xs text-gray-400 mt-2">{typeLabel} · Step {step} of {maxSteps}</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-32">

        {/* CO-02 Customer steps */}
        {coType === 'customer' && step === 1 && (
          <div className="space-y-3">
            <FormGroup label="Description of requested change *"><Textarea rows={7} value={d.description} onChange={e=>set('description',e.target.value)} className="font-serif text-xs" placeholder="Detailed description including materials, quantities, locations, and all items being added, removed, or substituted…" /></FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="CO amount (+/−)"><Input type="number" value={d.coAmount||''} onChange={e=>set('coAmount',parseFloat(e.target.value)||0)} /></FormGroup>
              <FormGroup label="Materials deposit"><Input type="number" value={d.materialsDeposit||''} onChange={e=>set('materialsDeposit',parseFloat(e.target.value)||0)} /></FormGroup>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Admin fee"><Input type="number" value={d.adminFee} onChange={e=>set('adminFee',parseFloat(e.target.value)||75)} /></FormGroup>
              <FormGroup label="Response deadline (days)"><Input type="number" value={d.responseDays} onChange={e=>set('responseDays',parseInt(e.target.value)||5)} /></FormGroup>
            </div>
          </div>
        )}
        {coType === 'customer' && step === 2 && (
          <div className="space-y-3">
            <FormGroup label="Schedule impact">
              {[{val:false,label:'No schedule impact'},{val:true,label:'Extends schedule'}].map(o => (
                <label key={String(o.val)} className="flex items-center gap-2 mb-2 cursor-pointer"><input type="radio" checked={d.scheduleImpact===o.val} onChange={()=>set('scheduleImpact',o.val)} /><span className="text-sm">{o.label}</span></label>
              ))}
            </FormGroup>
            {d.scheduleImpact && (
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Extension (days)"><Input type="number" value={d.scheduleDays||''} onChange={e=>set('scheduleDays',parseInt(e.target.value)||0)} /></FormGroup>
                <FormGroup label="New est. completion"><Input value={d.newCompletion} onChange={e=>set('newCompletion',e.target.value)} /></FormGroup>
              </div>
            )}
          </div>
        )}
        {coType === 'customer' && step === 3 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p className="font-display font-bold text-navy text-xs uppercase tracking-wide mb-3">Summary</p>
            <p><strong>{d.coNum}</strong> — Customer-requested CO</p>
            <p>Customer: {d.customerName}</p>
            <p>CO Amount: {fmtM(d.coAmount)} | Admin Fee: {fmtM(d.adminFee)}</p>
            <p>Deposit: {fmtM(d.materialsDeposit)} | Revised: {fmtM((d.originalContractPrice||0)+(d.coAmount||0))}</p>
          </div>
        )}

        {/* CO-03A Track A steps */}
        {coType === 'required_a' && step === 1 && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">⛔ Track A: Work CANNOT proceed without correction. Customer must approve or terminate.</div>
            <FormGroup label="Nature of condition">
              {[{k:'lifeSafety',l:'Life/safety risk to occupants, workers, or third parties'},{k:'structural',l:'Structural integrity compromise'},{k:'codeViolation',l:'Building code violation'}].map(o => (
                <label key={o.k} className="flex items-center gap-2 mb-2 cursor-pointer"><input type="checkbox" checked={d[o.k]} onChange={e=>set(o.k,e.target.checked)} /><span className="text-sm">{o.l}</span></label>
              ))}
            </FormGroup>
            <FormGroup label="Condition description *"><Textarea rows={5} value={d.conditionDescription} onChange={e=>set('conditionDescription',e.target.value)} className="font-serif text-xs" placeholder="Location on structure, physical description, date of discovery…" /></FormGroup>
          </div>
        )}
        {coType === 'required_a' && step === 2 && (
          <div className="space-y-3">
            <FormGroup label="Required corrective work *"><Textarea rows={5} value={d.correctiveWork} onChange={e=>set('correctiveWork',e.target.value)} className="font-serif text-xs" /></FormGroup>
            <FormGroup label="Consequences if declined *"><Textarea rows={4} value={d.consequences} onChange={e=>set('consequences',e.target.value)} className="font-serif text-xs" /></FormGroup>
          </div>
        )}
        {coType === 'required_a' && step === 3 && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="CO amount"><Input type="number" value={d.coAmount||''} onChange={e=>set('coAmount',parseFloat(e.target.value)||0)} /></FormGroup>
              <FormGroup label="Materials deposit"><Input type="number" value={d.materialsDeposit||''} onChange={e=>set('materialsDeposit',parseFloat(e.target.value)||0)} /></FormGroup>
            </div>
            <FormGroup label="Response deadline (days)"><Input type="number" value={d.responseDays} onChange={e=>set('responseDays',parseInt(e.target.value)||5)} /></FormGroup>
          </div>
        )}
        {coType === 'required_a' && step === 4 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-700">
            <p className="font-bold text-navy text-xs uppercase tracking-wide mb-2">Summary</p>
            <p><strong>{d.coNum}</strong> — Required CO Track A</p>
            <p>Nature: {[d.lifeSafety&&'Life/Safety',d.structural&&'Structural',d.codeViolation&&'Code'].filter(Boolean).join(', ')}</p>
            <p>CO: {fmtM(d.coAmount)} | Deposit: {fmtM(d.materialsDeposit)}</p>
          </div>
        )}

        {/* CO-03B Track B steps */}
        {coType === 'required_b' && step === 1 && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">⚠️ Track B: Work CAN proceed but warranty void on affected portions if customer declines.</div>
            <FormGroup label="Condition description *"><Textarea rows={5} value={d.conditionDescription} onChange={e=>set('conditionDescription',e.target.value)} className="font-serif text-xs" /></FormGroup>
            <FormGroup label="Required corrective work *"><Textarea rows={4} value={d.correctiveWork} onChange={e=>set('correctiveWork',e.target.value)} className="font-serif text-xs" /></FormGroup>
          </div>
        )}
        {coType === 'required_b' && step === 2 && (
          <div className="space-y-3">
            <FormGroup label="Warranty impact description *" hint="Why does this condition prevent warranty issuance if left uncorrected?"><Textarea rows={5} value={d.warrantyImpactDescription} onChange={e=>set('warrantyImpactDescription',e.target.value)} className="font-serif text-xs" /></FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="CO amount"><Input type="number" value={d.coAmount||''} onChange={e=>set('coAmount',parseFloat(e.target.value)||0)} /></FormGroup>
              <FormGroup label="Materials deposit"><Input type="number" value={d.materialsDeposit||''} onChange={e=>set('materialsDeposit',parseFloat(e.target.value)||0)} /></FormGroup>
            </div>
          </div>
        )}
        {coType === 'required_b' && step === 3 && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-700">
            <p className="font-bold text-navy text-xs uppercase tracking-wide mb-2">Summary</p>
            <p><strong>{d.coNum}</strong> — Required CO Track B (Warranty Impact)</p>
            <p>CO: {fmtM(d.coAmount)} | Deposit: {fmtM(d.materialsDeposit)}</p>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 flex gap-3" style={{bottom:'65px', paddingBottom:'env(safe-area-inset-bottom)'}}>
        <Button variant="ghost" className="flex-1" onClick={() => step > 1 ? setStep(s=>s-1) : navigate(`/jobs/${jobId}`)}>← Back</Button>
        <Button variant="primary" className="flex-[2]" onClick={next}>{step < maxSteps ? 'Continue →' : 'Preview CO →'}</Button>
      </div>
    </div>
  )
}
