'use client'

interface FilterDropdownProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}

export function FilterDropdown({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: FilterDropdownProps) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium mb-2" style={{ color: '#44291B' }}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
        style={{
          color: '#44291B',
          '--tw-ring-color': '#264384',
        } as any}
      >
        <option value="">All</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
