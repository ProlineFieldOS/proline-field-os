import { useParams } from 'react-router-dom'
import { fmtM, fmtDShort } from '../lib/utils'

export default function CustomerPortal() {
  const { token } = useParams()
  // In production this would look up the token in Supabase
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-sm border border-gray-100 text-center">
        <div className="text-4xl mb-4">🔗</div>
        <h1 className="font-display font-bold text-navy text-lg mb-2">Customer Portal</h1>
        <p className="text-gray-400 text-sm">This link is used to share contracts and invoices with customers for review and signing.</p>
        <p className="text-xs text-gray-300 mt-4 font-mono">Token: {token?.substring(0,12)}…</p>
      </div>
    </div>
  )
}
