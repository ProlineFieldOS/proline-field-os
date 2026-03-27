import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { useAuth } from '../hooks/useAuth'
import { fmtM, fmtDShort } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { getStageInfo } from '../lib/lifecycle'
import { Card, Badge, SectionTitle, Empty } from '../components/ui'
import { TopNav } from '../components/layout/AppShell'

const OWNER_EMAIL = 'brandyturner815@gmail.com'

export default function OwnerPortal() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { jobs, invoices, expenses, settings, viewAsRole, setViewAsRole } = useStore()
  const [allUsers, setAllUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [tab, setTab] = useState('overview')

  // Security: only Brandy's account can access this
  if (!user || user.email !== OWNER_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <div>
          <div className="text-5xl mb-4">🔒</div>
          <p className="font-bold text-navy text-lg mb-2">Access restricted</p>
          <p className="text-gray-400 text-sm">This portal is only accessible to the platform owner.</p>
          <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand text-sm underline">Back to app</button>
        </div>
      </div>
    )
  }

  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    if (!supabase) { setLoadingUsers(false); return }
    try {
      const { data } = await supabase.from('user_data').select('user_id, db')
      if (data) {
        const users = data.map(row => ({
          userId: row.user_id,
          coName: row.db?.settings?.coName || 'Unnamed account',
          coEmail: row.db?.settings?.coEmail || '',
          jobCount: (row.db?.jobs || []).length,
          invoiceTotal: (row.db?.invoices || []).reduce((s,i) => s+(i.amount||0), 0),
          hasTemplate: !!row.db?.contractTemplate,
          plan: row.db?.plan || 'unknown',
          lastSync: row.db?.lastSync,
        }))
        setAllUsers(users)
      }
    } catch(e) { console.warn('Owner portal load:', e.message) }
    setLoadingUsers(false)
  }

  // Local stats
  const totalRevenue = invoices.reduce((s,i) => s+(i.payments||[]).reduce((p,pm)=>p+(pm.amount||0),0), 0)
  const activeJobs = jobs.filter(j => j.status !== 'complete').length
  const ROLES = [
    { id: 'owner', label: 'Owner view', icon: '👑', desc: 'Full access — all modules' },
    { id: 'foreman', label: 'Foreman view', icon: '🦺', desc: 'Jobs, schedule, docs, comms' },
    { id: 'crew', label: 'Crew view', icon: '👷', desc: 'View-only on assigned jobs' },
    { id: 'customer', label: 'Customer view', icon: '🏠', desc: 'Portal — estimate + contract + balance' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Owner portal header */}
      <div className="bg-[#050d1f] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-base">Field OS Owner Portal</p>
            <p className="text-white/40 text-xs">{user.email}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="text-white/60 text-xs hover:text-white">← Back to app</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        {[['overview','Overview'],['users','Users'],['viewas','View as'],['portal','Portal preview']].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-3 text-xs font-semibold border-b-2 transition-colors ${tab===v ? 'border-[#0a3ef8] text-[#0a3ef8]' : 'border-transparent text-gray-400'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="px-4 pt-5 pb-10 max-w-2xl mx-auto">

        {/* ── Overview tab ── */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Platform users</p>
                <p className="font-bold text-2xl text-navy">{allUsers.length}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Your active jobs</p>
                <p className="font-bold text-2xl text-navy">{activeJobs}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">Your revenue</p>
                <p className="font-bold text-xl text-emerald-600">{fmtM(totalRevenue)}</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
                <p className="text-xs text-gray-400 mb-1">With AI template</p>
                <p className="font-bold text-2xl text-navy">{allUsers.filter(u=>u.hasTemplate).length}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <p className="font-semibold text-navy text-sm mb-3">Your account (Proline Gutter & Exteriors)</p>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-400">Company</span><span>{settings.coName || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Phone</span><span>{settings.coPhone || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">License</span><span>{settings.license || 'Not set'}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">State</span><span>{settings.primaryState}</span></div>
                <div className="flex justify-between"><span className="text-gray-400">Job types</span><span>{(settings.jobTypes||[]).length}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* ── Users tab ── */}
        {tab === 'users' && (
          <div>
            <SectionTitle>All platform accounts ({allUsers.length})</SectionTitle>
            {loadingUsers
              ? <p className="text-xs text-gray-400 py-8 text-center">Loading…</p>
              : allUsers.length === 0
              ? <Empty icon="👤" title="No accounts found" />
              : <div className="space-y-2.5 mt-3">
                  {allUsers.map(u => (
                    <Card key={u.userId}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-sm text-navy">{u.coName}</p>
                          <p className="text-xs text-gray-400">{u.coEmail}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{u.jobCount} jobs · {fmtM(u.invoiceTotal)} invoiced</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={u.hasTemplate ? 'green' : 'gray'}>{u.hasTemplate ? 'Has template' : 'No template'}</Badge>
                          <p className="text-xs text-gray-400 mt-1">{u.plan}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
            }
          </div>
        )}

        {/* ── View As tab ── */}
        {tab === 'viewas' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Switch your view to test what each role sees in the app. The role banner appears at the top of every screen while active.</p>
            <div className="space-y-3">
              {ROLES.map(role => (
                <button key={role.id} onClick={() => { setViewAsRole(role.id); if (role.id === 'customer') { navigate(`/portal/${jobs[0]?.portalToken || 'demo'}`) } else { navigate('/dashboard') } }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-colors ${viewAsRole === role.id ? 'border-[#0a3ef8] bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{role.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-navy">{role.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{role.desc}</p>
                    </div>
                    {viewAsRole === role.id && <span className="text-xs font-bold text-[#0a3ef8] bg-blue-100 rounded-full px-2 py-0.5">Active</span>}
                  </div>
                </button>
              ))}
            </div>
            {viewAsRole !== 'owner' && (
              <button onClick={() => setViewAsRole('owner')} className="w-full mt-4 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-500">
                Exit role view → back to Owner
              </button>
            )}
          </div>
        )}

        {/* ── Portal Preview tab ── */}
        {tab === 'portal' && (
          <div>
            <p className="text-sm text-gray-500 mb-4">Open the customer portal for any job to preview exactly what your customer sees.</p>
            {jobs.length === 0
              ? <Empty icon="🔗" title="No jobs" description="Create a job first to preview its portal" />
              : <div className="space-y-2.5">
                  {jobs.slice(0,10).map(job => {
                    const stage = getStageInfo(job.kbStatus)
                    return (
                      <Card key={job.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-sm text-navy">{job.client}</p>
                            <p className="text-xs text-gray-400">{stage.label}</p>
                            {job.portalToken
                              ? <p className="text-xs text-gray-300 font-mono mt-0.5">{job.portalToken.substring(0,16)}…</p>
                              : <p className="text-xs text-amber-500 mt-0.5">No portal token — open job to generate</p>
                            }
                          </div>
                          <div className="flex flex-col gap-1.5">
                            {job.portalToken && (
                              <>
                                <a href={`/portal/${job.portalToken}`} target="_blank" rel="noreferrer"
                                  className="text-xs font-semibold text-white bg-[#050d1f] rounded-lg px-3 py-1.5 text-center whitespace-nowrap">
                                  Open portal →
                                </a>
                                <button onClick={() => { navigator.clipboard?.writeText(window.location.origin+'/portal/'+job.portalToken) }}
                                  className="text-xs text-gray-400 hover:text-navy">
                                  Copy link
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
            }
          </div>
        )}
      </div>
    </div>
  )
}
