"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function UpdatePasswordSetup() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("");

    if (password.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password,
      data: {
        must_reset_password: false,
      },
    });
    setLoading(false);

    if (error) {
      setStatus(error.message || "Failed to update password.");
      return;
    }

    router.push("/role-selection");
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#8dbd59] p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl bg-[#5591AB] p-6 space-y-4"
      >
        <h1 className="text-2xl font-bold text-[#F6F8D5]">Reset Password</h1>
        <p className="text-sm text-[#F6F8D5]">
          Set a new password before continuing.
        </p>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            New Password
          </Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Confirm Password
          </Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>

        {status && <p className="text-sm text-red-200">{status}</p>}

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#fbbc05] text-[#2d1a12] font-semibold hover:bg-[#f9d776]"
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </main>
  );
}
