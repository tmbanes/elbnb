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
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-black uppercase tracking-wider ml-1 opacity-60" style={{ color: '#44291B' }}>{label}</label>
      <div className="relative group">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none px-4 py-2.5 pr-10 border border-[#44291B]/15 rounded-xl text-sm font-semibold shadow-sm transition-all hover:border-[#264384]/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#264384]/15 focus:border-[#264384]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: '#FDFFF4',
            color: '#44291B',
          } as any}
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-gray-400 group-hover:text-[#264384] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  )
}
