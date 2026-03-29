// app/dashboard/page.tsx (Minimal Version)
'use client'

import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="space-y-4 p-6">
      <div>Dashboard</div>
      
      <div className="flex gap-4">
        <Link href="/dashboard/accommodations">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Accommodations
          </button>
        </Link>
        
        <Link href="/dashboard/accommodation_application">
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Applications
          </button>
        </Link>
      </div>
    </div>
  )
}