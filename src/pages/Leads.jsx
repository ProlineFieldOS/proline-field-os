import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, cn, uid } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Button, Card, Badge, Modal, FormGroup, Input, Select, Textarea, Empty, SectionTitle } from '../components/ui'
import { toast } from '../components/ui'

const STAGES = ['New','Contacted','Quoted','Follow-up','Won','Lost']
const SOURCES = ['Referral','Word of mouth','Google','Facebook','Door hanger','Yard sign','Website','Other']

export default function Leads() {
  const navigate = useNavigate()
  const { leads, addJob, addLead, updateLead } = useStore()
  const [stage, setStage] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', source: 'Referral', notes: '', jobType: '', estimatedValue: '', stage: 'New' })

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const filtered = leads.filter(l => stage === 'all' || l.stage === stage)
  const wonCount = leads.filter(l => l.stage === 'Won').length
  const totalValue = leads.reduce((s,l) => s+(parseFloat(l.estimatedValue)||0), 0)

  const handleAdd = () => {
    if (!form.name) { toast('Name required'); return }
    addLead({ ...form })
    setShowNew(false)
    setForm({ name: '', phone: '', email: '', address: '', source: 'Referral', notes: '', jobType: '', estimatedValue: '', stage: 'New' })
    toast('Lead added')
  }

  const updateStage = (id, newStage) => {
    updateLead(id, { stage: newStage })
    toast(`Moved to ${newStage}`)
  }

  const convertToJob = (lead) => {
    addJob({ client: lead.name, phone: lead.phone, email: lead.email, address: lead.address, type: lead.jobType, notes: lead.notes, contractValue: parseFloat(lead.estimatedValue)||0, kbStatus: 'Estimate' })
    updateLead(lead.id, { stage: 'Won', convertedToJob: true })
    toast('Converted to job')
    navigate('/jobs')
  }

  const stageCounts = STAGES.reduce((acc, s) => { acc[s] = leads.filter(l => l.stage === s).length; return acc }, {})

  return (
    <>
      <TopNav title="Leads" actions={<button onClick={() => setShowNew(true)} className="text-white text-xl font-light">+</button>} />
      <div className="px-4 pt-4">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400 mb-1">Total leads</p><p className="font-display font-bold text-navy text-lg">{leads.length}</p></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400 mb-1">Pipeline</p><p className="font-display font-bold text-navy text-lg">{fmtM(totalValue)}</p></div>
          <div className="bg-gray-50 rounded-xl p-3 text-center"><p className="text-xs text-gray-400 mb-1">Won</p><p className="font-display font-bold text-navy text-lg">{wonCount}</p></div>
        </div>

        {/* Stage filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setStage('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0', stage==='all'?'bg-navy text-white border-navy':'bg-white text-gray-500 border-gray-200')}>All ({leads.length})</button>
          {STAGES.map(s => (
            <button key={s} onClick={() => setStage(s)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 transition-colors', stage===s?'bg-navy text-white border-navy':'bg-white text-gray-500 border-gray-200')}>
              {s} {stageCounts[s] > 0 && <span className="ml-1 opacity-60">({stageCounts[s]})</span>}
            </button>
          ))}
        </div>

        {filtered.length === 0
          ? <Empty icon="🎯" title="No leads" description="Track every potential customer from first call to signed contract" action={<Button variant="primary" onClick={() => setShowNew(true)}>+ Add lead</Button>} />
          : <div className="space-y-2.5">
              {filtered.map(lead => (
                <Card key={lead.id}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-navy">{lead.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{lead.source}{lead.jobType ? ` · ${lead.jobType}` : ''}</p>
                      {lead.phone && <a href={`tel:${lead.phone}`} className="text-xs text-brand">{lead.phone}</a>}
                      {lead.notes && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{lead.notes}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      {lead.estimatedValue && <p className="font-semibold text-sm text-navy">{fmtM(parseFloat(lead.estimatedValue))}</p>}
                      <span className={cn('badge mt-1 text-xs', lead.stage==='Won'?'badge-green':lead.stage==='Lost'?'badge-red':lead.stage==='Quoted'?'badge-blue':'badge-amber')}>{lead.stage}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    {lead.stage !== 'Won' && lead.stage !== 'Lost' && (
                      <Select value={lead.stage} onChange={e => updateStage(lead.id, e.target.value)} className="flex-1 text-xs py-1.5">
                        {STAGES.filter(s => s !== 'Won' && s !== 'Lost').map(s => <option key={s} value={s}>{s}</option>)}
                      </Select>
                    )}
                    {lead.stage !== 'Won' && !lead.convertedToJob && (
                      <button onClick={() => convertToJob(lead)} className="px-3 py-1.5 bg-navy text-white text-xs font-semibold rounded-lg flex-shrink-0 active:scale-95 transition-transform">
                        Convert to job →
                      </button>
                    )}
                    {lead.convertedToJob && <span className="text-xs text-emerald-600 py-1.5">✓ Converted to job</span>}
                  </div>
                </Card>
              ))}
            </div>
        }
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New lead"
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" className="flex-[2]" onClick={handleAdd}>Add lead</Button></div>}>
        <div className="space-y-3">
          <FormGroup label="Name *"><Input value={form.name} onChange={set('name')} placeholder="John Smith" /></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} /></FormGroup>
            <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormGroup>
          </div>
          <FormGroup label="Address"><Input value={form.address} onChange={set('address')} placeholder="Project address" /></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Source"><Select value={form.source} onChange={set('source')}>{SOURCES.map(s=><option key={s} value={s}>{s}</option>)}</Select></FormGroup>
            <FormGroup label="Work type"><Input value={form.jobType} onChange={set('jobType')} placeholder="Gutters, roofing…" /></FormGroup>
          </div>
          <FormGroup label="Estimated value"><Input type="number" value={form.estimatedValue} onChange={set('estimatedValue')} placeholder="0.00" /></FormGroup>
          <FormGroup label="Notes"><Textarea rows={3} value={form.notes} onChange={set('notes')} placeholder="Details, customer concerns, site conditions…" /></FormGroup>
        </div>
      </Modal>
    </>
  )
}
