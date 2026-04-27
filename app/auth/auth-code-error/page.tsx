// /app/auth/auth-code-error/page.tsx
"use client";
// Auth Error Page
export default function AuthCodeErrorPage() {
  return (
    <div className="p-[2rem] text-center">
      <h1>Authentication Error</h1>
      <p>We couldn't complete your login. Please try again.</p>
      <button
        className="mt-[1rem] p-[0rem 1rem] w-[200px] text-center h-[40px] border-gray border-[1px] rounded-md hover:bg-white/70 hover:text-black"
        onClick={() => (window.location.href = "/")}
      >
        Return to Login
      </button>
      <p className="mt-[1rem] text-[0.9rem] text-[#666]">
        If the issue continues, try clearing your browser cookies or using a
        different browser.
      </p>
    </div>
  );
}
