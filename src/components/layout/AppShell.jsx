import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '../../lib/utils'

const NAV = [
  { path: '/', icon: HomeIcon, label: 'Dashboard' },
  { path: '/jobs', icon: BriefcaseIcon, label: 'Jobs' },
  { path: '/invoices', icon: DollarIcon, label: 'Invoices' },
  { path: '/leads', icon: FunnelIcon, label: 'Leads' },
  { path: '/more', icon: GridIcon, label: 'More' },
]

export function AppShell({ children }) {
  const { pathname } = useLocation()

  return (
    <div className="screen">
      <div className="page-content">
        {children}
      </div>
      <nav className="bottomnav">
        {NAV.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path)
          return (
            <NavButton key={path} path={path} active={active} icon={<Icon active={active} />} label={label} />
          )
        })}
      </nav>
    </div>
  )
}

function NavButton({ path, active, icon, label }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(path)} className={cn('bottomnav-btn', active && 'active')}>
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  )
}

export function TopNav({ title, onBack, actions, transparent }) {
  const navigate = useNavigate()
  return (
    <div className={cn('topnav', transparent && 'bg-transparent')}>
      <div className="w-10">
        {onBack && (
          <button
            onClick={typeof onBack === 'function' ? onBack : () => navigate(-1)}
            className="text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
          >
            ← Back
          </button>
        )}
      </div>
      <span className="font-display font-bold text-white text-sm truncate">{title}</span>
      <div className="w-10 flex justify-end">{actions}</div>
    </div>
  )
}

// ── Nav Icons ─────────────────────────────────────────────────────
function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M3 9.5L12 3l9 6.5V21H15v-5h-6v5H3V9.5z"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  )
}
function BriefcaseIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <rect x="2" y="7" width="20" height="15" rx="2"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <line x1="2" y1="14" x2="22" y2="14" stroke="white" strokeWidth="1.5" opacity={active ? '0.3' : '0'} />
    </svg>
  )
}
function DollarIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <path d="M12 6v12M9 9h4.5a1.5 1.5 0 0 1 0 3H10.5a1.5 1.5 0 0 0 0 3H15"
        stroke={active ? 'white' : '#94a3b8'}
        strokeWidth="1.5" strokeLinecap="round"
      />
    </svg>
  )
}
function FunnelIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M3 4h18l-7 8.5V19l-4-2V12.5L3 4z"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5" strokeLinejoin="round"
      />
    </svg>
  )
}
function GridIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <rect x="14" y="3" width="7" height="7" rx="1"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <rect x="3" y="14" width="7" height="7" rx="1"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
      <rect x="14" y="14" width="7" height="7" rx="1"
        fill={active ? '#0a3ef8' : 'none'}
        stroke={active ? '#0a3ef8' : '#94a3b8'}
        strokeWidth="1.5"
      />
    </svg>
  )
}
