import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Card, Badge, Modal, FormGroup, Input, Select, Button } from '../components/ui'
import { toast } from '../components/ui'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function Schedule() {
  const navigate = useNavigate()
  const { jobs, crew, updateJob } = useStore()
  const [viewDate, setViewDate] = useState(new Date())
  const [selected, setSelected] = useState(null)
  const [showAssign, setShowAssign] = useState(null)
  const [view, setView] = useState('month')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()
  today.setHours(0,0,0,0)

  // Build calendar grid
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month+1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // Active jobs with dates
  const scheduledJobs = jobs.filter(j => j.startDate || j.scheduledDate)

  const jobsOnDay = (day) => {
    if (!day) return []
    const target = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return scheduledJobs.filter(j => {
      const start = j.startDate || j.scheduledDate
      const end = j.endDate
      if (!start) return false
      if (start <= target && (!end || end >= target)) return true
      return start.startsWith(target.substring(0,10))
    })
  }

  const isToday = (day) => {
    if (!day) return false
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
  }

  const prevMonth = () => setViewDate(new Date(year, month-1, 1))
  const nextMonth = () => setViewDate(new Date(year, month+1, 1))

  const unscheduledJobs = jobs.filter(j => j.status === 'active' && !j.startDate && !j.scheduledDate)

  const assignCrew = (jobId, crewIds) => {
    updateJob(jobId, { assignedCrew: crewIds })
    setShowAssign(null)
    toast('Crew assigned')
  }

  return (
    <>
      <TopNav title="Schedule" onBack={() => navigate('/more')} />
      <div className="px-4 pt-4">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 active:bg-gray-50">‹</button>
          <h2 className="font-display font-bold text-navy text-base">{MONTHS_LONG[month]} {year}</h2>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 active:bg-gray-50">›</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden mb-4">
          {cells.map((day, i) => {
            const dayJobs = jobsOnDay(day)
            const sel = selected === day
            return (
              <div key={i} onClick={() => day && setSelected(sel ? null : day)}
                className={cn('bg-white min-h-[52px] p-1 cursor-pointer transition-colors',
                  !day && 'bg-gray-50 cursor-default',
                  sel && 'bg-blue-50',
                  isToday(day) && 'bg-amber-50'
                )}
              >
                {day && (
                  <>
                    <div className={cn('text-xs font-semibold w-5 h-5 flex items-center justify-center rounded-full mb-0.5',
                      isToday(day) ? 'bg-navy text-white' : sel ? 'text-brand' : 'text-gray-600'
                    )}>{day}</div>
                    {dayJobs.slice(0,2).map(job => (
                      <div key={job.id} className="text-[9px] bg-brand text-white rounded px-1 py-0.5 mb-0.5 truncate leading-tight">{job.client?.split(' ')[0]}</div>
                    ))}
                    {dayJobs.length > 2 && <div className="text-[9px] text-gray-400">+{dayJobs.length-2}</div>}
                  </>
                )}
              </div>
            )
          })}
        </div>

        {/* Selected day detail */}
        {selected && (
          <div className="mb-4">
            <p className="section-title mb-2">{MONTHS_LONG[month]} {selected}</p>
            {jobsOnDay(selected).length === 0
              ? <p className="text-sm text-gray-400 text-center py-4">No jobs scheduled</p>
              : jobsOnDay(selected).map(job => (
                  <Card key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="mb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-navy">{job.client}</p>
                        <p className="text-xs text-gray-400">{job.type}</p>
                        {job.assignedCrew?.length > 0 && (
                          <p className="text-xs text-brand mt-0.5">
                            {job.assignedCrew.map(id => crew.find(c=>c.id===id)?.name).filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="blue">{job.kbStatus}</Badge>
                        <button onClick={e => { e.stopPropagation(); setShowAssign(job) }}
                          className="text-xs text-brand border border-brand rounded-lg px-2 py-0.5">
                          Assign crew
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
            }
          </div>
        )}

        {/* Unscheduled jobs */}
        {unscheduledJobs.length > 0 && (
          <>
            <p className="section-title mb-2">Needs scheduling ({unscheduledJobs.length})</p>
            <div className="space-y-2">
              {unscheduledJobs.map(job => (
                <Card key={job.id}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm text-navy">{job.client}</p>
                      <p className="text-xs text-gray-400">{job.type} · {fmtM(job.contractValue)}</p>
                    </div>
                    <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-xs font-semibold text-brand border border-brand rounded-lg px-3 py-1.5 active:scale-95 transition-transform">
                      Schedule →
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Crew assignment modal */}
      {showAssign && (
        <AssignCrewModal job={showAssign} crew={crew} onClose={() => setShowAssign(null)} onSave={assignCrew} />
      )}
    </>
  )
}

function AssignCrewModal({ job, crew, onClose, onSave }) {
  const [selected, setSelected] = useState(job.assignedCrew || [])
  const toggle = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  return (
    <Modal open={true} onClose={onClose} title={`Assign crew — ${job.client}`}
      footer={<div className="flex gap-2"><Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button><Button variant="primary" className="flex-[2]" onClick={() => onSave(job.id, selected)}>Assign</Button></div>}
    >
      {crew.length === 0
        ? <p className="text-sm text-gray-400 text-center py-4">No crew members yet. Add crew in Payroll.</p>
        : <div className="space-y-2">
            {crew.map(c => (
              <label key={c.id} className={cn('flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors', selected.includes(c.id) ? 'border-brand bg-blue-50' : 'border-gray-200')}>
                <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="accent-brand" />
                <div className="flex-1">
                  <p className="font-semibold text-sm text-navy">{c.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{c.role} · {c.payType==='daily'?`$${c.rate}/day`:`$${c.rate}/hr`}</p>
                </div>
              </label>
            ))}
          </div>
      }
    </Modal>
  )
}
