// app/accommodation_application/page.tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function AccommodationApplicationPage() {
  const searchParams = useSearchParams()
  const unitId = searchParams.get('unitId')
  const accommodationId = searchParams.get('accommodationId')

  return (
    <div>
      <h1>Apply for Unit</h1>
      <p>Unit ID: {unitId}</p>
      <p>Accommodation ID: {accommodationId}</p>
      {/* Your application form here */}
    </div>
  )
}