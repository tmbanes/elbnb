import Link from "next/link";

const setups = [
  {
    href: "/login",
    title: "Email + Password",
    highlights: ["Toggle sign in/sign up", "Show the session panel", "Explain password rules"],
    theme: {
      card:
        "border border-yellow-900 bg-gradient-to-br from-[#283307] via-[#212b03] to-[#283307] hover:border-emerald-300/60",
      open: "text-yellow-300",
      title: "text-yellow-100",
      bullets: "text-white"
    },
  },
  {
    href: "/google-login",
    title: "Google Login",
    highlights: ["Redirect URLs", "Call signInWithOAuth", "Watch session update"],
    theme: {
      card:
        "border border-yellow-900 bg-gradient-to-br from-[#083a45] via-[#04313b] to-[#11424d] hover:border-[#7fb0ff]/60",
      open: "text-[#24b3d4]",
      title: "text-[#74e3fc]",
      bullets: "text-white"
    },
  },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br bg-yellow-100 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="space-y-4">
          <p className="text-sm tracking-[0.25em] text-yellow-900">
            Elbnb
          </p>
          <h1 className="text-4xl text-yellow-900 font-semibold text-white drop-shadow-sm">
            User Authentication Setup
          </h1>
        </header>
        <section className="grid gap-6 md:grid-cols-3">
          {setups.map((setup) => {
            const theme = setup.theme;
            return (
              <Link
                key={setup.href}
                href={setup.href}
                className={`group relative isolate flex flex-col overflow-hidden rounded-[32px] p-6 transition hover:-translate-y-1 ${
                  theme?.card ??
                  "border border-white/5 bg-slate-900/60 shadow-[0_30px_70px_rgba(2,6,23,0.65)] hover:border-emerald-300/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Flow</p>
                  <span className={`text-sm font-semibold ${theme?.open ?? "text-emerald-300"}`}>
                    Open ↗
                  </span>
                </div>
                <h3
                  className={`mt-4 text-xl font-semibold ${
                    theme?.title ?? "text-white"
                  } transition group-hover:opacity-95`}
                >
                  {setup.title}
                </h3>
                <ul className={`mt-4 space-y-1 text-xs ${theme?.bullets ?? "text-slate-400"}`}>
                  {setup.highlights.map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
              </Link>
            );
          })}
        </section>
      </div>
    </div>
  );
}