import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, statusColor, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Button, Empty, SectionTitle, Modal, FormGroup, Input, Select, Textarea } from '../components/ui'

const STATUSES = ['New Lead','Estimate','Pending Contract','Active','In Progress','Invoiced','Complete','On Hold']

export default function Jobs() {
  const navigate = useNavigate()
  const { jobs, settings, addJob } = useStore()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({ client:'', address:'', phone:'', email:'', type:'', state:'SC', notes:'' })

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.client?.toLowerCase().includes(search.toLowerCase()) || j.address?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || j.status === filter
    return matchSearch && matchFilter
  })

  const handleAdd = () => {
    if (!form.client) return
    const job = addJob({ ...form, contractValue: 0 })
    setShowNew(false)
    setForm({ client:'', address:'', phone:'', email:'', type:'', state:'SC', notes:'' })
    navigate(`/jobs/${job.id}`)
  }

  return (
    <>
      <TopNav title="Jobs" actions={<button onClick={() => setShowNew(true)} className="text-white text-xl font-light leading-none">+</button>} />
      <div className="px-4 pt-4">
        <input className="form-input mb-3" placeholder="Search jobs or addresses…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {['all','active','pending','complete'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0 border transition-colors',
                filter === s ? 'bg-navy text-white border-navy' : 'bg-white text-gray-500 border-gray-200'
              )}
            >{s === 'all' ? `All (${jobs.length})` : s.charAt(0).toUpperCase()+s.slice(1)}</button>
          ))}
        </div>
        {filtered.length === 0
          ? <Empty icon="🔨" title="No jobs yet" description="Add your first job to get started" action={<Button variant="primary" onClick={() => setShowNew(true)}>+ New job</Button>} />
          : <div className="space-y-2.5">
              {filtered.map(job => (
                <button key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="w-full text-left card active:scale-[0.99] transition-transform">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-navy text-sm">{job.client}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{job.type}{job.address ? ` · ${job.address.split(',')[0]}` : ''}</p>
                      {job.startDate && <p className="text-xs text-gray-400 mt-0.5">Started {fmtDShort(job.startDate)}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-navy text-sm">{job.contractValue ? fmtM(job.contractValue) : '—'}</p>
                      <span className={cn('badge mt-1', statusColor(job.kbStatus))}>{job.kbStatus || job.status}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
        }
      </div>
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New job"
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" className="flex-2" onClick={handleAdd}>Create job</Button></div>}
      >
        <div className="space-y-3">
          <FormGroup label="Client name *"><Input placeholder="John Smith" value={form.client} onChange={set('client')} /></FormGroup>
          <FormGroup label="Job address"><Input placeholder="123 Main St, Greenville SC" value={form.address} onChange={set('address')} /></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Phone"><Input type="tel" value={form.phone} onChange={set('phone')} /></FormGroup>
            <FormGroup label="Email"><Input type="email" value={form.email} onChange={set('email')} /></FormGroup>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Work type">
              <Select value={form.type} onChange={set('type')}>
                <option value="">Select…</option>
                {(settings.jobTypes||[]).map(jt => <option key={jt.id} value={jt.name}>{jt.name}</option>)}
              </Select>
            </FormGroup>
            <FormGroup label="State">
              <Select value={form.state} onChange={set('state')}>
                {['SC','NC','GA','TN','VA'].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </FormGroup>
          </div>
          <FormGroup label="Notes"><Textarea rows={3} placeholder="Scope, special instructions…" value={form.notes} onChange={set('notes')} /></FormGroup>
        </div>
      </Modal>
    </>
  )
}
