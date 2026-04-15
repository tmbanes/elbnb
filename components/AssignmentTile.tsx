// components/AssignmentTile.tsx
'use client'

import { AccommodationAssignment, AssignmentStatus } from '@/types/assignment_workflow'
import { Accommodation, Unit } from '@/types/accommodation_units'
import Link from 'next/link'

interface AssignmentTileProps {
  assignment: AccommodationAssignment
  accommodation: Accommodation | null
  unit: Unit | null
  onTerminate: (assignmentId: string) => void
  onReject: (assignmentId: string) => void
  terminating: boolean
  rejecting: boolean
}

const STATUS_CONFIG: Record<AssignmentStatus, { bg: string; text: string; dot: string; label: string }> = {
  active:     { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Active' },
  completed:  { bg: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-500',     label: 'Completed' },
  cancelled:  { bg: 'bg-gray-100',    text: 'text-gray-500',    dot: 'bg-gray-400',    label: 'Cancelled' },
  terminated: { bg: 'bg-red-50',      text: 'text-red-700',     dot: 'bg-red-500',     label: 'Terminated' },
  pending:    { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Pending' },
  waiting_payment:    { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'Waiting For Payment' },
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-2 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-gray-800 text-right capitalize">{value}</span>
    </div>
  )
}

export function AssignmentTile({
  assignment,
  accommodation,
  unit,
  onTerminate,
  onReject,
  terminating,
  rejecting,
}: AssignmentTileProps) {
  const status = STATUS_CONFIG[assignment.assignment_status]
  const isActive = assignment.assignment_status === 'active'
  const isWaitingPayment = assignment.assignment_status === 'waiting_payment'

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Status bar top accent */}
      <div className={`h-1 w-full ${
        isActive ? 'bg-emerald-400' :
        isWaitingPayment ? 'bg-amber-400' :
        assignment.assignment_status === 'terminated' ? 'bg-red-400' :
        assignment.assignment_status === 'completed' ? 'bg-sky-400' :
        'bg-gray-300'
      }`} />

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate leading-tight">
              {accommodation?.name ?? 'Unknown Accommodation'}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{accommodation?.location ?? '—'}</p>
          </div>
          <span className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* Unit info pills */}
        {unit && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              Unit {unit.unit_number}
            </span>
            <span className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full capitalize">
              {unit.unit_type}
            </span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full capitalize">
              {unit.furnishing_status}
            </span>
            <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
              {unit.billing_period}
            </span>
          </div>
        )}

        {/* Details */}
        <div className="bg-gray-50 rounded-xl px-3 py-1">
          <InfoRow label="Move-in" value={fmt(assignment.move_in_date)} />
          <InfoRow label="Expected move-out" value={fmt(assignment.expected_move_out_date)} />
          {assignment.actual_move_out_date && (
            <InfoRow label="Actual move-out" value={fmt(assignment.actual_move_out_date)} />
          )}
          {accommodation && (
            <InfoRow label="Accommodation type" value={accommodation.accommodation_type.replace('_', ' ')} />
          )}
          {accommodation?.property_type && (
            <InfoRow label="Property type" value={accommodation.property_type} />
          )}
          {unit && (
            <InfoRow label="Rental" value={`₱${unit.rental_fee.toLocaleString()} / ${unit.billing_period}`} />
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-col gap-2">
          {isActive && (
            <button
              onClick={() => onTerminate(assignment.assignment_id)}
              disabled={terminating}
              className="w-full py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {terminating ? 'Terminating…' : 'Terminate Assignment'}
            </button>
          )}

          {isWaitingPayment && (
            <div className="flex gap-2">
              <button
                onClick={() => onReject(assignment.assignment_id)}
                disabled={rejecting}
                className="flex-1 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {rejecting ? 'Rejecting…' : 'Reject'}
              </button>
              <Link
                href={`/dashboard/billing?assignmentId=${assignment.assignment_id}`}
                className="flex-1 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white text-center hover:bg-blue-700 transition-colors"
              >
                Accept & Pay
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}