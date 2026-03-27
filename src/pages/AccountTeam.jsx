import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useAuth } from '../hooks/useAuth'
import { TopNav } from '../components/layout/AppShell'
import { Card, SectionTitle, Badge, Empty, FormGroup, Input, Select, Button, Modal } from '../components/ui'
import { toast } from '../components/ui'
import { cn } from '../lib/utils'

const ROLE_META = {
  owner:   { label: 'Owner',   color: 'blue',  icon: '👑', desc: 'Full access including billing and ownership transfer' },
  office:  { label: 'Office',  color: 'purple', icon: '💼', desc: 'Full operational access — no billing or ownership settings' },
  foreman: { label: 'Foreman', color: 'amber', icon: '🦺', desc: 'Jobs, documents, schedule, crew, comms' },
  crew:    { label: 'Crew',    color: 'gray',  icon: '👷', desc: 'View-only on assigned jobs and schedule' },
}

export default function AccountTeam() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { accountTeam, addTeamMember, removeTeamMember, settings, updateSettings } = useStore()
  const [showAdd, setShowAdd] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', role: 'office' })
  const [transferEmail, setTransferEmail] = useState('')
  const [transferConfirm, setTransferConfirm] = useState('')

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const isOwner = user?.email?.toLowerCase() === settings?.coEmail?.toLowerCase()

  const addMember = () => {
    if (!form.name.trim() || !form.email.trim()) { toast('Name and email required', 'error'); return }
    addTeamMember({ name: form.name.trim(), email: form.email.trim().toLowerCase(), role: form.role })
    toast(`${form.name} added as ${ROLE_META[form.role].label}`)
    setForm({ name: '', email: '', role: 'office' })
    setShowAdd(false)
  }

  const handleTransfer = () => {
    if (transferConfirm !== 'TRANSFER') { toast('Type TRANSFER to confirm', 'error'); return }
    if (!transferEmail.trim()) { toast('Enter the new owner email', 'error'); return }
    // In production: this would call a Supabase function to update auth + team roles
    // For now: update local state and note for manual completion
    const current = accountTeam.find(m => m.email === transferEmail.trim().toLowerCase())
    if (!current) {
      toast('That person must be added as a team member first', 'error')
      return
    }
    removeTeamMember(current.id)
    addTeamMember({ ...current, role: 'owner' })
    // Update the existing owner to office
    updateSettings({ coEmail: transferEmail.trim().toLowerCase() })
    toast('Ownership transfer initiated — contact support to complete the auth transfer')
    setShowTransfer(false)
  }

  return (
    <div className="page">
      <TopNav title="Account & Team" onBack={() => navigate('/admin')} />

      <div className="page-content px-4 pt-4 pb-8">

        {/* Current account owner */}
        <SectionTitle className="mb-3">Account ownership</SectionTitle>
        <Card className="mb-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-navy">{settings.adminSettings?.ownerName || 'Account owner'}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
              <Badge variant="blue" className="mt-1">Owner</Badge>
            </div>
            {isOwner && accountTeam.length > 0 && (
              <button onClick={() => setShowTransfer(true)}
                className="text-xs text-red-500 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-50">
                Transfer ownership
              </button>
            )}
          </div>
        </Card>

        {/* Team members */}
        <div className="flex items-center justify-between mb-3">
          <SectionTitle>Team members</SectionTitle>
          <button onClick={() => setShowAdd(true)}
            className="text-xs font-semibold text-brand">+ Add member</button>
        </div>

        {accountTeam.length === 0 ? (
          <Empty icon="👥" title="No team members" description="Add foremen, crew, or office staff to give them app access." />
        ) : (
          <div className="space-y-2.5 mb-6">
            {accountTeam.map(m => {
              const meta = ROLE_META[m.role] || ROLE_META.crew
              return (
                <Card key={m.id}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <p className="font-semibold text-sm text-navy">{m.name}</p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={meta.color}>{meta.label}</Badge>
                      <button onClick={() => removeTeamMember(m.id)}
                        className="text-gray-300 hover:text-red-400 text-base leading-none">×</button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Role guide */}
        <SectionTitle className="mb-3">Role guide</SectionTitle>
        <div className="space-y-2">
          {Object.entries(ROLE_META).map(([id, meta]) => (
            <div key={id} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
              <span className="text-base mt-0.5">{meta.icon}</span>
              <div>
                <p className="font-semibold text-xs text-navy">{meta.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{meta.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add member modal */}
      {showAdd && (
        <Modal title="Add team member" onClose={() => setShowAdd(false)}>
          <div className="space-y-3 p-4">
            <FormGroup label="Name">
              <Input value={form.name} onChange={set('name')} placeholder="Full name" />
            </FormGroup>
            <FormGroup label="Email">
              <Input value={form.email} onChange={set('email')} type="email" placeholder="email@example.com" />
            </FormGroup>
            <FormGroup label="Role">
              <Select value={form.role} onChange={set('role')}>
                <option value="office">Office — full operational access</option>
                <option value="foreman">Foreman — jobs, docs, comms</option>
                <option value="crew">Crew — view-only on assigned jobs</option>
              </Select>
            </FormGroup>
            <p className="text-xs text-gray-400 leading-relaxed">
              Note: Full multi-user login is coming in a future update. For now this registers them for notification purposes and role-based view testing.
            </p>
            <Button variant="primary" className="w-full" onClick={addMember}>Add member</Button>
          </div>
        </Modal>
      )}

      {/* Ownership transfer modal */}
      {showTransfer && (
        <Modal title="Transfer ownership" onClose={() => setShowTransfer(false)}>
          <div className="space-y-3 p-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-1">⚠ This action is significant</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Transferring ownership changes who controls billing and account settings. You will become an Office member.
                Contact platform support after completing this to finalize the auth change.
              </p>
            </div>
            <FormGroup label="New owner email" hint="Must already be a team member">
              <Input value={transferEmail} onChange={e => setTransferEmail(e.target.value)} placeholder="newemail@example.com" />
            </FormGroup>
            <FormGroup label="Type TRANSFER to confirm">
              <Input value={transferConfirm} onChange={e => setTransferConfirm(e.target.value)} placeholder="TRANSFER" />
            </FormGroup>
            <Button variant="primary" className="w-full bg-red-600" onClick={handleTransfer}>
              Transfer ownership
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
