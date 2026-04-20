// import { NextResponse } from "next/server";
// import { createSupabaseServerClient } from "@/lib/supabase/server-client";
// import { BillingStatus } from "@/types/billing/enums";

// const ASSIGNMENT_ID = "5da67371-840d-4004-b631-1bccddec9bc5";

// export async function GET() {
//   try {
//     const supabase = await createSupabaseServerClient();

//     // 1. CHECK IF BILLING EXISTS
//     const { data: existing, error: checkError } = await supabase
//       .from("billing")
//       .select("*")
//       .eq("assignment_id", ASSIGNMENT_ID)
//       .maybeSingle();

//     if (checkError) {
//       console.error("Check error:", checkError);
//       return NextResponse.json({ success: false, error: checkError });
//     }

//     // 2. CREATE BILLING IF NONE
//     if (!existing) {
//       const { error: insertError } = await supabase
//         .from("billing")
//         .insert([
//           {
//             assignment_id: ASSIGNMENT_ID,
//             amount: 7500,
//             due_date: new Date(),
//             billing_period_date: new Date(),
//             status: BillingStatus.UNPAID,
//             created_at: new Date(),
//             payment_method: "cash",
//             transaction_reference: "",
//           },
//         ]);

//       if (insertError) {
//         console.error("Insert error:", insertError);
//         return NextResponse.json({ success: false, error: insertError });
//       }
//     }

//     // 3. FETCH BILLING
//     const { data: billing, error: fetchError } = await supabase
//       .from("billing")
//       .select("*")
//       .eq("assignment_id", ASSIGNMENT_ID);

//     if (fetchError) {
//       console.error("Fetch error:", fetchError);
//       return NextResponse.json({ success: false, error: fetchError });
//     }

//     // 4. REVENUE SUMMARY
//     const { data: allBilling } = await supabase
//       .from("billing")
//       .select("amount, status");

//     let totalRevenue = 0;
//     let collected = 0;
//     let unpaid = 0;
//     let overdue = 0;

//     allBilling?.forEach((bill: any) => {
//       totalRevenue += bill.amount;

//       if (bill.status === BillingStatus.PAID) collected += bill.amount;
//       if (bill.status === BillingStatus.UNPAID) unpaid += bill.amount;
//       if (bill.status === BillingStatus.OVERDUE) overdue += bill.amount;
//     });

//     return NextResponse.json({
//       success: true,
//       assignment_id: ASSIGNMENT_ID,
//       billing,
//       revenue: {
//         totalRevenue,
//         collected,
//         unpaid,
//         overdue,
//       },
//     });

//   } catch (error) {
//     console.error("TEST ERROR:", error);

//     return NextResponse.json({
//       success: false,
//       error: "Something went wrong",
//     });
//   }
// }
