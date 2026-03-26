import { TopNav } from '../components/layout/AppShell'
export default function Invoices() {
  return (
    <>
      <TopNav title="Invoices" />
      <div className="px-4 pt-6 text-center">
        <div className="text-5xl mb-4">💰</div>
        <p className="font-display font-bold text-navy text-lg">Invoices</p>
        <p className="text-gray-400 text-sm mt-1">Full Invoices module — coming soon</p>
      </div>
    </>
  )
}
