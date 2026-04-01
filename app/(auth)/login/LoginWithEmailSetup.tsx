"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { signUpAsGuest, signUpAsStudent, signUpWithEmail } from "@/services/browser/auth";
import { DormitoryManagerCreationRequest, GuestCreationRequest, StudentCreationRequest, UserCreationRequest, UserRole, UserStatus } from "@/types/auth/user.types";
import { User } from "@supabase/supabase-js";
import { useState, useEffect } from "react";

type LoginWithEmailProps = {
    user: User | null;
};

type Mode = "signup" | "signin"

// NEED TO FILL UP BY ANY USER
type BaseFormData = {
    first_name: string;
    last_name: string;
    middle_name?: string;
    email: string;
    password: string;
    role: UserRole;
    user_status: UserStatus;
};

type FormData = BaseFormData & {
  // Role-specific fields
  // STUDENT
  student_number?: string;
  degree_program?: string;
  enrollment_status?: 'enrolled' | 'graduated' | 'dropped' ;
  residency_status?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'delayed';
  violation_count: number;

  // DORM MANAGER
  employee_id?: string;

  // GUEST
  valid_id?: string;
  purpose_visit?: string;
  occupancy_status?: string;
};

export default function LoginWithEmailSetup({ user }: LoginWithEmailProps) {
    const [mode, setMode] = useState("signup");
    const [status, setStatus] = useState("");
    const supabase = getSupabaseBrowserClient();
    const [currentUser, setCurrentUser] = useState<User | null>(user);

    const getInitialFormData = (): FormData => ({
        first_name: "",
        last_name: "",
        middle_name: "",
        email: "",
        password: "",
        role: "student",
        user_status: "active",

        student_number: "",
        degree_program: "",
        enrollment_status: "enrolled",
        residency_status: "freshman",
        violation_count: 0,

        employee_id: "",

        valid_id: "",
        purpose_visit: "",
        occupancy_status: "",
    }); 

    // VARIABLE: User data
    const [formData, setFormData] = useState<FormData>(getInitialFormData());

    // FUNCTION: Handles role change; 
    // Clears role specific fields (previously filled) on role change
    function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
        const newRole = e.target.value as UserRole;

        setFormData((prev) => ({
            ...prev,
            role: newRole,

            // clear role-specific fields
            // STUDENT
            student_number: "",
            degree_program: "",
            enrollment_status: "enrolled",
            residency_status: "freshman",
            violation_count: 0,

            // DORM MANAGER
            employee_id: "",
            
            // GUEST
            valid_id: "",
            purpose_visit: "",
            occupancy_status: "",
            
        }));
        console.log(formData);

        
    }

    // FUNCTION: Sets the form data
    function handleChange( e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    }

    // Sets current user
    useEffect(() => {
        const { data: listener } = supabase.auth.onAuthStateChange(
        (_event, session) => {
            setCurrentUser(session?.user ?? null);
        }
        );

        return () => {
        listener?.subscription.unsubscribe();
        };
    }, [supabase])

    // FUNCTION: handles submission of data
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        // VARIABLE: sign up request result
        let result: { success: boolean; userId?: string; error?: string };

        if (mode == "signup") {
            if (formData.role == "student") {
                result = await signUpAsStudent(formData as StudentCreationRequest);
            } else {
                result = await signUpAsGuest(formData as GuestCreationRequest);
            }

            if (result.success) {
                console.log("Student signed up successfully! ID:", result.userId);
            } else {
                console.error("Signup failed:", result.error);
            }
            
        } else {
            const { error, data } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            });

            if (error) {
                setStatus(error.message);
            } else {
                setStatus("Signed in successfully");
            }
        }

        setFormData(getInitialFormData());
    }
    
    // FUNCTION: Handles sign out function
    async function handleSignOut() {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setStatus("Signed out successfully");  
    }

    return (
        <>
        {!currentUser && (
            <>
            <form
                className="relative overflow-hidden rounded-[32px] border border-emerald-500/30 bg-gradient-to-br from-[#05130d] via-[#04100c] to-[#0c2a21] p-8 text-slate-100 shadow-[0_35px_90px_rgba(2,6,23,0.65)]"
                onSubmit={handleSubmit}
            >
                <div
                className="pointer-events-none absolute -left-4 -top-4 -z-10 h-20 w-28 rounded-full bg-[radial-gradient(circle,_rgba(16,185,129,0.25),_transparent)] blur-lg"
                aria-hidden="true"
                />
                <div
                className="pointer-events-none absolute -bottom-10 right-2 -z-10 h-28 w-40 rounded-full bg-[linear-gradient(140deg,_rgba(45,212,191,0.32),_rgba(59,130,246,0.12))] blur-xl"
                aria-hidden="true"
                />
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                    Credentials
                    </p>
                    <h3 className="text-xl font-semibold text-white">
                    {mode === "signup" ? "Create an account" : "Welcome back"}
                    </h3>
                </div>
                <div className="flex rounded-full border border-white/10 bg-white/[0.07] p-1 text-xs font-semibold text-slate-300">
                    {(["signup", "signin"] as Mode[]).map((option) => (
                    <button
                        key={option}
                        type="button"
                        aria-pressed={mode === option}
                        onClick={() => setMode(option)}
                        className={`rounded-full px-4 py-1 transition ${mode === option
                        ? "bg-emerald-500/30 text-white shadow shadow-emerald-500/20"
                        : "text-slate-400"
                        }`}
                    >
                        {option === "signup" ? "Sign up" : "Sign in"}
                    </button>
                    ))}
                </div>
                </div>
                <div className="mt-6 space-y-4">
                    <label className="block text-sm font-medium text-slate-200">
                        Email
                        <input
                        name = "email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        placeholder="you@email.com"
                        />
                    </label>
                    <label className="block text-sm font-medium text-slate-200">
                        Password
                        <input
                        name = "password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                        placeholder="At least 6 characters"
                        />
                    </label>
                    { mode == "signup" && (
                        <>
                            <label className="block text-sm font-medium text-slate-200">
                            First Name
                            <input
                            name = "first_name"
                            type="text"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                            placeholder="First Name"
                            />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Middle Name
                                <input
                                name = "middle_name"
                                type="text"
                                value={formData.middle_name}
                                onChange={handleChange}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Middle Name"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Last Name
                                <input
                                name = "last_name"
                                type="text"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Last Name"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Role
                                <select 
                                name="role" 
                                id="role" 
                                value={formData.role} 
                                onChange={handleRoleChange}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                >
                                    <option value="guest">Guest</option>
                                    <option value="student">Student</option>
                                    <option value="dormitory_manager">Dorm Manager</option>
                                </select>
                            </label>
                        { formData.role == "guest" && (
                            <>
                            <label className="block text-sm font-medium text-slate-200">
                                Valid ID
                                <input
                                name = "valid_id"
                                type="text"
                                value={formData.valid_id}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Valid ID #"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Purpose
                                <input
                                name = "purpose_visit"
                                type="text"
                                value={formData.purpose_visit}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Purpose of visit"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Occupancy status
                                <input
                                name = "occupancy_status"
                                type="text"
                                value={formData.occupancy_status}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Occupancy Status"
                                />
                            </label>
                            </>
                        )}
                        { formData.role == "student" && (
                            <>
                            <label className="block text-sm font-medium text-slate-200">
                                Student Number
                                <input
                                name = "student_number"
                                type="text"
                                value={formData.student_number}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="e.g. 202312345"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Degree Program
                                <input
                                name = "degree_program"
                                type="text"
                                value={formData.degree_program}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="e.g. BS Computer Science"
                                />
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Enrollment Status
                                <select 
                                name="enrollment_status" 
                                id="enrollment_status" 
                                value={formData.enrollment_status} 
                                onChange={handleChange}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                
                                >
                                    <option value="enrolled">Enrolled</option>
                                    <option value="graduated">Graduated</option>
                                    <option value="dropped">Dropped</option>
                                </select>
                            </label>
                            <label className="block text-sm font-medium text-slate-200">
                                Residency Status
                                <select 
                                name="residency_status" 
                                id="residency_status" 
                                value={formData.residency_status} 
                                onChange={handleChange}
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                >
                                    <option value="freshman">Freshman</option>
                                    <option value="sophomore">Sophomore</option>
                                    <option value="junior">Junior</option>
                                    <option value="senior">Senior</option>
                                    <option value="delayed">Delayed</option>
                                </select>
                            </label>
                            </>
                        )}
                        { formData.role == "dormitory_manager" && (
                            <>
                            <label className="block text-sm font-medium text-slate-200">
                                Employee ID
                                <input
                                name = "employee_id"
                                type="text"
                                value={formData.employee_id}
                                onChange={handleChange}
                                required
                                className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0b1b18] px-3 py-2.5 text-base text-white placeholder-slate-500 shadow-inner shadow-black/30 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
                                placeholder="Employee ID #"
                                />
                            </label>
                            </>
                        )}
                        </>
                    )}
                </div>
                <button
                type="submit"
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-600/40"
                >
                {mode === "signup" ? "Create account" : "Sign in"}
                </button>
                {status && (
                <p className="mt-4 text-sm text-slate-300" role="status" aria-live="polite">
                    {status}
                </p>
                )}
            </form>
            </>
        )}
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-7 text-slate-200 shadow-[0_25px_70px_rgba(2,6,23,0.65)] backdrop-blur">
            <div className="flex items-start justify-between gap-4">
            <div>
                <h3 className="text-lg font-semibold text-white">Session</h3>
                <p className="mt-1 text-sm text-slate-400">
                {currentUser
                    ? "Hydrated by getSession + onAuthStateChange."
                    : "Sign in to hydrate this panel instantly."}
                </p>
            </div>
            <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${currentUser
                ? "bg-emerald-500/20 text-emerald-200"
                : "bg-white/10 text-slate-400"
                }`}
            >
                {currentUser ? "Active" : "Idle"}
            </span>
            </div>
            {currentUser ? (
            <>
                <dl className="mt-5 space-y-3 text-sm text-slate-200">
                <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-400">User ID</dt>
                    <dd className="font-mono text-xs">{currentUser.id}</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-400">Email</dt>
                    <dd>{currentUser.email}</dd>
                </div>
                <div className="flex items-center justify-between gap-6">
                    <dt className="text-slate-400">Last sign in</dt>
                    <dd>
                    {currentUser.last_sign_in_at
                        ? new Date(currentUser.last_sign_in_at).toLocaleString()
                        : "—"}
                    </dd>
                </div>
                </dl>
                <button
                className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                onClick={handleSignOut}
                >
                Sign out
                </button>
            </>
            ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-5 text-sm text-slate-400">
                Session metadata will show up here after a successful sign in.
            </div>
            )}
        </section>
        </>
    );
}