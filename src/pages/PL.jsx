import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { fmtM, fmtDShort, cn } from '../lib/utils'
import { TopNav } from '../components/layout/AppShell'
import { Card, SectionTitle } from '../components/ui'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function PL() {
  const navigate = useNavigate()
  const { jobs, invoices, expenses } = useStore()
  const [period, setPeriod] = useState('all')

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const filterByPeriod = (dateStr) => {
    if (!dateStr) return period === 'all'
    const d = new Date(dateStr)
    if (period === 'month') return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    if (period === 'quarter') {
      const q = Math.floor(currentMonth / 3)
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === currentYear
    }
    if (period === 'year') return d.getFullYear() === currentYear
    return true
  }

  // Revenue = all recorded payments in period
  const revenue = invoices.reduce((s, inv) => {
    return s + (inv.payments||[]).filter(p => filterByPeriod(p.date)).reduce((ps, p) => ps + (p.amount||0), 0)
  }, 0)

  // Costs = all expenses in period
  const costs = expenses.filter(e => filterByPeriod(e.date)).reduce((s,e) => s+(e.amount||0), 0)
  const profit = revenue - costs
  const margin = revenue > 0 ? (profit/revenue)*100 : 0

  // Outstanding = invoiced but not collected
  const outstanding = invoices.reduce((s, inv) => {
    const paid = (inv.payments||[]).reduce((p,pm) => p+(pm.amount||0), 0)
    return s + Math.max(0, (inv.amount||0) - paid)
  }, 0)

  // Per-job profitability
  const jobPL = jobs.map(job => {
    const jobInvoices = invoices.filter(i => i.jobId === job.id)
    const jobRevenue = jobInvoices.reduce((s,i) => s+(i.payments||[]).reduce((p,pm)=>p+(pm.amount||0),0), 0)
    const jobCosts = expenses.filter(e => e.jobId === job.id).reduce((s,e) => s+(e.amount||0), 0)
    const jobProfit = jobRevenue - jobCosts
    const jobMargin = jobRevenue > 0 ? (jobProfit/jobRevenue)*100 : 0
    return { ...job, jobRevenue, jobCosts, jobProfit, jobMargin }
  }).filter(j => j.jobRevenue > 0 || j.contractValue > 0).sort((a,b) => b.jobProfit - a.jobProfit)

  // Expense breakdown by category
  const byCat = expenses.filter(e => filterByPeriod(e.date)).reduce((acc, e) => {
    acc[e.category] = (acc[e.category]||0) + (e.amount||0)
    return acc
  }, {})

  // Monthly revenue chart data
  const monthlyData = Array.from({length:6}, (_,i) => {
    const m = (currentMonth - 5 + i + 12) % 12
    const y = currentMonth - 5 + i < 0 ? currentYear - 1 : currentYear
    const monthRev = invoices.reduce((s,inv) => s+(inv.payments||[]).filter(p=>{const d=new Date(p.date);return d.getMonth()===m&&d.getFullYear()===y}).reduce((ps,p)=>ps+(p.amount||0),0), 0)
    const monthCost = expenses.filter(e=>{const d=new Date(e.date);return d.getMonth()===m&&d.getFullYear()===y}).reduce((s,e)=>s+(e.amount||0),0)
    return { month: MONTHS[m], revenue: monthRev, cost: monthCost, profit: monthRev - monthCost }
  })
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.revenue, d.cost)), 1)

  return (
    <>
      <TopNav title="P&L" onBack={() => navigate('/more')} />
      <div className="px-4 pt-4">
        {/* Period selector */}
        <div className="flex gap-2 mb-4">
          {[['all','All time'],['year','This year'],['quarter','This quarter'],['month','This month']].map(([v,l]) => (
            <button key={v} onClick={() => setPeriod(v)} className={cn('px-3 py-1.5 rounded-full text-xs font-semibold border flex-shrink-0 transition-colors', period===v?'bg-navy text-white border-navy':'bg-white text-gray-500 border-gray-200')}>{l}</button>
          ))}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-emerald-50 rounded-2xl p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">Revenue</p>
            <p className="font-display font-bold text-emerald-800 text-2xl">{fmtM(revenue)}</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4">
            <p className="text-xs text-red-500 font-medium mb-1">Costs</p>
            <p className="font-display font-bold text-red-700 text-2xl">{fmtM(costs)}</p>
          </div>
          <div className={cn('rounded-2xl p-4', profit >= 0 ? 'bg-navy' : 'bg-red-600')}>
            <p className="text-xs text-white/50 font-medium mb-1">Net profit</p>
            <p className="font-display font-bold text-white text-2xl">{fmtM(profit)}</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-400 font-medium mb-1">Outstanding</p>
            <p className="font-display font-bold text-navy text-2xl">{fmtM(outstanding)}</p>
          </div>
        </div>

        {margin > 0 && (
          <div className="card mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500">Profit margin</span>
              <span className={cn('text-sm font-bold', margin >= 30 ? 'text-emerald-600' : margin >= 15 ? 'text-amber-600' : 'text-red-500')}>{margin.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={cn('h-full rounded-full transition-all', margin >= 30 ? 'bg-emerald-500' : margin >= 15 ? 'bg-amber-500' : 'bg-red-500')} style={{width:`${Math.min(100,margin)}%`}} />
            </div>
          </div>
        )}

        {/* 6-month bar chart */}
        {monthlyData.some(d => d.revenue > 0 || d.cost > 0) && (
          <div className="card mb-4">
            <SectionTitle>6-month trend</SectionTitle>
            <div className="flex items-end gap-1.5 h-28 mt-3">
              {monthlyData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-0.5 items-end" style={{height:'80px'}}>
                    <div className="flex-1 rounded-t-sm bg-emerald-400 transition-all" style={{height:`${(d.revenue/maxVal)*100}%`, minHeight: d.revenue>0?'2px':'0'}} />
                    <div className="flex-1 rounded-t-sm bg-red-300 transition-all" style={{height:`${(d.cost/maxVal)*100}%`, minHeight: d.cost>0?'2px':'0'}} />
                  </div>
                  <span className="text-[9px] text-gray-400">{d.month}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-400" /><span className="text-xs text-gray-400">Revenue</span></div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-300" /><span className="text-xs text-gray-400">Costs</span></div>
            </div>
          </div>
        )}

        {/* Cost breakdown */}
        {Object.keys(byCat).length > 0 && (
          <div className="card mb-4">
            <SectionTitle>Cost breakdown</SectionTitle>
            <div className="space-y-2 mt-2">
              {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([cat, amt]) => (
                <div key={cat} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 flex-shrink-0 truncate">{cat}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-300 rounded-full" style={{width:`${(amt/costs)*100}%`}} />
                  </div>
                  <span className="text-xs font-semibold text-navy flex-shrink-0">{fmtM(amt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Per-job profitability */}
        {jobPL.length > 0 && (
          <>
            <SectionTitle>Per-job P&L</SectionTitle>
            <div className="space-y-2.5 mb-4">
              {jobPL.map(job => (
                <Card key={job.id} onClick={() => navigate(`/jobs/${job.id}`)}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-navy truncate">{job.client}</p>
                      <p className="text-xs text-gray-400">{job.type}</p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-emerald-600">Rev {fmtM(job.jobRevenue)}</span>
                        <span className="text-xs text-red-400">Cost {fmtM(job.jobCosts)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={cn('font-bold text-sm', job.jobProfit >= 0 ? 'text-emerald-600' : 'text-red-500')}>{fmtM(job.jobProfit)}</p>
                      {job.jobRevenue > 0 && <p className="text-xs text-gray-400">{job.jobMargin.toFixed(0)}% margin</p>}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {revenue === 0 && costs === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📊</div>
            <p className="font-display font-bold text-navy">No financial data yet</p>
            <p className="text-gray-400 text-sm mt-1">Record invoice payments and expenses to see your P&L</p>
          </div>
        )}
      </div>
    </>
  )
}
