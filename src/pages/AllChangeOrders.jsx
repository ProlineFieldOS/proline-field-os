import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Card, Badge, Empty } from '../components/ui'

const CO_LABELS = { customer: 'Customer-requested', required_a: 'Required — Track A', required_b: 'Required — Track B' }

export default function AllChangeOrders() {
  const navigate = useNavigate()
  const { changeOrders, jobs } = useStore()

  return (
    <>
      <TopNav title="Change orders" onBack={() => navigate('/more')} />
      <div className="px-4 pt-4">
        {changeOrders.length === 0
          ? <Empty icon="⚠️" title="No change orders" description="Change orders you create on jobs will appear here" />
          : <div className="space-y-2.5">
              {[...changeOrders].reverse().map(co => {
                const job = jobs.find(j => j.id === co.jobId)
                return (
                  <Card key={co.id} onClick={() => navigate(`/jobs/${co.jobId}`)}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-navy">{co.num}</span>
                          <Badge variant={co.status==='approved'?'green':co.status==='declined'?'red':'amber'}>{co.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{job?.client || 'Unknown client'}</p>
                        <p className="text-xs text-gray-400">{CO_LABELS[co.coType] || co.coType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-navy text-sm">{co.amount ? fmtM(co.amount) : '—'}</p>
                        <p className="text-xs text-gray-400">{fmtDShort(co.created)}</p>
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
