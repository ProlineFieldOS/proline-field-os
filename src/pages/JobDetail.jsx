import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, statusColor, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Button, Card, Badge, Modal, FormGroup, Input, Select, Textarea, SectionTitle, Empty } from '../components/ui'

const TABS = ['Overview','Documents','Invoices','Photos','Notes']

export default function JobDetail() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const { jobs, contracts, changeOrders, invoices, contacts, updateJob, addContact } = useStore()
  const [tab, setTab] = useState('Overview')
  const [showCOSelector, setShowCOSelector] = useState(false)

  const job = jobs.find(j => j.id === jobId)
  if (!job) return <div className="p-8 text-center text-gray-400">Job not found</div>

  const jobContracts = contracts.filter(c => c.jobId === jobId)
  const jobCOs = changeOrders.filter(c => c.jobId === jobId)
  const jobInvoices = invoices.filter(i => i.jobId === jobId)
  const jobContacts = contacts.filter(c => c.jobId === jobId)

  const totalPaid = jobInvoices.reduce((s,inv) => s + (inv.payments||[]).reduce((p,pm) => p+(pm.amount||0),0), 0)
  const totalOwed = jobInvoices.reduce((s,inv) => s + (inv.amount||0), 0)

  return (
    <>
      <TopNav title={job.client} onBack={() => navigate('/jobs')}
        actions={<span className={cn('badge text-xs', statusColor(job.kbStatus))}>{job.kbStatus}</span>}
      />
      <div className="flex gap-0 border-b border-gray-100 overflow-x-auto bg-white sticky top-[58px] z-10">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-4 py-3 text-xs font-semibold whitespace-nowrap flex-shrink-0 border-b-2 transition-colors',
              tab === t ? 'border-brand text-brand' : 'border-transparent text-gray-400'
            )}
          >{t}</button>
        ))}
      </div>

      <div className="px-4 pt-4">
        {tab === 'Overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400 mb-1">Contract value</div><div className="font-display font-bold text-navy text-lg">{fmtM(job.contractValue)}</div></div>
              <div className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400 mb-1">Collected</div><div className="font-display font-bold text-navy text-lg">{fmtM(totalPaid)}</div></div>
            </div>
            <Card>
              <div className="space-y-2 text-sm">
                {job.address && <div className="flex gap-2"><span className="text-gray-400 w-16 flex-shrink-0">Address</span><span className="text-navy">{job.address}</span></div>}
                {job.phone && <div className="flex gap-2"><span className="text-gray-400 w-16 flex-shrink-0">Phone</span><a href={`tel:${job.phone}`} className="text-brand">{job.phone}</a></div>}
                {job.email && <div className="flex gap-2"><span className="text-gray-400 w-16 flex-shrink-0">Email</span><a href={`mailto:${job.email}`} className="text-brand">{job.email}</a></div>}
                {job.type && <div className="flex gap-2"><span className="text-gray-400 w-16 flex-shrink-0">Type</span><span>{job.type}</span></div>}
                {job.startDate && <div className="flex gap-2"><span className="text-gray-400 w-16 flex-shrink-0">Started</span><span>{fmtDShort(job.startDate)}</span></div>}
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="primary" className="w-full" onClick={() => navigate(`/jobs/${jobId}/contract/new`)}>📋 New contract</Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowCOSelector(true)}>⚠️ Change order</Button>
            </div>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/invoices?jobId=${jobId}`)}>💰 New invoice</Button>
          </div>
        )}

        {tab === 'Documents' && (
          <div className="space-y-3">
            {jobContracts.length === 0 && jobCOs.length === 0
              ? <Empty icon="📋" title="No documents" description="Create a contract to get started" action={<Button variant="primary" onClick={() => navigate(`/jobs/${jobId}/contract/new`)}>New contract</Button>} />
              : <>
                  {jobContracts.map(c => (
                    <Card key={c.id} onClick={() => {}}>
                      <div className="flex items-center justify-between">
                        <div><p className="font-semibold text-sm">{c.num}</p><p className="text-xs text-gray-400">{c.paymentVersion === 'A' ? 'Balance at completion' : c.paymentVersion === 'B' ? 'Weekly draws' : 'Milestone draws'} · {fmtM(c.price)}</p></div>
                        <Badge variant={c.status === 'signed' ? 'green' : 'amber'}>{c.status}</Badge>
                      </div>
                    </Card>
                  ))}
                  {jobCOs.map(c => (
                    <Card key={c.id}>
                      <div className="flex items-center justify-between">
                        <div><p className="font-semibold text-sm">{c.num}</p><p className="text-xs text-gray-400 mt-0.5">{c.coType === 'customer' ? 'Customer-requested' : c.coType === 'required_a' ? 'Required — Track A' : 'Required — Track B'}</p></div>
                        <Badge variant={c.status === 'approved' ? 'green' : c.status === 'declined' ? 'red' : 'amber'}>{c.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </>
            }
          </div>
        )}

        {tab === 'Invoices' && (
          <div className="space-y-3">
            {jobInvoices.length === 0
              ? <Empty icon="💰" title="No invoices" action={<Button variant="primary" onClick={() => navigate(`/invoices?jobId=${jobId}`)}>New invoice</Button>} />
              : jobInvoices.map(inv => {
                  const paid = (inv.payments||[]).reduce((s,p) => s+(p.amount||0),0)
                  const balance = (inv.amount||0) - paid
                  return (
                    <Card key={inv.id}>
                      <div className="flex items-center justify-between">
                        <div><p className="font-semibold text-sm">{inv.num}</p><p className="text-xs text-gray-400">Due {fmtM(inv.amount)} · Paid {fmtM(paid)}</p></div>
                        <div className="text-right"><p className="font-bold text-sm text-navy">{fmtM(balance)}</p><Badge variant={balance <= 0 ? 'green' : 'amber'}>{balance <= 0 ? 'Paid' : 'Outstanding'}</Badge></div>
                      </div>
                    </Card>
                  )
                })
            }
          </div>
        )}

        {tab === 'Photos' && <Empty icon="📸" title="No photos" description="Photo documentation coming soon" />}

        {tab === 'Notes' && (
          <div>
            {job.notes ? <Card><p className="text-sm text-navy leading-relaxed">{job.notes}</p></Card> : <Empty icon="📝" title="No notes" />}
          </div>
        )}
      </div>

      <Modal open={showCOSelector} onClose={() => setShowCOSelector(false)} title="New change order">
        <div className="space-y-3">
          {[
            { type: 'customer', icon: '📋', title: 'Customer-requested', desc: 'Scope change at customer request. Includes admin fee and deposit requirement.' },
            { type: 'required_a', icon: '⛔', title: 'Required — Track A (Life/Safety/Code)', desc: 'Work cannot proceed without correction. Customer must approve or terminate.' },
            { type: 'required_b', icon: '⚠️', title: 'Required — Track B (Warranty Impact)', desc: 'Work can proceed but warranty void on affected portions if declined.' },
          ].map(opt => (
            <button key={opt.type} onClick={() => { setShowCOSelector(false); navigate(`/jobs/${jobId}/co/new?type=${opt.type}`) }}
              className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-navy transition-colors"
            >
              <div className="flex gap-3">
                <span className="text-xl flex-shrink-0">{opt.icon}</span>
                <div><p className="font-semibold text-sm text-navy">{opt.title}</p><p className="text-xs text-gray-500 mt-1">{opt.desc}</p></div>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
