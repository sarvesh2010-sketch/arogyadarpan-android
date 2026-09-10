import { Check, Edit3, X } from 'lucide-react'
import Button from './Button'

export default function VerificationButtons({
  onConfirm,
  onEdit,
  onReject,
  status = 'unverified',
  className = '',
}) {
  if (status === 'doctor_confirmed' || status === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-300 shrink-0">
        <Check className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" /> Verified
      </span>
    )
  }

  if (status === 'doctor_edited' || status === 'doctor_corrected' || status === 'edited') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-blue-800 font-bold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-300 shrink-0">
        <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Corrected by Physician
      </span>
    )
  }

  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-red-700 font-bold bg-red-50 px-2.5 py-1 rounded-full border border-red-300 shrink-0">
        <X className="w-3.5 h-3.5 stroke-[2.5] text-red-600" /> Rejected
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap ${className}`}>
      {onConfirm && (
        <button
          type="button"
          onClick={onConfirm}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-heading font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Verify and confirm this clinical item"
        >
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Confirm</span>
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 border border-slate-300 font-heading font-bold text-xs shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Edit or add physician notes"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      )}
      {onReject && (
        <button
          type="button"
          onClick={onReject}
          className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 active:scale-95 font-heading font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
          title="Reject this clinical item"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
      )}
    </div>
  )
}
