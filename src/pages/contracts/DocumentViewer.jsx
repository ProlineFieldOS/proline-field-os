import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store'
import { useAuth } from '../../hooks/useAuth'
import { TopNav } from '../../components/layout/AppShell'
import { Button, Modal } from '../../components/ui'
import { toast } from '../../components/ui'

// Generic viewer/editor for any saved document (contract, estimate, CO)
export default function DocumentViewer() {
  const { jobId, docType, docId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    contracts, estimates, changeOrders,
    updateContract, updateEstimate, updateChangeOrder,
    deleteContract, deleteEstimate, deleteChangeOrder,
    syncToSupabase,
  } = useStore()
  const editRef = useRef(null)
  const [edited, setEdited] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const doc = (() => {
    if (docType === 'contract') return contracts.find(c => c.id === docId)
    if (docType === 'estimate') return estimates.find(e => e.id === docId)
    if (docType === 'co')       return changeOrders.find(c => c.id === docId)
    return null
  })()

  if (!doc) {
    return (
      <div className="screen">
        <TopNav title="Document not found" onBack={() => navigate(-1)} />
        <div className="page-content flex items-center justify-center">
          <p className="text-gray-400 text-sm">This document could not be found.</p>
        </div>
      </div>
    )
  }

  const docText = doc.documentText || doc.generatedText || ''
  const docLabel = docType === 'contract' ? `Contract ${doc.num}`
    : docType === 'estimate' ? `Estimate ${doc.num}`
    : `Change Order ${doc.num}`

  const doSync = () => { if (user?.id) syncToSupabase(user.id) }

  const handleSave = () => {
    const newText = editRef.current?.innerText || docText
    if (docType === 'contract') updateContract(docId, { documentText: newText })
    if (docType === 'estimate') updateEstimate(docId, { documentText: newText })
    if (docType === 'co')       updateChangeOrder(docId, { documentText: newText })
    setEdited(false)
    doSync()
    toast('Document saved')
    setShowSaveConfirm(false)
  }

  const handleDelete = () => {
    if (docType === 'contract') deleteContract(docId)
    if (docType === 'estimate') deleteEstimate(docId)
    if (docType === 'co')       deleteChangeOrder(docId)
    doSync()
    toast(`${docLabel} deleted`)
    navigate(jobId ? `/jobs/${jobId}` : -1)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${docLabel}</title>
    <style>
      body { font-family: 'Times New Roman', serif; font-size: 11pt; line-height: 1.7; color: #000; padding: 0.75in 1in; max-width: 8.5in; margin: 0 auto; }
      @media print { body { padding: 0; } }
    </style></head><body><pre style="font-family:inherit;white-space:pre-wrap;word-wrap:break-word">${(editRef.current?.innerText || docText).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`)
    w.document.close()
    w.print()
  }

  return (
    <div className="screen">
      <TopNav title={docLabel} onBack={() => navigate(-1)}
        actions={
          <div className="flex gap-2 items-center">
            <button onClick={handlePrint} className="text-white/70 text-xs">Print</button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-red-300 text-xs font-semibold"
            >
              Delete
            </button>
            {edited && (
              <button onClick={() => setShowSaveConfirm(true)}
                className="text-xs font-bold text-white bg-brand rounded-lg px-3 py-1.5">
                Save
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center gap-2">
          <span className="text-sm">✏️</span>
          <p className="text-xs text-amber-800">This document is editable. Tap anywhere in the text to make changes. Changes are saved back to this job.</p>
        </div>

        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          {doc.created && <span>Created {new Date(doc.created).toLocaleDateString()}</span>}
          {doc.status && <span className="capitalize">Status: {doc.status}</span>}
          {doc.paymentVersion && <span>Payment Version {doc.paymentVersion}</span>}
          {doc.projectState && <span>State: {doc.projectState}</span>}
          {doc.warrantyYears && <span>{doc.warrantyYears}yr warranty</span>}
          {doc.attorneyAck && (
            <span className={doc.attorneyAck.type === 'reviewed' ? 'text-emerald-600' : 'text-amber-500'}>
              {doc.attorneyAck.type === 'reviewed' ? '✓ Attorney reviewed' : '⚠ No attorney review'} — {doc.attorneyAck.confirmedBy}
            </span>
          )}
        </div>

        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          className="px-5 py-6 font-serif text-xs leading-relaxed text-gray-900 outline-none"
          style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', minHeight: '60vh', fontFamily: "'Times New Roman', serif", fontSize: '11pt', lineHeight: '1.7' }}
          onInput={() => setEdited(true)}
          dangerouslySetInnerHTML={{ __html: docText.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>') }}
        />
      </div>

      {edited && (
        <div className="bg-blue-50 border-t border-blue-100 px-4 py-2 text-xs text-blue-700 flex items-center gap-2">
          <span>📝</span> Document has been edited — tap Save to keep changes
        </div>
      )}

      <div className="border-t border-gray-100 p-4 flex gap-3" style={{paddingBottom:'calc(16px + env(safe-area-inset-bottom))'}}>
        <Button variant="ghost" className="flex-1" onClick={handlePrint}>Print / PDF</Button>
        <Button variant="primary" className="flex-[2]" onClick={() => setShowSaveConfirm(true)} disabled={!edited}>
          {edited ? 'Save changes' : 'No changes'}
        </Button>
      </div>

      {/* Save confirm */}
      <Modal open={showSaveConfirm} title="Save changes?" onClose={() => setShowSaveConfirm(false)}>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            This will update the saved document text. The original generated text is preserved separately.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowSaveConfirm(false)}>Cancel</Button>
            <Button variant="primary" className="flex-[2]" onClick={handleSave}>Save changes</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal open={showDeleteConfirm} title={`Delete ${docLabel}?`} onClose={() => setShowDeleteConfirm(false)}>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            This will permanently remove <strong>{docLabel}</strong> from this job. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
            <button
              onClick={handleDelete}
              className="flex-[2] bg-red-600 text-white text-sm font-semibold rounded-xl py-3 active:scale-95 transition-transform"
            >
              Delete permanently
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
