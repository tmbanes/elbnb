'use client'

interface ResultsCountProps {
  count: number
  label?: string
}

export function ResultsCount({ count, label = 'accommodations' }: ResultsCountProps) {
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#F6F8D5', color: '#44291B' }}>
      {count} {label} found
    </div>
  )
}
