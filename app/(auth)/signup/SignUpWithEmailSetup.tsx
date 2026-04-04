"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

const fieldClasses =
  "mt-1.5 w-full rounded-full border-none bg-[#fcf4d9] px-6 py-2.5 text-lg " +
  "text-[#2d1a12] placeholder-[#2d1a12]/30 shadow-sm focus:outline-none " +
  "focus:ring-2 focus:ring-[#fbbc05]/50 transition-all";

const labelClasses =
  "block text-xs font-semibold uppercase tracking-wider text-slate-300";

export default function SignUpWithEmailSetup({ user }: { user: User | null }) {
  const [status, setStatus] = useState("");
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  const getInitialFormData = () => ({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    role: "Student", // Default role
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
    setStatus("");

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setStatus("Account created! Please check your email for verification.");
      } else {
        setStatus(`Error: ${result.error}`);
      }
    } catch (error) {
      setStatus("An error occurred. Please try again.");
    }
  }

  return (
    // BACKGROUND
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#8dbd59] p-4 font-sans selection:bg-emerald-500/30">
      <div className="w-full max-w-md space-y-6">
        
        {/* SIGN UP CARD */}
        {!currentUser && (
          <div className="relative overflow-hidden rounded-3xl bg-[#5591AB] p-8 shadow-2xl backdrop-blur-xl">
            <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full blur-3xl" />
            <div className="absolute -left-10 -bottom-10 -z-10 h-32 w-32 rounded-full blur-3xl" />

            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-4xl font-bold text-[#F6F8D5]">
                  Get Started!
                </h2>
                <p className="text-l text-[#F6F8D5]">Kindly fill the necessary information below</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* NAMES */}
                <div className="grid grid-cols-2 gap-4">
                  <label className={labelClasses}>
                    First Name
                    <input name="first_name" type="text" value={formData.first_name} onChange={handleChange} required className={fieldClasses} />
                  </label>
                  <label className={labelClasses}>
                    Last Name
                    <input name="last_name" type="text" value={formData.last_name} onChange={handleChange} required className={fieldClasses} />
                  </label>
                </div>

                <label className={labelClasses}>
                  Middle Name (Optional)
                  <input name="middle_name" type="text" value={formData.middle_name} onChange={handleChange} className={fieldClasses} />
                </label>

                {/* ROLES */}
                <label className={labelClasses}>
                  User Role
                  <select 
                    name="role" 
                    value={formData.role} 
                    onChange={handleChange} 
                    className={`${fieldClasses} appearance-none cursor-pointer`}
                  >
                    <option value="Student">Student</option>
                    <option value="Guest">Guest</option>
                    <option value="Dorm Manager">Dorm Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </label>

              <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4">
                <hr className="border-white/5 my-4" />

                {/* EMAIL & PASSWORD */}
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
              </div>

              <button
                type="submit"
                className="w-full mt-4 bg-[#fbbc05] hover:bg-[#fcf4d9] text-[#fcf4d9] hover:text-[#2d1a12] font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                Create Account
              </button>

              {status && (
                <p className="text-center text-xs font-medium text-emerald-400 mt-2 bg-emerald-400/10 py-2 rounded-lg">
                  {status}
                </p>
              )}
            </form>
          </div>
        )}

        {/* SESSION STATUS */}
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
                onClick={async () => {
                  await supabase.auth.signOut();
                  window.location.href = "/onboarding"; 
                }}
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