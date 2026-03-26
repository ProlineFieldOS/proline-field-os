import { useState } from 'react'
import { useStore } from '../store'
import { fmtM, fmtDShort, cn, uid } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Button, Card, Modal, FormGroup, Input, Select, Textarea, Empty } from '../components/ui'
import { toast } from '../components/ui'

const CATEGORIES = ['Materials','Fuel','Equipment rental','Subcontractor','Permits & fees','Dump fees','Tools','Vehicle','Office','Other']

export default function Expenses() {
  const { expenses, jobs, addExpense, deleteExpense } = useStore()
  const [showNew, setShowNew] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ description: '', amount: '', category: 'Materials', jobId: '', date: new Date().toISOString().split('T')[0], notes: '' })

  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  const thisMonth = new Date().getMonth()
  const monthExpenses = expenses.filter(e => new Date(e.date).getMonth() === thisMonth)
  const monthTotal = monthExpenses.reduce((s,e) => s+(e.amount||0), 0)
  const allTotal = expenses.reduce((s,e) => s+(e.amount||0), 0)

  const filtered = expenses.filter(e => filter === 'all' || e.category === filter)
    .sort((a,b) => new Date(b.date) - new Date(a.date))

  const byCat = CATEGORIES.reduce((acc,c) => {
    acc[c] = expenses.filter(e=>e.category===c).reduce((s,e)=>s+(e.amount||0),0)
    return acc
  }, {})

  const handleAdd = () => {
    if (!form.description || !form.amount) { toast('Description and amount required'); return }
    addExpense({ ...form, amount: parseFloat(form.amount), id: uid() })
    setShowNew(false)
    setForm({ description: '', amount: '', category: 'Materials', jobId: '', date: new Date().toISOString().split('T')[0], notes: '' })
    toast('Expense logged')
  }

  return (
    <>
      <TopNav title="Expenses" actions={<button onClick={() => setShowNew(true)} className="text-white text-xl font-light">+</button>} />
      <div className="px-4 pt-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">This month</p><p className="font-display font-bold text-navy text-lg">{fmtM(monthTotal)}</p></div>
          <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-400 mb-1">All time</p><p className="font-display font-bold text-navy text-lg">{fmtM(allTotal)}</p></div>
        </div>

        {/* Category breakdown */}
        {expenses.length > 0 && (
          <div className="card mb-4">
            <p className="section-title mb-3">By category</p>
            <div className="space-y-2">
              {CATEGORIES.filter(c => byCat[c] > 0).map(c => (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs text-gray-600 w-28 flex-shrink-0">{c}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand rounded-full" style={{width: `${Math.min(100,(byCat[c]/allTotal)*100)}%`}} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-navy ml-3 flex-shrink-0">{fmtM(byCat[c])}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          <button onClick={() => setFilter('all')} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0', filter==='all'?'bg-navy text-white border-navy':'bg-white text-gray-500 border-gray-200')}>All</button>
          {CATEGORIES.filter(c => byCat[c] > 0).map(c => (
            <button key={c} onClick={() => setFilter(c)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0', filter===c?'bg-navy text-white border-navy':'bg-white text-gray-500 border-gray-200')}>{c}</button>
          ))}
        </div>

        {filtered.length === 0
          ? <Empty icon="🧾" title="No expenses" description="Log materials, fuel, and field costs" action={<Button variant="primary" onClick={() => setShowNew(true)}>+ Log expense</Button>} />
          : <div className="space-y-2.5">
              {filtered.map(exp => {
                const job = jobs.find(j => j.id === exp.jobId)
                return (
                  <Card key={exp.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-navy">{exp.description}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{exp.category}{job?` · ${job.client}`:''}</p>
                        <p className="text-xs text-gray-400">{fmtDShort(exp.date)}</p>
                        {exp.notes && <p className="text-xs text-gray-400 mt-1">{exp.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <p className="font-bold text-navy text-sm">{fmtM(exp.amount)}</p>
                        <button onClick={() => deleteExpense(exp.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none">×</button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
        }
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="Log expense"
        footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button><Button variant="primary" className="flex-[2]" onClick={handleAdd}>Save</Button></div>}>
        <div className="space-y-3">
          <FormGroup label="Description *"><Input value={form.description} onChange={set('description')} placeholder="40 LF 6-inch aluminum gutter" /></FormGroup>
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Amount *"><Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" /></FormGroup>
            <FormGroup label="Date"><Input type="date" value={form.date} onChange={set('date')} /></FormGroup>
          </div>
          <FormGroup label="Category"><Select value={form.category} onChange={set('category')}>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</Select></FormGroup>
          <FormGroup label="Job (optional)"><Select value={form.jobId} onChange={set('jobId')}><option value="">No job</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.client}</option>)}</Select></FormGroup>
          <FormGroup label="Notes"><Input value={form.notes} onChange={set('notes')} placeholder="Vendor, receipt #, etc." /></FormGroup>
        </div>
      </Modal>
    </>
  )
}
