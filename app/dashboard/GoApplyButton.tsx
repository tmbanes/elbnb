"use client";

import { useRouter } from "next/navigation";

export default function GoApplyButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/apply")}
      className="inline-flex rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white transition hover:bg-emerald-600"
    >
      Go to Apply Page
    </button>
  );
}
