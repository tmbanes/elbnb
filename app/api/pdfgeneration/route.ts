//generatePDF usage test/template
//TEST: curl -X POST http://localhost:3000/api/pdfgeneration --output ElBnB-BillingReceipt.pdf
import { NextResponse } from 'next/server'
import { generatePDF } from '@/services/generate_report/pdfgeneration'
import BillingReceipt from '@/services/generate_report/pdf_formats/billingreceipt'
import { supabaseAdmin } from '@/lib/supabase/admin-client'

export const runtime = 'nodejs'

export async function POST() {
    //fetch data
    const {data, error: fetchError} = await supabaseAdmin
      .from('billing')
      .select('*')
      .limit(1)
      .single()
  
  if (fetchError) throw fetchError
  console.log("Fetched data: ", data)
  
  // const billingData = { //dummmy data
  //   first_name: 'ROCHELLE',
  //   last_name: 'LAQUI',
  //   email: 'rplaqui@up.edu.ph',
  //   status: 'Paid',
  //   amount: 5000,
  //   due_date: '2026-04-20'
  // }

  const pdfBuffer = await generatePDF(BillingReceipt, data)

  return new NextResponse(Uint8Array.from(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=receipt.pdf'//set fillename
    }
  })
}