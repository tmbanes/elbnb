"use client";

import StudentBillingClient from "@/app/student/billing/BillingClient";

export default function GuestBillingClient(props: any) {
  return <StudentBillingClient {...props} uploadEndpoint="/api/guest/billing/upload-receipt" />;
}
