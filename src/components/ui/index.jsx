import { cn } from '../../lib/utils'

// ── Toast system ──────────────────────────────────────────────────
let _toastFn = null
export const setToastFn = (fn) => { _toastFn = fn }
export const toast = (msg, type = 'default') => _toastFn?.(msg, type)

// ── Button ────────────────────────────────────────────────────────
export function Button({ children, variant = 'ghost', size = 'md', className, ...props }) {
  const base = 'btn transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'btn-primary', brand: 'btn-brand', ghost: 'btn-ghost', danger: 'btn-danger',
    link: 'text-brand text-sm font-semibold underline-offset-4 hover:underline bg-transparent border-none p-0',
  }
  const sizes = { sm: 'text-xs px-3 py-1.5', md: 'text-sm px-4 py-2.5', lg: 'text-base px-5 py-3' }
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({ children, className, onClick }) {
  return (
    <div
      onClick={onClick}
      className={cn('card', onClick && 'cursor-pointer active:scale-[0.99] transition-transform', className)}
    >
      {children}
    </div>
  )
}

// ── Badge ─────────────────────────────────────────────────────────
export function Badge({ children, variant = 'gray' }) {
  const v = { green: 'badge-green', blue: 'badge-blue', amber: 'badge-amber', red: 'badge-red', gray: 'badge-gray' }
  return <span className={cn('badge', v[variant] || 'badge-gray')}>{children}</span>
}

// ── Modal ─────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  if (!open) return null
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl', full: 'max-w-full mx-4' }
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className={cn('relative bg-white rounded-t-2xl sm:rounded-2xl w-full shadow-xl max-h-[90vh] flex flex-col', sizes[size])}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
            <span className="font-display font-bold text-navy text-base">{title}</span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="px-5 pb-5 flex-shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

// ── Form elements ─────────────────────────────────────────────────
export function FormGroup({ label, hint, children, className }) {
  return (
    <div className={cn('form-group', className)}>
      {label && <label className="form-label">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export function Input({ className, ...props }) {
  return <input className={cn('form-input', className)} {...props} />
}

export function Select({ children, className, ...props }) {
  return <select className={cn('form-select', className)} {...props}>{children}</select>
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('form-textarea', className)} {...props} />
}

// ── Empty state ───────────────────────────────────────────────────
export function Empty({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && <div className="text-5xl mb-4">{icon}</div>}
      <p className="font-display font-bold text-navy text-base mb-1">{title}</p>
      {description && <p className="text-sm text-gray-400 mb-4">{description}</p>}
      {action}
    </div>
  )
}

// ── Loading spinner ───────────────────────────────────────────────
export function Spinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4 border-2', md: 'w-6 h-6 border-2', lg: 'w-10 h-10 border-3' }
  return (
    <div className={cn('rounded-full border-gray-200 border-t-brand animate-spin', sizes[size])} />
  )
}

// ── Section header ────────────────────────────────────────────────
export function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>
}

// ── Progress steps ────────────────────────────────────────────────
export function ProgressBar({ current, total }) {
  return (
    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-all duration-300"
        style={{ width: `${(current / total) * 100}%` }}
      />
    </div>
  )
}

// ── Wizard radio card ─────────────────────────────────────────────
export function RadioCard({ selected, onClick, title, description, badge }) {
  return (
    <div
      onClick={onClick}
      className={cn('wizard-radio cursor-pointer', selected ? 'selected' : '')}
    >
      <div className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 transition-colors',
        selected ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
      )}>
        {selected && <div className="w-full h-full rounded-full bg-white scale-[0.4]" />}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-navy">{title}</span>
          {badge && <span className="badge badge-blue text-xs">{badge}</span>}
        </div>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: description }} />}
      </div>
    </div>
  )
}

// ── Toast provider ────────────────────────────────────────────────
import { useState as useToastState } from 'react'
export function ToastProvider() {
  const [toasts, setToasts] = useToastState([])

  useEffect(() => {
    setToastFn((msg, type) => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    })
  }, [])

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          'px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2',
          t.type === 'error' ? 'bg-red-600 text-white' : 'bg-navy text-white'
        )}>
          {t.msg}
        </div>
      ))}
    </div>
  )
}

import { useEffect } from 'react'
