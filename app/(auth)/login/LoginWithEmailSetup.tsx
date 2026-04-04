//TODO: fix validation, error handling

"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const fieldClasses =
  "mt-1.5 w-full rounded-full border-none bg-[#fcf4d9] px-6 py-2.5 text-lg " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm focus:outline-none " +
  "focus:ring-2 focus:ring-[#fbbc05]/50 transition-all";

const labelClasses =
  "block text-xs font-semibold uppercase tracking-wider text-slate-300";

export default function LoginWithEmailSetup({ user }: { user: User | null }) {
  const [status, setStatus] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();

  const getInitialFormData = () => ({
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => listener?.subscription.unsubscribe();
  }, [supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    router.push("/role-selection");
  }

  const handleLogout = async () => {
    setIsExiting(true); 
    await supabase.auth.signOut();
    
    setTimeout(() => {
      window.location.href = "/onboarding";
    }, 300); 
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">
        
        {/* Main Auth Card */}
        {!currentUser && (
          <div className="relative overflow-hidden rounded-3xl bg-[#5591AB] p-8 shadow-2xl backdrop-blur-xl">
            {/* Decorative Blurs */}
            <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-3xl" />
            <div className="absolute -left-10 -bottom-10 -z-10 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-[#F6F8D5]">
                  Welcome Back!
                </h2>
                <p className="text-l text-[#F6F8D5]">Please enter your credentials</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Credentials Section */}
              <div className="grid grid-cols-1 gap-4">
                <label className={labelClasses}>
                  Email Address
                  <input name="email" type="email" value={formData.email} onChange={handleChange} required className={fieldClasses} placeholder="name@uplb.edu.ph" />
                </label>
                <label className={labelClasses}>
                  Password
                  <input name="password" type="password" value={formData.password} onChange={handleChange} required className={fieldClasses} placeholder="••••••••" />
                </label>
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#fbbc05] hover:bg-[#fcf4d9] text-[#fcf4d9] hover:text-[#2d1a12] font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Log In
              </button>

              {status && (
                <p className="text-center text-xs font-medium text-emerald-400 mt-2 bg-emerald-400/10 py-2 rounded-lg">
                  {status}
                </p>
              )}
            </form>
          </div>
        )}

        {/* Session Status Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">System Session</h3>
              <p className="text-xs text-slate-500">
                {currentUser ? currentUser.email : "No active session detected"}
              </p>
            </div>
            {currentUser ? (
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500/20 hover:bg-red-500/40 rounded-lg transition-colors"
              >
                Log Out
              </button>
            ) : (
              <span className="h-2 w-2 rounded-full bg-slate-600 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}