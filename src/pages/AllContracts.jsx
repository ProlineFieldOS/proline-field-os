import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Card, Badge, Empty } from '../components/ui'

export default function AllContracts() {
  const navigate = useNavigate()
  const { contracts, jobs } = useStore()

  return (
    <>
      <TopNav title="All contracts" onBack={() => navigate('/more')} />
      <div className="px-4 pt-4">
        {contracts.length === 0
          ? <Empty icon="📋" title="No contracts" description="Contracts you create on jobs will appear here" />
          : <div className="space-y-2.5">
              {[...contracts].reverse().map(c => {
                const job = jobs.find(j => j.id === c.jobId)
                return (
                  <Card key={c.id} onClick={() => navigate(`/jobs/${c.jobId}`)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-navy">{c.num}</span>
                          <Badge variant={c.status==='signed'?'green':c.status==='void'?'red':'amber'}>{c.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{job?.client || 'Unknown client'}</p>
                        <p className="text-xs text-gray-400">Version {c.paymentVersion} · {c.projectState}</p>
                        {c.attorneyAck && <p className={cn('text-xs mt-1', c.attorneyAck.type==='reviewed'?'text-emerald-600':'text-amber-500')}>
                          {c.attorneyAck.type === 'reviewed' ? '✓ Attorney reviewed' : c.attorneyAck.type === 'ai_generated' ? '⚡ AI provisions' : '⚠ No review'}
                        </p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-navy text-sm">{fmtM(c.price)}</p>
                        <p className="text-xs text-gray-400">{fmtDShort(c.created)}</p>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
        }
      </div>
    </>
  )
}
