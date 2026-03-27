import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useAuth } from '../hooks/useAuth'
import { TopNav } from '../components/layout/AppShell'
import { Card, SectionTitle, Badge, Empty, FormGroup, Input, Select, Button } from '../components/ui'
import { toast } from '../components/ui'
import { cn } from '../lib/utils'

const CATEGORIES = ['Bug / Error', 'Feature request', 'Billing question', 'Account issue', 'How-to question', 'Other']
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']

export default function Support() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { supportTickets, addSupportTicket, settings } = useStore()
  const [view, setView] = useState('list') // list | new
  const [form, setForm] = useState({ subject: '', category: 'Bug / Error', priority: 'Normal', description: '', contactEmail: user?.email || '' })

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = () => {
    if (!form.subject.trim() || !form.description.trim()) {
      toast('Subject and description are required', 'error')
      return
    }
    addSupportTicket({
      subject: form.subject.trim(),
      category: form.category,
      priority: form.priority,
      description: form.description.trim(),
      contactEmail: form.contactEmail || user?.email || '',
      accountName: settings.coName || '',
      userId: user?.id || '',
    })
    toast('Support ticket submitted — we\'ll respond within 1–2 business days')
    setForm({ subject: '', category: 'Bug / Error', priority: 'Normal', description: '', contactEmail: user?.email || '' })
    setView('list')
  }

  const statusColor = s => s === 'open' ? 'blue' : s === 'in_progress' ? 'amber' : 'green'
  const priorityColor = p => p === 'Urgent' ? 'red' : p === 'High' ? 'amber' : 'gray'

  return (
    <div className="flex flex-col h-full min-h-0">
      <TopNav title="Support" onBack={() => navigate('/more')}
        actions={
          <button onClick={() => setView(v => v === 'list' ? 'new' : 'list')}
            className="text-white/80 text-xs font-semibold">
            {view === 'list' ? '+ New' : 'Cancel'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">

        {view === 'new' ? (
          <div className="space-y-4">
            <SectionTitle>Submit a support ticket</SectionTitle>
            <FormGroup label="Subject *">
              <Input value={form.subject} onChange={set('subject')} placeholder="Brief description of the issue" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Category">
                <Select value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Priority">
                <Select value={form.priority} onChange={set('priority')}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </Select>
              </FormGroup>
            </div>
            <FormGroup label="Description *" hint="Include steps to reproduce if reporting a bug">
              <textarea value={form.description} onChange={set('description')}
                rows={5} placeholder="Describe the issue in detail..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-brand" />
            </FormGroup>
            <FormGroup label="Reply-to email">
              <Input value={form.contactEmail} onChange={set('contactEmail')} type="email" />
            </FormGroup>
            <Button variant="primary" className="w-full" onClick={submit}>Submit ticket</Button>
          </div>
        ) : (
          <div>
            <SectionTitle className="mb-3">Your tickets</SectionTitle>
            {supportTickets.length === 0 ? (
              <Empty icon="🎫" title="No tickets yet" description="Submit a ticket if you need help with anything." />
            ) : (
              <div className="space-y-3">
                {supportTickets.map(t => (
                  <Card key={t.id}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-navy truncate">{t.subject}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{t.category} · {new Date(t.createdAt).toLocaleDateString()}</p>
                        {t.description && (
                          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed line-clamp-2">{t.description}</p>
                        )}
                        {t.response && (
                          <div className="mt-2 bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                            <p className="text-xs font-semibold text-emerald-700 mb-1">Response from support:</p>
                            <p className="text-xs text-emerald-800 leading-relaxed">{t.response}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Badge variant={statusColor(t.status || 'open')}>
                          {(t.status || 'open').replace('_', ' ')}
                        </Badge>
                        {t.priority !== 'Normal' && (
                          <Badge variant={priorityColor(t.priority)}>{t.priority}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-6 bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-gray-700 mb-1">Response time</p>
              <p className="text-xs text-gray-500">Normal: 1–2 business days · Urgent: same business day</p>
              <p className="text-xs text-gray-400 mt-2">Platform admin: <span className="font-medium">brandyturner815@gmail.com</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
