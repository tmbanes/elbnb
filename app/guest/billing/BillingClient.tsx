"use client";

import StudentBillingClient from "@/app/student/billing/BillingClient";

export default function GuestBillingClient(props: any) {
  return <StudentBillingClient {...props} dashboardPath="/guest/dashboard" />;
}
